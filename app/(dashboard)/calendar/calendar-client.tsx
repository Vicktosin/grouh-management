"use client";

import { useState, useCallback } from "react";
import { SlotEditor } from "./slot-editor";

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

type Calendar = {
  id: string;
  month: number;
  year: number;
  slots: Slot[];
} | null;

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

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarClient({ initialCalendar, initialMonth, initialYear }: {
  initialCalendar: Calendar;
  initialMonth: number;
  initialYear: number;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [calendar, setCalendar] = useState<Calendar>(initialCalendar);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ date: string; slotIndex: number; existing?: Slot } | null>(null);

  const slotsByDate = (calendar?.slots ?? []).reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = slot.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  async function navigate(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setLoading(true);
    setMonth(m);
    setYear(y);

    // Ensure calendar exists for new month
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: m, year: y }),
    });

    const res = await fetch(`/api/calendar?month=${m}&year=${y}`);
    const data = await res.json();
    setCalendar(data.calendar);
    setLoading(false);
  }

  const handleSlotSaved = useCallback((slot: Slot & { id: string }) => {
    setCalendar((prev) => {
      if (!prev) return prev;
      const filtered = prev.slots.filter((s) => !(s.date.slice(0, 10) === slot.date.slice(0, 10) && s.slotIndex === slot.slotIndex));
      return { ...prev, slots: [...filtered, slot] };
    });
    setEditing(null);
  }, []);

  function openSlot(dateKey: string, slotIndex: number) {
    const existing = slotsByDate[dateKey]?.find((s) => s.slotIndex === slotIndex);
    if (!calendar) return;
    setEditing({ date: dateKey + "T00:00:00.000Z", slotIndex, existing });
  }

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const today = new Date();
  const isToday = (day: number) => today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const totalSlots = daysInMonth * 3;
  const readySlots = (calendar?.slots ?? []).filter((s) => s.status === "ready" || s.status === "published").length;
  const linkedSlots = (calendar?.slots ?? []).filter((s) => s.driveUrl).length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Content Calendar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Plan and track your content across platforms</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm transition-colors hover:opacity-80"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}
            >
              ‹
            </button>
            <span className="px-5 py-2 text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)", minWidth: 160, textAlign: "center" }}>
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={() => navigate(1)}
              className="px-4 py-2 text-sm transition-colors hover:opacity-80"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Content Slots", value: `${linkedSlots} / ${totalSlots}`, sub: "linked to Drive", color: "var(--accent)" },
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
      <div className="flex items-center gap-5 mb-4">
        {[["draft", "Draft", "#facc15"], ["ready", "Ready", "var(--success)"], ["published", "Published", "var(--accent)"]].map(([s, label, color]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Click any slot to add content</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ background: "var(--surface-2)" }}>
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: "var(--text-subtle)" }}>Loading...</div>
        ) : (
          Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7" style={{ borderTop: "1px solid var(--border)" }}>
              {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                if (!day) return (
                  <div key={dayIdx} className="min-h-28 p-2" style={{ background: "var(--background)", opacity: 0.4, borderRight: dayIdx < 6 ? "1px solid var(--border)" : undefined }} />
                );

                const dateKey = toDateKey(year, month, day);
                const daySlots = slotsByDate[dateKey] ?? [];
                const isWeekend = dayIdx === 0 || dayIdx === 6;

                return (
                  <div
                    key={day}
                    className="min-h-28 p-2 flex flex-col gap-1"
                    style={{
                      background: isToday(day) ? "rgba(108,92,231,0.06)" : isWeekend ? "rgba(255,255,255,0.01)" : "var(--background)",
                      borderRight: dayIdx < 6 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                        style={
                          isToday(day)
                            ? { background: "var(--accent)", color: "white" }
                            : { color: isWeekend ? "var(--text-subtle)" : "var(--text-muted)" }
                        }
                      >
                        {day}
                      </span>
                      {daySlots.length > 0 && (
                        <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                          {daySlots.filter(s => s.driveUrl).length}/{3}
                        </span>
                      )}
                    </div>

                    {/* Slots */}
                    {[0, 1, 2].map((slotIdx) => {
                      const slot = daySlots.find((s) => s.slotIndex === slotIdx);
                      if (slot) {
                        return (
                          <div
                            key={slotIdx}
                            onClick={() => slot.driveUrl ? window.open(slot.driveUrl, "_blank") : openSlot(dateKey, slotIdx)}
                            className="group relative rounded-md px-1.5 py-1 text-xs cursor-pointer transition-all hover:opacity-90"
                            style={{
                              background: slot.platform ? `${PLATFORM_COLORS[slot.platform]}22` : "var(--surface-2)",
                              borderLeft: `2px solid ${slot.platform ? PLATFORM_COLORS[slot.platform] : STATUS_DOT[slot.status ?? "draft"]}`,
                              color: "var(--text)",
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: STATUS_DOT[slot.status ?? "draft"] }}
                              />
                              <span className="truncate font-medium" style={{ fontSize: 10 }}>
                                {slot.title || slot.platform || slot.contentType || "Untitled"}
                              </span>
                              {slot.driveUrl && (
                                <span className="ml-auto shrink-0" style={{ fontSize: 10, color: "var(--text-subtle)" }}>↗</span>
                              )}
                            </div>
                            {/* Edit button on hover */}
                            <button
                              onClick={(e) => { e.stopPropagation(); openSlot(dateKey, slotIdx); }}
                              className="absolute top-0 right-0 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-sm text-xs"
                              style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                              title="Edit"
                            >
                              ✎
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={slotIdx}
                          onClick={() => openSlot(dateKey, slotIdx)}
                          className="rounded-md px-1.5 py-1 text-xs text-left transition-all hover:opacity-70 flex items-center gap-1"
                          style={{
                            background: "transparent",
                            border: "1px dashed var(--border-subtle)",
                            color: "var(--text-subtle)",
                            fontSize: 10,
                          }}
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

      {/* Slot editor modal */}
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
    </div>
  );
}
