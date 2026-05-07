import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    const progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) throw new NotFoundException('User progress not found');

    // Check already owned
    if (item.oneTimePurchase) {
      const existing = await this.purchaseRepo.findOne({ where: { userId, itemId } });
      if (existing) throw new BadRequestException('Already owned');
    }

    // Check credits
    if ((progress.credits ?? 0) < item.creditCost) {
      throw new BadRequestException('Not enough credits');
    }

    // Deduct credits
    progress.credits = (progress.credits ?? 0) - item.creditCost;
    await this.progressRepo.save(progress);

    // Record purchase
    const purchase = this.purchaseRepo.create({ userId, itemId });
    await this.purchaseRepo.save(purchase);

    // Apply cosmetic immediately
    if (item.category === 'cosmetic' && item.cosmeticType && item.applyValue) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        if (item.cosmeticType === 'theme') user.theme = item.applyValue;
        if (item.cosmeticType === 'callingCard') user.callingCard = item.applyValue;
        await this.userRepo.save(user);
      }
    }

    return {
      success: true,
      credits: progress.credits,
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        applyValue: item.applyValue,
        cosmeticType: item.cosmeticType,
        gameSlug: item.gameSlug,
      },
    };
  }

  async getOwnedItems(userId: number) {
    const purchases = await this.purchaseRepo.find({ where: { userId } });
    return purchases.map(p => ({
      itemId: p.itemId,
      name: p.item.name,
      category: p.item.category,
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
    const item = await this.itemRepo.findOne({
      where: { applyValue: skinApplyValue, available: true },
    });
    if (!item) return null;

    // Idempotent — don't double-grant
    const existing = await this.purchaseRepo.findOne({ where: { userId, itemId: item.id } });
    if (existing) return null;

    // Record as prize (no credit deduction)
    const purchase = this.purchaseRepo.create({ userId, itemId: item.id, isPrize: true });
    await this.purchaseRepo.save(purchase);

    // Apply cosmetic to user profile
    if (item.category === 'cosmetic' && item.cosmeticType && item.applyValue) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        if (item.cosmeticType === 'theme') user.theme = item.applyValue;
        if (item.cosmeticType === 'callingCard') user.callingCard = item.applyValue;
        await this.userRepo.save(user);
      }
    }

    return { name: item.name, icon: item.icon, applyValue: item.applyValue };
  }
}
