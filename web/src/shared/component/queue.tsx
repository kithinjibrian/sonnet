"use client";

import { apply$, style$ } from "@kithinji/arcane";
import {
  Component,
  computed,
  Navigate,
  type Signal,
  signal,
} from "@kithinji/orca";
import { LinkedinService } from "../linkedin.service";
import { ClientService } from "../client.service";
import { SidebarModal } from "./setting-modal";
import { TimerStart } from "./time-start";
import { ListView } from "./list-view";
import { type LinkedinPost } from "../entities/post.entity";

@Component({
  inject: [TimerStart, SidebarModal, ListView],
})
export class Queue {
  showShadow = signal(false);
  posts: Signal<LinkedinPost[]> = signal([]);
  isLoading = signal(false);

  postedCount = 0;
  unpostedCount = 0;
  hasMorePosted = signal(true);
  hasMoreUnposted = signal(true);

  private scrollEl?: HTMLDivElement;

  constructor(
    private readonly linkedinService: LinkedinService,
    private readonly clientService: ClientService,
    private readonly navigate: Navigate,
  ) {
    this.clientService.isSignedIn$.subscribe((session) => {
      if (session == null) return;

      this.loadInitialPosts();

      this.clientService.refreshPosts$.subscribe(() => {
        this.refreshNewPost();
      });
    });
  }

  private mergePosts(
    existingPosts: LinkedinPost[],
    newPosts: LinkedinPost[],
  ): LinkedinPost[] {
    const postsMap = new Map<string, LinkedinPost>();

    [...existingPosts, ...newPosts].forEach((post) => {
      postsMap.set(post.id, post);
    });

    const allPosts = Array.from(postsMap.values());

    return allPosts.sort((a, b) => {
      if (a.posted && !b.posted) return -1;
      if (!a.posted && b.posted) return 1;

      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();

      if (a.posted && b.posted) {
        return bTime - aTime;
      }

      return aTime - bTime;
    });
  }

  async loadInitialPosts() {
    const posts = await this.linkedinService.getPosts(1, 0, 10, 0);
    this.posts.value = this.mergePosts([], posts);

    this.postedCount = this.posts.value.filter((p) => p.posted).length;
    this.unpostedCount = this.posts.value.filter((p) => !p.posted).length;

    if (this.scrollEl) {
      queueMicrotask(() => {
        const firstUnpostedEl = this.scrollEl?.children[
          this.postedCount
        ] as HTMLElement;
        if (firstUnpostedEl) {
          firstUnpostedEl.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }
  }

  async refreshNewPost() {
    const newPosts = await this.linkedinService.getPosts(
      0,
      0,
      1,
      this.unpostedCount,
    );

    if (newPosts.length > 0) {
      const oldLength = this.posts.value.length;

      this.posts.value = this.mergePosts(this.posts.value, newPosts);

      const actualNewPosts = this.posts.value.length - oldLength;
      this.unpostedCount += actualNewPosts;

      if (this.scrollEl && actualNewPosts > 0) {
        queueMicrotask(() => {
          this.scrollEl?.scrollTo({
            top: this.scrollEl.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    }
  }

  async loadMorePosted() {
    if (!this.hasMorePosted.value) return;

    const newPosts = await this.linkedinService.getPosts(
      10,
      this.postedCount,
      0,
      0,
    );

    if (newPosts.length === 0) {
      this.hasMorePosted.value = false;
      return;
    }

    const oldLength = this.posts.value.length;

    this.posts.value = [...newPosts, ...this.posts.value];

    const actualNewPosts = this.posts.value.length - oldLength;
    this.postedCount += actualNewPosts;
  }

  async loadMoreUnposted() {
    if (!this.hasMoreUnposted.value) return;

    const newPosts = await this.linkedinService.getPosts(
      0,
      0,
      10,
      this.unpostedCount,
    );

    if (newPosts.length === 0) {
      this.hasMoreUnposted.value = false;
      return;
    }

    const oldLength = this.posts.value.length;

    this.posts.value = this.mergePosts(newPosts, this.posts.value);

    const actualNewPosts = this.posts.value.length - oldLength;
    this.unpostedCount += actualNewPosts;
  }

  async post(id: string) {
    this.isLoading.value = true;
    await this.linkedinService.post(id);
    this.isLoading.value = false;
  }

  renderPost(index: number) {
    const post = this.posts.value[index];
    if (!post) return null;

    return (
      <div key={post.id} {...apply$(post.posted ? cls.postedCard : cls.card)}>
        {/* Preview Text */}
        <p {...apply$(cls.previewText)}>
          {post.preview_text || "No preview text"}
        </p>
        {/* Preview Image */}
        {post.preview_src && (
          <img
            src={post.preview_src}
            alt="Preview"
            {...apply$(cls.previewImage)}
          />
        )}
        {/* Actions */}
        <div {...apply$(cls.actions)}>
          {post.posted == false && (
            <button
              {...apply$(cls.actionButton)}
              onClick={() => this.post(post.id)}
            >
              {this.isLoading.value ? "Posting..." : "Post"}
            </button>
          )}
        </div>
      </div>
    );
  }

  build() {
    const handleScroll = (e: any) => {
      this.showShadow.value = e.target.scrollTop > 0;
    };

    const length = computed(() => this.posts.value.length);

    return (
      <div {...apply$(cls.container)}>
        <div
          {...apply$(
            this.showShadow.value
              ? cls.headerContainerWithShadow
              : cls.headerContainer,
          )}
        >
          <h2 {...apply$(cls.header)}>Your Queue</h2>
          <button
            {...apply$(cls.iconButton)}
            onClick={() => this.navigate.pushOverlay(<SidebarModal />)}
          >
            <TimerStart />
          </button>
        </div>

        <div
          ref={this.scrollEl}
          {...apply$(cls.scrollContent)}
          onScroll={handleScroll}
        >
          <ListView
            itemCount={length.value}
            itemBuilder={(index) => this.renderPost(index)}
            onReachStart={() => this.loadMorePosted()}
            onReachEnd={() => this.loadMoreUnposted()}
            startThreshold={200}
            endThreshold={200}
          />
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
  },
  headerContainerWithShadow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
    position: "relative",
    zIndex: 1,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    transition: "box-shadow 0.2s ease",
  },
  header: {
    margin: 0,
    padding: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#e8e8e8",
    position: "relative",
    zIndex: 1,
    transition: "box-shadow 0.2s ease",
  },
  scrollContent: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    flex: 1,
    overflowY: "auto",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#161616",
    marginBottom: 10,
  },
  postedCard: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#0f2a1f",
    border: "2px solid #2d5f3f",
    opacity: 0.7,
    marginBottom: 10,
  },
  previewText: {
    margin: 0,
    fontSize: 14,
    color: "#e8e8e8",
    lineHeight: 1.5,
  },
  previewImage: {
    width: "100%",
    height: "auto",
    maxHeight: 200,
    borderRadius: 4,
    objectFit: "cover",
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: "6px 12px",
    border: "none",
    borderRadius: 20,
    backgroundColor: "#ff5722",
    color: "#e8e8e8",
    cursor: "pointer",
    fontSize: 14,
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
