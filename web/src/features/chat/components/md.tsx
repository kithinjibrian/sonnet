"use client";

import { style$ } from "@kithinji/arcane";
import { Component, computed } from "@kithinji/orca";
import { marked } from "marked";

const cls = style$({
  main: {
    flex: 1,
    overflowY: "auto",
    padding: "0 1rem",
  },
  content_block: {
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "8px",
    borderLeft: "4px solid #333",
  },
  // Code block wrapper
  code_wrapper: {
    position: "relative",
    marginTop: "1.5rem",
    marginBottom: "2rem",
  },
  // Copy button
  copy_button: {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    backgroundColor: "#3a3a3a",
    color: "#e8e8e8",
    border: "1px solid #4a4a4a",
    borderRadius: "4px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
    zIndex: 10,
  },
  copy_button_hover: {
    backgroundColor: "#4a4a4a",
  },
  copy_button_copied: {
    backgroundColor: "#ff5722",
    borderColor: "#ff5722",
  },
  // Heading styles
  h1: {
    fontSize: "2.25rem",
    fontWeight: "bold",
    marginTop: "1rem",
    marginBottom: "1.5rem",
    color: "#ffffff",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  h2: {
    fontSize: "1.75rem",
    fontWeight: "bold",
    marginTop: "2.5rem",
    marginBottom: "1.25rem",
    color: "#e8e8e8",
    lineHeight: "1.3",
    letterSpacing: "-0.01em",
  },
  h3: {
    fontSize: "1.375rem",
    fontWeight: "600",
    marginTop: "2rem",
    marginBottom: "1rem",
    color: "#d0d0d0",
    lineHeight: "1.4",
  },
  // Paragraph
  paragraph: {
    fontSize: "1rem",
    marginBottom: "1.5rem",
    lineHeight: "1.5",
    color: "#c0c0c0",
    letterSpacing: "0.01em",
  },
  // Code blocks
  pre: {
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    padding: "1.5rem",
    overflowX: "auto",
    border: "1px solid #3a3a3a",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    margin: 0,
  },
  code: {
    backgroundColor: "#1a1a1a",
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "0.9em",
    fontFamily: "monospace",
    color: "#ff5722",
    border: "1px solid #3a3a3a",
  },
  // Blockquote
  blockquote: {
    borderLeft: "4px solid #ff5722",
    paddingLeft: "1.5rem",
    marginLeft: "0",
    marginTop: "1.5rem",
    marginBottom: "2rem",
    fontStyle: "italic",
    color: "#a0a0a0",
    fontSize: "1rem",
    lineHeight: "1.8",
  },
  // Lists
  ul: {
    listStyle: "disc",
    paddingLeft: "2rem",
    marginTop: "1rem",
    marginBottom: "2rem",
    color: "#c0c0c0",
    fontSize: "1rem",
  },
  ol: {
    listStyle: "decimal",
    paddingLeft: "2rem",
    marginTop: "1rem",
    marginBottom: "2rem",
    color: "#c0c0c0",
    fontSize: "1rem",
  },
  li: {
    marginBottom: "0.75rem",
    lineHeight: "1.8",
  },
  // Links
  link: {
    color: "#58a6ff",
    textDecoration: "none",
    borderBottom: "1px solid transparent",
    transition: "border-color 0.2s",
  },
  // Strong/Bold
  strong: {
    fontWeight: "600",
    color: "#e8e8e8",
  },
  // Horizontal rule
  hr: {
    border: "none",
    borderTop: "1px solid #3a3a3a",
    marginTop: "3rem",
    marginBottom: "3rem",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "1.5rem 0",
  },

  navButton: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "1rem 1.25rem",
    minWidth: "160px",

    background: "#242424",
    border: "1px solid #161616",
    borderRadius: "12px",

    cursor: "pointer",
    textAlign: "left",

    transition: "background 0.2s ease, border-color 0.2s ease",
  },

  label: {
    fontSize: "0.8rem",
    color: "#777",
  },

  title: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "white",
  },

  next: {
    textAlign: "right",
    alignItems: "flex-end",
  },
});

marked.use({
  hooks: {
    postprocess(html) {
      return html
        .replace(/<h1>/g, `<h1 class="${cls.h1}">`)
        .replace(/<h2>/g, `<h2 class="${cls.h2}">`)
        .replace(/<h3>/g, `<h3 class="${cls.h3}">`)
        .replace(/<p>/g, `<p class="${cls.paragraph}">`)
        .replace(/<blockquote>/g, `<blockquote class="${cls.blockquote}">`)
        .replace(/<ul>/g, `<ul class="${cls.ul}">`)
        .replace(/<ol>/g, `<ol class="${cls.ol}">`)
        .replace(/<li>/g, `<li class="${cls.li}">`)
        .replace(/<a href=/g, `<a class="${cls.link}" href=`)
        .replace(/<strong>/g, `<strong class="${cls.strong}">`)
        .replace(/<hr>/g, `<hr class="${cls.hr}">`);
    },
  },
});

@Component({
  inject: [],
})
export class Md {
  props!: {
    md: string;
  };

  build() {
    const h = computed(() => {
      const markdown = this.props.md;
      const html = marked.parse(markdown, {
        async: false,
      });
      return html;
    });

    return <div dangerouslySetInnerHTML={{ __html: h.value }} />;
  }
}
