"use client";

import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { apply$, style$ } from "@kithinji/arcane";
import { Component, Inject, signal } from "@kithinji/orca";
import { SupabaseClient } from "@supabase/supabase-js";
import { LinkedinService } from "../linkedin.service";
import { ClientService } from "../client.service";

@Component()
export class AppHeader {
  isSignedIn = signal(false);

  props!: {
    reload?: boolean;
  };

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    private readonly linkedinService: LinkedinService,
    private readonly clientService: ClientService,
  ) {
    this.clientService.isSignedIn$.subscribe((session) => {
      this.isSignedIn.value = !!session;

      if (this.isSignedIn.value && this.props?.reload) {
        // This is a bad hack
        // don't know why this.isSignedIn.value effect doesn't work
        // after redirecting back from linkedin login page
        window.location.href = window.location.origin;
      }

      if (session?.provider_token) {
        this.linkedinService.storeProviderToken(session?.provider_token);
      }
    });
  }

  async connectLinkedin() {
    await this.supabaseClient.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        scopes: "openid profile email w_member_social",
        redirectTo: `${window.location.origin}?reload=true`,
        skipBrowserRedirect: false,
      },
    });
  }

  build() {
    return (
      <header {...apply$(cls.header)}>
        <div {...apply$(cls.div)}>
          <h2>
            <a href="/" {...apply$(cls.logo)}>
              Sonnet
            </a>
          </h2>
        </div>
        <div>
          {this.isSignedIn.value == false && (
            <button onClick={() => this.connectLinkedin()}>
              Connect LinkedIn
            </button>
          )}
        </div>
      </header>
    );
  }
}

const cls = style$({
  header: {
    padding: "0.5rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  div: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
  },
  button: {
    border: "none",
    cursor: "pointer",
    fontSize: "1.5rem",
    color: "#e8e8e8",
    padding: "4px",
    background: "none",
    borderRadius: "4px",
    display: {
      default: "none",
      "@media (max-width: 1024px)": "block",
    },
  },
  logo: {
    textDecoration: "none",
    color: "#ff5722",
  },
});
