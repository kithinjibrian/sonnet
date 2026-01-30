"use client";

import { ChatService } from "@/features/chat/chat.service";
import { type Chat } from "@/features/chat/entities/chat.entity";
import { SidebarLeft } from "@/shared/component/sidebar-left";
import { apply$, style$ } from "@kithinji/arcane";
import { Component, signal, Signal } from "@kithinji/orca";

@Component({
  inject: [SidebarLeft],
})
export class SidebarPanel {
  props!: {
    toggleSidebar: () => void;
    chats: Chat[];
  };

  build() {
    return (
      <aside {...apply$(cls.container)}>
        <div {...apply$(cls.header)}>
          <button
            {...apply$(cls.iconButton)}
            aria-label="Toggle Sidebar"
            onClick={this.props.toggleSidebar}
          >
            <SidebarLeft />
          </button>
          <h2 {...apply$(cls.title)}>Chats</h2>
        </div>

        <div {...apply$(cls.chatList)}>
          <ul {...apply$(cls.list)}>
            {this.props.chats.map((chat) => (
              <li {...apply$(cls.listItem)}>
                <a href={`/chat/${chat.id}`} {...apply$(cls.chatLink)}>
                  <span {...apply$(cls.chatTitle)}>{chat.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#242424",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 12px",
    borderBottom: "1px solid #333",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    color: "#bdbdbd",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease, color 0.2s ease",
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: "#e0e0e0",
    margin: 0,
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "8px 0",
  },
  emptyState: {
    padding: "32px 16px",
    textAlign: "center",
    color: "#757575",
    fontSize: 14,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  listItem: {
    margin: "2px 8px",
  },
  chatLink: {
    display: "block",
    padding: "12px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#e0e0e0",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    cursor: "pointer",
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: 500,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
