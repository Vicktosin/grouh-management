"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Entry = {
  id: string;
  title: string;
  type: string;
  targetCompany: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { firstName: string; lastName: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTRY_TYPES = ["research","competitor","positioning","brief"];
const TYPE_META: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  research:   { label:"Research",    color:"#1c7be0", bg:"rgba(28,123,224,0.10)",  icon:"🔍" },
  competitor: { label:"Competitor",  color:"#e05252", bg:"rgba(224,82,82,0.10)",   icon:"⚔️" },
  positioning:{ label:"Positioning", color:"#f0be43", bg:"rgba(240,190,67,0.10)",  icon:"🎯" },
  brief:      { label:"Brief",       color:"#5fbb46", bg:"rgba(95,187,70,0.10)",   icon:"📋" },
};

const COMPANIES = ["all","software","academy","marketing","entertainment"];
const COMPANY_LABELS: Record<string,string> = {
  all:"All", software:"Software Co.", academy:"Academy",
  marketing:"Marketing Agency", entertainment:"Entertainment",
};

// ─── Edit / Create Modal ──────────────────────────────────────────────────────

function EntryModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Entry> | null;
  onClose: () => void;
  onSaved: (e: Entry) => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    type: initial?.type ?? "research",
    targetCompany: initial?.targetCompany ?? "all",
    body: initial?.body ?? "",
    status: initial?.status ?? "draft",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const isEdit = !!initial?.id;
    const res = await fetch("/api/marketing/strategy", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: initial!.id, ...form } : form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.entry) { onSaved(data.entry); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[92vh]" style={{ background:"var(--surface)", border:"1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color:"var(--text)" }}>{initial?.id ? "Edit Entry" : "New Strategy Entry"}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Title *</label>
            <input className={inp} style={inpStyle} value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} placeholder="e.g. Academy competitor landscape Q4" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Type</label>
            <select className={inp} style={inpStyle} value={form.type} onChange={(e) => setForm({...form,type:e.target.value})}>
              {ENTRY_TYPES.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>For</label>
            <select className={inp} style={inpStyle} value={form.targetCompany} onChange={(e) => setForm({...form,targetCompany:e.target.value})}>
              {COMPANIES.map((c) => <option key={c} value={c}>{COMPANY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Status</label>
            <select className={inp} style={inpStyle} value={form.status} onChange={(e) => setForm({...form,status:e.target.value})}>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Content</label>
            <textarea
              rows={12}
              className={inp}
              style={{...inpStyle, resize:"vertical", fontFamily:"inherit", lineHeight:1.7}}
              value={form.body}
              onChange={(e) => setForm({...form,body:e.target.value})}
              placeholder="Write your research notes, analysis, competitor profile, positioning strategy or campaign brief…"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background:TYPE_META[form.type]?.color??"#1c1d52", color:"white", opacity:saving?0.7:1 }}>
            {saving?"Saving…":initial?.id?"Save Changes":"Create Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[entry.type] ?? TYPE_META.research;
  const preview = entry.body.slice(0, 200) + (entry.body.length > 200 ? "…" : "");
  const updated = new Date(entry.updatedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

  return (
    <div className="rounded-2xl p-5 group cursor-pointer" style={{ background:"var(--surface)", border:`1px solid var(--border)` }} onClick={() => onEdit(entry)}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background:meta.bg, color:meta.color }}>
              {meta.icon} {meta.label}
            </span>
            {entry.targetCompany !== "all" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:"var(--surface-2)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>
                {COMPANY_LABELS[entry.targetCompany]}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background:entry.status==="final"?"rgba(95,187,70,0.12)":"var(--surface-2)", color:entry.status==="final"?"#5fbb46":"var(--text-subtle)" }}>
              {entry.status === "final" ? "✓ Final" : "Draft"}
            </span>
          </div>

          <p className="text-sm font-bold mb-1.5" style={{ color:"var(--text)" }}>{entry.title}</p>

          {preview && (
            <p className="text-xs leading-relaxed" style={{ color:"var(--text-subtle)" }}>{preview}</p>
          )}

          <p className="text-xs mt-3" style={{ color:"var(--text-subtle)" }}>
            by {entry.createdBy.firstName} {entry.createdBy.lastName} · updated {updated}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
          className="opacity-0 group-hover:opacity-100 transition-all text-xs shrink-0"
          style={{ color:"#e05252" }}
        >×</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function StrategyClient({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editing, setEditing]       = useState<Partial<Entry> | null | "new">(null);

  async function handleDelete(id: string) {
    setEntries((p) => p.filter((e) => e.id !== id));
    await fetch(`/api/marketing/strategy?id=${id}`, { method: "DELETE" });
  }

  function handleSaved(entry: Entry) {
    setEntries((p) => {
      const idx = p.findIndex((e) => e.id === entry.id);
      if (idx >= 0) { const n = [...p]; n[idx] = entry; return n; }
      return [entry, ...p];
    });
  }

  const displayed = typeFilter === "all"
    ? entries
    : entries.filter((e) => e.type === typeFilter);

  const counts = ENTRY_TYPES.reduce((acc, t) => {
    acc[t] = entries.filter((e) => e.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:"var(--text)" }}>Marketing</h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Strategy Board — research, competitor analysis, positioning and briefs.</p>
        </div>
        <button onClick={() => setEditing("new")} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background:"#1c1d52", color:"white" }}>
          + New Entry
        </button>
      </div>

      <MarketingNav />

      {/* Type filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTypeFilter("all")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background:typeFilter==="all"?"#1c1d52":"var(--surface)", color:typeFilter==="all"?"white":"var(--text-muted)", border:`1px solid ${typeFilter==="all"?"#1c1d52":"var(--border)"}` }}>
          All ({entries.length})
        </button>
        {ENTRY_TYPES.map((t) => {
          const m = TYPE_META[t];
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background:typeFilter===t?m.color+"22":"var(--surface)", color:typeFilter===t?m.color:"var(--text-muted)", border:`1px solid ${typeFilter===t?m.color+"55":"var(--border)"}` }}>
              {m.icon} {m.label} ({counts[t] ?? 0})
            </button>
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm py-12 text-center rounded-2xl" style={{ color:"var(--text-subtle)", background:"var(--surface)", border:"1px solid var(--border)" }}>
          {entries.length === 0
            ? "Nothing documented yet — start with research or a campaign brief."
            : `No ${TYPE_META[typeFilter]?.label.toLowerCase()} entries.`}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((e) => (
            <EntryCard key={e.id} entry={e} onEdit={setEditing} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {editing !== null && (
        <EntryModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
