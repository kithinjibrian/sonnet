import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Chat } from "./chat.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  sender: "system" | "assistant" | "user";

  @Column()
  content: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: "CASCADE",
  })
  chat: Chat;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
