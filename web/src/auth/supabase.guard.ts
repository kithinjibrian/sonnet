import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@kithinji/orca";
import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@kithinji/typeorm";
import { Repository } from "typeorm";
import { AsyncLocalStorage } from "async_hooks";
import { Bot } from "@/features/chat/entities/bot.entity";
import { env$, inlineFile$ } from "@kithinji/arcane";
import * as crypto from "crypto";

export const requestContext = new AsyncLocalStorage<Request>();

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
  ) {}

  private encryptApiKey(data: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(env$("ENCRYPTION_KEY"), "hex");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  private async createMainBot(user: User): Promise<Bot> {
    const encryptedApiKey = this.encryptApiKey(env$("DEEPSEEK_API_KEY"));

    const bot = this.botRepo.create({
      name: "sonnet",
      model: "deepseek-chat",
      api_key: encryptedApiKey,
      type: "main",
      user,
      base_url: "https://api.deepseek.com",
      system_prompts: [inlineFile$("../resources/main_prompt.md")],
    });

    return await this.botRepo.save(bot);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new Error(
        "Missing authentication token (expected in Header or Query)",
      );
    }

    const { data, error } = await this.supabaseClient.auth.getUser(token);

    if (error || !data.user) {
      throw new Error("Invalid token");
    }

    let user = await this.userRepo.findOne({
      where: { email: data.user.user_metadata.email },
    });

    if (user == null) {
      const uData = data.user.user_metadata;

      user = await this.userRepo.save(
        this.userRepo.create({
          email: uData.email,
          first_name: uData.given_name,
          last_name: uData.family_name,
          image: uData.picture,
          owner_id: uData.sub,
        }),
      );

      // create main bot
      this.createMainBot(user);
    }

    // assign to req
    (req as any).user = user;

    return true;
  }
}
