"use client";

import { apply$, style$ } from "@kithinji/arcane";
import { Component, signal } from "@kithinji/orca";

@Component({
  inject: [],
})
export class Chatbox {
  text = signal("");

  props!: {
    sendMessage: (message: string) => void;
  };

  sendMessage() {
    this.props.sendMessage(this.text.value);

    this.text.value = "";
  }

  build() {
    return (
      <div {...apply$(cls.container)}>
        <div {...apply$(cls.inputWrapper)}>
          <textarea
            {...apply$(cls.textarea)}
            placeholder="Message Sonnet..."
            rows={1}
            value={this.text.value}
            onChange={(e: any) => (this.text.value = e.target.value)}
          />
          <button
            {...apply$(cls.sendButton)}
            onClick={() => this.sendMessage()}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              stroke-width="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    padding: "16px 20px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    backgroundColor: "#2f2f2f",
    borderRadius: 24,
    padding: "12px 16px",
  },
  textarea: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    color: "#e8e8e8",
    fontSize: 15,
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    maxHeight: 200,
  },
  sendButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
});
