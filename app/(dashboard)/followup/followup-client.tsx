"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type DayLog = {
  id: string;
  logDate: string;
  isCleared: boolean;
  screenshotUrl: string | null;
  notes: string | null;
  submittedAt: string;
};

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  roleTitle: string;
  todayLog: DayLog | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toDateKey(iso: string) { return iso.slice(0, 10); }

function dayOfMonth(iso: string) { return new Date(iso).getUTCDate(); }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getDaysInMonth(m: number, y: number) { return new Date(y, m, 0).getDate(); }
function getFirstDay(m: number, y: number)    { return new Date(y, m - 1, 1).getDay(); }

// ─── Daily check-in card ──────────────────────────────────────────────────────

function CheckInCard({
  todayLog,
  staffId,
  onSaved,
}: {
  todayLog: DayLog | null;
  staffId: string;
  onSaved: (log: DayLog) => void;
}) {
  const [isCleared, setIsCleared] = useState(todayLog?.isCleared ?? false);
  const [notes, setNotes] = useState(todayLog?.notes ?? "");
  const [screenshotUrl, setScreenshotUrl] = useState(todayLog?.screenshotUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadError("File too large — max 5 MB"); return; }
    setUploadError("");
    setUploading(true);

    const path = `${staffId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("followup").upload(path, file, { upsert: true });

    if (error) {
      setUploadError("Upload failed. Make sure the 'followup' storage bucket exists in Supabase.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("followup").getPublicUrl(path);
    setScreenshotUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCleared, screenshotUrl, notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.log) onSaved(data.log);
  }

  const isSubmitted = !!todayLog;

  return (
    <div className="rounded-2xl overflow-hidden mb-8" style={{ border: `2px solid ${isCleared ? "#5fbb46" : "var(--border)"}` }}>
      {/* Header bar */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: isCleared ? "rgba(95,187,70,0.10)" : "var(--surface)" }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--text-subtle)" }}>Today's Follow-up Check-in</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{dateLabel}</p>
        </div>
        {isSubmitted && (
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: isCleared ? "rgba(95,187,70,0.15)" : "rgba(224,82,82,0.12)", color: isCleared ? "#5fbb46" : "#e05252" }}>
            {isCleared ? "✓ Cleared" : "⚠ Backlog reported"}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6" style={{ background: "var(--surface)" }}>
        {/* Cleared toggle */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Follow-up status</p>
          <div className="flex gap-3">
            {[
              { val: true,  label: "All Clear",   desc: "No backlog — everyone followed up", color: "#5fbb46" },
              { val: false, label: "Has Backlog",  desc: "Some follow-ups are outstanding",   color: "#e05252" },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                onClick={() => setIsCleared(opt.val)}
                className="flex-1 rounded-xl p-4 text-left transition-all"
                style={{
                  border: `2px solid ${isCleared === opt.val ? opt.color : "var(--border)"}`,
                  background: isCleared === opt.val ? `${opt.color}12` : "var(--surface-2)",
                }}
              >
                <p className="text-sm font-bold mb-0.5" style={{ color: isCleared === opt.val ? opt.color : "var(--text-muted)" }}>
                  {isCleared === opt.val ? (opt.val ? "✓ " : "⚠ ") : ""}{opt.label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Screenshot upload */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Screenshot proof
            <span className="text-xs font-normal ml-2" style={{ color: "var(--text-subtle)" }}>Upload from your follow-up app</span>
          </p>

          {screenshotUrl ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <img src={screenshotUrl} alt="Follow-up screenshot" className="w-full max-h-72 object-contain" style={{ background: "var(--surface-2)" }} />
              <button
                onClick={() => setScreenshotUrl("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
              >×</button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-xl py-10 flex flex-col items-center gap-3 transition-all hover:opacity-80"
              style={{ border: "2px dashed var(--border)", background: "var(--surface-2)", cursor: uploading ? "not-allowed" : "pointer" }}
            >
              {uploading ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Uploading…</p>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-subtle)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Click to upload screenshot</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </>
              )}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {uploadError && <p className="text-xs mt-2" style={{ color: "#e05252" }}>{uploadError}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>Notes <span className="text-xs font-normal" style={{ color: "var(--text-subtle)" }}>(optional)</span></label>
          <textarea
            rows={2}
            placeholder="Any comments about today's follow-ups…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 10, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", resize: "none" }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: isCleared ? "#5fbb46" : "#1c1d52", color: "white", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : isSubmitted ? "Update Check-in" : "Submit Check-in"}
        </button>
      </div>
    </div>
  );
}

// ─── Month calendar ───────────────────────────────────────────────────────────

function MonthCalendar({ logs, month, year }: { logs: DayLog[]; month: number; year: number }) {
  const logMap: Record<string, DayLog> = {};
  for (const l of logs) logMap[toDateKey(l.logDate)] = l;

  const days = getDaysInMonth(month, year);
  const firstDay = getFirstDay(month, year);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (d: number) => today.getDate() === d && today.getMonth() + 1 === month && today.getFullYear() === year;
  const isPast  = (d: number) => new Date(year, month - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold py-1" style={{ color: "var(--text-subtle)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const log = logMap[key];
          const past = isPast(day);
          const tod  = isToday(day);

          let bg = "var(--surface-2)";
          let color = "var(--text-subtle)";
          let dot = null;

          if (log) {
            bg = log.isCleared ? "rgba(95,187,70,0.15)" : "rgba(224,82,82,0.12)";
            color = log.isCleared ? "#5fbb46" : "#e05252";
            dot = log.isCleared ? "✓" : "!";
          } else if (past) {
            bg = "rgba(224,82,82,0.06)";
            color = "#e0525250";
          }

          return (
            <div
              key={day}
              className="relative flex flex-col items-center justify-center rounded-lg py-2"
              style={{ background: bg, border: tod ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", minHeight: 44 }}
              title={log ? `${log.isCleared ? "Cleared" : "Backlog"} — submitted ${fmtTime(log.submittedAt)}` : past ? "Not submitted" : ""}
            >
              <span className="text-xs font-bold" style={{ color: tod ? "var(--accent)" : color }}>{day}</span>
              {dot && <span style={{ fontSize: 9, color, lineHeight: 1 }}>{dot}</span>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        {[["#5fbb46","✓ Cleared"],["#e05252","⚠ Backlog"],["var(--border)","Not submitted"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: c, opacity: 0.5 }} />
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manager team overview ────────────────────────────────────────────────────

function TeamOverview({ team }: { team: TeamMember[] }) {
  const pending = team.filter((m) => !m.todayLog);
  const cleared = team.filter((m) => m.todayLog?.isCleared);
  const backlog  = team.filter((m) => m.todayLog && !m.todayLog.isCleared);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Team Today</h2>
        {[
          { label: "Cleared", count: cleared.length, color: "#5fbb46" },
          { label: "Backlog", count: backlog.length,  color: "#e05252" },
          { label: "Pending", count: pending.length,  color: "var(--text-subtle)" },
        ].map((s) => (
          <span key={s.label} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${s.color}15`, color: s.color }}>
            {s.count} {s.label}
          </span>
        ))}
      </div>

      {team.length === 0 ? (
        <p className="text-sm py-6 text-center rounded-xl" style={{ color: "var(--text-subtle)", background: "var(--surface)", border: "1px solid var(--border)" }}>
          No follow-up staff found (Sales / Customer Care / Support roles)
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {team.map((member, i) => {
            const log = member.todayLog;
            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4"
                style={{ background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: i < team.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "var(--accent)", color: "white" }}>
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{member.firstName} {member.lastName}</p>
                  <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{member.roleTitle}</p>
                </div>
                {log ? (
                  <div className="flex items-center gap-3">
                    {log.screenshotUrl && (
                      <a href={log.screenshotUrl} target="_blank" rel="noopener noreferrer">
                        <img src={log.screenshotUrl} alt="screenshot" className="w-12 h-9 rounded object-cover" style={{ border: "1px solid var(--border)" }} />
                      </a>
                    )}
                    <div className="text-right">
                      <span className="block text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: log.isCleared ? "rgba(95,187,70,0.15)" : "rgba(224,82,82,0.12)", color: log.isCleared ? "#5fbb46" : "#e05252" }}>
                        {log.isCleared ? "✓ All Clear" : "⚠ Backlog"}
                      </span>
                      <span className="text-xs mt-1 block" style={{ color: "var(--text-subtle)" }}>{fmtTime(log.submittedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(136,146,164,0.12)", color: "var(--text-subtle)" }}>Not submitted yet</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FollowUpClient({
  initialLogs,
  initialTeam,
  todayLog: initialTodayLog,
  isManager,
  staffId,
  currentMonth,
  currentYear,
}: {
  initialLogs: DayLog[];
  initialTeam: TeamMember[];
  todayLog: DayLog | null;
  isManager: boolean;
  staffId: string;
  currentMonth: number;
  currentYear: number;
}) {
  const [logs, setLogs] = useState<DayLog[]>(initialLogs);
  const [todayLog, setTodayLog] = useState<DayLog | null>(initialTodayLog);

  function handleSaved(log: DayLog) {
    setTodayLog(log);
    setLogs((prev) => {
      const filtered = prev.filter((l) => toDateKey(l.logDate) !== toDateKey(log.logDate));
      return [log, ...filtered];
    });
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Follow-up Tracker</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Daily proof that your follow-up queue is clear — no one left behind.</p>
      </div>

      {/* Manager team overview */}
      {isManager && <TeamOverview team={initialTeam} />}

      {/* Daily check-in */}
      <CheckInCard todayLog={todayLog} staffId={staffId} onSaved={handleSaved} />

      {/* Monthly calendar */}
      <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>{MONTH_NAMES[currentMonth - 1]} {currentYear}</p>
        <MonthCalendar logs={logs} month={currentMonth} year={currentYear} />
      </div>
    </div>
  );
}
