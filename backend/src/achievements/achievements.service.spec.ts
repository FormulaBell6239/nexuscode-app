import { DataSource, Repository } from 'typeorm';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { StoreService } from '../store/store.service';
import { AchievementsService } from './achievements.service';

jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('typeorm', () => ({ Repository: class Repository {}, DataSource: class DataSource {} }));
jest.mock('../entities/Achievement', () => ({ Achievement: class Achievement {} }));
jest.mock('../entities/UserAchievement', () => ({ UserAchievement: class UserAchievement {} }));
jest.mock('../entities/UserProgress', () => ({ UserProgress: class UserProgress {} }));
jest.mock('../store/store.service', () => ({ StoreService: class StoreService {} }));

describe('achievement reward previews', () => {
  const achievements = [
    { id: 1, name: 'First Blood', creditReward: 10 },
    { id: 2, name: 'Level 5', creditReward: 20 },
    { id: 3, name: 'Unstoppable', creditReward: 100 },
  ];
  const achievementRepo = { find: jest.fn().mockResolvedValue(achievements) };
  const userAchievementRepo = { find: jest.fn().mockResolvedValue([]) };
  const service = new AchievementsService(
    achievementRepo as unknown as Repository<Achievement>,
    userAchievementRepo as unknown as Repository<UserAchievement>,
    {} as StoreService,
    {} as DataSource,
  );

  it.each([
    ['public', () => service.getAllAchievements()],
    ['signed in', () => service.getUserAchievements(1)],
  ])('returns the same reward details for %s milestones', async (_label, load) => {
    const result = await load();
    expect(result).toEqual([
      expect.objectContaining({ emblemId: 'emblem-glitched-static', themeReward: 'ember', avatarReward: null }),
      expect.objectContaining({ emblemId: 'emblem-singularity-accretion', themeReward: 'matrix-green', avatarReward: null }),
      expect.objectContaining({ emblemId: 'emblem-voided-skulls-bonewalker', themeReward: 'solar', avatarReward: 'avatar-unbroken' }),
    ]);
  });

  it('propagates prize persistence failures from the transactional path', async () => {
    const earnedAchievement = {
      id: 4,
      name: 'First Spark',
      type: 'xp_earned',
      requiredCount: 1,
      creditReward: 10,
    };
    const achievementRepository = { find: jest.fn().mockResolvedValue([earnedAchievement]) };
    const userAchievementRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => ({ id: 9, ...value })),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const prizeError = new Error('prize insert failed');
    const store = { grantPrizeSkinInTransaction: jest.fn().mockRejectedValue(prizeError) };
    const manager = {
      getRepository: jest.fn((entity) => entity === Achievement ? achievementRepository : userAchievementRepository),
      query: jest.fn().mockResolvedValue([{ userId: 7 }]),
    };
    const transactionService = new AchievementsService(
      {} as Repository<Achievement>,
      {} as Repository<UserAchievement>,
      store as unknown as StoreService,
      {} as DataSource,
    );

    await expect(transactionService.incrementProgressInTransaction(manager as any, 7, 'xp_earned', 50))
      .rejects.toBe(prizeError);
    expect(userAchievementRepository.save).toHaveBeenCalled();
    expect(store.grantPrizeSkinInTransaction).toHaveBeenCalled();
  });

  it('locks progress before updating achievements through the transaction manager', async () => {
    const achievementRepository = { find: jest.fn().mockResolvedValue([]) };
    const manager = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn(() => achievementRepository),
    };
    const dataSource = {
      transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)),
    };
    const globalAchievementRepo = { find: jest.fn() };
    const transactionService = new AchievementsService(
      globalAchievementRepo as any,
      {} as Repository<UserAchievement>,
      {} as StoreService,
      dataSource as any,
    );

    await transactionService.incrementProgress(7, 'xp_earned', 50);

    expect(manager.query.mock.calls[0][0]).toContain('INSERT INTO "user_progress"');
    expect(manager.query.mock.calls[1][0]).toContain('FOR UPDATE');
    expect(manager.getRepository).toHaveBeenCalledWith(Achievement);
    expect(globalAchievementRepo.find).not.toHaveBeenCalled();
  });
});
