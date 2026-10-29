"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = { id: string; name: string; type: string };

type Campaign = {
  id: string;
  name: string;
  targetCompany: string;
  description: string | null;
  status: string;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  channels: Channel[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANIES = ["all","software","academy","marketing","entertainment"];
const COMPANY_LABELS: Record<string,string> = {
  all:"All companies", software:"Software Co.", academy:"Academy",
  marketing:"Marketing Agency", entertainment:"Entertainment",
};
const COMPANY_COLORS: Record<string,string> = {
  all:"#8892a4", software:"#1c1d52", academy:"#5fbb46",
  marketing:"#f0be43", entertainment:"#e05252",
};

const STATUSES = ["planning","active","paused","completed"];
const STATUS_META: Record<string,{label:string;color:string;bg:string}> = {
  planning:  { label:"Planning",  color:"#8892a4", bg:"rgba(136,146,164,0.12)" },
  active:    { label:"Active",    color:"#5fbb46", bg:"rgba(95,187,70,0.12)"   },
  paused:    { label:"Paused",    color:"#f0be43", bg:"rgba(240,190,67,0.12)"  },
  completed: { label:"Completed", color:"#1c7be0", bg:"rgba(28,123,224,0.12)"  },
};

// ─── Add Campaign Modal ───────────────────────────────────────────────────────

function AddCampaignModal({
  channels,
  onClose,
  onAdded,
}: {
  channels: Channel[];
  onClose: () => void;
  onAdded: (c: Campaign) => void;
}) {
  const [form, setForm] = useState({
    name: "", targetCompany: "all", description: "",
    budget: "", startDate: "", endDate: "", channelIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  function toggleChannel(id: string) {
    setForm((f) => ({
      ...f,
      channelIds: f.channelIds.includes(id)
        ? f.channelIds.filter((x) => x !== id)
        : [...f.channelIds, id],
    }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.campaign) { onAdded(data.campaign); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]" style={{ background:"var(--surface)", border:"1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color:"var(--text)" }}>New Campaign</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Campaign name *</label>
            <input className={inp} style={inpStyle} value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="e.g. Academy Q4 Launch" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>For</label>
            <select className={inp} style={inpStyle} value={form.targetCompany} onChange={(e) => setForm({...form,targetCompany:e.target.value})}>
              {COMPANIES.map((c) => <option key={c} value={c}>{COMPANY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Budget ($)</label>
            <input type="number" min="0" className={inp} style={inpStyle} value={form.budget} onChange={(e) => setForm({...form,budget:e.target.value})} placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Start date</label>
            <input type="date" className={inp} style={inpStyle} value={form.startDate} onChange={(e) => setForm({...form,startDate:e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>End date</label>
            <input type="date" className={inp} style={inpStyle} value={form.endDate} onChange={(e) => setForm({...form,endDate:e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Description</label>
            <textarea rows={2} className={inp} style={{...inpStyle,resize:"none"}} value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="What is this campaign about?" />
          </div>
          {channels.length > 0 && (
            <div className="col-span-2">
              <label className="text-xs font-medium mb-2 block" style={{ color:"var(--text-muted)" }}>Channels</label>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => {
                  const sel = form.channelIds.includes(ch.id);
                  return (
                    <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background:sel?"#1c1d52":"var(--surface-2)", color:sel?"white":"var(--text-muted)", border:`1px solid ${sel?"#1c1d52":"var(--border)"}` }}>
                      {ch.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background:"#1c1d52", color:"white", opacity:saving?0.7:1 }}>
            {saving?"Saving…":"Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onStatusChange,
  onDelete,
}: {
  campaign: Campaign;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const sm = STATUS_META[campaign.status] ?? STATUS_META.planning;
  const cc = COMPANY_COLORS[campaign.targetCompany] ?? "#8892a4";

  function fmt(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
  }

  const nextStatus: Record<string,string> = { planning:"active", active:"paused", paused:"active" };

  return (
    <div className="rounded-2xl p-5 group" style={{ background:"var(--surface)", border:`1px solid var(--border)` }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold" style={{ color:"var(--text)" }}>{campaign.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:sm.bg, color:sm.color }}>{sm.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:cc+"18", color:cc }}>
              {COMPANY_LABELS[campaign.targetCompany] ?? campaign.targetCompany}
            </span>
          </div>

          {campaign.description && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color:"var(--text-subtle)" }}>{campaign.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {campaign.budget != null && (
              <span className="text-xs font-semibold" style={{ color:"var(--text-muted)" }}>
                Budget: <span style={{ color:"var(--text)" }}>${campaign.budget.toLocaleString()}</span>
              </span>
            )}
            {(campaign.startDate || campaign.endDate) && (
              <span className="text-xs" style={{ color:"var(--text-subtle)" }}>
                {fmt(campaign.startDate)} {campaign.endDate ? `→ ${fmt(campaign.endDate)}` : "→ ongoing"}
              </span>
            )}
          </div>

          {campaign.channels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {campaign.channels.map((ch) => (
                <span key={ch.id} className="text-xs px-2 py-0.5 rounded" style={{ background:"var(--surface-2)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}>
                  {ch.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {campaign.status !== "completed" && nextStatus[campaign.status] && (
            <button
              onClick={() => onStatusChange(campaign.id, nextStatus[campaign.status])}
              className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
              style={{ background:"var(--surface-2)", color:"var(--text-muted)", border:"1px solid var(--border)" }}
            >
              → {STATUS_META[nextStatus[campaign.status]]?.label}
            </button>
          )}
          {campaign.status !== "completed" && (
            <button
              onClick={() => onStatusChange(campaign.id, "completed")}
              className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
              style={{ background:"rgba(28,123,224,0.10)", color:"#1c7be0" }}
            >
              Mark done
            </button>
          )}
          <button
            onClick={() => onDelete(campaign.id)}
            className="opacity-0 group-hover:opacity-100 text-xs transition-all"
            style={{ color:"#e05252" }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CampaignsClient({
  initialCampaigns,
  initialChannels,
}: {
  initialCampaigns: Campaign[];
  initialChannels: Channel[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [filter, setFilter] = useState<string>("all-status");
  const [showAdd, setShowAdd] = useState(false);

  async function handleStatusChange(id: string, status: string) {
    setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch("/api/marketing/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function handleDelete(id: string) {
    setCampaigns((p) => p.filter((c) => c.id !== id));
    await fetch(`/api/marketing/campaigns?id=${id}`, { method: "DELETE" });
  }

  const displayed = filter === "all-status"
    ? campaigns
    : campaigns.filter((c) => c.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = campaigns.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:"var(--text)" }}>Marketing</h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Campaign Hub — all active and planned initiatives.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background:"#1c1d52", color:"white" }}>
          + New Campaign
        </button>
      </div>

      <MarketingNav />

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilter("all-status")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background:filter==="all-status"?"#1c1d52":"var(--surface)", color:filter==="all-status"?"white":"var(--text-muted)", border:`1px solid ${filter==="all-status"?"#1c1d52":"var(--border)"}` }}
        >
          All ({campaigns.length})
        </button>
        {STATUSES.map((s) => {
          const m = STATUS_META[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background:filter===s?m.color+"22":"var(--surface)", color:filter===s?m.color:"var(--text-muted)", border:`1px solid ${filter===s?m.color+"55":"var(--border)"}` }}>
              {m.label} ({counts[s] ?? 0})
            </button>
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm py-12 text-center rounded-2xl" style={{ color:"var(--text-subtle)", background:"var(--surface)", border:"1px solid var(--border)" }}>
          {filter === "all-status" ? "No campaigns yet — create your first one." : `No ${STATUS_META[filter]?.label.toLowerCase()} campaigns.`}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((c) => (
            <CampaignCard key={c.id} campaign={c} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddCampaignModal
          channels={initialChannels}
          onClose={() => setShowAdd(false)}
          onAdded={(c) => setCampaigns((p) => [c, ...p])}
        />
      )}
    </div>
  );
}
