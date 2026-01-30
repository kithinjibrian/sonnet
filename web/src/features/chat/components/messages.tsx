"use client";

import { apply$, style$ } from "@kithinji/arcane";
import { Component, Signal } from "@kithinji/orca";
import { Md } from "./md";
import { type Message } from "../entities/message.entity";

@Component({
  inject: [Md],
})
export class Messages {
  props!: {
    messages: Message[];
    ref: Signal<HTMLElement>;
  };

  build() {
    return (
      <div {...apply$(cls.container)}>
        <span>
          {this.props.messages.map((message, index) => (
            <div
              key={index}
              {...apply$(
                cls.messageWrapper,
                message.sender === "user" ? cls.myMessage : cls.aiMessage,
              )}
            >
              {message.sender === "user" ? (
                <div {...apply$(cls.messageBubble)}>
                  <div {...apply$(cls.content)}>{message.content}</div>
                </div>
              ) : (
                <div {...apply$(cls.aiContent)}>
                  <Md md={message.content} />
                </div>
              )}
            </div>
          ))}
        </span>
        <div ref={this.props.ref.value} />
      </div>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    padding: 20,
    flex: 1,
    overflowY: "auto",
  },
  messageWrapper: {
    display: "flex",
    width: "100%",
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: 18,
    backgroundColor: "#161616",
  },
  content: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#e8e8e8",
  },
  aiContent: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#e8e8e8",
    maxWidth: "100%",
  },
});
