import { GameService } from './game.service';

jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('typeorm', () => ({ DataSource: class DataSource {}, Repository: class Repository {} }));
jest.mock('../entities/Game', () => ({ Game: class Game {} }));
jest.mock('../entities/StoreItem', () => ({ StoreItem: class StoreItem {} }));
jest.mock('../entities/UserPurchase', () => ({ UserPurchase: class UserPurchase {} }));
jest.mock('../achievements/achievements.service', () => ({ AchievementsService: class AchievementsService {} }));

describe('GameService progress synchronization', () => {
  it('adds the existing 100 XP under the progress row lock and preserves reward thresholds', async () => {
    const manager = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('SELECT "xp" FROM "user_progress"')) return [{ xp: 250 }];
        return [];
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)),
    };
    const achievements = { incrementProgress: jest.fn().mockResolvedValue({ creditsAwarded: 0, prizes: [] }) };
    const service = new GameService(
      { findOne: jest.fn().mockResolvedValue({ id: 1, locked: false }) } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      achievements as any,
      dataSource as any,
    );

    await expect(service.completeGame(1, 7)).resolves.toMatchObject({ xp: 350, level: 2 });
    expect(manager.query.mock.calls[0][0]).toContain('INSERT INTO "user_progress"');
    expect(manager.query.mock.calls[1][0]).toContain('FOR UPDATE');
    const update = manager.query.mock.calls[2][0];
    expect(update).toContain('"xp" = $2');
    expect(update).toContain('"level" = $3');
    expect(update).toContain('"lastActiveDate" = $4');
    expect(update).not.toContain('"credits" =');
    expect(update).not.toContain('"completedLessons" =');
    expect(achievements.incrementProgress).toHaveBeenNthCalledWith(1, 7, 'challenges_completed', 1);
    expect(achievements.incrementProgress).toHaveBeenNthCalledWith(2, 7, 'targets_hit', 1);
    expect(achievements.incrementProgress).toHaveBeenCalledTimes(2);
  });

  it('retains the level-five overall-performance threshold', async () => {
    const manager = {
      query: jest.fn(async (sql: string) => sql.includes('SELECT "xp" FROM "user_progress"') ? [{ xp: 1200 }] : []),
    };
    const dataSource = { transaction: async (callback: (manager: any) => unknown) => callback(manager) };
    const achievements = { incrementProgress: jest.fn().mockResolvedValue({ creditsAwarded: 0, prizes: [] }) };
    const service = new GameService(
      { findOne: jest.fn().mockResolvedValue({ id: 1, locked: false }) } as any,
      {} as any,
      {} as any,
      achievements as any,
      dataSource as any,
    );

    await expect(service.completeGame(1, 7)).resolves.toMatchObject({ xp: 1300, level: 5 });
    expect(achievements.incrementProgress).toHaveBeenCalledWith(7, 'overall_performance', 1);
  });
});
