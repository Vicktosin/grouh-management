import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { CompanyFeed } from "@/components/feed/company-feed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let isManager = false;
  let feedPosts: {
    id: string;
    content: string;
    type: string;
    isPinned: boolean;
    eventDate: string | null;
    createdAt: string;
    author: { id: string; firstName: string; lastName: string };
    mentions: { staffId: string; firstName: string; lastName: string }[];
  }[] = [];
  let staffList: { id: string; firstName: string; lastName: string; roleTitle?: string }[] = [];
  let myTasks: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    creator: { firstName: string; lastName: string };
  }[] = [];
  let activeTimer: { id: string; clockIn: Date } | null = null;

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: true },
    });

    if (staff) {
      isManager = (staff.role?.level ?? 3) <= 2;

      // Feed posts
      const rawPosts = await db.companyPost.findMany({
        where: { companyId: staff.companyId },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          mentions: { include: { staff: { select: { id: true, firstName: true, lastName: true } } } },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 20,
      });
      feedPosts = rawPosts.map((p) => ({
        id: p.id,
        content: p.content,
        type: p.type,
        isPinned: p.isPinned,
        eventDate: p.eventDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        author: p.author,
        mentions: p.mentions.map((m) => ({ staffId: m.staffId, firstName: m.staff.firstName, lastName: m.staff.lastName })),
      }));

      // Staff list for @mention dropdown (managers only need this)
      if (isManager) {
        const allStaff = await db.staffMember.findMany({
          where: { companyId: staff.companyId, status: "active" },
          include: { role: { select: { title: true } } },
          orderBy: { firstName: "asc" },
        });
        staffList = allStaff.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, roleTitle: s.role?.title }));
      }

      myTasks = await db.task.findMany({
        where: { assigneeId: staff.id, status: { not: "completed" } },
        include: { creator: { select: { firstName: true, lastName: true } } },
        orderBy: [{ createdAt: "desc" }, { dueDate: "asc" }],
        take: 8,
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

  const now = new Date();
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const newTaskCount = myTasks.filter((t) => t.createdAt > cutoff48h).length;

  const priorityColor: Record<string, string> = {
    high: "var(--danger)",
    medium: "var(--warning)",
    low: "var(--success)",
  };

  const priorityLabel: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Done",
  };

  const h = now.getHours();
  const greeting = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Good {greeting}, {staff.firstName}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {staff.role?.title ?? "No role assigned"} &nbsp;·&nbsp;{" "}
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {newTaskCount > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent)" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--accent)" }}
            />
            {newTaskCount} new task{newTaskCount > 1 ? "s" : ""} assigned
          </div>
        )}
      </div>

      {/* Company Feed */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Company Feed</h2>
        </div>
        <CompanyFeed
          initialPosts={feedPosts}
          isManager={isManager}
          currentStaffId={staff.id}
          staffList={staffList}
          authorName={`${staff.firstName} ${staff.lastName}`}
        />
      </div>

      {/* Stats */}
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
          sub={activeTimer ? `Since ${formatDateTime(activeTimer.clockIn)}` : "Go to Time to clock in"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          label="My Role"
          value={staff.role?.title ?? "—"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          }
        />
      </div>

      {/* Tasks */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Tasks Assigned to Me</h2>
            {newTaskCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {newTaskCount} new
              </span>
            )}
          </div>
          <Link href="/tasks" className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            View all →
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <p className="text-sm" style={{ color: "var(--text-subtle)" }}>No open tasks — you&apos;re all clear</p>
          </div>
        ) : (
          <div>
            {myTasks.map((task, i) => {
              const isNew = task.createdAt > cutoff48h;
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: i < myTasks.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                    background: isNew ? "var(--accent-subtle)" : "transparent",
                  }}
                >
                  {/* Priority dot */}
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: priorityColor[task.priority] }}
                  />

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{task.title}</p>
                      {isNew && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                          style={{ background: "var(--accent)", color: "white", fontSize: 9 }}
                        >
                          New
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{task.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {/* Assigned by */}
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-subtle)" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                        Assigned by{" "}
                        <strong style={{ color: "var(--text-muted)" }}>
                          {task.creator.firstName} {task.creator.lastName}
                        </strong>
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: task.dueDate < now ? "var(--danger)" : "var(--text-subtle)" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          Due {formatDateTime(task.dueDate)}
                          {task.dueDate < now && " · Overdue"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: task.status === "in_progress" ? "var(--info-subtle)" : "var(--surface-2)",
                        color: task.status === "in_progress" ? "var(--info)" : "var(--text-subtle)",
                      }}
                    >
                      {statusLabel[task.status]}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--surface-3)", color: priorityColor[task.priority] }}
                    >
                      {priorityLabel[task.priority]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickLink href="/time" label="Time Tracking" sub="Clock in / out"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
        <QuickLink href="/tasks" label="All Tasks" sub="View & update"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <QuickLink href="/kpis" label="My KPIs" sub="Submit results"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17l-5-5-3 3-4-4"/></svg>}
        />
        <QuickLink href="/profile" label="My Profile" sub="View details"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor, icon, sub }: {
  label: string; value: string; valueColor?: string; icon: React.ReactNode; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        {icon}
      </div>
      <p className="text-lg font-bold leading-tight" style={{ color: valueColor ?? "var(--text)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label, sub, icon }: { href: string; label: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {icon}
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
      </div>
    </Link>
  );
}
