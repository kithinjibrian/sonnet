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

@Entity("bots")
export class Bot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column()
  base_url: string;

  @Column()
  api_key: string;

  @Column()
  type: "main" | "judge" | "audience";

  @Column({ type: "json" })
  system_prompts: string[];

  @ManyToOne(() => User, (user) => user.bots, {
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
