"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = { id: string; name: string; type: string; isActive: boolean };

type Performance = {
  id: string;
  campaignId: string;
  channelId: string;
  periodLabel: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  notes: string | null;
  loggedAt: string;
  campaign: { id: string; name: string };
  channel:  { id: string; name: string };
};

type Campaign = { id: string; name: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_TYPES = ["digital","traditional","influencer","other"];
const TYPE_COLORS: Record<string,string> = {
  digital: "#1c7be0", traditional: "#f0be43", influencer: "#e05252", other: "#8892a4",
};

// ─── Add Channel Modal ────────────────────────────────────────────────────────

function AddChannelModal({ onClose, onAdded }: { onClose:()=>void; onAdded:(c:Channel)=>void }) {
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState("digital");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/marketing/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "channel", name, channelType }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.channel) { onAdded(data.channel); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color:"var(--text)" }}>Add Marketing Channel</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Channel name *</label>
            <input className={inp} style={inpStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Facebook Ads, Billboard, Influencer…" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Type</label>
            <select className={inp} style={inpStyle} value={channelType} onChange={(e) => setChannelType(e.target.value)}>
              {CHANNEL_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving||!name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background:"#1c1d52", color:"white", opacity:saving?0.7:1 }}>
            {saving?"Saving…":"Add Channel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Performance Modal ────────────────────────────────────────────────────

function LogPerformanceModal({
  channels,
  campaigns,
  onClose,
  onLogged,
}: {
  channels: Channel[];
  campaigns: Campaign[];
  onClose: () => void;
  onLogged: (p: Performance) => void;
}) {
  const [form, setForm] = useState({
    campaignId: campaigns[0]?.id ?? "",
    channelId: channels[0]?.id ?? "",
    periodLabel: "",
    spend: "", reach: "", impressions: "", clicks: "", conversions: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.campaignId || !form.channelId || !form.periodLabel.trim()) return;
    setSaving(true);
    const res = await fetch("/api/marketing/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "performance", ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.performance) { onLogged(data.performance); onClose(); }
  }

  const inp = "rounded-lg px-3 py-2 text-sm w-full outline-none";
  const inpStyle = { background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]" style={{ background:"var(--surface)", border:"1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold" style={{ color:"var(--text)" }}>Log Performance</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Campaign *</label>
            <select className={inp} style={inpStyle} value={form.campaignId} onChange={(e) => setForm({...form,campaignId:e.target.value})}>
              <option value="">Select…</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Channel *</label>
            <select className={inp} style={inpStyle} value={form.channelId} onChange={(e) => setForm({...form,channelId:e.target.value})}>
              <option value="">Select…</option>
              {channels.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Period *</label>
            <input className={inp} style={inpStyle} value={form.periodLabel} onChange={(e) => setForm({...form,periodLabel:e.target.value})} placeholder='e.g. "Week 1", "Oct 2026"' />
          </div>
          {[
            ["spend","Spend ($)"],["reach","Reach"],["impressions","Impressions"],
            ["clicks","Clicks"],["conversions","Conversions"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>{label}</label>
              <input type="number" min="0" className={inp} style={inpStyle}
                value={(form as Record<string,string>)[key]}
                onChange={(e) => setForm({...form,[key]:e.target.value})}
                placeholder="0" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color:"var(--text-muted)" }}>Notes</label>
            <input className={inp} style={inpStyle} value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} placeholder="Any context…" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.campaignId||!form.channelId||!form.periodLabel} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background:"#5fbb46", color:"white", opacity:saving?0.7:1 }}>
            {saving?"Saving…":"Log Performance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ChannelsClient({
  initialChannels,
  initialPerformance,
  initialCampaigns,
}: {
  initialChannels: Channel[];
  initialPerformance: Performance[];
  initialCampaigns: Campaign[];
}) {
  const [channels, setChannels]       = useState<Channel[]>(initialChannels);
  const [performance, setPerformance] = useState<Performance[]>(initialPerformance);
  const [showAddCh, setShowAddCh]     = useState(false);
  const [showLogPerf, setShowLogPerf] = useState(false);
  const [filterCh, setFilterCh]       = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    setChannels((p) => p.map((c) => (c.id === id ? { ...c, isActive } : c)));
    await fetch("/api/marketing/channels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
  }

  async function deleteChannel(id: string) {
    setChannels((p) => p.filter((c) => c.id !== id));
    await fetch(`/api/marketing/channels?id=${id}&type=channel`, { method: "DELETE" });
  }

  async function deletePerf(id: string) {
    setPerformance((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/marketing/channels?id=${id}&type=performance`, { method: "DELETE" });
  }

  const filteredPerf = filterCh ? performance.filter((p) => p.channelId === filterCh) : performance;

  // Aggregate totals across all performance entries
  const totals = performance.reduce((acc, p) => ({
    spend: acc.spend + p.spend,
    reach: acc.reach + p.reach,
    clicks: acc.clicks + p.clicks,
    conversions: acc.conversions + p.conversions,
  }), { spend: 0, reach: 0, clicks: 0, conversions: 0 });

  const ctr  = totals.reach > 0 ? ((totals.clicks / totals.reach) * 100).toFixed(2) : "—";
  const cpc  = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : "—";
  const cvr  = totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : "—";

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:"var(--text)" }}>Marketing</h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Channels & Performance — track every channel and log results.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddCh(true)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background:"var(--surface)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>
            + Channel
          </button>
          <button onClick={() => setShowLogPerf(true)} disabled={channels.length === 0 || initialCampaigns.length === 0} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background:"#5fbb46", color:"white" }}>
            + Log Performance
          </button>
        </div>
      </div>

      <MarketingNav />

      {/* Aggregate stats */}
      {performance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label:"Total Spend",    value:`$${totals.spend.toLocaleString()}` },
            { label:"Total Reach",    value:totals.reach.toLocaleString()       },
            { label:"Click Rate",     value:`${ctr}%`                           },
            { label:"Conv. Rate",     value:`${cvr}%`                           },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <p className="text-xs mb-1" style={{ color:"var(--text-subtle)" }}>{s.label}</p>
              <p className="text-xl font-bold tabular-nums" style={{ color:"var(--text)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Channel roster */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"var(--text-subtle)" }}>Channels ({channels.length})</p>
        {channels.length === 0 ? (
          <p className="text-sm py-6 text-center rounded-xl" style={{ color:"var(--text-subtle)", background:"var(--surface)", border:"1px solid var(--border)" }}>No channels yet — add your first one.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center gap-2 px-3 py-2 rounded-xl group" style={{ background:ch.isActive?"var(--surface)":"var(--surface-2)", border:`1px solid ${ch.isActive?"var(--border)":"var(--border-subtle)"}`, opacity:ch.isActive?1:0.6 }}>
                <span className="w-2 h-2 rounded-full" style={{ background:TYPE_COLORS[ch.type]??TYPE_COLORS.other }} />
                <span className="text-sm font-medium" style={{ color:"var(--text)" }}>{ch.name}</span>
                <span className="text-xs" style={{ color:TYPE_COLORS[ch.type]??TYPE_COLORS.other }}>{ch.type}</span>
                <button onClick={() => toggleActive(ch.id, !ch.isActive)} className="text-xs opacity-0 group-hover:opacity-100 ml-1 transition-all" style={{ color:"var(--text-subtle)" }}>
                  {ch.isActive ? "Pause" : "Activate"}
                </button>
                <button onClick={() => deleteChannel(ch.id)} className="text-xs opacity-0 group-hover:opacity-100 transition-all" style={{ color:"#e05252" }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance log */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-subtle)" }}>Performance Log</p>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterCh(null)} className="text-xs px-2.5 py-1 rounded-full" style={{ background:!filterCh?"#1c1d52":"var(--surface)", color:!filterCh?"white":"var(--text-muted)", border:`1px solid ${!filterCh?"#1c1d52":"var(--border)"}` }}>
              All
            </button>
            {channels.map((ch) => (
              <button key={ch.id} onClick={() => setFilterCh(ch.id)} className="text-xs px-2.5 py-1 rounded-full" style={{ background:filterCh===ch.id?"#1c1d52":"var(--surface)", color:filterCh===ch.id?"white":"var(--text-muted)", border:`1px solid ${filterCh===ch.id?"#1c1d52":"var(--border)"}` }}>
                {ch.name}
              </button>
            ))}
          </div>
        </div>

        {filteredPerf.length === 0 ? (
          <p className="text-sm py-6 text-center rounded-xl" style={{ color:"var(--text-subtle)", background:"var(--surface)", border:"1px solid var(--border)" }}>
            {channels.length === 0 || initialCampaigns.length === 0
              ? "Add channels and campaigns first, then log performance here."
              : "No performance entries yet."}
          </p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
            {filteredPerf.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 group"
                style={{ background:i%2===0?"var(--surface)":"var(--surface-2)", borderBottom:i<filteredPerf.length-1?"1px solid var(--border-subtle)":"none" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color:"var(--text)" }}>{p.channel.name}</span>
                    <span className="text-xs" style={{ color:"var(--text-subtle)" }}>·</span>
                    <span className="text-xs" style={{ color:"var(--text-subtle)" }}>{p.campaign.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background:"var(--surface-2)", color:"var(--text-subtle)", border:"1px solid var(--border-subtle)" }}>{p.periodLabel}</span>
                  </div>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    {[
                      ["Spend", `$${p.spend.toLocaleString()}`],
                      ["Reach", p.reach.toLocaleString()],
                      ["Clicks", p.clicks.toLocaleString()],
                      ["Conv.", p.conversions.toLocaleString()],
                    ].map(([l, v]) => (
                      <span key={l} className="text-xs" style={{ color:"var(--text-subtle)" }}>
                        {l}: <strong style={{ color:"var(--text-muted)" }}>{v}</strong>
                      </span>
                    ))}
                    {p.notes && <span className="text-xs italic" style={{ color:"var(--text-subtle)" }}>{p.notes}</span>}
                  </div>
                </div>
                <button onClick={() => deletePerf(p.id)} className="opacity-0 group-hover:opacity-100 text-xs transition-all" style={{ color:"#e05252" }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddCh  && <AddChannelModal onClose={() => setShowAddCh(false)} onAdded={(c) => setChannels((p) => [...p, c])} />}
      {showLogPerf && (
        <LogPerformanceModal
          channels={channels}
          campaigns={initialCampaigns}
          onClose={() => setShowLogPerf(false)}
          onLogged={(p) => setPerformance((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
}
