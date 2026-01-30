"use client";
import { apply$, style$ } from "@kithinji/arcane";
import { Component, Signal, signal } from "@kithinji/orca";
import { TextBox } from "./textbox";
import { Queue } from "@/shared/component/queue";
import { SidebarPanel } from "@/shared/component/sidebar-panel";
import { Sidebar } from "@/shared/component/sidebar";
import { type Chat } from "@/features/chat/entities/chat.entity";
import { ChatService } from "@/features/chat/chat.service";
import { ClientService } from "@/shared/client.service";

@Component({
  inject: [TextBox, Queue],
})
export class MainArea {
  sidebarOpen = signal(false);
  isSignedIn = signal(false);

  chats: Signal<Chat[]> = signal([]);

  constructor(
    private readonly chatService: ChatService,
    private readonly clientService: ClientService,
  ) {
    this.clientService.isSignedIn$.subscribe((session) => {
      this.isSignedIn.value = !!session;

      if (this.isSignedIn.value)
        this.chatService.getChats().then((chats) => (this.chats.value = chats));
    });
  }

  build() {
    return (
      <div {...apply$(cls.container)}>
        <div
          {...apply$(this.sidebarOpen.value ? cls.leftPanel2 : cls.leftPanel)}
        >
          {this.sidebarOpen.value ? (
            <SidebarPanel
              chats={this.chats.value}
              toggleSidebar={() =>
                (this.sidebarOpen.value = !this.sidebarOpen.value)
              }
            />
          ) : (
            <Sidebar
              toggleSidebar={() =>
                (this.sidebarOpen.value = !this.sidebarOpen.value)
              }
            />
          )}
        </div>

        {/* middle panel */}
        <div {...apply$(cls.middlePanel)}>
          <TextBox />
        </div>

        <div {...apply$(cls.rightPanel)}>
          <Queue />
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    padding: 10,
    gap: 10,
  },
  leftPanel: {
    width: 60,
    flexShrink: 0,
    overflow: "auto",
    backgroundColor: "#242424",
    borderRadius: 8,
    transition: "width 0.3s ease",
  },
  leftPanel2: {
    width: "25%",
    flexShrink: 0,
    overflow: "auto",
    backgroundColor: "#242424",
    borderRadius: 8,
    transition: "width 0.3s ease",
  },
  middlePanel: {
    flex: 1,
    backgroundColor: "#242424",
    borderRadius: 8,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "0 10px",
  },
  rightPanel: {
    width: "25%",
    flexShrink: 0,
    overflow: "auto",
    backgroundColor: "#242424",
    borderRadius: 8,
  },
});
