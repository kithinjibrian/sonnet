import { User } from "@/auth/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from "typeorm";

@Entity("posts")
export class LinkedinPost {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  preview_text: string;

  @Column({ nullable: true })
  preview_src?: string;

  @Column({ default: false })
  posted: boolean;

  @Column("text")
  content: string;

  @Column({ type: "json" })
  images: string[];

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column({ nullable: true })
  linkedin_post_id?: string;

  @Column({ nullable: true })
  posted_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
