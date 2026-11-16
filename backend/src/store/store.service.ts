import { applyEnergyRegen } from '../energy';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StoreItem } from '../entities/StoreItem';
import { UserPurchase } from '../entities/UserPurchase';
import { UserProgress } from '../entities/UserProgress';
import { User } from '../entities/user.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreItem)
    private readonly itemRepo: Repository<StoreItem>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getCatalog(userId: number | null) {
    // milestoneOnly items are earn-only — never appear in the buyable catalog
    const items = await this.itemRepo.find({ where: { available: true, milestoneOnly: false } });
    const purchases = userId
      ? await this.purchaseRepo.find({ where: { userId } })
      : [];
    const purchaseMap = new Map(purchases.map(p => [p.itemId, p]));

    const progress = userId
      ? await this.progressRepo.findOne({ where: { userId } })
      : null;
    const credits = progress?.credits ?? 0;

    return {
      credits,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        category: item.category,
        creditCost: item.creditCost,
        gameSlug: item.gameSlug,
        cosmeticType: item.cosmeticType,
        applyValue: item.applyValue,
        oneTimePurchase: item.oneTimePurchase,
        owned: item.oneTimePurchase ? purchaseMap.has(item.id) : false,
        isPrize: purchaseMap.get(item.id)?.isPrize ?? false,
      })),
    };
  }

  async purchase(userId: number, itemId: number) {
    const item = await this.itemRepo.findOne({ where: { id: itemId, available: true } });
    if (!item) throw new NotFoundException('Item not found');

    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT "userId" FROM "user_progress" WHERE "userId" = $1 FOR UPDATE`,
        [userId],
      );
      await this.lockPrizeGrantsForUser(manager, userId);
      const progressRepo = manager.getRepository(UserProgress);
      const purchaseRepo = manager.getRepository(UserPurchase);
      const progress = await progressRepo.findOne({ where: { userId } });
      if (!progress) throw new NotFoundException('User progress not found');

      if (item.oneTimePurchase) {
        const existing = await purchaseRepo.findOne({ where: { userId, itemId } });
        if (existing) throw new BadRequestException('Already owned');
      }

      const isEnergyRefill = item.category === 'powerup' && item.applyValue === 'energy_refill';
      if (isEnergyRefill) {
        applyEnergyRegen(progress);
        if (progress.energy >= progress.maxEnergy) {
          throw new BadRequestException('Energy is already full');
        }
      }

      if ((progress.credits ?? 0) < item.creditCost) {
        throw new BadRequestException('Not enough credits');
      }

      progress.credits = (progress.credits ?? 0) - item.creditCost;
      if (isEnergyRefill) {
        progress.energy = progress.maxEnergy;
        progress.energyLastRegen = new Date();
      }
      await progressRepo.save(progress);

      const purchase = purchaseRepo.create({ userId, itemId });
      await purchaseRepo.save(purchase);

      return {
        success: true,
        credits: progress.credits,
        energy: progress.energy,
        item: {
          id: item.id,
          name: item.name,
          category: item.category,
          applyValue: item.applyValue,
          cosmeticType: item.cosmeticType,
          gameSlug: item.gameSlug,
        },
      };
    });
  }

  async getOwnedItems(userId: number) {
    const purchases = await this.purchaseRepo.find({ where: { userId } });
    return purchases.map(p => ({
      itemId: p.itemId,
      name: p.item.name,
      category: p.item.category,
      cosmeticType: p.item.cosmeticType,
      applyValue: p.item.applyValue,
      gameSlug: p.item.gameSlug,
      isPrize: p.isPrize,
      purchasedAt: p.purchasedAt,
    }));
  }

  /**
   * Award an item to a user for free (prize / milestone reward).
   * Bypasses credit check. Safe to call multiple times — idempotent.
   * Returns prize info if newly granted, null if already owned.
   */
  async grantPrizeSkin(
    userId: number,
    skinApplyValue: string,
  ): Promise<{ name: string; icon: string; applyValue: string } | null> {
    return this.dataSource.transaction(async (manager) => {
      // Match the source-attempt lock order before touching reward rows.
      await manager.query(
        `SELECT "userId" FROM "user_progress" WHERE "userId" = $1 FOR UPDATE`,
        [userId],
      );
      return this.grantPrizeSkinInTransaction(manager, userId, skinApplyValue);
    });
  }

  /** Use only from a transaction that already holds this user's progress row. */
  async grantPrizeSkinInTransaction(
    manager: EntityManager,
    userId: number,
    skinApplyValue: string,
  ): Promise<{ name: string; icon: string; applyValue: string } | null> {
    // Serializes prize checks/inserts across all cooperating grant paths without
    // requiring a uniqueness migration against potentially duplicated history.
    await this.lockPrizeGrantsForUser(manager, userId);
    const item = await manager.getRepository(StoreItem).findOne({
      where: { applyValue: skinApplyValue, available: true },
    });
    if (!item) return null;

    const purchaseRepo = manager.getRepository(UserPurchase);
    const existing = await purchaseRepo.findOne({ where: { userId, itemId: item.id } });
    if (existing) return null;

    // Record as prize (no credit deduction)
    const purchase = purchaseRepo.create({ userId, itemId: item.id, isPrize: true });
    await purchaseRepo.save(purchase);

    return { name: item.name, icon: item.icon, applyValue: item.applyValue };
  }

  private async lockPrizeGrantsForUser(manager: EntityManager, userId: number): Promise<void> {
    await manager.query(`SELECT pg_advisory_xact_lock($1, $2)`, [731902, userId]);
  }
}
