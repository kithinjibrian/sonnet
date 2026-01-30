import { env$ } from "@kithinji/arcane";
import { Module } from "@kithinji/orca";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CLIENT = Symbol("supabase:client");

@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (): SupabaseClient =>
        createClient(
          env$("SUPABASE_URL"), //
          env$("SUPABASE_SERVICE_KEY"),
        ),
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
