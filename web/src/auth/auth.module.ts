import { Module } from "@kithinji/orca";
import { TypeOrmModule } from "@kithinji/typeorm";
import { User } from "./entities/user.entity";
import { AuthService } from "./auth.service";
import { Bot } from "@/features/chat/entities/bot.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Bot])],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
