import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: true })
    isActive: boolean;

    // Profile fields
    @Column({ nullable: true })
    displayName: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ nullable: true, default: '👾' })
    avatar: string;

    @Column({ nullable: true, default: 'indigo' })
    callingCard: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}