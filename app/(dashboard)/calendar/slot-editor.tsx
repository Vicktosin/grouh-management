"use client";

import { useState } from "react";

type Slot = {
  id?: string;
  date: string;
  slotIndex: number;
  title?: string | null;
  platform?: string | null;
  contentType?: string | null;
  driveUrl?: string | null;
  status?: string;
  notes?: string | null;
};

const PLATFORMS = ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "Twitter/X"];
const CONTENT_TYPES = ["copy", "image", "video", "reel", "carousel"];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok: "#69c9d0",
  Facebook: "#1877f2",
  LinkedIn: "#0a66c2",
  YouTube: "#ff0000",
  "Twitter/X": "#000000",
};

export function SlotEditor({
  calendarId,
  date,
  slotIndex,
  existing,
  onClose,
  onSaved,
}: {
  calendarId: string;
  date: string;
  slotIndex: number;
  existing?: Slot;
  onClose: () => void;
  onSaved: (slot: Slot & { id: string }) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [platform, setPlatform] = useState(existing?.platform ?? "");
  const [contentType, setContentType] = useState(existing?.contentType ?? "");
  const [driveUrl, setDriveUrl] = useState(existing?.driveUrl ?? "");
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/calendar/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId, date, slotIndex, title, platform, contentType, driveUrl, status, notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.slot) onSaved(data.slot);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Content Slot
          </h2>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: "var(--text-subtle)" }}>✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Title</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Post title or description..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Platform</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Select...</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Content Type</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="">Select...</option>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Google Drive Link</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Status</label>
            <div className="flex gap-2">
              {(["draft", "ready", "published"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={
                    status === s
                      ? { background: s === "ready" ? "var(--success)" : s === "published" ? "var(--accent)" : "var(--surface-3)", color: "white" }
                      : { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-subtle)" }}>Notes</label>
            <textarea
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Brief notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
