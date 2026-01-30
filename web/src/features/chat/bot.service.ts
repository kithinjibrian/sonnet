import { Inject, Injectable, Shared } from "@kithinji/orca";
import { InjectRepository } from "@kithinji/typeorm";
import { Bot } from "./entities/bot.entity";
import { Repository } from "typeorm";
import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { env$ } from "@kithinji/arcane";
import * as crypto from "crypto";

@Injectable()
export class BotService {
  request!: Request;

  constructor(
    @Shared()
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
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

  private decryptApiKey(encryptedData: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(env$("ENCRYPTION_KEY"), "hex");
    const parts = encryptedData.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async getMainBot(userId: string) {
    const bot = await this.botRepo.findOne({
      where: { user: { id: userId }, name: "sonnet" },
    });

    if (!bot) {
      throw new Error(`Sonnet bot not found`);
    }

    return {
      ...bot,
      api_key: this.decryptApiKey(bot.api_key),
    };
  }
}
