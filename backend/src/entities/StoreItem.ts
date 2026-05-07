import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StoreItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  // 'game' | 'cosmetic' | 'powerup'
  @Column()
  category: string;

  @Column()
  creditCost: number;

  // For 'game' items: the game slug that gets unlocked
  @Column({ nullable: true })
  gameSlug: string;

  // For 'cosmetic' items: which field it applies to (theme, callingCard, avatar)
  @Column({ nullable: true })
  cosmeticType: string;

  // The value applied when purchased (href, theme key, etc.)
  @Column({ nullable: true })
  applyValue: string;

  // Whether it can only be purchased once per user
  @Column({ default: true })
  oneTimePurchase: boolean;

  @Column({ default: true })
  available: boolean;

  // True for tier-skin cosmetics: earn-only, never appears in buy catalog
  @Column({ default: false })
  milestoneOnly: boolean;
}
