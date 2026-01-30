"use client";

import { apply$, style$ } from "@kithinji/arcane";
import { Component, Signal, signal } from "@kithinji/orca";
import { Sidebar } from "../../../shared/component/sidebar";
import { SidebarPanel } from "../../../shared/component/sidebar-panel";
import { ChatService } from "../chat.service";
import { Chatbox } from "./chatbox";
import { Messages } from "./messages";
import { Queue } from "@/shared/component/queue";
import { type Message } from "../entities/message.entity";
import { type Chat } from "../entities/chat.entity";

@Component({
  inject: [
    Queue, //
    Sidebar,
    SidebarPanel,
    Chatbox,
    Messages,
  ],
})
export class ChatMainArea {
  sidebarOpen = signal(false);
  messages: Signal<Message[]> = signal<Message[]>([]);
  ref: Signal<HTMLElement> = signal(null);

  props!: {
    chatId: string;
    prompt?: string;
    chats: Chat[];
  };

  constructor(private readonly chatService: ChatService) {}

  onInit() {
    this.chatService.getMessages(this.props.chatId).then((val) => {
      this.messages.value = val;
    });

    if (this.props.prompt) {
      this.sendPrompt(this.props.prompt);
    }
  }

  sendPrompt(prompt: string) {
    let currentContent = "";
    let assistantMessageId: string | null = null;

    const stream = this.chatService.prompt(this.props.chatId, prompt);

    stream.subscribe({
      next: (event) => {
        queueMicrotask(() =>
          this.ref.value?.scrollTo({
            top: this.ref.value?.scrollHeight,
            behavior: "smooth",
          }),
        );

        if (event.type === "message") {
          this.messages.value = [...this.messages.value, event.message];

          if (event.sender === "assistant") {
            assistantMessageId = event.message.id;
          }
        } else if (event.type === "update" && assistantMessageId) {
          currentContent += event.chunk;

          this.messages.value = this.messages.value.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: currentContent }
              : msg,
          );
        }
      },
      error: (err) => {
        console.error("Stream error:", err);
      },
      complete: () => {
        console.log("Stream complete");

        currentContent = "";
        assistantMessageId = null;
      },
    });
  }
  build() {
    return (
      <div {...apply$(cls.container)}>
        {/* left bar */}
        <div
          {...apply$(this.sidebarOpen.value ? cls.leftPanel2 : cls.leftPanel)}
        >
          {this.sidebarOpen.value ? (
            <SidebarPanel
              chats={this.props.chats}
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
          <Messages messages={this.messages.value} ref={this.ref} />
          <Chatbox sendMessage={(message) => this.sendPrompt(message)} />
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
