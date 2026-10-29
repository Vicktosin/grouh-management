"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MentionStub = { staffId: string; firstName: string; lastName: string };

type Post = {
  id: string;
  content: string;
  type: string;
  isPinned: boolean;
  eventDate: string | null;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
  mentions: MentionStub[];
};

type StaffOption = { id: string; firstName: string; lastName: string; roleTitle?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  general:      { label: "Update",       color: "#8892a4", bg: "rgba(136,146,164,0.10)", icon: "💬" },
  announcement: { label: "Announcement", color: "#f0be43", bg: "rgba(240,190,67,0.10)",  icon: "📢" },
  event:        { label: "Event",        color: "#5fbb46", bg: "rgba(95,187,70,0.10)",   icon: "📅" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(first: string, last: string) {
  return (first[0] ?? "") + (last[0] ?? "");
}

// Render content: replace @[Name](id) with highlighted spans, @all with a badge
function renderContent(content: string) {
  const parts: React.ReactNode[] = [];
  const re = /@\[([^\]]+)\]\([^)]+\)|@all/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push(content.slice(last, m.index));
    const token = m[0];
    const name = token === "@all" ? "all" : token.slice(2, token.indexOf("]"));
    parts.push(
      <span
        key={key++}
        className="font-semibold px-1 rounded"
        style={{ background: "rgba(95,187,70,0.15)", color: "#5fbb46" }}
      >
        @{name}
      </span>
    );
    last = m.index + token.length;
  }
  if (last < content.length) parts.push(content.slice(last));
  return parts;
}

// ─── @Mention textarea composer ───────────────────────────────────────────────

function MentionComposer({
  value,
  onChange,
  staffList,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  staffList: StaffOption[];
  placeholder?: string;
}) {
  const [query, setQuery]     = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atStartRef  = useRef(-1);

  const filtered = query
    ? staffList.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase())
      )
    : staffList;

  function handleKeyUp(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const pos = el.selectionStart ?? 0;
    const before = el.value.slice(0, pos);
    const atMatch = before.match(/@([^@\s]*)$/);

    if (atMatch) {
      atStartRef.current = before.lastIndexOf("@");
      setQuery(atMatch[1]);
      setShowMenu(true);

      // Position dropdown near cursor (approximate)
      const lines = before.split("\n");
      const lineH = 22;
      setMenuPos({ top: lines.length * lineH + 4, left: 0 });
    } else {
      atStartRef.current = -1;
      setShowMenu(false);
      setQuery("");
    }
  }

  function pickStaff(s: StaffOption) {
    const el = textareaRef.current;
    if (!el) return;
    const before = value.slice(0, atStartRef.current);
    const after  = value.slice(el.selectionStart ?? 0);
    onChange(`${before}@[${s.firstName} ${s.lastName}](${s.id})${after}`);
    setShowMenu(false);
    setQuery("");
    setTimeout(() => el.focus(), 0);
  }

  function pickAll() {
    const el = textareaRef.current;
    if (!el) return;
    const before = value.slice(0, atStartRef.current);
    const after  = value.slice(el.selectionStart ?? 0);
    onChange(`${before}@all${after}`);
    setShowMenu(false);
    setQuery("");
    setTimeout(() => el.focus(), 0);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows={3}
        placeholder={placeholder ?? "Write something… Use @ to mention someone"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
      />

      {showMenu && filtered.length > 0 && (
        <div
          className="absolute z-20 w-56 rounded-xl shadow-xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left, background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* @all shortcut */}
          <button
            onMouseDown={(e) => { e.preventDefault(); pickAll(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(95,187,70,0.12)", color: "#5fbb46", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="font-bold">@all</span>
            <span className="text-xs opacity-70">Tag everyone</span>
          </button>
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); pickStaff(s); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:opacity-80"
              style={{ color: "var(--text)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {initials(s.firstName, s.lastName)}
              </span>
              <span className="flex-1 text-left">
                <span className="font-medium">{s.firstName} {s.lastName}</span>
                {s.roleTitle && <span className="text-xs ml-1 opacity-50">{s.roleTitle}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composer card (managers only) ───────────────────────────────────────────

function Composer({
  staffList,
  onPosted,
  authorName,
}: {
  staffList: StaffOption[];
  onPosted: (p: Post) => void;
  authorName: string;
}) {
  const [content, setContent]   = useState("");
  const [type, setType]         = useState<"general" | "announcement" | "event">("general");
  const [eventDate, setEventDate] = useState("");
  const [posting, setPosting]   = useState(false);

  async function post() {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type, eventDate: eventDate || undefined }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.post) {
      onPosted(data.post);
      setContent("");
      setEventDate("");
      setType("general");
    }
  }

  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Type selector */}
      <div className="flex gap-1.5 mb-3">
        {(["general", "announcement", "event"] as const).map((t) => {
          const m = TYPE_META[t];
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: type === t ? m.color + "22" : "var(--surface-2)",
                color: type === t ? m.color : "var(--text-muted)",
                border: `1px solid ${type === t ? m.color + "55" : "var(--border)"}`,
              }}
            >
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>

      <MentionComposer
        value={content}
        onChange={setContent}
        staffList={staffList}
        placeholder={
          type === "announcement"
            ? "Write an important announcement… @ to mention"
            : type === "event"
            ? "Describe the event… @ to mention"
            : "Share an update with the team… @ to mention"
        }
      />

      {type === "event" && (
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
          Posting as <strong style={{ color: "var(--text-muted)" }}>{authorName}</strong>
        </span>
        <button
          onClick={post}
          disabled={posting || !content.trim()}
          className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: type === "announcement" ? "#f0be43" : type === "event" ? "#5fbb46" : "#1c1d52", color: type === "announcement" ? "#1c1d52" : "white", opacity: posting || !content.trim() ? 0.5 : 1 }}
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isManager,
  currentStaffId,
  onDelete,
  onPin,
}: {
  post: Post;
  isManager: boolean;
  currentStaffId: string;
  onDelete: (id: string) => void;
  onPin: (id: string, val: boolean) => void;
}) {
  const meta = TYPE_META[post.type] ?? TYPE_META.general;
  const canDelete = isManager || post.author.id === currentStaffId;

  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: post.isPinned ? "rgba(240,190,67,0.06)" : "var(--surface)",
        border: `1px solid ${post.isPinned ? "rgba(240,190,67,0.35)" : post.type === "announcement" ? "rgba(240,190,67,0.25)" : "var(--border)"}`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: "var(--accent)", color: "white" }}
        >
          {initials(post.author.firstName, post.author.lastName)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {post.author.firstName} {post.author.lastName}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.icon} {meta.label}
            </span>
            {post.isPinned && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(240,190,67,0.15)", color: "#f0be43" }}>
                📌 Pinned
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>{timeAgo(post.createdAt)}</span>
          </div>

          {/* Event date */}
          {post.eventDate && (
            <p className="text-xs mt-1 font-medium" style={{ color: "#5fbb46" }}>
              📅 {new Date(post.eventDate).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Actions */}
        {(canDelete || isManager) && (
          <div className="flex gap-1 shrink-0">
            {isManager && (
              <button
                onClick={() => onPin(post.id, !post.isPinned)}
                title={post.isPinned ? "Unpin" : "Pin"}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:opacity-80"
                style={{ background: post.isPinned ? "rgba(240,190,67,0.15)" : "var(--surface-2)", color: post.isPinned ? "#f0be43" : "var(--text-subtle)" }}
              >
                📌
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:opacity-80"
                style={{ background: "rgba(224,82,82,0.08)", color: "#e05252" }}
              >×</button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
        {renderContent(post.content)}
      </p>

      {/* Mentions footer */}
      {post.mentions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Tagged:</span>
          {post.mentions.map((m) => (
            <span key={m.staffId} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(95,187,70,0.12)", color: "#5fbb46" }}>
              @{m.firstName} {m.lastName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main feed component ──────────────────────────────────────────────────────

export function CompanyFeed({
  initialPosts,
  isManager,
  currentStaffId,
  staffList,
  authorName,
}: {
  initialPosts: Post[];
  isManager: boolean;
  currentStaffId: string;
  staffList: StaffOption[];
  authorName: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  function handlePosted(p: Post) {
    setPosts((prev) => [p, ...prev.filter((x) => !x.isPinned), ...prev.filter((x) => x.isPinned)]);
    // Re-sort: pinned first
    setPosts((prev) => [...prev.filter((x) => x.isPinned), ...prev.filter((x) => !x.isPinned)]);
  }

  async function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/feed?id=${id}`, { method: "DELETE" });
  }

  async function handlePin(id: string, isPinned: boolean) {
    setPosts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isPinned } : p));
      return [...updated.filter((p) => p.isPinned), ...updated.filter((p) => !p.isPinned)];
    });
    await fetch("/api/feed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPinned }),
    });
  }

  return (
    <div>
      {isManager && (
        <Composer staffList={staffList} onPosted={handlePosted} authorName={authorName} />
      )}

      {posts.length === 0 && (
        <div className="text-center py-10 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No posts yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
            {isManager ? "Post an update, announcement or event for your team." : "Company updates will appear here."}
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isManager={isManager}
          currentStaffId={currentStaffId}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      ))}
    </div>
  );
}
