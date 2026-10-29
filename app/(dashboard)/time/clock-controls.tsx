"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClockControls({
  staffId,
  activeEntry,
}: {
  staffId: string;
  activeEntry: { id: string; clockIn: Date } | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClock() {
    setLoading(true);
    const endpoint = activeEntry ? "/api/time/clock-out" : "/api/time/clock-in";
    const body = activeEntry ? { entryId: activeEntry.id, staffId } : { staffId };

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    router.refresh();
  }

  const isClockedIn = !!activeEntry;

  function timeSince(date: Date) {
    const ms = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  }

  return (
    <div className="rounded-xl p-6 flex items-center justify-between" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Current Status</p>
        <p className="text-xl font-semibold" style={{ color: isClockedIn ? "var(--success)" : "var(--text)" }}>
          {isClockedIn ? "Clocked In" : "Not Clocked In"}
        </p>
        {isClockedIn && activeEntry && (
          <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
            Working for {timeSince(activeEntry.clockIn)}
          </p>
        )}
      </div>

      <button
        onClick={handleClock}
        disabled={loading}
        className="px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity"
        style={{
          background: isClockedIn ? "var(--danger)20" : "var(--success)20",
          color: isClockedIn ? "var(--danger)" : "var(--success)",
          border: `1px solid ${isClockedIn ? "var(--danger)40" : "var(--success)40"}`,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "…" : isClockedIn ? "Clock Out" : "Clock In"}
      </button>
    </div>
  );
}
