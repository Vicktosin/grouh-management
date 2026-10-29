"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function ClockControls({
  staffId,
  activeEntry,
}: {
  staffId: string;
  activeEntry: { id: string; clockIn: Date } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isClockedIn = !!activeEntry;
  const clockInTime = activeEntry ? new Date(activeEntry.clockIn) : null;

  // Elapsed since clock-in
  const elapsed = clockInTime ? now.getTime() - clockInTime.getTime() : 0;
  const elapsedHrs = Math.floor(elapsed / 3600000);
  const elapsedMins = Math.floor((elapsed % 3600000) / 60000);
  const elapsedSecs = Math.floor((elapsed % 60000) / 1000);
  const elapsedStr = `${String(elapsedHrs).padStart(2, "0")}:${String(elapsedMins).padStart(2, "0")}:${String(elapsedSecs).padStart(2, "0")}`;

  // Live current time
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  async function handleClock() {
    setLoading(true);
    const endpoint = isClockedIn ? "/api/time/clock-out" : "/api/time/clock-in";
    const body = isClockedIn ? { entryId: activeEntry!.id, staffId } : { staffId };
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Current time display */}
      <div
        className="flex flex-col items-center justify-center py-10 px-6"
        style={{ background: "var(--surface)" }}
      >
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "var(--text-subtle)" }}>
          {dateStr}
        </p>

        {/* Big live clock */}
        <p
          className="font-bold tabular-nums leading-none"
          style={{
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            color: "var(--text)",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeStr}
        </p>

        {/* Status pill */}
        <div
          className="mt-5 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: isClockedIn ? "rgba(95,187,70,0.15)" : "rgba(136,146,164,0.12)",
            color: isClockedIn ? "#5fbb46" : "var(--text-subtle)",
          }}
        >
          {isClockedIn ? "● Clocked In" : "○ Not clocked in"}
        </div>

        {/* Elapsed timer */}
        {isClockedIn && (
          <div className="mt-6 text-center">
            <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Time at work today
            </p>
            <p
              className="font-bold tabular-nums"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                color: "#5fbb46",
                letterSpacing: "0.05em",
              }}
            >
              {elapsedStr}
            </p>
            {clockInTime && (
              <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
                Clocked in at {clockInTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Big clock button */}
      <div className="px-6 pb-8 pt-6" style={{ background: "var(--surface)" }}>
        <button
          onClick={handleClock}
          disabled={loading}
          className="w-full rounded-2xl font-bold text-xl transition-all active:scale-95"
          style={{
            padding: "22px 0",
            fontSize: "1.25rem",
            letterSpacing: "0.02em",
            background: isClockedIn
              ? "linear-gradient(135deg, #e05252 0%, #c03030 100%)"
              : "linear-gradient(135deg, #5fbb46 0%, #3d9a2d 100%)",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: isClockedIn
              ? "0 8px 24px rgba(224,82,82,0.35)"
              : "0 8px 24px rgba(95,187,70,0.35)",
          }}
        >
          {loading ? (
            "…"
          ) : isClockedIn ? (
            <span className="flex items-center justify-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
                <rect x="6" y="6" width="4" height="12" rx="1.5" />
                <rect x="14" y="6" width="4" height="12" rx="1.5" />
              </svg>
              Clock Out
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Clock In
            </span>
          )}
        </button>

        {!isClockedIn && (
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-subtle)" }}>
            Tap to start tracking your hours
          </p>
        )}
        {isClockedIn && (
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-subtle)" }}>
            Tap to end your session and save your hours
          </p>
        )}
      </div>
    </div>
  );
}
