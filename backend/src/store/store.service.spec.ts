import { StoreService } from './store.service';
import { StoreItem } from '../entities/StoreItem';
import { UserProgress } from '../entities/UserProgress';
import { UserPurchase } from '../entities/UserPurchase';

jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('typeorm', () => ({ DataSource: class DataSource {}, Repository: class Repository {} }));
jest.mock('../entities/StoreItem', () => ({ StoreItem: class StoreItem {} }));
jest.mock('../entities/UserProgress', () => ({ UserProgress: class UserProgress {} }));
jest.mock('../entities/UserPurchase', () => ({ UserPurchase: class UserPurchase {} }));
jest.mock('../entities/user.entity', () => ({ User: class User {} }));

describe('StoreService purchase synchronization', () => {
  it('continues to allow repeat purchases when oneTimePurchase is false', async () => {
    const item = {
      id: 9,
      name: 'Repeatable Energy Theme',
      category: 'cosmetic',
      applyValue: 'repeatable-theme',
      creditCost: 10,
      oneTimePurchase: false,
    };
    const progress = {
      userId: 7,
      credits: 50,
      energy: 7,
      maxEnergy: 10,
      xp: 345,
      completedLessons: '["html-headings"]',
    };
    const purchaseRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const progressRepo = {
      findOne: jest.fn().mockResolvedValue(progress),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const manager = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn((entity) => entity === UserProgress ? progressRepo : purchaseRepo),
    };
    const dataSource = {
      transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)),
    };
    const service = new StoreService(
      { findOne: jest.fn().mockResolvedValue(item) } as any,
      purchaseRepo as any,
      progressRepo as any,
      {} as any,
      dataSource as any,
    );

    const first = await service.purchase(7, item.id);
    const second = await service.purchase(7, item.id);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(purchaseRepo.findOne).not.toHaveBeenCalled();
    expect(purchaseRepo.save).toHaveBeenCalledTimes(2);
    expect(progress.credits).toBe(30);
    expect(progress).toMatchObject({ xp: 345, completedLessons: '["html-headings"]' });
    expect(manager.query.mock.calls.filter(([sql]) => sql.includes('FOR UPDATE'))).toHaveLength(2);
  });
});
