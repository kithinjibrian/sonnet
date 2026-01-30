import { Module, RouterModule } from "@kithinji/orca";
import { LinkedinService } from "./linkedin.service";
import { ClientService } from "./client.service";
import { SupabaseModule } from "@/supabase/supabase.module";
import { TypeOrmModule } from "@kithinji/typeorm";
import { LinkedinPost } from "./entities/post.entity";
import { Cron } from "./entities/cron.entity";
import { CronService } from "./cron.service";
import { AuthModule } from "@/auth/auth.module";
import { Button } from "./component/button";
import { PaperClip } from "./component/paperclip";
import { AppHeader } from "./component/header";
import { Queue } from "./component/queue";
import { SidebarLeft } from "./component/sidebar-left";
import { SidebarRight } from "./component/sidebar-right";
import { Setting } from "./component/setting";
import { SidebarModal } from "./component/setting-modal";
import { TimerStart } from "./component/time-start";
import { ListView } from "./component/list-view";
import { Sidebar } from "./component/sidebar";
import { SidebarPanel } from "./component/sidebar-panel";

@Module({
  imports: [
    AuthModule,
    SupabaseModule,
    RouterModule.forRoot(),
    TypeOrmModule.forFeature([
      LinkedinPost, //
      Cron,
    ]),
  ],
  providers: [
    LinkedinService, //
    ClientService,
    CronService,
  ],
  declarations: [
    Button, //
    PaperClip,
    AppHeader,
    Queue,
    SidebarLeft,
    SidebarRight,
    Setting,
    SidebarModal,
    TimerStart,
    ListView,
    Sidebar,
    SidebarPanel,
  ],
  exports: [
    Button, //
    PaperClip,
    AppHeader,
    Queue,
    SidebarLeft,
    SidebarRight,
    Setting,
    SidebarModal,
    TimerStart,
    ListView,
    Sidebar,
    SidebarPanel,
    // providers
    LinkedinService,
    ClientService,
  ],
})
export class SharedModule {}
