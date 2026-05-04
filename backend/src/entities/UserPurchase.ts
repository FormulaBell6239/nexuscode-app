import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { StoreItem } from './StoreItem';

@Entity()
export class UserPurchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => StoreItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'itemId' })
  item: StoreItem;

  @Column()
  itemId: number;

  @CreateDateColumn()
  purchasedAt: Date;
}
