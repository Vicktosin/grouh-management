import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let myTasks: { id: string; title: string; status: string; priority: string; dueDate: Date | null; creator: { firstName: string; lastName: string } }[] = [];
  let activeTimer: { id: string; clockIn: Date } | null = null;

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: true },
    });

    if (staff) {
      myTasks = await db.task.findMany({
        where: { assigneeId: staff.id, status: { not: "completed" } },
        include: { creator: { select: { firstName: true, lastName: true } } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      });

      activeTimer = await db.timeEntry.findFirst({
        where: { staffId: staff.id, clockOut: null },
        select: { id: true, clockIn: true },
      });
    }
  } catch {}

  if (!staff) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center mt-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--surface-2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Profile not set up</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Your account has been created but your staff profile hasn&apos;t been configured yet. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const priorityColor: Record<string, string> = {
    high: "var(--danger)",
    medium: "var(--warning)",
    low: "var(--text-subtle)",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Done",
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Good {getGreeting()}, {staff.firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {staff.role?.title ?? "No role assigned"} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Open Tasks"
          value={myTasks.length.toString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Clock Status"
          value={activeTimer ? "Clocked In" : "Not Clocked In"}
          valueColor={activeTimer ? "var(--success)" : "var(--text-muted)"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          sub={activeTimer ? `Since ${formatDateTime(activeTimer.clockIn)}` : undefined}
        />
        <StatCard
          label="Role"
          value={staff.role?.title ?? "—"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
              <path d="M12 2a5 5 0 1 0 5 5A5 5 0 0 0 12 2z" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          }
        />
      </div>

      {/* Tasks & Quick Links */}
      <div className="grid grid-cols-5 gap-6">
        {/* Tasks */}
        <div className="col-span-3 rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>My Tasks</h2>
            <Link href="/tasks" className="text-xs" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>

          {myTasks.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-subtle)" }}>No open tasks</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: priorityColor[task.priority] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text)" }}>{task.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
                      {statusLabel[task.status]}
                      {task.dueDate && ` · Due ${formatDateTime(task.dueDate)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Quick Actions</h2>
          <QuickLink href="/time" label="Time Tracking" sub="Clock in / out" />
          <QuickLink href="/tasks" label="Tasks" sub="View your assignments" />
          <QuickLink href="/kpis" label="My KPIs" sub="Submit results" />
          <QuickLink href="/profile" label="My Profile" sub="View your details" />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({
  label,
  value,
  valueColor,
  icon,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        {icon}
      </div>
      <p className="text-xl font-semibold" style={{ color: valueColor ?? "var(--text)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
