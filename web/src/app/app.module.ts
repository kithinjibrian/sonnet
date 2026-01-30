import {
  DynamicModule,
  EXPRESS_ADAPTER_HOST,
  Inject,
  Injectable,
  Module,
  RouterModule,
  ServeStaticModule,
} from "@kithinji/orca";
import { SharedModule } from "@/shared/shared.module";
import { AppService } from "./app.service";
import { AppPage } from "./app.page";
import { ChatModule } from "@/features/chat/chat.module";
import { TypeOrmModule } from "@kithinji/typeorm";
import { LinkedinPost } from "@/shared/entities/post.entity";
import { AuthModule } from "@/auth/auth.module";
import { User } from "@/auth/entities/user.entity";
import { Cron } from "@/shared/entities/cron.entity";
import { Chat } from "@/features/chat/entities/chat.entity";
import { Message } from "@/features/chat/entities/message.entity";
import { MainArea } from "./components/main";
import { TextBox } from "./components/textbox";
import { Bot } from "@/features/chat/entities/bot.entity";

@Module({
  imports: [
    ChatModule,
    AuthModule,
    SharedModule,
    RouterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: "./public",
    }),
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "db.sqlite",
      entities: [
        LinkedinPost, //
        User,
        Cron,
        Chat,
        Message,
        Bot,
      ],
      synchronize: true,
      extra: {
        pragma: "foreign_keys=ON",
      },
    }),
  ],
  providers: [AppService],
  declarations: [
    AppPage, //
    MainArea,
    TextBox,
  ],
  exports: [AppService, AppPage],
  bootstrap: AppPage,
})
export class AppModule {}
