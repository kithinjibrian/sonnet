import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { Inject, Injectable } from "@kithinji/orca";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable()
export class ClientService {
  private refreshPostsSubject = new Subject<void>();
  public refreshPosts$ = this.refreshPostsSubject.asObservable();

  private isSignedInSubject = new BehaviorSubject<Session | null>(null);
  public isSignedIn$ = this.isSignedInSubject.asObservable();

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
  ) {
    this.initializeAuth();

    this.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        this.isSignedInSubject.next(session);
      } else if (event === "SIGNED_OUT") {
        this.isSignedInSubject.next(null);
      }
    });
  }

  private async initializeAuth() {
    const {
      data: { session },
    } = await this.supabaseClient.auth.getSession();
    this.isSignedInSubject.next(session);
  }

  fetchPost() {
    this.refreshPostsSubject.next();
  }

  getCurrentSession(): Session | null {
    return this.isSignedInSubject.getValue();
  }
}
