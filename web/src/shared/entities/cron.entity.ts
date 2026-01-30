import { User } from "@/auth/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("crons")
export class Cron {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  expression: string;

  @Column()
  timezone: string;

  @Column({ type: "datetime" })
  next_run_at: Date;

  @Column({ type: "datetime", nullable: true })
  last_run_at: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, (user) => user.crons, {
    onDelete: "CASCADE",
  })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
