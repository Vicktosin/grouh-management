import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ClockControls } from "./clock-controls";

export default async function TimePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let recentEntries: { id: string; clockIn: Date; clockOut: Date | null; notes: string | null }[] = [];
  let activeEntry: { id: string; clockIn: Date } | null = null;

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user!.id } });
    if (staff) {
      recentEntries = await db.timeEntry.findMany({
        where: { staffId: staff.id },
        orderBy: { clockIn: "desc" },
        take: 10,
        select: { id: true, clockIn: true, clockOut: true, notes: true },
      });
      activeEntry = await db.timeEntry.findFirst({
        where: { staffId: staff.id, clockOut: null },
        select: { id: true, clockIn: true },
      });
    }
  } catch {}

  function getDuration(clockIn: Date, clockOut: Date | null) {
    const end = clockOut ?? new Date();
    const ms = end.getTime() - new Date(clockIn).getTime();
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Time Tracking</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Track your hours — clock in when you start, clock out when you finish.</p>
      </div>

      {staff && <ClockControls staffId={staff.id} activeEntry={activeEntry ? { id: activeEntry.id, clockIn: activeEntry.clockIn } : null} />}

      {/* Recent entries */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Recent Entries</h2>

        {recentEntries.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-subtle)" }}>No entries yet</p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-muted)" }}>Clock In</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-muted)" }}>Clock Out</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-muted)" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    style={{
                      background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      borderBottom: i < recentEntries.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--text)" }}>{formatDateTime(entry.clockIn)}</td>
                    <td className="px-4 py-3" style={{ color: entry.clockOut ? "var(--text)" : "var(--success)" }}>
                      {entry.clockOut ? formatDateTime(entry.clockOut) : "Active"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {getDuration(entry.clockIn, entry.clockOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
