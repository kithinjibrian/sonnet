import { Bot } from "@/features/chat/entities/bot.entity";
import { Chat } from "@/features/chat/entities/chat.entity";
import { Cron } from "@/shared/entities/cron.entity";
import { LinkedinPost } from "@/shared/entities/post.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Index(["email"])
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ default: 0 })
  token_used: number;

  @Column({ default: 1000 })
  token_limit: number;

  @OneToMany(() => LinkedinPost, (post) => post.user, {
    cascade: true,
  })
  posts: LinkedinPost[];

  @OneToMany(() => Cron, (cron) => cron.user, {
    cascade: true,
  })
  crons: Cron[];

  @OneToMany(() => Chat, (chat) => chat.user, {
    cascade: true,
  })
  chats: Chat[];

  @OneToMany(() => Bot, (bot) => bot.user, {
    cascade: true,
  })
  bots: Bot[];

  @Column()
  owner_id: string;

  @Column({ nullable: true })
  provider_token?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
