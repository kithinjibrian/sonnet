"use client";

import { ChatPage } from "@/features/chat/chat.page";
import { ChatService } from "@/features/chat/chat.service";
import { ClientService } from "@/shared/client.service";
import { PaperClip } from "@/shared/component/paperclip";
import { LinkedinService } from "@/shared/linkedin.service";
import { apply$, style$ } from "@kithinji/arcane";
import { Component, Navigate, signal } from "@kithinji/orca";

@Component({
  inject: [PaperClip, ChatPage],
})
export class TextBox {
  text = signal("");
  selectedFiles = signal<File[]>([]);
  previews = signal<string[]>([]);
  isLoading = signal(false);
  private fileInput!: HTMLInputElement;
  isSignedIn = signal(false);

  constructor(
    private readonly navigate: Navigate,
    private readonly linkedinService: LinkedinService,
    private readonly clientService: ClientService,
    private readonly chatService: ChatService,
  ) {
    this.clientService.isSignedIn$.subscribe((session) => {
      this.isSignedIn.value = !!session;
    });
  }

  handleFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    const newFiles = Array.from(input.files);
    const current = this.selectedFiles.value;

    if (current.length + newFiles.length > 10) {
      alert("Maximum 10 images allowed");
      return;
    }

    this.selectedFiles.value = [...current, ...newFiles];
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    this.previews.value = [...this.previews.value, ...newPreviews];
  }

  removeImage(index: number) {
    const files = [...this.selectedFiles.value];
    const prevs = [...this.previews.value];

    URL.revokeObjectURL(prevs[index]);

    files.splice(index, 1);
    prevs.splice(index, 1);

    this.selectedFiles.value = files;
    this.previews.value = prevs;
  }

  onDestroy() {
    this.previews.value.forEach((url: string) => URL.revokeObjectURL(url));
  }

  addToQueue() {
    this.isLoading.value = true;

    this.linkedinService
      .createPost(this.text.value, this.selectedFiles.value)
      .then(() => {
        this.clientService.fetchPost();
        this.text.value = "";
        this.previews.value.forEach((url: string) => URL.revokeObjectURL(url));
        this.previews.value = [];
        this.selectedFiles.value = [];
      })
      .catch((error) => {
        console.error("Failed to create post:", error);
      })
      .finally(() => {
        this.isLoading.value = false;
      });
  }

  askAI() {
    this.chatService.createChat(this.text.value).then((chat) => {
      this.navigate.push(<ChatPage id={chat.id} prompt={this.text.value} />);
    });
  }

  build() {
    return (
      <div {...apply$(cls.container)}>
        <textarea
          {...apply$(cls.textarea)}
          autoFocus
          aria-label="Post editor"
          placeholder="Type LinkedIn post or ask AI..."
          spellCheck={false}
          value={this.text.value}
          onChange={(e: any) => (this.text.value = e.target.value)}
        />
        <div>
          {this.previews.value.length > 0 && (
            <div {...apply$(cls.previewGrid)}>
              {this.previews.value.map((src: any, i: number) => (
                <div key={i} {...apply$(cls.previewItem)}>
                  <img src={src} alt="Preview" {...apply$(cls.previewImg)} />
                  <button
                    type="button"
                    onClick={() => this.removeImage(i)}
                    {...apply$(cls.removeBtn)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* actions */}
        <div {...apply$(cls.actions)}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => this.handleFiles(e)}
            style={{ display: "none" }}
            ref={this.fileInput}
          />
          <button
            onClick={() => {
              this.fileInput?.click();
            }}
            {...apply$(cls.uploadButton)}
            disabled={this.isLoading.value}
          >
            <PaperClip />
          </button>
          <div {...apply$(cls.spacer)}>
            <></>
          </div>
          <button
            {...apply$(cls.actionButton)}
            onClick={
              this.isSignedIn.value
                ? () => this.askAI()
                : () => alert("Connect you LinkedIn account!")
            }
            disabled={this.isLoading.value}
          >
            Prompt AI
          </button>
          <button
            {...apply$(cls.primaryButton)}
            onClick={
              this.isSignedIn.value
                ? () => this.addToQueue()
                : () => alert("Connect you LinkedIn account!")
            }
            disabled={this.isLoading.value}
          >
            {this.isLoading.value && (
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  marginRight: "8px",
                }}
              />
            )}
            {this.isLoading.value ? "Adding..." : "Add to Queue"}
          </button>
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    width: "100%",
    height: "100%",
  },
  header: {
    display: "flex",
    gap: 8,
  },
  button: {
    padding: "6px 12px",
    border: "1px solid #d0d0d0",
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    flex: 1,
    padding: 12,
    border: "none",
    outline: "none",
    borderRadius: 4,
    fontSize: 16,
    fontFamily: "inherit",
    resize: "none",
    color: "#e8e8e8",
    backgroundColor: "transparent",
  },
  actions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    padding: "8px 16px",
    border: "1px solid #d0d0d0",
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontSize: 14,
  },
  primaryButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 20,
    backgroundColor: "#ff5722",
    color: "#e8e8e8",
    cursor: "pointer",
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: "transparent",
    border: "none",
  },
  previewGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  previewItem: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    background: "#333",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    border: "none",
    fontSize: 16,
    lineHeight: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
