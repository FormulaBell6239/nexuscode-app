"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import styles from "./Community.module.css";

type PostCategory = "Question" | "Discussion" | "Project";
type FeedFilter = "For You" | "Questions" | "Projects" | "Unanswered";

type Author = {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
};

type ApiReply = {
  id: number;
  parentId: number | null;
  body: string;
  votes: number;
  isAccepted: boolean;
  createdAt: string;
  author: Author;
  myVote: boolean;
};

type ApiPost = {
  id: number;
  type: "question" | "discussion" | "project";
  title: string;
  body: string;
  tags: string[];
  projectUrl: string | null;
  votes: number;
  replyCount: number;
  acceptedReplyId: number | null;
  createdAt: string;
  author: Author;
  myVote: boolean;
  replies?: ApiReply[];
};

type PostList = { items: ApiPost[]; total: number };

const filters: FeedFilter[] = ["For You", "Questions", "Projects", "Unanswered"];
const filterParam: Record<FeedFilter, string> = {
  "For You": "all",
  Questions: "questions",
  Projects: "projects",
  Unanswered: "unanswered",
};
const categories: PostCategory[] = ["Question", "Discussion", "Project"];
const accents = ["cyan", "purple", "green", "orange"];
const reportReasons = ["spam", "harassment", "unsafe", "inappropriate", "other"];

const categoryLabel = (type: ApiPost["type"]): PostCategory =>
  type === "question" ? "Question" : type === "project" ? "Project" : "Discussion";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

const initialsOf = (author: Author) =>
  author.displayName.slice(0, 2).toUpperCase();

const accentOf = (author: Author) => accents[author.id % accents.length];

/* Reads the signed-in user id from the stored JWT; only used to show owner-only controls. */
function currentUserId(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Number(payload.sub) || null;
  } catch {
    return null;
  }
}

type Notification = {
  id: number;
  type: "reply" | "accepted";
  postId: number;
  postTitle: string;
  actor: Author;
  read: boolean;
  createdAt: string;
};

type ReportTarget = { type: "post" | "reply"; id: number };

export default function Community() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("For You");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"Recent" | "Popular">("Recent");
  const [showComposer, setShowComposer] = useState(false);
  const [category, setCategory] = useState<PostCategory>("Question");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<ApiPost | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyParent, setReplyParent] = useState<number | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [meId, setMeId] = useState<number | null>(null);

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => setMeId(currentUserId()), []);

  const loadNotifs = useCallback(async () => {
    if (!currentUserId()) return;
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>("/api/community/notifications");
      setNotifs(data.items);
      setUnread(data.unread);
    } catch {
      /* notifications are optional */
    }
  }, []);

  useEffect(() => {
    void loadNotifs();
    const timer = setInterval(() => void loadNotifs(), 60000);
    return () => clearInterval(timer);
  }, [loadNotifs]);

  async function toggleNotifs() {
    const next = !showNotifs;
    setShowNotifs(next);
    if (next && unread > 0) {
      try {
        await api.post("/api/community/notifications/read");
        setUnread(0);
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({
        filter: filterParam[activeFilter],
        sort: sortBy.toLowerCase(),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const data = await api.get<PostList>(`/api/community/posts?${params}`);
      setPosts(data.items);
      setTotal(data.total);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load the feed."
      );
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch, sortBy]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  /* Runs an authenticated action and surfaces server messages (limits, bans, etc.). */
  async function guarded<T>(action: () => Promise<T>): Promise<T | null> {
    if (!meId) {
      setNotice("Log in to take part in the community.");
      return null;
    }
    try {
      return await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
      return null;
    }
  }

  function patchPost(id: number, patch: Partial<ApiPost>) {
    setPosts((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDetail((current) => (current && current.id === id ? { ...current, ...patch } : current));
  }

  async function togglePostVote(post: ApiPost) {
    const result = await guarded(() =>
      api.post<{ voted: boolean; votes: number }>(`/api/community/posts/${post.id}/vote`)
    );
    if (result) patchPost(post.id, { votes: result.votes, myVote: result.voted });
  }

  async function toggleReplyVote(reply: ApiReply) {
    const result = await guarded(() =>
      api.post<{ voted: boolean; votes: number }>(`/api/community/replies/${reply.id}/vote`)
    );
    if (result && detail) {
      setDetail({
        ...detail,
        replies: detail.replies?.map((r) =>
          r.id === reply.id ? { ...r, votes: result.votes, myVote: result.voted } : r
        ),
      });
    }
  }

  async function openPost(id: number) {
    setReplyText("");
    setReplyParent(null);
    try {
      setDetail(await api.get<ApiPost>(`/api/community/posts/${id}`));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not open this post.");
    }
  }

  function applyDetail(updated: ApiPost) {
    setDetail(updated);
    patchPost(updated.id, {
      replyCount: updated.replyCount,
      acceptedReplyId: updated.acceptedReplyId,
      votes: updated.votes,
    });
  }

  async function submitReply() {
    if (!detail || !replyText.trim()) return;
    const updated = await guarded(() =>
      api.post<ApiPost>(`/api/community/posts/${detail.id}/replies`, {
        body: replyText,
        ...(replyParent ? { parentId: replyParent } : {}),
      })
    );
    if (updated) {
      applyDetail(updated);
      setReplyText("");
      setReplyParent(null);
    }
  }

  async function acceptReply(reply: ApiReply) {
    const updated = await guarded(() =>
      api.post<ApiPost>(`/api/community/replies/${reply.id}/accept`)
    );
    if (updated) applyDetail(updated);
  }

  async function deletePost(post: ApiPost) {
    if (!window.confirm("Delete this post?")) return;
    const result = await guarded(() => api.delete(`/api/community/posts/${post.id}`));
    if (result) {
      setDetail(null);
      void loadPosts();
    }
  }

  async function deleteReply(reply: ApiReply) {
    if (!window.confirm("Delete this reply?")) return;
    const result = await guarded(() => api.delete(`/api/community/replies/${reply.id}`));
    if (result && detail) void openPost(detail.id);
  }

  async function sendReport(reason: string) {
    if (!reportTarget) return;
    const target = reportTarget;
    setReportTarget(null);
    const result = await guarded(() =>
      api.post("/api/community/report", {
        targetType: target.type,
        targetId: target.id,
        reason,
      })
    );
    if (result) setNotice("Thanks. Our moderators will review this.");
  }

  async function publishPost() {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length < 5 || cleanContent.length < 10) {
      setNotice("Add a title (5+ characters) and some details (10+ characters).");
      return;
    }

    setPublishing(true);
    const created = await guarded(() =>
      api.post<ApiPost>("/api/community/posts", {
        type: category.toLowerCase(),
        title: cleanTitle,
        body: cleanContent,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
        ...(category === "Project" && projectUrl.trim()
          ? { projectUrl: projectUrl.trim() }
          : {}),
      })
    );
    setPublishing(false);

    if (created) {
      setTitle("");
      setContent("");
      setTagsInput("");
      setProjectUrl("");
      setCategory("Question");
      setNotice("");
      setShowComposer(false);
      setActiveFilter("For You");
      setSearch("");
      void loadPosts();
    }
  }

  return (
    <main className={styles.community}>
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <span className={styles.statusDot} />
            THE DEVELOPER NETWORK
          </div>

          <h1>
            Nexus<span>Community</span>
          </h1>

          <p className={styles.subtitle}>
            Connect with developers. Solve problems. Build something
            worth sharing.
          </p>
        </div>

        <div className={styles.headerActions}>
          {meId && (
            <div className={styles.bellWrap}>
              <button className={styles.bellButton} onClick={() => void toggleNotifs()} aria-label="Notifications" aria-expanded={showNotifs}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && <span className={styles.bellBadge}>{unread > 9 ? "9+" : unread}</span>}
              </button>
              {showNotifs && (
                <div className={styles.notifPanel}>
                  <div className={styles.notifTitle}>NOTIFICATIONS</div>
                  {notifs.length === 0 ? (
                    <p className={styles.notifEmpty}>Nothing yet. Replies and accepted answers show up here.</p>
                  ) : (
                    notifs.map((n) => (
                      <button
                        key={n.id}
                        className={`${styles.notifItem} ${n.read ? "" : styles.notifUnread}`}
                        onClick={() => {
                          setShowNotifs(false);
                          void openPost(n.postId);
                        }}
                      >
                        <strong>{n.actor.displayName}</strong>{" "}
                        {n.type === "accepted" ? "accepted your answer on" : "replied to"} “{n.postTitle}”
                        <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <button
            className={styles.createButton}
            onClick={() => {
              setNotice("");
              setShowComposer(true);
            }}
          >
            <span aria-hidden="true">＋</span>
            Create post
          </button>
        </div>
      </header>

      <section className={styles.welcomePanel}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeLabel}>
            YOUR NEXT BREAKTHROUGH STARTS HERE
          </div>

          <h2>
            Building is better
            <br />
            <span>together.</span>
          </h2>

          <p>
            Stuck on a bug? Have an idea? Show the community what
            you're working on and learn from people building alongside you.
          </p>

          <button
            className={styles.secondaryButton}
            onClick={() => {
              setCategory("Question");
              setNotice("");
              setShowComposer(true);
            }}
          >
            Ask the community <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className={styles.orbit} aria-hidden="true">
          <div className={styles.orbitRing} />
          <div className={styles.orbitRingInner} />
          <div className={styles.orbitCore}>
            <span>{"</>"}</span>
          </div>
          <span className={`${styles.orbitNode} ${styles.nodeOne}`}>
            {"{ }"}
          </span>
          <span className={`${styles.orbitNode} ${styles.nodeTwo}`}>
            {"01"}
          </span>
          <span className={`${styles.orbitNode} ${styles.nodeThree}`}>
            {"//"}
          </span>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statIcon}>⌘</span>
          <div>
            <strong>BUILD</strong>
            <span>Share your projects</span>
          </div>
        </div>

        <div className={styles.stat}>
          <span className={styles.statIcon}>{"</>"}</span>
          <div>
            <strong>LEARN</strong>
            <span>Ask and answer questions</span>
          </div>
        </div>

        <div className={styles.stat}>
          <span className={styles.statIcon}>↗</span>
          <div>
            <strong>LEVEL UP</strong>
            <span>Grow with your community</span>
          </div>
        </div>
      </section>

      <section className={styles.feedSection}>
        <div className={styles.feedHeading}>
          <div>
            <div className={styles.sectionEyebrow}>COMMUNITY SIGNAL</div>
            <h2>Developer feed</h2>
            <p>Ideas, questions, and progress from the network.</p>
          </div>

          <label className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search community posts"
              placeholder="Search posts, tags..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>

        <div className={styles.feedToolbar}>
          <div className={styles.filters} role="tablist" aria-label="Feed filters">
            {filters.map((filter) => (
              <button
                key={filter}
                role="tab"
                aria-selected={activeFilter === filter}
                className={
                  activeFilter === filter
                    ? `${styles.filterButton} ${styles.activeFilter}`
                    : styles.filterButton
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                {filter === "Unanswered" && (
                  <span className={styles.filterDot} />
                )}
              </button>
            ))}
          </div>

          <label className={styles.sortControl}>
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "Recent" | "Popular")
              }
              aria-label="Sort posts"
            >
              <option value="Recent">Recent</option>
              <option value="Popular">Popular</option>
            </select>
          </label>
        </div>

        <div className={styles.postList}>
          {loading && <p className={styles.fieldHint}>Loading the feed...</p>}
          {loadError && (
            <p className={styles.formError} role="alert">
              {loadError}
            </p>
          )}

          {posts.map((post) => (
            <article className={styles.postCard} key={post.id}>
              <div className={styles.postMain}>
                <div
                  className={`${styles.avatar} ${styles[accentOf(post.author)]}`}
                  aria-hidden="true"
                >
                  {initialsOf(post.author)}
                </div>

                <div className={styles.postBody}>
                  <div className={styles.postMeta}>
                    <Link href={`/community/u/${post.author.username}`} className={styles.author}>{post.author.displayName}</Link>
                    <span className={styles.metaSeparator}>/</span>
                    <span>{timeAgo(post.createdAt)}</span>
                    <span
                      className={`${styles.categoryBadge} ${
                        post.type === "question"
                          ? styles.questionBadge
                          : post.type === "project"
                            ? styles.projectBadge
                            : styles.discussionBadge
                      }`}
                    >
                      {categoryLabel(post.type)}
                    </span>
                    {post.acceptedReplyId && (
                      <span className={styles.categoryBadge}>✓ Solved</span>
                    )}
                  </div>

                  <h3>{post.title}</h3>
                  <p className={styles.postContent}>
                    {post.body.length > 280 ? `${post.body.slice(0, 280)}…` : post.body}
                  </p>

                  {post.tags.length > 0 && (
                    <div className={styles.tags}>
                      {post.tags.map((tag) => (
                        <button
                          className={styles.tag}
                          key={tag}
                          onClick={() => setSearch(tag)}
                          title={`Search for ${tag}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.postActions}>
                    <button
                      className={
                        post.myVote
                          ? `${styles.actionButton} ${styles.voted}`
                          : styles.actionButton
                      }
                      aria-pressed={post.myVote}
                      onClick={() => void togglePostVote(post)}
                    >
                      <span aria-hidden="true">↑</span>
                      {post.votes}
                      <span className={styles.actionLabel}>Upvotes</span>
                    </button>

                    <button
                      className={styles.actionButton}
                      onClick={() => void openPost(post.id)}
                    >
                      <span aria-hidden="true">▤</span>
                      {post.replyCount}
                      <span className={styles.actionLabel}>Replies</span>
                    </button>

                    <button
                      className={styles.actionButton}
                      onClick={() => void openPost(post.id)}
                    >
                      View discussion <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>

                <button
                  className={styles.moreButton}
                  aria-label={`Report ${post.title}`}
                  title="Report this post"
                  onClick={() => setReportTarget({ type: "post", id: post.id })}
                >
                  ⚑
                </button>
              </div>
            </article>
          ))}

          {!loading && !loadError && total === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⌕</div>
              <h3>No signals found</h3>
              <p>
                Nothing matches those filters yet. Try another search or
                start a new discussion.
              </p>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setSearch("");
                  setActiveFilter("For You");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {notice && (
        <div className={styles.notice} role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}

      {showComposer && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowComposer(false);
            }
          }}
        >
          <section
            className={styles.composer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
          >
            <div className={styles.composerHeader}>
              <div>
                <div className={styles.sectionEyebrow}>CONTRIBUTE TO THE NETWORK</div>
                <h2 id="composer-title">Create a post</h2>
              </div>
              <button
                className={styles.closeButton}
                aria-label="Close post composer"
                onClick={() => setShowComposer(false)}
              >
                ×
              </button>
            </div>

            <label className={styles.fieldLabel}>
              Post type
              <div className={styles.categoryChoices}>
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item
                        ? `${styles.categoryChoice} ${styles.selectedChoice}`
                        : styles.categoryChoice
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item === "Question"
                      ? "?"
                      : item === "Project"
                        ? "</>"
                        : "↗"}{" "}
                    {item}
                  </button>
                ))}
              </div>
            </label>

            <label className={styles.fieldLabel}>
              Title
              <input
                autoFocus
                maxLength={140}
                placeholder={
                  category === "Question"
                    ? "What are you stuck on?"
                    : category === "Project"
                      ? "What have you been building?"
                      : "What's on your mind?"
                }
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Details
              <textarea
                rows={5}
                maxLength={10000}
                placeholder="Give the community some context..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <span className={styles.characterCount}>
                {content.length}/10000
              </span>
            </label>

            <label className={styles.fieldLabel}>
              Tags <span className={styles.optionalLabel}>OPTIONAL</span>
              <input
                placeholder="React, TypeScript, CSS"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
              <span className={styles.fieldHint}>
                Separate tags with commas. Up to five tags.
              </span>
            </label>

            {category === "Project" && (
              <label className={styles.fieldLabel}>
                Project link <span className={styles.optionalLabel}>OPTIONAL</span>
                <input
                  type="url"
                  placeholder="https://github.com/you/project"
                  maxLength={300}
                  value={projectUrl}
                  onChange={(event) => setProjectUrl(event.target.value)}
                />
              </label>
            )}

            {notice && (
              <p className={styles.formError} role="alert">
                {notice}
              </p>
            )}

            <div className={styles.composerFooter}>
              <span className={styles.fieldHint}>
                Be kind. Share knowledge. Keep it constructive.
              </span>
              <button
                className={styles.createButton}
                onClick={() => void publishPost()}
                disabled={publishing}
              >
                Publish post <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {detail && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <section
            className={styles.composer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="thread-title"
          >
            <div className={styles.composerHeader}>
              <div>
                <div className={styles.sectionEyebrow}>
                  {categoryLabel(detail.type).toUpperCase()} · <Link href={`/community/u/${detail.author.username}`} className={styles.authorInline}>{detail.author.displayName}</Link> ·{" "}
                  {timeAgo(detail.createdAt)}
                </div>
                <h2 id="thread-title">{detail.title}</h2>
              </div>
              <button
                className={styles.closeButton}
                aria-label="Close discussion"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </div>

            <p className={styles.postContent} style={{ whiteSpace: "pre-wrap" }}>
              {detail.body}
            </p>

            {detail.projectUrl && (
              <p>
                <a href={detail.projectUrl} target="_blank" rel="noopener noreferrer nofollow ugc">
                  {detail.projectUrl} ↗
                </a>
              </p>
            )}

            <div className={styles.postActions}>
              <button
                className={detail.myVote ? `${styles.actionButton} ${styles.voted}` : styles.actionButton}
                onClick={() => void togglePostVote(detail)}
              >
                <span aria-hidden="true">↑</span> {detail.votes}
              </button>
              <button
                className={styles.actionButton}
                onClick={() => setReportTarget({ type: "post", id: detail.id })}
              >
                ⚑ Report
              </button>
              {meId === detail.author.id && (
                <button className={styles.actionButton} onClick={() => void deletePost(detail)}>
                  Delete
                </button>
              )}
            </div>

            <h3>{detail.replies?.length ?? 0} replies</h3>

            <div className={styles.postList}>
              {(detail.replies ?? [])
                .filter((reply) => !reply.parentId)
                .map((reply) => (
                  <div key={reply.id}>
                    {[reply, ...(detail.replies ?? []).filter((r) => r.parentId === reply.id)].map(
                      (item) => (
                        <article
                          className={styles.postCard}
                          key={item.id}
                          style={item.parentId ? { marginLeft: 28 } : undefined}
                        >
                          <div className={styles.postMeta}>
                            <Link href={`/community/u/${item.author.username}`} className={styles.author}>{item.author.displayName}</Link>
                            <span className={styles.metaSeparator}>/</span>
                            <span>{timeAgo(item.createdAt)}</span>
                            {item.isAccepted && (
                              <span className={styles.categoryBadge}>✓ Accepted answer</span>
                            )}
                          </div>
                          <p className={styles.postContent} style={{ whiteSpace: "pre-wrap" }}>
                            {item.body}
                          </p>
                          <div className={styles.postActions}>
                            <button
                              className={item.myVote ? `${styles.actionButton} ${styles.voted}` : styles.actionButton}
                              onClick={() => void toggleReplyVote(item)}
                            >
                              <span aria-hidden="true">↑</span> {item.votes}
                            </button>
                            {!item.parentId && (
                              <button className={styles.actionButton} onClick={() => setReplyParent(item.id)}>
                                Reply
                              </button>
                            )}
                            {detail.type === "question" && meId === detail.author.id && (
                              <button className={styles.actionButton} onClick={() => void acceptReply(item)}>
                                {item.isAccepted ? "Unaccept" : "Accept answer"}
                              </button>
                            )}
                            {meId === item.author.id && (
                              <button className={styles.actionButton} onClick={() => void deleteReply(item)}>
                                Delete
                              </button>
                            )}
                            <button
                              className={styles.actionButton}
                              onClick={() => setReportTarget({ type: "reply", id: item.id })}
                            >
                              ⚑
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                ))}
            </div>

            <label className={styles.fieldLabel}>
              {replyParent ? "Replying to a comment" : "Your reply"}
              <textarea
                rows={4}
                maxLength={8000}
                placeholder="Share what you know. Be kind and constructive."
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
              />
            </label>

            {notice && (
              <p className={styles.formError} role="alert">
                {notice}
              </p>
            )}

            <div className={styles.composerFooter}>
              {replyParent ? (
                <button className={styles.secondaryButton} onClick={() => setReplyParent(null)}>
                  Cancel reply-to
                </button>
              ) : (
                <span className={styles.fieldHint}>Be kind. Share knowledge.</span>
              )}
              <button className={styles.createButton} onClick={() => void submitReply()}>
                Post reply <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {reportTarget && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReportTarget(null);
          }}
        >
          <section className={styles.composer} role="dialog" aria-modal="true" aria-label="Report content">
            <div className={styles.composerHeader}>
              <h2>Report this {reportTarget.type}</h2>
              <button className={styles.closeButton} aria-label="Cancel report" onClick={() => setReportTarget(null)}>
                ×
              </button>
            </div>
            <p className={styles.fieldHint}>What is wrong with it?</p>
            <div className={styles.categoryChoices}>
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={styles.categoryChoice}
                  onClick={() => void sendReport(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
