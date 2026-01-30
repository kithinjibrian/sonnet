"use client";

import { SidebarRight } from "@/shared/component/sidebar-right";
import { apply$, style$ } from "@kithinji/arcane";
import { Component } from "@kithinji/orca";

@Component({
  inject: [SidebarRight],
})
export class Sidebar {
  props!: {
    toggleSidebar: () => void;
  };

  build() {
    return (
      <aside {...apply$(cls.container)}>
        <div {...apply$(cls.top)}>
          <button
            {...apply$(cls.iconButton)}
            aria-label="Home"
            onClick={this.props.toggleSidebar}
          >
            <SidebarRight />
          </button>
        </div>
      </aside>
    );
  }
}

const cls = style$({
  container: {
    width: 64,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
  },

  top: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "none",
    backgroundColor: "transparent",
    color: "#bdbdbd",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s ease, color 0.15s ease",
  },
});
