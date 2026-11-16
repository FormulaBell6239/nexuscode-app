jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('typeorm', () => {
  const decorator = () => () => undefined;
  return new Proxy({ DataSource: class DataSource {}, Repository: class Repository {} }, {
    get(target, key: string) {
      return key in target ? (target as any)[key] : decorator;
    },
  });
});
jest.mock('../achievements/achievements.service', () => ({ AchievementsService: class AchievementsService {} }));

import { LESSON_REWARDS } from '../lesson-catalog';
import { createHash } from 'crypto';
import { BadRequestException, ConflictException, GoneException } from '@nestjs/common';
import { ProfileService, hasUnpairedSurrogate, lessonAttemptsEnabled, replayCredits } from './profile.service';

const previousFeatureFlag = process.env.LESSON_ATTEMPTS_ENABLED;
const previousSchemaFlag = process.env.LESSON_ATTEMPTS_SCHEMA_READY;
beforeAll(() => {
  process.env.LESSON_ATTEMPTS_ENABLED = 'true';
  process.env.LESSON_ATTEMPTS_SCHEMA_READY = 'true';
});
afterAll(() => {
  if (previousFeatureFlag === undefined) delete process.env.LESSON_ATTEMPTS_ENABLED;
  else process.env.LESSON_ATTEMPTS_ENABLED = previousFeatureFlag;
  if (previousSchemaFlag === undefined) delete process.env.LESSON_ATTEMPTS_SCHEMA_READY;
  else process.env.LESSON_ATTEMPTS_SCHEMA_READY = previousSchemaFlag;
});

describe('lesson attempt reward primitives', () => {
  it.each([
    ['ASCII', 'plain text', false],
    ['a valid supplementary pair', '\u{1F680}', false],
    ['replacement character', '\uFFFD', false],
    ['lone high surrogate', '\uD800', true],
    ['lone low surrogate', '\uDC00', true],
    ['high surrogate before ordinary text', '\uD800x', true],
    ['low surrogate after ordinary text', 'x\uDC00', true],
  ])('classifies %s correctly', (_label, value, invalid) => {
    expect(hasUnpairedSurrogate(value)).toBe(invalid);
  });

  it('rejects unpaired source before attempt lookup and leaves the pending attempt usable', async () => {
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings',
      status: 'pending', sourceHash: null, result: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service, manager, dataSource } = makeService(attempt, progress);

    const invalidSourceError = await service.submitLessonAttempt(7, attempt.id, '\uD800').catch((error) => error);
    expect(invalidSourceError).toBeInstanceOf(BadRequestException);
    expect(invalidSourceError.getStatus()).toBe(400);
    expect(invalidSourceError.getResponse()).toMatchObject({ code: 'LESSON_SOURCE_INVALID_UTF16' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
    expect(attempt).toMatchObject({ status: 'pending', sourceHash: null, result: null });

    const validSource = '<h1>Welcome to NexusCode</h1><!-- \uFFFD --><h2>Lesson</h2>';
    await expect(service.submitLessonAttempt(7, attempt.id, validSource)).resolves.toMatchObject({ success: true });
    expect(attempt.status).toBe('succeeded');
    expect(attempt.sourceHash).toBe(createHash('sha256').update(validSource, 'utf8').digest('hex'));
  });

  it('updates energy under the progress lock without overwriting XP or credits', async () => {
    const progress: any = {
      userId: 7, xp: 321, level: 2, streak: 4, completedLessons: '["html-headings"]',
      credits: 19, energy: 4, maxEnergy: 10, energyLastRegen: new Date(Date.now() - 3_600_000),
      overclockActiveUntil: null,
    };
    const { service, manager, dataSource, progressRepo } = makeEnergyService({ plan: 'free' }, progress);

    const result = await service.deductHeart(7);

    expect(result.hearts).toBe(5);
    expect(progressRepo.findOne).toHaveBeenCalledWith({ where: { userId: 7 }, lock: { mode: 'pessimistic_write' } });
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    const update = manager.query.mock.calls.find(([sql]) => sql.includes('UPDATE "user_progress"'));
    expect(update[0]).toContain('"energy" = $2');
    expect(update[0]).toContain('"maxEnergy" = $3');
    expect(update[0]).not.toContain('"xp" =');
    expect(update[0]).not.toContain('"credits" =');
    expect(progress).toMatchObject({ xp: 321, credits: 19, completedLessons: '["html-headings"]' });
  });

  it('persists profile energy regeneration with a targeted update under the row lock', async () => {
    const initial: any = {
      userId: 7, username: 'learner', email: null, displayName: null, bio: null,
      avatar: '👾', callingCard: 'indigo', plan: 'free', theme: 'default',
      xp: 99, level: 1, streak: 2, longestStreak: 2, lastActiveDate: null,
      energy: 2, maxEnergy: 8, energyLastRegen: new Date(Date.now() - 3_600_000),
      overclockActiveUntil: null, credits: 51, completedLessons: '["html-headings"]',
    };
    const locked = { ...initial };
    const lockedProgressRepo = { findOne: jest.fn().mockResolvedValue(locked) };
    const manager = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn(() => lockedProgressRepo),
    };
    const dataSource = { transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)) };
    const service = new ProfileService(
      { findOne: jest.fn().mockResolvedValue({ id: 7, username: 'learner', plan: 'free' }) } as any,
      { findOne: jest.fn().mockResolvedValue(initial) } as any,
      {} as any,
      {} as any,
      dataSource as any,
    );

    const result = await service.getProfile(7);
    const update = manager.query.mock.calls.find(([sql]) => sql.includes('UPDATE "user_progress"'));

    expect(lockedProgressRepo.findOne).toHaveBeenCalledWith({
      where: { userId: 7 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(update[0]).toContain('"energy" = $2');
    expect(update[0]).not.toContain('"xp" =');
    expect(update[0]).not.toContain('"credits" =');
    expect(update[0]).not.toContain('"completedLessons" =');
    expect(result).toMatchObject({ xp: 99, credits: 51, completedLessons: ['html-headings'] });
  });

  it('keeps Pro heart deductions exempt and performs no progress transaction', async () => {
    const { service, dataSource } = makeEnergyService({ plan: 'pro' }, null);
    await expect(service.deductHeart(7)).resolves.toEqual({ hearts: null, pro: true });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('reads regenerated hearts after locking the progress row', async () => {
    const progress: any = {
      userId: 7, xp: 44, level: 1, credits: 8, completedLessons: '[]',
      energy: 8, maxEnergy: 10, energyLastRegen: new Date(), overclockActiveUntil: null,
    };
    const { service, progressRepo, manager } = makeEnergyService({ plan: 'free' }, progress);

    await expect(service.getHearts(7)).resolves.toMatchObject({ hearts: 8, maxHearts: 10, plan: 'free' });
    expect(progressRepo.findOne).toHaveBeenCalledWith({ where: { userId: 7 }, lock: { mode: 'pessimistic_write' } });
    expect(manager.query.mock.calls.some(([sql]) => sql.includes('UPDATE "user_progress"'))).toBe(true);
    expect(progress).toMatchObject({ xp: 44, credits: 8, completedLessons: '[]' });
  });

  it('fails closed unless the feature flag is exactly true', () => {
    const current = process.env.LESSON_ATTEMPTS_ENABLED;
    delete process.env.LESSON_ATTEMPTS_ENABLED;
    expect(lessonAttemptsEnabled()).toBe(false);
    if (current === undefined) delete process.env.LESSON_ATTEMPTS_ENABLED;
    else process.env.LESSON_ATTEMPTS_ENABLED = current;
    expect(lessonAttemptsEnabled('')).toBe(false);
    expect(lessonAttemptsEnabled('TRUE')).toBe(false);
    expect(lessonAttemptsEnabled('1')).toBe(false);
    expect(lessonAttemptsEnabled('true ')).toBe(false);
    const schemaFlag = process.env.LESSON_ATTEMPTS_SCHEMA_READY;
    delete process.env.LESSON_ATTEMPTS_SCHEMA_READY;
    expect(lessonAttemptsEnabled('true')).toBe(false);
    if (schemaFlag === undefined) delete process.env.LESSON_ATTEMPTS_SCHEMA_READY;
    else process.env.LESSON_ATTEMPTS_SCHEMA_READY = schemaFlag;
    expect(lessonAttemptsEnabled('true', 'false')).toBe(false);
    expect(lessonAttemptsEnabled('true', 'true')).toBe(true);
  });

  it('rounds 20 percent of base credits to nearest integer with halves up', () => {
    expect(replayCredits(3)).toBe(1);
    expect(replayCredits(4)).toBe(1);
    expect(replayCredits(5)).toBe(1);
    expect(replayCredits(15)).toBe(3);
  });

  it('keeps section-clear credits separate from replay credits', () => {
    expect(LESSON_REWARDS['html-meta']).toEqual({ xp: 50, baseCredits: 5, sectionClearBonus: 10 });
    expect(replayCredits(LESSON_REWARDS['html-meta'].baseCredits)).toBe(1);
  });

  it('awards the first completion in a transaction and stores its idempotent receipt', async () => {
    const code = '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>';
    const attempt: any = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service, manager, achievements } = makeService(attempt, progress);
    const result = await service.submitLessonAttempt(7, attempt.id, code);

    expect(result).toMatchObject({ success: true, completionWasFirst: true, awardedXp: 50, lessonCreditsAwarded: 3 });
    expect(progress.completedLessons).toContain('html-headings');
    expect(attempt.sourceHash).toBe(createHash('sha256').update(code).digest('hex'));
    expect(attempt.status).toBe('succeeded');
    expect(result).toMatchObject({ firstTry: true, achievementCreditsAwarded: 0 });
    expect(achievements.incrementProgressEventsInTransaction).toHaveBeenCalledWith(
      expect.anything(), 7, [
        { type: 'xp_earned', by: 50 },
        { type: 'first_try_lessons', by: 1 },
      ],
    );
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [attempt.id, 7]);
    const terminalUpdate = manager.query.mock.calls.find(([sql]) => sql.includes('UPDATE "lesson_attempt"'));
    expect(terminalUpdate[0]).toContain('"userId" = $4');
    expect(terminalUpdate[0]).toContain('"status" = \'pending\'');
    expect(terminalUpdate[0]).toContain('"sourceHash" IS NULL');
    expect(terminalUpdate[0]).toContain('RETURNING "id"');
    expect(terminalUpdate[1][3]).toBe(7);
  });

  it('returns the saved result for a duplicate delivery after expiry', async () => {
    const code = 'same source';
    const result = { success: true, awardedXp: 50 };
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings', status: 'succeeded',
      sourceHash: createHash('sha256').update(code).digest('hex'), result,
      expiresAt: new Date(Date.now() - 60_000),
    };
    const { service, manager, achievements } = makeService(attempt, null);

    await expect(service.submitLessonAttempt(7, attempt.id, code)).resolves.toEqual(result);
    expect(manager.query).toHaveBeenCalledTimes(1);
    expect(achievements.incrementProgressEventsInTransaction).not.toHaveBeenCalled();
  });

  it('returns an identical failed receipt without creating another incorrect-answer event', async () => {
    const code = 'incorrect source';
    const result = { success: false, awardedXp: 0, completedLessons: [] };
    const attempt: any = {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', userId: 7, lessonKey: 'html-headings', status: 'failed',
      sourceHash: createHash('sha256').update(code).digest('hex'), result,
      expiresAt: new Date(Date.now() - 60_000),
    };
    const { service, manager, achievements } = makeService(attempt, null);

    await expect(service.submitLessonAttempt(7, attempt.id, code)).resolves.toEqual(result);
    expect(manager.query).toHaveBeenCalledTimes(1);
    expect(achievements.incrementProgressEventsInTransaction).not.toHaveBeenCalled();
  });

  it('awards no XP, credits, or achievement progress for a completed-lesson replay', async () => {
    const attempt: any = {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', userId: 7, lessonKey: 'html-headings',
      status: 'pending', expiresAt: new Date(Date.now() + 60_000),
    };
    const progress: any = {
      xp: 50, level: 1, streak: 1, longestStreak: 1, lastActiveDate: new Date(),
      energy: 10, maxEnergy: 10, energyLastRegen: new Date(), overclockActiveUntil: null,
      credits: 3, completedLessons: '["html-headings"]',
    };
    const { service, achievements } = makeService(attempt, progress);
    const result = await service.submitLessonAttempt(7, attempt.id, '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>');

    expect(result).toMatchObject({
      success: true,
      completionWasFirst: false,
      firstTry: false,
      awardedXp: 0,
      lessonCreditsAwarded: 0,
      bonusCreditsAwarded: 0,
      achievementCreditsAwarded: 0,
      awardedCredits: 0,
      xp: 50,
      credits: 3,
    });
    expect(result.completedLessons).toEqual(['html-headings']);
    expect(achievements.incrementProgressEventsInTransaction).not.toHaveBeenCalled();
    expect(progress.completedLessons).toBe('["html-headings"]');
  });

  it('rejects a different source hash for a submitted attempt with 409', async () => {
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings', status: 'failed',
      sourceHash: createHash('sha256').update('original').digest('hex'), result: { success: false },
      expiresAt: new Date(Date.now() - 60_000),
    };
    const { service } = makeService(attempt, null);

    await expect(service.submitLessonAttempt(7, attempt.id, 'different')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an expired unsubmitted attempt without consuming it', async () => {
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings', status: 'pending',
      sourceHash: null, result: null, expiresAt: new Date(Date.now() - 60_000),
    };
    const { service, manager } = makeService(attempt, null);

    await expect(service.submitLessonAttempt(7, attempt.id, 'code')).rejects.toBeInstanceOf(GoneException);
    expect(attempt.status).toBe('pending');
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('does not disclose or process an attempt owned by another user', async () => {
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings',
      status: 'pending', expiresAt: new Date(Date.now() + 60_000),
    };
    const { service, manager } = makeService(attempt, null);

    await expect(service.submitLessonAttempt(8, attempt.id, '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>'))
      .rejects.toMatchObject({ status: 404 });
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('records a failed attempt without awarding XP, credits, or completion', async () => {
    const attempt: any = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'js-console', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 20, level: 1, streak: 2, longestStreak: 2, lastActiveDate: new Date(),
      energy: 8, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 12, completedLessons: '[]',
    };
    const { service, manager } = makeService(attempt, progress);
    const result = await service.submitLessonAttempt(7, attempt.id, 'no match');

    expect(result).toMatchObject({ success: false, awardedXp: 0, awardedCredits: 0, completedLessons: [] });
    expect(manager.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE "user_progress"'), expect.anything());
    expect(attempt.status).toBe('failed');
  });

  it('disqualifies first-try status when an earlier valid incorrect submission was recorded', async () => {
    const attempt: any = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', userId: 7, lessonKey: 'html-headings', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service, achievements } = makeService(attempt, progress, 1, true);
    const result = await service.submitLessonAttempt(7, attempt.id, '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>');

    expect(result).toMatchObject({ success: true, completionWasFirst: true, firstTry: false });
    expect(achievements.incrementProgressEventsInTransaction).toHaveBeenCalledTimes(1);
    expect(achievements.incrementProgressEventsInTransaction).toHaveBeenCalledWith(
      expect.anything(), 7, [{ type: 'xp_earned', by: 50 }],
    );
  });

  it('rolls back completion and progress when transactional achievement processing fails', async () => {
    const code = '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>';
    const attempt: any = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', userId: 7, lessonKey: 'html-headings', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service } = makeService(attempt, progress);
    (service as any).achievementsService.incrementProgressEventsInTransaction.mockRejectedValue(new Error('prize persistence failed'));

    await expect(service.submitLessonAttempt(7, attempt.id, code)).rejects.toThrow('prize persistence failed');
    expect(attempt.status).toBe('pending');
    expect(attempt.sourceHash).toBeUndefined();
    expect(progress).toMatchObject({ xp: 0, credits: 0, completedLessons: '[]' });
  });

  it('leaves the attempt pending when the progress update fails', async () => {
    const attempt: any = { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', userId: 7, lessonKey: 'html-headings', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service } = makeService(attempt, progress, 1, false, true);

    await expect(service.submitLessonAttempt(7, attempt.id, '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>'))
      .rejects.toThrow('progress update failed');
    expect(attempt.status).toBe('pending');
    expect(progress).toMatchObject({ xp: 0, credits: 0, completedLessons: '[]' });
  });

  it('aborts if the conditional terminal update does not affect exactly one row', async () => {
    const attempt: any = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'js-console', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: new Date(),
      energy: 10, maxEnergy: 10, energyLastRegen: new Date(), overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service } = makeService(attempt, progress, 0);

    await expect(service.submitLessonAttempt(7, attempt.id, 'console.log(')).rejects.toBeInstanceOf(ConflictException);
    expect(attempt.status).toBe('pending');
    expect(progress).toMatchObject({ xp: 0, credits: 0, completedLessons: '[]' });
  });

  it('rolls back rewards when successful attempt finalization fails', async () => {
    const attempt: any = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', userId: 7, lessonKey: 'html-headings', status: 'pending', expiresAt: new Date(Date.now() + 60_000) };
    const progress: any = {
      xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null,
      energy: 10, maxEnergy: 10, energyLastRegen: null, overclockActiveUntil: null,
      credits: 0, completedLessons: '[]',
    };
    const { service, achievements } = makeService(attempt, progress, 0);

    await expect(service.submitLessonAttempt(7, attempt.id, '<h1>Welcome to NexusCode</h1><h2>Lesson</h2>'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(attempt.status).toBe('pending');
    expect(progress).toMatchObject({ xp: 0, credits: 0, completedLessons: '[]' });
    expect(achievements.incrementProgressEventsInTransaction).toHaveBeenCalled();
  });

  it('mock cleanup selects expired pending rows only and retains terminal receipts', async () => {
    const now = Date.now();
    const records = [
      { id: 'expired-pending', status: 'pending', expiresAt: new Date(now - 1000) },
      { id: 'live-pending', status: 'pending', expiresAt: new Date(now + 60_000) },
      { id: 'expired-success', status: 'succeeded', expiresAt: new Date(now - 1000) },
      { id: 'expired-failed', status: 'failed', expiresAt: new Date(now - 1000) },
    ];
    let deleted: string[] = [];
    const manager = { query: jest.fn(async (sql: string) => {
      if (sql.includes('DELETE FROM "lesson_attempt"')) {
        deleted = records.filter((row) => row.status === 'pending' && row.expiresAt.getTime() <= Date.now()).map((row) => row.id);
        return deleted.map((id) => ({ id }));
      }
      return [];
    }) };
    const dataSource = { transaction: async (_isolation: string, callback: (m: any) => unknown) => callback(manager) };
    const service = new ProfileService({} as any, {} as any, {} as any, { incrementProgress: jest.fn() } as any, dataSource as any);

    await service.createLessonAttempt(7, 'html-headings');
    const cleanupSql = manager.query.mock.calls[0][0];
    expect(cleanupSql).toContain('"status" = \'pending\'');
    expect(cleanupSql).toContain('"expiresAt" <= now()');
    expect(cleanupSql).toContain('FOR UPDATE SKIP LOCKED');
    expect(deleted).toEqual(['expired-pending']);
  });

  it('mock cleanup skips an attempt marked as locked by a concurrent submission', async () => {
    const attempt: any = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId: 7, lessonKey: 'html-headings',
      status: 'pending', expiresAt: new Date(Date.now() - 1000), sourceHash: null, result: null,
    };
    let locked = true;
    const manager = { query: jest.fn(async (sql: string, params: any[] = []) => {
      if (sql.includes('DELETE FROM "lesson_attempt"')) {
        // Mock the database effect of SKIP LOCKED; this is not a PostgreSQL concurrency test.
        return locked ? [] : [{ id: attempt.id }];
      }
      if (sql.includes('SELECT "id", "userId", "lessonKey"')) {
        return attempt.userId === params[1] ? [attempt] : [];
      }
      return [];
    }) };
    const dataSource = { transaction: async (_isolation: string, callback: (m: any) => unknown) => callback(manager) };
    const service = new ProfileService({} as any, {} as any, {} as any, { incrementProgress: jest.fn() } as any, dataSource as any);

    await service.createLessonAttempt(7, 'html-headings');
    expect(attempt.status).toBe('pending');
    await expect(service.submitLessonAttempt(7, attempt.id, 'code')).rejects.toBeInstanceOf(GoneException);
    expect(attempt.status).toBe('pending');
    locked = false;
  });
});

function makeService(
  attempt: any,
  progress: any,
  terminalAffectedRows = 1,
  priorIncorrect = false,
  failProgressUpdate = false,
) {
  const manager = {
    query: jest.fn(async (sql: string, params: any[] = []) => {
      if (sql.includes('SELECT "id", "userId", "lessonKey"')) return attempt && attempt.userId === params[1] ? [attempt] : [];
      if (sql.includes('SELECT "xp", "level"')) return progress ? [progress] : [];
      if (sql.includes('SELECT 1 FROM "lesson_attempt"')) return priorIncorrect ? [{ '?column?': 1 }] : [];
      if (sql.includes('UPDATE "user_progress"') && progress) {
        if (failProgressUpdate) throw new Error('progress update failed');
        [progress.xp, progress.level, progress.streak, progress.longestStreak, progress.lastActiveDate,
          progress.credits, progress.completedLessons, progress.energy, progress.energyLastRegen] = params.slice(1);
      }
      if (sql.includes('UPDATE "lesson_attempt"') && attempt) {
        if (terminalAffectedRows !== 1) return [];
        attempt.status = sql.includes("'succeeded'") ? 'succeeded' : 'failed';
        attempt.sourceHash = params[1];
        attempt.result = JSON.parse(params[2]);
        return [{ id: attempt.id }];
      }
      return [];
    }),
  };
  const dataSource = {
    transaction: jest.fn(async (_isolation: string, callback: (manager: any) => unknown) => {
      const attemptBefore = attempt ? { ...attempt } : null;
      const progressBefore = progress ? { ...progress } : null;
      try {
        return await callback(manager);
      } catch (error) {
        if (attempt && attemptBefore) Object.assign(attempt, attemptBefore);
        if (progress && progressBefore) Object.assign(progress, progressBefore);
        throw error;
      }
    }),
  };
  const achievements = {
    incrementProgress: jest.fn().mockResolvedValue(undefined),
    incrementProgressInTransaction: jest.fn().mockResolvedValue({ creditsAwarded: 0, prizes: [] }),
    incrementProgressEventsInTransaction: jest.fn().mockResolvedValue({ creditsAwarded: 0, prizes: [] }),
  };
  const service = new ProfileService({} as any, {} as any, {} as any, achievements as any, dataSource as any);
  return { service, manager, achievements, dataSource };
}

function makeEnergyService(user: any, progress: any) {
  const progressRepo = { findOne: jest.fn().mockResolvedValue(progress) };
  const manager = {
    query: jest.fn().mockResolvedValue([]),
    getRepository: jest.fn(() => progressRepo),
  };
  const dataSource = {
    transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)),
  };
  const userRepo = { findOne: jest.fn().mockResolvedValue(user) };
  const service = new ProfileService(
    userRepo as any,
    {} as any,
    {} as any,
    { incrementProgress: jest.fn() } as any,
    dataSource as any,
  );
  return { service, manager, dataSource, progressRepo };
}
