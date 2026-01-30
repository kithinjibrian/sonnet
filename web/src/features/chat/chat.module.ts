import { Module } from "@kithinji/orca";
import { SharedModule } from "@/shared/shared.module";
import { ChatService } from "./chat.service";
import { ChatPage } from "./chat.page";
import { TypeOrmModule } from "@kithinji/typeorm";
import { Message } from "./entities/message.entity";
import { Chat } from "./entities/chat.entity";
import { ChatMainArea } from "./components/main";
import { Chatbox } from "./components/chatbox";
import { Messages } from "./components/messages";
import { Md } from "./components/md";
import { BotPage } from "./pages/bot.page";
import { BotService } from "./bot.service";

@Module({
  imports: [
    SharedModule, //
    TypeOrmModule.forFeature([Chat, Message]),
  ],
  providers: [ChatService, BotService],
  declarations: [
    ChatPage, //
    BotPage,
    ChatMainArea,
    Chatbox,
    Messages,
    Md,
  ],
  exports: [ChatService, BotService, ChatPage, BotPage],
})
export class ChatModule {}
