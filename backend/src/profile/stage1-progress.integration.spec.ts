import { createHash, randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';

// Intentionally fixed allowlist. Updating the database requires a reviewed code
// change; a database name containing "test" is never considered sufficient.
// These checks do not prove that PostgreSQL is physically local or disposable:
// a loopback TCP forward can still reach a remote server. Operators must
// explicitly provision this exact database as disposable, use a dedicated
// least-privilege test role, and ensure the target cannot tunnel to an unintended
// database. Isolation and role provisioning are external prerequisites, not
// guarantees made by this harness.
const APPROVED_HOST = '127.0.0.1';
const APPROVED_PORT = 5432;
const APPROVED_DATABASE = 'nexuscode_stage1_test';
const TEST_LOCK_NAMESPACE = 731903;
const TEST_LOCK_KEY = 1;
const FIXTURE_PREFIX = 'Stage1Integration:';
const PG_CONNECTION_TIMEOUT_MS = 3000;
const PG_STATEMENT_TIMEOUT_MS = 8000;
const PG_LOCK_TIMEOUT_MS = 4000;
const PG_IDLE_TRANSACTION_TIMEOUT_MS = 12000;
const BARRIER_TIMEOUT_MS = 6000;
const OPERATION_TIMEOUT_MS = 20000;
const CANCELLATION_GRACE_MS = 5000;
const RUNNER_CLEANUP_TIMEOUT_MS = 2000;
const JEST_TEST_TIMEOUT_MS = 90000;

// Keep Jest's per-test and hook timeout above the operation, cancellation, and
// fixture-cleanup budgets. This is local to this spec; jest.config.js is untouched.
jest.setTimeout(JEST_TEST_TIMEOUT_MS);

const explicitOptIn = process.env.STAGE1_PG_INTEGRATION === '1';
const postgresUrl = process.env.STAGE1_PG_TEST_URL;
const integrationDescribe = explicitOptIn ? describe : describe.skip;

function parseDedicatedTarget(rawUrl: string | undefined, optedIn: boolean) {
  if (!optedIn) throw new Error('PostgreSQL integration requires explicit STAGE1_PG_INTEGRATION=1 opt-in.');
  if (!rawUrl) throw new Error('STAGE1_PG_TEST_URL is required; no database fallback is permitted.');

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('STAGE1_PG_TEST_URL is malformed; connection details were not logged.');
  }

  let database: string;
  let username: string;
  let password: string;
  try {
    database = decodeURIComponent(parsed.pathname.slice(1));
    username = decodeURIComponent(parsed.username);
    password = decodeURIComponent(parsed.password);
  } catch {
    throw new Error('STAGE1_PG_TEST_URL contains malformed encoding; connection details were not logged.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      parsed.hostname !== APPROVED_HOST ||
      parsed.port !== String(APPROVED_PORT) ||
      database !== APPROVED_DATABASE ||
      !username || !password || parsed.search || parsed.hash || parsed.pathname.includes('%2f')) {
    throw new Error('PostgreSQL integration target is not the approved local disposable database.');
  }

  return {
    type: 'postgres' as const,
    host: APPROVED_HOST,
    port: APPROVED_PORT,
    username,
    password,
    database: APPROVED_DATABASE,
    ssl: false as const,
    synchronize: false,
    migrationsRun: false,
  };
}

describe('PostgreSQL test-target safety guard', () => {
  it('requires opt-in and an explicit URL', () => {
    expect(() => parseDedicatedTarget(undefined, false)).toThrow(/explicit STAGE1_PG_INTEGRATION/);
    expect(() => parseDedicatedTarget(undefined, true)).toThrow(/no database fallback/);
  });

  it.each([
    ['remote host', 'postgresql://user:secret@db.example:5432/nexuscode_stage1_test'],
    ['development database', 'postgresql://user:secret@127.0.0.1:5432/nexuscode'],
    ['lookalike database', 'postgresql://user:secret@127.0.0.1:5432/production_nexuscode_stage1_test'],
    ['wrong port', 'postgresql://user:secret@127.0.0.1:5433/nexuscode_stage1_test'],
    ['query overrides', 'postgresql://user:secret@127.0.0.1:5432/nexuscode_stage1_test?host=db.example'],
    ['alternate local name', 'postgresql://user:secret@localhost:5432/nexuscode_stage1_test'],
  ])('rejects %s without echoing credentials', (_label, url) => {
    let message = '';
    try {
      parseDedicatedTarget(url, true);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/not the approved local disposable database/);
    expect(message).not.toContain('secret');
  });

  it('accepts only the exact approved local target with schema automation disabled', () => {
    expect(parseDedicatedTarget(
      'postgresql://test_user:test_password@127.0.0.1:5432/nexuscode_stage1_test',
      true,
    )).toMatchObject({
      host: APPROVED_HOST,
      port: APPROVED_PORT,
      database: APPROVED_DATABASE,
      synchronize: false,
      migrationsRun: false,
    });
  });
});

integrationDescribe('Stage 1 progress writer PostgreSQL integration', () => {
  let dataSource!: DataSource;
  let runtime: any;
  let services: ReturnType<typeof createServices>;
  let lockRunner: any;
  let lockAcquired = false;
  let userId: number | undefined;
  const transientAchievementIds: number[] = [];
  const transientStoreItemIds: number[] = [];
  const runId = randomUUID();

  beforeAll(async () => {
    // Validate before loading TypeORM or constructing any connection. No app
    // module, dotenv loader, or application database configuration is imported.
    const target = parseDedicatedTarget(postgresUrl, explicitOptIn);
    try {
      runtime = loadTestRuntime();
      dataSource = new runtime.DataSource({
        ...target,
        extra: {
          max: 8,
          connectionTimeoutMillis: PG_CONNECTION_TIMEOUT_MS,
          statement_timeout: PG_STATEMENT_TIMEOUT_MS,
          lock_timeout: PG_LOCK_TIMEOUT_MS,
          idle_in_transaction_session_timeout: PG_IDLE_TRANSACTION_TIMEOUT_MS,
        },
        entities: [
          runtime.User,
          runtime.UserProgress,
          runtime.Achievement,
          runtime.UserAchievement,
          runtime.StoreItem,
          runtime.UserPurchase,
          runtime.Game,
          runtime.LessonAttempt,
        ],
      });
      await dataSource.initialize();
    } catch {
      if (dataSource?.isInitialized) await dataSource.destroy();
      throw new Error('Could not initialize the approved local PostgreSQL test target; details were redacted.');
    }

    try {
      lockRunner = dataSource.createQueryRunner();
      await lockRunner.connect();
      const lockRows = await lockRunner.query(
        'SELECT pg_try_advisory_lock($1, $2) AS acquired',
        [TEST_LOCK_NAMESPACE, TEST_LOCK_KEY],
      );
      lockAcquired = lockRows[0]?.acquired === true;
      if (!lockAcquired) throw new Error('Another Stage 1 integration process is already using this database.');

      const server = await lockRunner.query(
        'SELECT inet_server_addr()::text AS address, inet_server_port() AS port, current_database() AS database',
      );
      if (server[0]?.address !== APPROVED_HOST ||
          Number(server[0]?.port) !== APPROVED_PORT ||
          server[0]?.database !== APPROVED_DATABASE) {
        throw new Error('Connected PostgreSQL server identity does not match the approved local target.');
      }

      const existingRows = await dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM "user") AS users,
           (SELECT COUNT(*) FROM "user_progress") AS progress,
           (SELECT COUNT(*) FROM "lesson_attempt") AS attempts,
           (SELECT COUNT(*) FROM "user_achievement") AS user_achievements,
           (SELECT COUNT(*) FROM "user_purchase") AS purchases`,
      );
      if (Object.values(existingRows[0] ?? {}).some((count) => Number(count) !== 0)) {
        throw new Error('Approved test database must have no user-owned or attempt records before execution.');
      }

      const staleFixtures = await dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM "achievement" WHERE "name" LIKE $1) AS achievements,
           (SELECT COUNT(*) FROM "store_item" WHERE "name" LIKE $1
             OR "applyValue" LIKE $2) AS store_items`,
        [`${FIXTURE_PREFIX}%`, 'stage1-integration:%'],
      );
      if (Object.values(staleFixtures[0] ?? {}).some((count) => Number(count) !== 0)) {
        throw new Error('Stale Stage 1 integration fixtures exist; review and remove them separately.');
      }
    } catch (error) {
      await releaseTestLockAndConnections(lockRunner, dataSource, lockAcquired);
      lockAcquired = false;
      if (error instanceof Error && /^(Another Stage 1|Connected PostgreSQL|Approved test database|Stale Stage 1)/.test(error.message)) {
        throw error;
      }
      throw new Error('PostgreSQL safety preflight failed; connection details were redacted.');
    }
  });

  beforeEach(async () => {
    const userRepo = dataSource.getRepository(runtime.User);
    const user = await userRepo.save(userRepo.create({
      username: `${FIXTURE_PREFIX}${runId}:${randomUUID()}`,
      email: null,
      password: 'integration-test-only',
      plan: 'free',
    }));
    userId = user.id;

    await dataSource.getRepository(runtime.UserProgress).save(
      dataSource.getRepository(runtime.UserProgress).create({
        userId,
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        energy: 8,
        maxEnergy: 10,
        energyLastRegen: new Date(),
        credits: 0,
        completedLessons: '[]',
      }),
    );
    services = createServices(dataSource, runtime);
    // Test-only bypass of the service activation gate; no process flag changes.
    (services.profile as any).assertLessonAttemptsEnabled = () => undefined;
  });

  afterEach(async () => {
    const failures = await cleanupFixtures(dataSource, runtime, userId, transientAchievementIds, transientStoreItemIds);
    if (!failures.length) userId = undefined;
    if (failures.length) throw new Error(`Stage 1 fixture cleanup failed: ${failures.join('; ')}`);
  });

  afterAll(async () => {
    const failures = dataSource && runtime
      ? await cleanupFixtures(dataSource, runtime, userId, transientAchievementIds, transientStoreItemIds)
      : [];
    await releaseTestLockAndConnections(lockRunner, dataSource, lockAcquired);
    lockAcquired = false;
    if (failures.length) throw new Error(`Stage 1 final cleanup failed: ${failures.join('; ')}`);
  });

  it('preserves both XP contributions, completion, level, credits, and activity when lesson and game race', async () => {
    const attemptId = await createAttempt(dataSource, userId!);
    const [lesson, game] = await runAtTransactionBarrier(dataSource, 'lesson/game race', [
      () => services.profile.submitLessonAttempt(userId!, attemptId, validHtmlSource()),
      () => services.game.completeGame(1, userId!),
    ]);
    const progress = await dataSource.getRepository(runtime.UserProgress).findOneByOrFail({ userId });

    expect(lesson.awardedXp).toBe(50);
    expect(game.xp).toBe(100);
    expect(progress.xp).toBe(150);
    expect(progress.level).toBe(1);
    expect(JSON.parse(progress.completedLessons)).toEqual(['html-headings']);
    expect(progress.credits).toBe(lesson.awardedCredits + game.creditsAwarded);
    expect(progress.lastActiveDate).toBeInstanceOf(Date);
    expect([0, 1]).toContain(progress.streak); // ordering determines whether lesson initializes today's streak first
    expect(progress.longestStreak).toBeGreaterThanOrEqual(progress.streak);
  });

  it('preserves lesson progress while energy deduction races regeneration', async () => {
    await dataSource.query(
      `UPDATE "user_progress" SET "energy" = 8, "energyLastRegen" = now() - interval '61 minutes' WHERE "userId" = $1`,
      [userId],
    );
    const attemptId = await createAttempt(dataSource, userId!);
    const [lesson, energy] = await runAtTransactionBarrier(dataSource, 'lesson/energy race', [
      () => services.profile.submitLessonAttempt(userId!, attemptId, validHtmlSource()),
      () => services.profile.deductHeart(userId!),
    ]);
    const progress = await dataSource.getRepository(runtime.UserProgress).findOneByOrFail({ userId });

    expect(progress.energy).toBe(9); // +2 regenerated, then one deducted, regardless of lock winner
    expect(energy.hearts).toBeGreaterThanOrEqual(0);
    expect(progress.xp).toBe(lesson.awardedXp);
    expect(progress.credits).toBe(lesson.awardedCredits);
    expect(JSON.parse(progress.completedLessons)).toEqual(['html-headings']);
    expect(progress.level).toBe(1);
  });

  it('preserves legacy achievement progress and credits exactly once beside lesson completion', async () => {
    const achievement = await insertAchievement(dataSource, runtime, transientAchievementIds, runId, {
      type: `stage1_legacy_${randomUUID()}`,
      requiredCount: 1,
      creditReward: 17,
    });
    const attemptId = await createAttempt(dataSource, userId!);
    const [lesson, legacy] = await runAtTransactionBarrier(dataSource, 'lesson/achievement race', [
      () => services.profile.submitLessonAttempt(userId!, attemptId, validHtmlSource()),
      () => services.achievements.incrementProgress(userId!, achievement.type, 1),
    ]);
    const progress = await dataSource.getRepository(runtime.UserProgress).findOneByOrFail({ userId });
    const records = await dataSource.getRepository(runtime.UserAchievement).findBy({ userId, achievementId: achievement.id });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ progress: 1, earned: true });
    expect(progress.credits).toBe(lesson.awardedCredits + legacy.creditsAwarded);
    expect(legacy.creditsAwarded).toBe(17);
    expect(progress.xp).toBe(lesson.awardedXp);
    expect(JSON.parse(progress.completedLessons)).toEqual(['html-headings']);
  });

  it('persists two terminal attempt receipts but grants first-completion rewards once', async () => {
    const attemptIds = await Promise.all([
      createAttempt(dataSource, userId!),
      createAttempt(dataSource, userId!),
    ]);
    const results = await runAtTransactionBarrier(dataSource, 'concurrent lesson attempts', attemptIds.map((id) =>
      () => services.profile.submitLessonAttempt(userId!, id, validHtmlSource()),
    ));
    const attempts = await dataSource.query(
      `SELECT "id", "status", "sourceHash", "result" FROM "lesson_attempt" WHERE "id" = ANY($1::uuid[]) ORDER BY "id"`,
      [attemptIds],
    );
    const progress = await dataSource.getRepository(runtime.UserProgress).findOneByOrFail({ userId });
    const userPurchases = await dataSource.getRepository(runtime.UserPurchase).findBy({ userId, isPrize: true });

    expect(attempts).toHaveLength(2);
    expect(attempts.every((attempt: any) => attempt.status === 'succeeded' && attempt.sourceHash)).toBe(true);
    expect(attempts.map((attempt: any) => attempt.result.success)).toEqual([true, true]);
    const receiptById = new Map(attempts.map((attempt: any) => [attempt.id, attempt.result]));
    for (const result of results) {
      expect(receiptById.get(result.attemptId)).toMatchObject({
        success: result.success,
        completionWasFirst: result.completionWasFirst,
        awardedXp: result.awardedXp,
        awardedCredits: result.awardedCredits,
      });
    }
    expect(results.filter((result) => result.completionWasFirst)).toHaveLength(1);
    const first = results.find((result) => result.completionWasFirst)!;
    const replay = results.find((result) => !result.completionWasFirst)!;
    expect(first.awardedXp).toBe(50);
    expect(replay.awardedXp).toBe(0);
    expect(replay.lessonCreditsAwarded).toBe(0);
    expect(replay.bonusCreditsAwarded).toBe(0);
    expect(replay.achievementCreditsAwarded ?? 0).toBe(0);
    expect(replay.awardedCredits).toBe(0);
    expect(progress.xp).toBe(50);
    expect(progress.credits).toBe(first.awardedCredits);
    expect(JSON.parse(progress.completedLessons)).toEqual(['html-headings']);
    const achievementProgress = await dataSource.query(
      `SELECT ua."progress", ua."earned", a."type", a."requiredCount", a."creditReward" FROM "user_achievement" ua
       JOIN "achievement" a ON a."id" = ua."achievementId" WHERE ua."userId" = $1`,
      [userId],
    );
    const matchingDefinitions = await dataSource.query(
      `SELECT COUNT(*) AS count FROM "achievement" WHERE "type" IN ('xp_earned', 'first_try_lessons')`,
    );
    expect(achievementProgress).toHaveLength(Number(matchingDefinitions[0].count));
    expect(achievementProgress.every((record: any) => Number(record.progress) <= Number(record.requiredCount))).toBe(true);
    for (const record of achievementProgress) {
      const eventAmount = record.type === 'xp_earned' ? 50 : record.type === 'first_try_lessons' ? 1 : null;
      if (eventAmount !== null) expect(Number(record.progress)).toBe(Math.min(eventAmount, Number(record.requiredCount)));
    }
    expect(achievementProgress.filter((record: any) => record.earned)
      .reduce((sum: number, record: any) => sum + Number(record.creditReward), 0))
      .toBe(first.achievementCreditsAwarded ?? 0);
    const expectedPrizeValues = (first.achievementPrizes ?? []).map((prize: any) => prize.applyValue).sort();
    const persistedPrizeValues = (await dataSource.query(
      `SELECT si."applyValue" FROM "user_purchase" up JOIN "store_item" si ON si."id" = up."itemId"
       WHERE up."userId" = $1 AND up."isPrize" = true`,
      [userId],
    )).map((row: any) => row.applyValue).sort();
    expect(persistedPrizeValues).toEqual(expectedPrizeValues);
    expect(userPurchases.length).toBe(expectedPrizeValues.length);
  });

  it('serializes a one-time purchase with a prize grant and keeps repeatable purchases repeatable', async () => {
    await dataSource.query(`UPDATE "user_progress" SET "credits" = 10 WHERE "userId" = $1`, [userId]);
    const item = await insertStoreItem(dataSource, runtime, transientStoreItemIds, runId, {
      applyValue: `stage1-integration:${runId}:race:${randomUUID()}`,
      oneTimePurchase: true,
      creditCost: 1,
    });

    const outcomes = await runAtTransactionBarrier(dataSource, 'purchase/prize race', [
      () => services.store.purchase(userId!, item.id).then(
        (value: any) => ({ kind: 'purchase' as const, value }),
        (error: any) => ({ kind: 'purchase-error' as const, error }),
      ),
      () => services.store.grantPrizeSkin(userId!, item.applyValue).then(
        (value: any) => ({ kind: 'prize' as const, value }),
        (error: any) => ({ kind: 'prize-error' as const, error }),
      ),
    ]);
    const purchaseOutcome = outcomes.find((outcome) => outcome.kind.startsWith('purchase'))!;
    const prizeOutcome = outcomes.find((outcome) => outcome.kind.startsWith('prize'))!;
    const purchases = await dataSource.getRepository(runtime.UserPurchase).findBy({ userId, itemId: item.id });

    expect(prizeOutcome.kind).toBe('prize');
    if (purchaseOutcome.kind === 'purchase-error') {
      expect(purchaseOutcome.error).toMatchObject({ response: { message: 'Already owned' } });
    }
    expect(purchases).toHaveLength(1);
    expect(purchases[0].isPrize).toBe(prizeOutcome.kind === 'prize' && prizeOutcome.value !== null && purchaseOutcome.kind === 'purchase-error');

    const repeatable = await insertStoreItem(dataSource, runtime, transientStoreItemIds, runId, {
      applyValue: `stage1-integration:${runId}:repeatable:${randomUUID()}`,
      oneTimePurchase: false,
      creditCost: 1,
    });
    const repeated = await Promise.all([
      services.store.purchase(userId!, repeatable.id),
      services.store.purchase(userId!, repeatable.id),
    ]);
    expect(repeated).toHaveLength(2);
    expect(await dataSource.getRepository(runtime.UserPurchase).countBy({ userId, itemId: repeatable.id })).toBe(2);
  });

  it('rolls back an actually inserted prize and every source-attempt effect after a later prize failure', async () => {
    // tierSkinForReward(10) selects the seeded "ember" item. If the disposable
    // catalog omits it, create a uniquely tracked fixture for the transaction.
    await ensurePrizeItem(dataSource, runtime, transientStoreItemIds, runId, 'ember');
    const achievement = await insertAchievement(dataSource, runtime, transientAchievementIds, runId, {
      type: 'first_try_lessons',
      requiredCount: 1,
      creditReward: 10,
    });
    const attemptId = await createAttempt(dataSource, userId!);
    const beforeAttempt = await dataSource.query(`SELECT * FROM "lesson_attempt" WHERE "id" = $1`, [attemptId]);
    const beforeProgress = await dataSource.query(`SELECT * FROM "user_progress" WHERE "userId" = $1`, [userId]);
    const beforeAchievements = await dataSource.query(
      `SELECT * FROM "user_achievement" WHERE "userId" = $1 ORDER BY "id"`,
      [userId],
    );
    const beforePurchases = await dataSource.query(
      `SELECT * FROM "user_purchase" WHERE "userId" = $1 ORDER BY "id"`,
      [userId],
    );
    const originalGrant = services.store.grantPrizeSkinInTransaction.bind(services.store);
    let insertedPrize = false;
    jest.spyOn(services.store, 'grantPrizeSkinInTransaction').mockImplementation(async (manager, id, value) => {
      const result = await originalGrant(manager, id, value);
      if (!insertedPrize && result !== null) {
        if (!result) throw new Error('Rollback test did not insert its expected prize row.');
        insertedPrize = true;
        throw new Error('forced failure after real prize insertion');
      }
      return result;
    });

    await expect(services.profile.submitLessonAttempt(userId!, attemptId, validHtmlSource()))
      .rejects.toThrow('forced failure after real prize insertion');
    const afterAttempt = await dataSource.query(`SELECT * FROM "lesson_attempt" WHERE "id" = $1`, [attemptId]);
    const afterProgress = await dataSource.query(`SELECT * FROM "user_progress" WHERE "userId" = $1`, [userId]);
    const afterAchievements = await dataSource.query(
      `SELECT * FROM "user_achievement" WHERE "userId" = $1 ORDER BY "id"`,
      [userId],
    );
    const afterPurchases = await dataSource.query(
      `SELECT * FROM "user_purchase" WHERE "userId" = $1 ORDER BY "id"`,
      [userId],
    );

    expect(insertedPrize).toBe(true);
    expect(beforeAttempt).toHaveLength(1);
    expect(beforeAttempt[0]).toMatchObject({
      status: 'pending',
      result: null,
      submittedAt: null,
      sourceHash: null,
    });
    expect(afterAttempt).toEqual(beforeAttempt);
    expect(afterProgress).toEqual(beforeProgress);
    expect(afterProgress[0]).toMatchObject({
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      credits: 0,
      completedLessons: '[]',
    });
    expect(afterAchievements).toEqual(beforeAchievements);
    expect(afterPurchases).toEqual(beforePurchases);
    expect(afterAchievements).toHaveLength(0);
    expect(afterPurchases).toHaveLength(0);
  });

  it('rejects malformed UTF-16 without changing the receipt and stores U+FFFD identity', async () => {
    const attemptId = await createAttempt(dataSource, userId!);
    await expect(services.profile.submitLessonAttempt(userId!, attemptId, '\uD800'))
      .rejects.toMatchObject({ response: { statusCode: 400, code: 'LESSON_SOURCE_INVALID_UTF16' } });
    const pending = await dataSource.query(
      `SELECT "status", "sourceHash", "result" FROM "lesson_attempt" WHERE "id" = $1`,
      [attemptId],
    );
    expect(pending[0]).toMatchObject({ status: 'pending', sourceHash: null, result: null });

    const source = '<h1>Welcome to NexusCode</h1><!-- \uFFFD --><h2>Lesson</h2>';
    const result = await services.profile.submitLessonAttempt(userId!, attemptId, source);
    const receipt = await dataSource.query(`SELECT "status", "sourceHash", "result" FROM "lesson_attempt" WHERE "id" = $1`, [attemptId]);
    const expectedHash = createHash('sha256').update(source, 'utf8').digest('hex');

    expect(result.success).toBe(true);
    expect(receipt[0].status).toBe('succeeded');
    expect(receipt[0].sourceHash).toBe(expectedHash);
    expect(receipt[0].result).toMatchObject({ success: true, attemptId });
  });
});

function loadTestRuntime(): any {
  // These imports are deliberately lazy: the default Jest run can discover this
  // spec without loading a database driver or application DB configuration.
  require('reflect-metadata');
  const typeorm = require('typeorm');
  const User = require('../entities/user.entity').User;
  const UserProgress = require('../entities/UserProgress').UserProgress;
  const Achievement = require('../entities/Achievement').Achievement;
  const UserAchievement = require('../entities/UserAchievement').UserAchievement;
  const StoreItem = require('../entities/StoreItem').StoreItem;
  const UserPurchase = require('../entities/UserPurchase').UserPurchase;
  const Game = require('../entities/Game').Game;
  const LessonAttempt = require('../entities/LessonAttempt').LessonAttempt;
  const { ProfileService } = require('./profile.service');
  const { AchievementsService } = require('../achievements/achievements.service');
  const { StoreService } = require('../store/store.service');
  const { GameService } = require('../services/game.service');
  return {
    DataSource: typeorm.DataSource,
    User,
    UserProgress,
    Achievement,
    UserAchievement,
    StoreItem,
    UserPurchase,
    Game,
    LessonAttempt,
    ProfileService,
    AchievementsService,
    StoreService,
    GameService,
  };
}

function createServices(dataSource: DataSource, runtime: any) {
  const userRepo = dataSource.getRepository(runtime.User);
  const progressRepo = dataSource.getRepository(runtime.UserProgress);
  const purchaseRepo = dataSource.getRepository(runtime.UserPurchase);
  const itemRepo = dataSource.getRepository(runtime.StoreItem);
  const achievementRepo = dataSource.getRepository(runtime.Achievement);
  const userAchievementRepo = dataSource.getRepository(runtime.UserAchievement);
  const store = new runtime.StoreService(itemRepo, purchaseRepo, progressRepo, userRepo, dataSource);
  const achievements = new runtime.AchievementsService(achievementRepo, userAchievementRepo, store, dataSource);
  const profile = new runtime.ProfileService(userRepo, progressRepo, purchaseRepo, achievements, dataSource);
  const game = new runtime.GameService(
    { findOne: jest.fn().mockResolvedValue({ id: 1, locked: false }) },
    purchaseRepo,
    itemRepo,
    achievements,
    dataSource,
  );
  return { store, achievements, profile, game };
}

/**
 * Holds each competing service call after its own database transaction has
 * started, but before its service callback can issue application queries or
 * acquire row/advisory locks. Releasing the barrier therefore establishes
 * overlapping open transactions while preserving the real locking behavior.
 * Calls after the expected arrivals proceed without blocking.
 */
async function runAtTransactionBarrier(
  dataSource: DataSource,
  label: string,
  operations: Array<() => Promise<any>>,
): Promise<any[]> {
  if (operations.length < 2) throw new Error(`Transaction barrier for ${label} requires competing operations.`);

  const expectedArrivals = operations.length;
  let arrivals = 0;
  let release!: () => void;
  let reject!: (error: Error) => void;
  const gate = new Promise<void>((resolve, rejectGate) => {
    release = resolve;
    reject = rejectGate;
  });
  // Mark rejection as observed even if no participant reaches the gate before
  // its timeout; participants that await gate still receive the rejection.
  void gate.catch(() => undefined);
  const originalCreateQueryRunner = dataSource.createQueryRunner.bind(dataSource) as (...args: any[]) => any;
  const allRunners: any[] = [];
  const transactionRunners: any[] = [];
  const runnerSpies: Array<{ mockRestore: () => void }> = [];
  const runnerPhases = new Map<any, string>();
  let barrierTimer: ReturnType<typeof setTimeout> | undefined;
  let operationTimer: ReturnType<typeof setTimeout> | undefined;
  let timedOut: Error | undefined;
  let cancellationReason: Error | undefined;

  const phaseSummary = (): string => allRunners
    .filter((queryRunner) => !queryRunner.isReleased)
    .map((queryRunner, index) => `runner-${index + 1}:${runnerPhases.get(queryRunner) ?? 'created'}`)
    .join(', ') || 'no unreleased QueryRunners';

  const forceCloseOutstandingRunners = async (reason: Error): Promise<void> => {
    const outstanding = allRunners.filter((queryRunner) => !queryRunner.isReleased);
    const closeResults = await Promise.all(outstanding.map(async (queryRunner) => {
      // TypeORM's PostgresQueryRunner exposes this release path at runtime even
      // though it is private in the declarations. Passing an error makes pg-pool
      // destroy the checked-out client instead of returning an in-flight session
      // to the pool. That closes the PostgreSQL session and rolls back its txn.
      const abortConnection = (queryRunner as any).releasePostgresConnection;
      if (typeof abortConnection !== 'function') {
        return `QueryRunner ${queryRunner.connection?.name ?? 'unknown'} lacks the PostgreSQL abort release path`;
      }
      try {
        await abortConnection.call(queryRunner, reason);
        return null;
      } catch {
        return 'a QueryRunner connection could not be destroyed';
      }
    }));
    const failure = closeResults.find((message) => message !== null);
    if (failure) throw new Error(failure);
  };

  const queryRunnerSpy = jest.spyOn(dataSource, 'createQueryRunner').mockImplementation((...args: any[]) => {
    const queryRunner = originalCreateQueryRunner(...args);
    allRunners.push(queryRunner);
    runnerPhases.set(queryRunner, 'created');

    const originalConnect = queryRunner.connect.bind(queryRunner) as (...connectArgs: any[]) => Promise<any>;
    runnerSpies.push(jest.spyOn(queryRunner, 'connect').mockImplementation(async (...connectArgs: any[]) => {
      if (cancellationReason) throw cancellationReason;
      runnerPhases.set(queryRunner, 'connection acquisition');
      try {
        const connection = await originalConnect(...connectArgs);
        runnerPhases.set(queryRunner, 'connected');
        return connection;
      } catch (error) {
        runnerPhases.set(queryRunner, 'connection acquisition failed');
        throw error;
      }
    }));

    const originalQuery = queryRunner.query.bind(queryRunner) as (...queryArgs: any[]) => Promise<any>;
    runnerSpies.push(jest.spyOn(queryRunner, 'query').mockImplementation(async (query: any, ...queryArgs: any[]) => {
      if (cancellationReason) throw cancellationReason;
      const statement = /^\s*(START TRANSACTION|BEGIN)\b/i.test(query)
        ? 'transaction startup query'
        : /^\s*COMMIT\b/i.test(query)
          ? 'commit'
          : /^\s*ROLLBACK\b/i.test(query)
            ? 'rollback'
            : /pg_advisory_(?:xact_)?lock/i.test(query)
              ? 'advisory-lock wait/query'
              : /\bFOR\s+UPDATE\b/i.test(query)
                ? 'row-lock wait/query'
                : 'application query';
      runnerPhases.set(queryRunner, statement);
      try {
        return await originalQuery(query, ...queryArgs);
      } catch (error) {
        runnerPhases.set(queryRunner, `${statement} failed`);
        throw error;
      }
    }));

    const originalStartTransaction = queryRunner.startTransaction.bind(queryRunner) as (...startArgs: any[]) => Promise<void>;
    const startSpy = jest.spyOn(queryRunner, 'startTransaction').mockImplementation(async (...startArgs: any[]) => {
      if (cancellationReason) throw cancellationReason;
      runnerPhases.set(queryRunner, 'transaction startup');
      await originalStartTransaction(...startArgs);
      if (arrivals < expectedArrivals) {
        arrivals += 1;
        transactionRunners.push(queryRunner);
        runnerPhases.set(queryRunner, 'open transaction at barrier');
        if (arrivals === expectedArrivals) {
          if (barrierTimer) clearTimeout(barrierTimer);
          release();
        }
        await gate;
        runnerPhases.set(queryRunner, 'application transaction after barrier');
      }
    });
    runnerSpies.push(startSpy);
    return queryRunner;
  });

  barrierTimer = setTimeout(() => {
    timedOut = new Error(`Barrier phase timed out in ${label}: ${arrivals}/${expectedArrivals} transactions started; ${phaseSummary()}.`);
    cancellationReason = timedOut;
    void withTimeout(
      forceCloseOutstandingRunners(timedOut),
      RUNNER_CLEANUP_TIMEOUT_MS,
      `QueryRunner termination timed out during the barrier phase in ${label}; ${phaseSummary()}.`,
    ).then(
      () => reject(timedOut!),
      (error) => reject(new Error(`${timedOut!.message} Connection cleanup failed: ${(error as Error).message}`)),
    );
  }, BARRIER_TIMEOUT_MS);

  let operationSettled!: Promise<Array<{ succeeded: true; value: any } | { succeeded: false; error: any }>>;
  let cleanupFailure: Error | undefined;
  try {
    operationSettled = Promise.all(operations.map((operation) =>
      Promise.resolve().then(operation).then(
        (value) => ({ succeeded: true as const, value }),
        (error) => ({ succeeded: false as const, error }),
      ),
    ));

    const operationDeadline = new Promise<{ timedOut: true }>((resolve) => {
      operationTimer = setTimeout(() => {
        timedOut = timedOut ?? new Error(`Operation phase timed out in ${label} after ${OPERATION_TIMEOUT_MS} ms; ${phaseSummary()}.`);
        cancellationReason = timedOut;
        void withTimeout(
          forceCloseOutstandingRunners(timedOut),
          RUNNER_CLEANUP_TIMEOUT_MS,
          `QueryRunner termination timed out during operation cancellation in ${label}; ${phaseSummary()}.`,
        ).then(
          () => resolve({ timedOut: true }),
          (error) => {
            cleanupFailure = new Error(`${timedOut!.message} Connection cleanup failed: ${(error as Error).message}`);
            resolve({ timedOut: true });
          },
        );
      }, OPERATION_TIMEOUT_MS);
    });

    const first = await Promise.race([
      operationSettled.then((settled) => ({ timedOut: false as const, settled })),
      operationDeadline,
    ]);
    if (first.timedOut) {
      let cancellationTimer: ReturnType<typeof setTimeout> | undefined;
      const cancellationDeadline = new Promise<'expired'>((resolve) => {
        cancellationTimer = setTimeout(() => resolve('expired'), CANCELLATION_GRACE_MS);
      });
      let cancellationResult: 'settled' | 'expired';
      try {
        cancellationResult = await Promise.race([
          operationSettled.then(() => 'settled' as const),
          cancellationDeadline,
        ]);
      } finally {
        if (cancellationTimer) clearTimeout(cancellationTimer);
      }
      if (cancellationResult !== 'settled') {
        await withTimeout(
          forceCloseOutstandingRunners(timedOut!),
          RUNNER_CLEANUP_TIMEOUT_MS,
          `Final QueryRunner termination timed out in ${label}; ${phaseSummary()}.`,
        );
        throw new Error(`${timedOut!.message} Outstanding operations did not settle within ${CANCELLATION_GRACE_MS} ms after connection termination; safe cleanup cannot be confirmed.`);
      }
      throw cleanupFailure ?? timedOut!;
    }

    const settled = first.settled;
    if (timedOut) throw timedOut;
    const failure = settled.find((result) => !result.succeeded);
    if (failure && !failure.succeeded) throw failure.error;
    if (transactionRunners.length < expectedArrivals || new Set(transactionRunners).size !== expectedArrivals) {
      throw new Error(`Expected ${expectedArrivals} independent transaction connections in ${label}.`);
    }
    return settled.map((result) => result.succeeded ? result.value : undefined);
  } finally {
    if (barrierTimer) clearTimeout(barrierTimer);
    if (operationTimer) clearTimeout(operationTimer);

    const unreleased = allRunners.filter((queryRunner) => !queryRunner.isReleased);
    if (unreleased.length) {
      try {
        await withTimeout(
          forceCloseOutstandingRunners(new Error(`Closing leftover QueryRunners after ${label}.`)),
          RUNNER_CLEANUP_TIMEOUT_MS,
          `QueryRunner cleanup timed out in ${label}; ${phaseSummary()}.`,
        );
      } catch (error) {
        cleanupFailure = cleanupFailure ?? error as Error;
      }
    }
    for (const spy of runnerSpies) spy.mockRestore();
    queryRunnerSpy.mockRestore();
    if (cleanupFailure) throw cleanupFailure;
  }
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function insertAchievement(dataSource: DataSource, runtime: any, ids: number[], runId: string, overrides: Record<string, unknown>) {
  const repo = dataSource.getRepository(runtime.Achievement);
  const achievement = await repo.save(repo.create({
    name: `${FIXTURE_PREFIX}${runId}:${randomUUID()}`,
    description: 'Disposable Stage 1 integration fixture',
    icon: '*',
    type: `stage1_${randomUUID()}`,
    requiredCount: 1,
    creditReward: 0,
    ...overrides,
  }));
  ids.push(achievement.id); // Track immediately after successful insertion.
  return achievement;
}

async function insertStoreItem(dataSource: DataSource, runtime: any, ids: number[], runId: string, overrides: Record<string, unknown>) {
  const repo = dataSource.getRepository(runtime.StoreItem);
  const item = await repo.save(repo.create({
    name: `${FIXTURE_PREFIX}${runId}:${randomUUID()}`,
    description: 'Disposable Stage 1 integration fixture',
    icon: '*',
    category: 'cosmetic',
    creditCost: 1,
    applyValue: `stage1-integration:${runId}:${randomUUID()}`,
    oneTimePurchase: true,
    available: true,
    milestoneOnly: false,
    ...overrides,
  }));
  ids.push(item.id); // Track immediately after successful insertion.
  return item;
}

async function ensurePrizeItem(dataSource: DataSource, runtime: any, ids: number[], runId: string, applyValue: string): Promise<void> {
  const existing = await dataSource.getRepository(runtime.StoreItem).findOne({ where: { applyValue, available: true } });
  if (existing) return;
  await insertStoreItem(dataSource, runtime, ids, runId, {
    applyValue,
    name: `${FIXTURE_PREFIX}${runId}:prize:${randomUUID()}`,
    oneTimePurchase: true,
    milestoneOnly: true,
  });
}

async function cleanupFixtures(dataSource: DataSource, runtime: any, userId: number | undefined, achievementIds: number[], storeItemIds: number[]): Promise<string[]> {
  if (!dataSource?.isInitialized || !runtime) return [];
  const failures: string[] = [];
  if (userId !== undefined) {
    try {
      await dataSource.getRepository(runtime.User).delete({ id: userId });
    } catch {
      failures.push(`user ${userId} deletion failed`);
    }
  }

  for (const id of achievementIds.slice()) {
    try {
      await dataSource.getRepository(runtime.Achievement).delete({ id });
      achievementIds.splice(achievementIds.indexOf(id), 1);
    } catch {
      failures.push(`achievement fixture ${id} deletion failed`);
    }
  }
  for (const id of storeItemIds.slice()) {
    try {
      await dataSource.getRepository(runtime.StoreItem).delete({ id });
      storeItemIds.splice(storeItemIds.indexOf(id), 1);
    } catch {
      failures.push(`store fixture ${id} deletion failed`);
    }
  }
  return failures;
}

async function releaseTestLockAndConnections(lockRunner: any, dataSource: DataSource | undefined, lockAcquired: boolean): Promise<void> {
  try {
    if (lockRunner?.isReleased === false && lockAcquired) {
      await lockRunner.query('SELECT pg_advisory_unlock($1, $2)', [TEST_LOCK_NAMESPACE, TEST_LOCK_KEY]);
    }
  } catch {
    // The release failure is surfaced below with other cleanup errors.
    throw new Error('Could not release the Stage 1 integration advisory lock.');
  } finally {
    try {
      if (lockRunner && !lockRunner.isReleased) await lockRunner.release();
    } finally {
      if (dataSource?.isInitialized) await dataSource.destroy();
    }
  }
}

async function createAttempt(dataSource: DataSource, userId: number): Promise<string> {
  const id = randomUUID();
  await dataSource.query(
    `INSERT INTO "lesson_attempt" ("id", "userId", "lessonKey", "status", "expiresAt", "createdAt")
     VALUES ($1, $2, 'html-headings', 'pending', now() + interval '30 minutes', now())`,
    [id, userId],
  );
  return id;
}

function validHtmlSource(): string {
  return '<h1>Welcome to NexusCode</h1><!-- Stage 1 integration --><h2>Lesson</h2>';
}
