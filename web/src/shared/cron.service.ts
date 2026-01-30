"use public";
import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { Inject, Injectable, Shared, UseGuards } from "@kithinji/orca";
import { InjectRepository } from "@kithinji/typeorm";
import { SupabaseClient } from "@supabase/supabase-js";
import { Cron } from "./entities/cron.entity";
import { Repository, UpdateResult, LessThanOrEqual } from "typeorm";
import { SupabaseAuthGuard } from "@/auth/supabase.guard";
import { CronExpressionParser } from "cron-parser";
import { LinkedinPost } from "./entities/post.entity";
import { LinkedinService } from "./linkedin.service";
import { type Request } from "express";
import { User } from "@/auth/entities/user.entity";

@Injectable()
export class CronService {
  request!: Request;

  constructor(
    @Shared()
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    @InjectRepository(Cron)
    private readonly cronRepo: Repository<Cron>,
    @InjectRepository(LinkedinPost)
    private readonly postRepo: Repository<LinkedinPost>,
    private readonly linkedinService: LinkedinService,
  ) {}

  private user(): User | undefined {
    return (this.request as any).user;
  }

  private getAuthenticatedUser(): User {
    const user = this.user();
    if (!user) {
      throw new Error("User is not authenticated");
    }
    return user;
  }

  private async createCronHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async createCron(expression: string, timezone: string): Promise<Cron> {
    const user = this.getAuthenticatedUser();

    const interval = CronExpressionParser.parse(expression, {
      tz: timezone,
    });
    const nextRunAt = interval.next().toDate();

    const cron = await this.cronRepo.save(
      this.cronRepo.create({
        expression,
        timezone,
        next_run_at: nextRunAt,
        user,
      }),
    );

    return cron;
  }

  private async getCronsHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async getCrons(): Promise<Cron[]> {
    const user = this.getAuthenticatedUser();

    return await this.cronRepo.find({
      where: { user: { id: user.id } },
      order: { next_run_at: "ASC" },
    });
  }

  private async deleteCronHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async deleteCron(id: string): Promise<UpdateResult> {
    const user = this.getAuthenticatedUser();

    const cron = await this.cronRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!cron) {
      throw new Error(
        "Cron not found or you don't have permission to delete it",
      );
    }

    return await this.cronRepo.softDelete(id);
  }

  public async runTasks() {
    const now = new Date();

    const crons = await this.cronRepo.find({
      where: {
        is_active: true,
        next_run_at: LessThanOrEqual(now),
      },
      relations: ["user"],
    });

    for (const cron of crons) {
      try {
        const post = await this.postRepo.findOne({
          where: { user: { id: cron.user.id }, posted: false },
          order: { created_at: "ASC" },
        });

        if (post) {
          this.linkedinService.post(post.id).catch((err) => {
            console.error(
              `Error posting to LinkedIn for post ${post.id}:`,
              err,
            );
          });
        }

        const interval = CronExpressionParser.parse(cron.expression, {
          tz: cron.timezone,
          currentDate: now,
        });
        const nextRunAt = interval.next().toDate();

        await this.cronRepo.update(cron.id, {
          last_run_at: now,
          next_run_at: nextRunAt,
        });
      } catch (error) {
        console.error(`Error running cron ${cron.id}:`, error);
      }
    }

    return true;
  }
}
