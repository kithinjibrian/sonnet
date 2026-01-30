import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Message } from "./message.entity";
import { User } from "@/auth/entities/user.entity";

@Entity("chats")
export class Chat {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.chats, {
    onDelete: "CASCADE",
  })
  user: User;

  @OneToMany(() => Message, (msg) => msg.chat, {
    cascade: true,
  })
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
