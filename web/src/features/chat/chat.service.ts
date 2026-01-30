"use public";

import {
  Inject,
  Injectable,
  Shared,
  Signature,
  UseGuards,
} from "@kithinji/orca";
import { chatCreateInput, chatCreateOutput } from "./schemas/create";
import { Observable } from "rxjs";
import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { SupabaseClient } from "@supabase/supabase-js";
import { type Request } from "express";
import { SupabaseAuthGuard } from "@/auth/supabase.guard";
import { InjectRepository } from "@kithinji/typeorm";
import { Chat } from "./entities/chat.entity";
import { Repository } from "typeorm";
import { User } from "@/auth/entities/user.entity";
import { Message } from "./entities/message.entity";
import OpenAI from "openai";
import { env$ } from "@kithinji/arcane";
import { BotService } from "./bot.service";

export type PromptEvent =
  | {
      type: "message";
      sender: "user" | "assistant";
      message: Message;
    }
  | {
      type: "update";
      id: string;
      chunk: string;
    }
  | {
      type: "complete";
      id: string;
    };

@Injectable()
export class ChatService {
  request!: Request;

  constructor(
    @Shared()
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly botService: BotService,
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

  private async promptHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      token,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public prompt(chatId: string, prompt: string): Observable<PromptEvent> {
    const user = this.getAuthenticatedUser();

    return new Observable<PromptEvent>((observer) => {
      let assistantMessage: Message | null = null;
      const abortController = new AbortController();
      let accumulatedContent = "";
      let lastSaveTime = Date.now();
      const SAVE_INTERVAL_MS = 2000;

      (async () => {
        try {
          const chat = await this.chatRepo.findOne({
            where: { id: chatId },
            relations: ["user"],
          });

          if (!chat) {
            throw new Error("Chat not found");
          }

          if (chat.user?.id !== user.id) {
            throw new Error("Unauthorized access to chat");
          }

          const userMessage = await this.messageRepo.save(
            this.messageRepo.create({
              chat,
              sender: "user",
              content: prompt.trim(),
            }),
          );

          observer.next({
            type: "message",
            sender: "user",
            message: userMessage,
          });

          assistantMessage = await this.messageRepo.save(
            this.messageRepo.create({
              chat,
              sender: "assistant",
              content: "",
            }),
          );

          observer.next({
            type: "message",
            sender: "assistant",
            message: assistantMessage,
          });

          const bot = await this.botService.getMainBot(user.id);

          const previousMessages = await this.messageRepo.find({
            where: { chat: { id: chatId } },
            order: { created_at: "ASC" },
            take: 50,
          });

          const messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }> = [
            {
              role: "system",
              content: bot.system_prompts.join("\n\n"),
            },
            ...previousMessages
              .filter((m) => m.id !== userMessage.id && m.content?.trim())
              .map((m) => ({
                role: m.sender as "user" | "assistant",
                content: m.content,
              })),
            {
              role: "user",
              content: prompt.trim(),
            },
          ];

          const client = new OpenAI({
            baseURL: bot.base_url,
            apiKey: bot.api_key,
          });

          const stream = await client.chat.completions.create(
            {
              model: bot.model,
              stream: true,
              messages,
            },
            {
              signal: abortController.signal,
            },
          );

          try {
            for await (const chunk of stream) {
              if (abortController.signal.aborted) {
                break;
              }

              const delta = chunk.choices[0]?.delta?.content;
              if (!delta) continue;

              accumulatedContent += delta;

              observer.next({
                type: "update",
                id: assistantMessage.id,
                chunk: delta,
              });

              const now = Date.now();
              if (now - lastSaveTime > SAVE_INTERVAL_MS) {
                assistantMessage.content = accumulatedContent;
                await this.messageRepo.save(assistantMessage);
                lastSaveTime = now;
              }
            }
          } catch (streamError) {
            throw streamError;

            // if (streamError.name === "AbortError") {
            //   console.log("Stream aborted by client");
            // } else {
            // }
          }

          assistantMessage.content = accumulatedContent;
          await this.messageRepo.save(assistantMessage);

          observer.next({
            type: "complete",
            id: assistantMessage.id,
          });

          observer.complete();
        } catch (err) {
          console.error("Error in prompt method:", err);

          if (assistantMessage && !accumulatedContent) {
            try {
              await this.messageRepo.remove(assistantMessage);
            } catch (cleanupError) {
              console.error(
                "Failed to clean up assistant message:",
                cleanupError,
              );
            }
          } else if (assistantMessage && accumulatedContent) {
            try {
              assistantMessage.content = accumulatedContent;
              await this.messageRepo.save(assistantMessage);
            } catch (saveError) {
              console.error("Failed to save partial response:", saveError);
            }
          }

          observer.error(err);
        }
      })();

      return () => {
        console.log("Client disconnected, aborting stream");
        abortController.abort();
      };
    });
  }

  private async createChatHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Signature(chatCreateInput, chatCreateOutput)
  public async createChat(prompt: string) {
    const user = this.getAuthenticatedUser();

    return await this.chatRepo.save(
      this.chatRepo.create({
        user,
        title: prompt,
      }),
    );
  }

  private async getMessagesHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async getMessages(chatId: string) {
    const user = this.getAuthenticatedUser();

    return await this.messageRepo.find({
      where: { chat: { id: chatId } },
    });
  }

  private async getChatsHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async getChats() {
    const user = this.getAuthenticatedUser();

    return await this.chatRepo.find({
      where: { user: { id: user.id } },
    });
  }
}
