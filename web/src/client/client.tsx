"use client";

import { SupabaseModule } from "@/supabase/supabase.module";
import {
  Module,
  BrowserFactory,
  Component,
  RouterModule,
  RouterOutlet,
  HttpClientModule,
} from "@kithinji/orca";

@Component({
  inject: [RouterOutlet],
})
class AppComponent {
  build() {
    return <RouterOutlet />;
  }
}

@Module({
  imports: [RouterModule.forRoot(), HttpClientModule, SupabaseModule],
  declarations: [AppComponent],
  bootstrap: AppComponent,
})
class AppModule {}

export async function bootstrap() {
  await BrowserFactory.create(AppModule, document.getElementById("root")!);
}

bootstrap();

/* Don't modify */
export { Navigate, getCurrentInjector } from "@kithinji/orca";
