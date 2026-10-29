"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FocusItem = { id: string; text: string; isDone: boolean };

type Tool = {
  id: string;
  name: string;
  category: string;
  usedBy: string;
  url: string | null;
  monthlyCost: number;
  status: string;
  notes: string | null;
};

type Idea = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetCompany: string;
  priority: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANIES = ["all", "software", "academy", "marketing", "entertainment"];
const COMPANY_LABELS: Record<string, string> = {
  all: "All companies",
  software: "Software Co.",
  academy: "Academy",
  marketing: "Marketing Agency",
  entertainment: "Entertainment",
};
const COMPANY_COLORS: Record<string, string> = {
  all: "#8892a4",
  software: "#1c1d52",
  academy: "#5fbb46",
  marketing: "#f0be43",
  entertainment: "#e05252",
};

const TOOL_CATEGORIES = ["hosting", "database", "design", "communication", "dev", "marketing", "other"];
const TOOL_STATUS_META: Record<string, { label: string; color: string }> = {
  active:     { label: "Active",     color: "#5fbb46" },
  warning:    { label: "Warning",    color: "#f0be43" },
  down:       { label: "Down",       color: "#e05252" },
  deprecated: { label: "Deprecated", color: "#8892a4" },
};

const IDEA_STATUSES = ["concept", "planning", "in-dev", "live", "archived"];
const IDEA_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  concept:  { label: "Concept",  color: "#8892a4", bg: "rgba(136,146,164,0.12)" },
  planning: { label: "Planning", color: "#f0be43", bg: "rgba(240,190,67,0.12)" },
  "in-dev": { label: "In Dev",   color: "#1c7be0", bg: "rgba(28,123,224,0.12)" },
  live:     { label: "Live",     color: "#5fbb46", bg: "rgba(95,187,70,0.12)" },
  archived: { label: "Archived", color: "#8892a4", bg: "rgba(136,146,164,0.08)" },
};
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#8892a4" },
  medium: { label: "Medium", color: "#f0be43" },
  high:   { label: "High",   color: "#e05252" },
};

// ─── Tab 1: Today / Focus ─────────────────────────────────────────────────────

function TodayTab({ initialFocus, tools }: { initialFocus: FocusItem[]; tools: Tool[] }) {
  const [items, setItems] = useState<FocusItem[]>(initialFocus);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const done    = items.filter((i) => i.isDone).length;
  const total   = items.length;
  const monthlyCost = tools.filter((t) => t.status !== "deprecated").reduce((s, t) => s + t.monthlyCost, 0);
  const downCount   = tools.filter((t) => t.status === "down").length;
  const warnCount   = tools.filter((t) => t.status === "warning").length;
  const activeTools = tools.filter((t) => t.status === "active").length;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  async function addItem() {
    if (!draft.trim()) return;
    setAdding(true);
    const res = await fetch("/api/cto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "focus", text: draft.trim() }),
    });
    const data = await res.json();
    if (data.item) { setItems((p) => [...p, data.item]); setDraft(""); }
    setAdding(false);
  }

  async function toggleItem(id: string, isDone: boolean) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, isDone } : i)));
    await fetch("/api/cto", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "focus", id, isDone }),
    });
  }

  async function deleteItem(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
    await fetch(`/api/cto?type=focus&id=${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Date */}
      <p className="text-sm font-medium" style={{ color: "var(--text-subtle)" }}>{today}</p>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Monthly spend", value: `$${monthlyCost.toLocaleString()}`, color: "var(--text)", sub: "tools & services" },
          { label: "Active tools",  value: activeTools,  color: "#5fbb46",  sub: "running fine" },
          { label: "Warnings",      value: warnCount,    color: warnCount > 0 ? "#f0be43" : "var(--text-subtle)", sub: "need attention" },
          { label: "Down",          value: downCount,    color: downCount > 0 ? "#e05252" : "var(--text-subtle)", sub: "investigate" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>{s.label}</p>
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Focus list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--surface)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Today's Focus</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
              {total === 0 ? "Nothing set yet" : `${done} of ${total} done`}
            </p>
          </div>
          {total > 0 && (
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(done / total) * 100}%`, background: "#5fbb46" }} />
            </div>
          )}
        </div>

        <div style={{ background: "var(--surface-2)" }}>
          {items.length === 0 && (
            <p className="text-sm px-5 py-4" style={{ color: "var(--text-subtle)" }}>Write what you're focusing on today.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3 group" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => toggleItem(item.id, !item.isDone)}
                className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
                style={{ border: `2px solid ${item.isDone ? "#5fbb46" : "var(--border)"}`, background: item.isDone ? "#5fbb46" : "transparent" }}
              >
                {item.isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="flex-1 text-sm" style={{ color: item.isDone ? "var(--text-subtle)" : "var(--text)", textDecoration: item.isDone ? "line-through" : "none" }}>
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0.5 rounded"
                style={{ color: "#e05252", background: "rgba(224,82,82,0.08)" }}
              >×</button>
            </div>
          ))}

          {/* Add */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="w-5 h-5 rounded shrink-0" style={{ border: "2px dashed var(--border)" }} />
            <input
              type="text"
              placeholder="Add focus item…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text)" }}
              disabled={adding}
            />
            {draft.trim() && (
              <button onClick={addItem} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: "#5fbb46", color: "white" }}>
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Down / warning services quick alert */}
      {(downCount > 0 || warnCount > 0) && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: downCount > 0 ? "rgba(224,82,82,0.08)" : "rgba(240,190,67,0.08)", border: `1px solid ${downCount > 0 ? "rgba(224,82,82,0.3)" : "rgba(240,190,67,0.3)"}` }}>
          <p className="text-sm font-bold" style={{ color: downCount > 0 ? "#e05252" : "#f0be43" }}>
            {downCount > 0 ? `⚠ ${downCount} service${downCount > 1 ? "s" : ""} down` : `${warnCount} service${warnCount > 1 ? "s" : ""} need attention`}
          </p>
          {tools.filter((t) => t.status === "down" || t.status === "warning").map((t) => (
            <p key={t.id} className="text-xs" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: TOOL_STATUS_META[t.status].color }}>● </span>{t.name} — {t.notes ?? "no notes"}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Stack ─────────────────────────────────────────────────────────────

function AddToolModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: Tool) => void }) {
  const [form, setForm] = useState({ name: "", category: "hosting", usedBy: "all", url: "", monthlyCost: "", status: "active", notes: "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/cto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "tool", ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.tool) { onAdded(data.tool); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color: "var(--text)" }}>Add Software / Tool</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Tool name *</label>
            <input className={inp} style={inpStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vercel, Supabase…" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Category</label>
            <select className={inp} style={inpStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Used by</label>
            <select className={inp} style={inpStyle} value={form.usedBy} onChange={(e) => setForm({ ...form, usedBy: e.target.value })}>
              {COMPANIES.map((c) => <option key={c} value={c}>{COMPANY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Monthly cost ($)</label>
            <input type="number" min="0" className={inp} style={inpStyle} value={form.monthlyCost} onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Status</label>
            <select className={inp} style={inpStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(TOOL_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>URL (optional)</label>
            <input className={inp} style={inpStyle} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Notes (optional)</label>
            <input className={inp} style={inpStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#1c1d52", color: "white", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Add Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StackTab({ initialTools }: { initialTools: Tool[] }) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  async function setStatus(id: string, status: string) {
    setTools((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch("/api/cto", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "tool", id, status }),
    });
  }

  async function deleteTool(id: string) {
    setTools((p) => p.filter((t) => t.id !== id));
    await fetch(`/api/cto?type=tool&id=${id}`, { method: "DELETE" });
  }

  const filtered = filter === "all" ? tools : tools.filter((t) => t.usedBy === filter || t.usedBy === "all");
  const grouped: Record<string, Tool[]> = {};
  for (const t of filtered) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  const totalCost = tools.filter((t) => t.status !== "deprecated").reduce((s, t) => s + t.monthlyCost, 0);

  return (
    <div className="max-w-3xl">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {["all", ...COMPANIES.filter((c) => c !== "all")].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{
                background: filter === c ? COMPANY_COLORS[c] : "var(--surface)",
                color: filter === c ? "white" : "var(--text-muted)",
                border: `1px solid ${filter === c ? COMPANY_COLORS[c] : "var(--border)"}`,
              }}
            >
              {c === "all" ? "All" : COMPANY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>
            ${totalCost.toLocaleString()}/mo
          </span>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: "#1c1d52", color: "white" }}>
            + Add Tool
          </button>
        </div>
      </div>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 && (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-subtle)" }}>No tools yet — add your first one.</p>
      )}
      {Object.entries(grouped).map(([cat, catTools]) => (
        <div key={cat} className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>{cat}</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {catTools.map((tool, i) => (
              <div key={tool.id} className="flex items-center gap-4 px-5 py-4 group"
                style={{ background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: i < catTools.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                {/* Status dot */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TOOL_STATUS_META[tool.status]?.color ?? "#8892a4" }} />
                {/* Name & meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{tool.name}</p>
                    {tool.url && (
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--accent)" }}>↗</a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: COMPANY_COLORS[tool.usedBy] + "20", color: COMPANY_COLORS[tool.usedBy] }}>
                      {COMPANY_LABELS[tool.usedBy] ?? tool.usedBy}
                    </span>
                    {tool.notes && <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{tool.notes}</span>}
                  </div>
                </div>
                {/* Cost */}
                <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                  {tool.monthlyCost > 0 ? `$${tool.monthlyCost}/mo` : "Free"}
                </span>
                {/* Status select */}
                <select
                  value={tool.status}
                  onChange={(e) => setStatus(tool.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg font-semibold outline-none"
                  style={{ background: TOOL_STATUS_META[tool.status]?.color + "18", color: TOOL_STATUS_META[tool.status]?.color, border: "none", cursor: "pointer" }}
                >
                  {Object.entries(TOOL_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                {/* Delete */}
                <button
                  onClick={() => deleteTool(tool.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  style={{ color: "#e05252" }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAdd && <AddToolModal onClose={() => setShowAdd(false)} onAdded={(t) => setTools((p) => [...p, t])} />}
    </div>
  );
}

// ─── Tab 3: Ideas ─────────────────────────────────────────────────────────────

function AddIdeaModal({ onClose, onAdded }: { onClose: () => void; onAdded: (i: Idea) => void }) {
  const [form, setForm] = useState({ title: "", description: "", status: "concept", targetCompany: "all", priority: "medium" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/cto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "idea", ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.idea) { onAdded(data.idea); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color: "var(--text)" }}>New Product Idea</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Title *</label>
            <input className={inp} style={inpStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What's the idea?" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={3} className={inp} style={{ ...inpStyle, resize: "none" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief concept, problem it solves…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Stage</label>
              <select className={inp} style={inpStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {IDEA_STATUSES.map((s) => <option key={s} value={s}>{IDEA_STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>For</label>
              <select className={inp} style={inpStyle} value={form.targetCompany} onChange={(e) => setForm({ ...form, targetCompany: e.target.value })}>
                {COMPANIES.map((c) => <option key={c} value={c}>{c === "all" ? "All" : COMPANY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Priority</label>
              <select className={inp} style={inpStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#5fbb46", color: "white", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Add Idea"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IdeasTab({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  async function moveStatus(id: string, status: string) {
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, status } : i)));
    await fetch("/api/cto", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "idea", id, status }),
    });
  }

  async function deleteIdea(id: string) {
    setIdeas((p) => p.filter((i) => i.id !== id));
    await fetch(`/api/cto?type=idea&id=${id}`, { method: "DELETE" });
  }

  const displayed = ideas.filter((i) => {
    if (filter === "archived") return i.status === "archived";
    if (filter === "all") return i.status !== "archived";
    return i.targetCompany === filter || i.targetCompany === "all";
  });

  // group by status (excluding archived in main view)
  const stages = filter === "archived" ? ["archived"] : ["concept", "planning", "in-dev", "live"];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "all",      label: "Active" },
            ...COMPANIES.filter((c) => c !== "all").map((c) => ({ key: c, label: COMPANY_LABELS[c] })),
            { key: "archived", label: "Archived" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{
                background: filter === f.key ? "#1c1d52" : "var(--surface)",
                color: filter === f.key ? "white" : "var(--text-muted)",
                border: `1px solid ${filter === f.key ? "#1c1d52" : "var(--border)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="ml-auto text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: "#5fbb46", color: "white" }}>
          + New Idea
        </button>
      </div>

      {/* Stage columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((stage) => {
          const meta = IDEA_STATUS_META[stage];
          const stageIdeas = displayed.filter((i) => i.status === stage);
          return (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                <span className="text-xs ml-1" style={{ color: "var(--text-subtle)" }}>{stageIdeas.length}</span>
              </div>
              <div className="space-y-3">
                {stageIdeas.length === 0 && (
                  <p className="text-xs py-4 text-center rounded-xl" style={{ color: "var(--text-subtle)", background: meta.bg }}>Empty</p>
                )}
                {stageIdeas.map((idea) => (
                  <div key={idea.id} className="rounded-xl p-4 group" style={{ background: "var(--surface)", border: `1px solid var(--border)` }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>{idea.title}</p>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs shrink-0"
                        style={{ color: "#e05252" }}
                      >×</button>
                    </div>
                    {idea.description && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-subtle)" }}>{idea.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: COMPANY_COLORS[idea.targetCompany] + "20", color: COMPANY_COLORS[idea.targetCompany] }}>
                        {COMPANY_LABELS[idea.targetCompany] ?? idea.targetCompany}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: PRIORITY_META[idea.priority]?.color }}>
                        {PRIORITY_META[idea.priority]?.label}
                      </span>
                    </div>
                    {/* Move */}
                    <div className="flex gap-1 mt-3">
                      {IDEA_STATUSES.filter((s) => s !== idea.status && s !== "archived").map((s) => (
                        <button
                          key={s}
                          onClick={() => moveStatus(idea.id, s)}
                          className="text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: IDEA_STATUS_META[s].bg, color: IDEA_STATUS_META[s].color }}
                        >→ {IDEA_STATUS_META[s].label}</button>
                      ))}
                      {idea.status !== "archived" && (
                        <button
                          onClick={() => moveStatus(idea.id, "archived")}
                          className="text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ml-auto"
                          style={{ background: "var(--surface-2)", color: "var(--text-subtle)" }}
                        >Archive</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddIdeaModal onClose={() => setShowAdd(false)} onAdded={(i) => setIdeas((p) => [i, ...p])} />}
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: "today", label: "Today" },
  { key: "stack", label: "Stack & Tools" },
  { key: "ideas", label: "Ideas Pipeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CTOHub({
  initialFocus,
  initialTools,
  initialIdeas,
}: {
  initialFocus: FocusItem[];
  initialTools: Tool[];
  initialIdeas: Idea[];
}) {
  const [tab, setTab] = useState<TabKey>("today");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>CTO Hub</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Tech pulse, tools, and what's being built next.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t.key ? "#1c1d52" : "transparent",
              color: tab === t.key ? "white" : "var(--text-muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && <TodayTab initialFocus={initialFocus} tools={initialTools} />}
      {tab === "stack" && <StackTab initialTools={initialTools} />}
      {tab === "ideas" && <IdeasTab initialIdeas={initialIdeas} />}
    </div>
  );
}
