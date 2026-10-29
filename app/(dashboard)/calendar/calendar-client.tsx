"use client";

import { useState, useCallback } from "react";
import { SlotEditor } from "./slot-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

type Slot = {
  id: string;
  date: string;
  slotIndex: number;
  title?: string | null;
  platform?: string | null;
  contentType?: string | null;
  driveUrl?: string | null;
  status?: string;
  notes?: string | null;
};

export type CalendarMeta = {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  createdAt: string;
};

type CalendarFull = CalendarMeta & { slots: Slot[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok: "#69c9d0",
  Facebook: "#1877f2",
  LinkedIn: "#0a66c2",
  YouTube: "#ff0000",
  "Twitter/X": "#8899a6",
};

const STATUS_DOT: Record<string, string> = {
  ready: "var(--success)",
  published: "var(--accent)",
  draft: "#facc15",
  empty: "var(--border)",
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PALETTE = ["#1c1d52","#5fbb46","#f0be43","#4285f4","#e1306c","#db4437","#9c27b0","#0a66c2","#8892a4"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(m: number, y: number) { return new Date(y, m, 0).getDate(); }
function getFirstDay(m: number, y: number)    { return new Date(y, m - 1, 1).getDay(); }
function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

// ─── New-calendar modal ───────────────────────────────────────────────────────

function NewCalendarModal({ onCreated, onClose }: { onCreated: (c: CalendarMeta) => void; onClose: () => void }) {
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [color, setColor] = useState("#1c1d52");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, color }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.calendar) { onCreated(data.calendar); onClose(); }
  }

  const inp = { background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", width: "100%", outline: "none" } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>New Calendar</h2>
          <button onClick={onClose} style={{ color: "var(--text-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Calendar Name *</label>
            <input required style={inp} placeholder="e.g. Client A — Social" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
            <input style={inp} placeholder="What is this calendar for?" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Colour</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{ background: c, border: color === c ? "3px solid white" : "2px solid transparent", transform: color === c ? "scale(1.2)" : "scale(1)", boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  calendar,
  month,
  year,
  loading,
  onOpenSlot,
}: {
  calendar: CalendarFull | null;
  month: number;
  year: number;
  loading: boolean;
  onOpenSlot: (date: string, slotIndex: number) => void;
}) {
  const slotsByDate = (calendar?.slots ?? []).reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = slot.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay    = getFirstDay(month, year);
  const today       = new Date();
  const isToday = (d: number) => today.getDate() === d && today.getMonth() + 1 === month && today.getFullYear() === year;

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Day headers */}
      <div className="grid grid-cols-7" style={{ background: "var(--surface-2)" }}>
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: "var(--text-subtle)" }}>Loading…</div>
      ) : (
        Array.from({ length: cells.length / 7 }, (_, wk) => (
          <div key={wk} className="grid grid-cols-7" style={{ borderTop: "1px solid var(--border)" }}>
            {cells.slice(wk * 7, wk * 7 + 7).map((day, di) => {
              if (!day) return (
                <div key={di} className="min-h-28 p-2" style={{ background: "var(--background)", opacity: 0.4, borderRight: di < 6 ? "1px solid var(--border)" : undefined }} />
              );
              const dateKey = toDateKey(year, month, day);
              const daySlots = slotsByDate[dateKey] ?? [];
              const isWknd = di === 0 || di === 6;
              return (
                <div key={day} className="min-h-28 p-2 flex flex-col gap-1"
                  style={{
                    background: isToday(day) ? "rgba(28,29,82,0.06)" : isWknd ? "rgba(255,255,255,0.01)" : "var(--background)",
                    borderRight: di < 6 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                      style={isToday(day) ? { background: "var(--accent)", color: "white" } : { color: isWknd ? "var(--text-subtle)" : "var(--text-muted)" }}
                    >{day}</span>
                    {daySlots.length > 0 && (
                      <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{daySlots.filter(s => s.driveUrl).length}/3</span>
                    )}
                  </div>

                  {[0, 1, 2].map((slotIdx) => {
                    const slot = daySlots.find(s => s.slotIndex === slotIdx);
                    if (slot) return (
                      <div key={slotIdx}
                        onClick={() => slot.driveUrl ? window.open(slot.driveUrl, "_blank") : onOpenSlot(dateKey, slotIdx)}
                        className="group relative rounded-md px-1.5 py-1 text-xs cursor-pointer transition-all hover:opacity-90"
                        style={{
                          background: slot.platform ? `${PLATFORM_COLORS[slot.platform]}22` : "var(--surface-2)",
                          borderLeft: `2px solid ${slot.platform ? PLATFORM_COLORS[slot.platform] : STATUS_DOT[slot.status ?? "draft"]}`,
                          color: "var(--text)",
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[slot.status ?? "draft"] }} />
                          <span className="truncate font-medium" style={{ fontSize: 10 }}>{slot.title || slot.platform || slot.contentType || "Untitled"}</span>
                          {slot.driveUrl && <span className="ml-auto shrink-0" style={{ fontSize: 10, color: "var(--text-subtle)" }}>↗</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onOpenSlot(dateKey, slotIdx); }}
                          className="absolute top-0 right-0 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-sm text-xs"
                          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }} title="Edit"
                        >✎</button>
                      </div>
                    );
                    return (
                      <button key={slotIdx} onClick={() => onOpenSlot(dateKey, slotIdx)}
                        className="rounded-md px-1.5 py-1 text-xs text-left transition-all hover:opacity-70 flex items-center gap-1"
                        style={{ background: "transparent", border: "1px dashed var(--border-subtle)", color: "var(--text-subtle)", fontSize: 10 }}
                      >
                        <span style={{ opacity: 0.5 }}>+</span> Add content
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function CalendarClient({
  initialCalendars,
  initialCalendar,
  initialMonth,
  initialYear,
  isManager,
}: {
  initialCalendars: CalendarMeta[];
  initialCalendar: CalendarFull | null;
  initialMonth: number;
  initialYear: number;
  isManager: boolean;
}) {
  const [calendars, setCalendars] = useState<CalendarMeta[]>(initialCalendars);
  const [activeId, setActiveId]   = useState<string | null>(initialCalendar?.id ?? initialCalendars[0]?.id ?? null);
  const [calendar, setCalendar]   = useState<CalendarFull | null>(initialCalendar);
  const [month, setMonth]         = useState(initialMonth);
  const [year, setYear]           = useState(initialYear);
  const [loading, setLoading]     = useState(false);
  const [editing, setEditing]     = useState<{ date: string; slotIndex: number; existing?: Slot } | null>(null);
  const [creatingCal, setCreatingCal] = useState(false);

  async function loadCalendar(calId: string, m: number, y: number) {
    setLoading(true);
    const res  = await fetch(`/api/calendar?calendarId=${calId}&month=${m}&year=${y}`);
    const data = await res.json();
    setCalendar(data.calendar ?? null);
    setLoading(false);
  }

  async function switchCalendar(cal: CalendarMeta) {
    setActiveId(cal.id);
    await loadCalendar(cal.id, month, year);
  }

  async function navigate(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    setMonth(m);
    setYear(y);
    if (activeId) await loadCalendar(activeId, m, y);
  }

  async function deleteCalendar(id: string) {
    if (!confirm("Delete this calendar and all its content slots?")) return;
    await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    const remaining = calendars.filter(c => c.id !== id);
    setCalendars(remaining);
    if (activeId === id) {
      const next = remaining[0] ?? null;
      setActiveId(next?.id ?? null);
      if (next) await loadCalendar(next.id, month, year);
      else setCalendar(null);
    }
  }

  const handleSlotSaved = useCallback((slot: Slot & { id: string }) => {
    setCalendar((prev) => {
      if (!prev) return prev;
      const filtered = prev.slots.filter(s => !(s.date.slice(0, 10) === slot.date.slice(0, 10) && s.slotIndex === slot.slotIndex));
      return { ...prev, slots: [...filtered, slot] };
    });
    setEditing(null);
  }, []);

  function openSlot(dateKey: string, slotIndex: number) {
    const existing = calendar?.slots.find(s => s.date.slice(0, 10) === dateKey && s.slotIndex === slotIndex);
    if (!calendar) return;
    setEditing({ date: dateKey + "T00:00:00.000Z", slotIndex, existing });
  }

  const active = calendars.find(c => c.id === activeId);
  const totalSlots  = getDaysInMonth(month, year) * 3;
  const linkedSlots = (calendar?.slots ?? []).filter(s => s.driveUrl).length;
  const readySlots  = (calendar?.slots ?? []).filter(s => s.status === "ready" || s.status === "published").length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Content Calendar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Plan and track your content across platforms</p>
        </div>
        {isManager && (
          <button onClick={() => setCreatingCal(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white" }}>
            + New Calendar
          </button>
        )}
      </div>

      {/* Calendar switcher tabs */}
      {calendars.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          {calendars.map((cal) => (
            <div key={cal.id} className="flex items-center group">
              <button
                onClick={() => switchCalendar(cal)}
                className="flex items-center gap-2 px-4 py-2 rounded-l-xl text-sm font-medium transition-all"
                style={{
                  background: activeId === cal.id ? cal.color : "var(--surface)",
                  color: activeId === cal.id ? "white" : "var(--text-muted)",
                  border: `1px solid ${activeId === cal.id ? cal.color : "var(--border)"}`,
                  borderRight: isManager ? "none" : undefined,
                  borderRadius: isManager ? "10px 0 0 10px" : "10px",
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeId === cal.id ? "rgba(255,255,255,0.7)" : cal.color }} />
                {cal.name}
              </button>
              {isManager && (
                <button
                  onClick={() => deleteCalendar(cal.id)}
                  className="px-2 py-2 rounded-r-xl text-xs transition-all opacity-0 group-hover:opacity-100"
                  style={{
                    background: activeId === cal.id ? cal.color : "var(--surface)",
                    color: activeId === cal.id ? "rgba(255,255,255,0.6)" : "var(--text-subtle)",
                    border: `1px solid ${activeId === cal.id ? cal.color : "var(--border)"}`,
                    borderLeft: `1px solid ${activeId === cal.id ? "rgba(255,255,255,0.2)" : "var(--border-subtle)"}`,
                  }}
                  title="Delete calendar"
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No calendars */}
      {calendars.length === 0 && (
        <div className="rounded-2xl py-16 text-center mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No calendars yet</p>
          {isManager && <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Click "+ New Calendar" to create your first one</p>}
        </div>
      )}

      {active && (
        <>
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <p className="text-base font-semibold" style={{ color: "var(--text)" }}>{active.name}</p>
              {active.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{active.description}</p>}
            </div>
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm hover:opacity-80" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>‹</button>
              <span className="px-5 py-2 text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)", minWidth: 160, textAlign: "center" }}>
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button onClick={() => navigate(1)} className="px-4 py-2 text-sm hover:opacity-80" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>›</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Content Slots", value: `${linkedSlots} / ${totalSlots}`, sub: "linked to Drive", color: active.color },
              { label: "Ready to Post", value: readySlots, sub: "pieces ready", color: "var(--success)" },
              { label: "Coverage", value: `${Math.round((linkedSlots / totalSlots) * 100)}%`, sub: "of month planned", color: "#f59e0b" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4 flex-wrap">
            {[["draft","Draft","#facc15"],["ready","Ready","var(--success)"],["published","Published","var(--accent)"]].map(([s, label, color]) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
            <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>Click any slot to add content</span>
          </div>

          <CalendarGrid calendar={calendar} month={month} year={year} loading={loading} onOpenSlot={openSlot} />
        </>
      )}

      {/* Slot editor */}
      {editing && calendar && (
        <SlotEditor
          calendarId={calendar.id}
          date={editing.date}
          slotIndex={editing.slotIndex}
          existing={editing.existing}
          onClose={() => setEditing(null)}
          onSaved={handleSlotSaved}
        />
      )}

      {/* New calendar modal */}
      {creatingCal && (
        <NewCalendarModal
          onCreated={(cal) => {
            setCalendars((prev) => [...prev, cal]);
            setActiveId(cal.id);
            setCalendar({ ...cal, slots: [] });
          }}
          onClose={() => setCreatingCal(false)}
        />
      )}
    </div>
  );
}
