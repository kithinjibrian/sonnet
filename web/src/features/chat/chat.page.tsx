"use client";

import { Component, Signal, signal } from "@kithinji/orca";
import { apply$, style$ } from "@kithinji/arcane";
import { AppHeader } from "@/shared/component/header";
import { ChatMainArea } from "./components/main";
import { ChatService } from "./chat.service";
import { type Chat } from "./entities/chat.entity";

@Component({
  inject: [AppHeader, ChatMainArea],
  route: "/chat/:id",
})
export class ChatPage {
  props!: {
    id: string;
    prompt?: string;
  };

  chats: Signal<Chat[]> = signal([]);

  constructor(private readonly chatService: ChatService) {
    this.chatService.getChats().then((chats) => (this.chats.value = chats));
  }

  build() {
    return (
      <div {...apply$(cls.container)}>
        <AppHeader />
        <div {...apply$(cls.content)}>
          <ChatMainArea
            chats={this.chats.value}
            prompt={this.props.prompt}
            chatId={this.props.id}
          />
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    backgroundColor: "#161616",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "#e8e8e8",
  },
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
});
