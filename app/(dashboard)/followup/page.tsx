import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FollowUpClient } from "./followup-client";

export default async function FollowUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const staff = await db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true } } },
  });
  if (!staff) redirect("/login");

  const isManager = (staff.role?.level ?? 3) <= 2;

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 1));

  // Personal logs for this month
  const rawLogs = await db.followUpLog.findMany({
    where: { staffId: staff.id, logDate: { gte: start, lt: end } },
    orderBy: { logDate: "desc" },
  });

  const logs = rawLogs.map((l) => ({
    id: l.id,
    logDate: l.logDate.toISOString(),
    isCleared: l.isCleared,
    screenshotUrl: l.screenshotUrl,
    notes: l.notes,
    submittedAt: l.submittedAt.toISOString(),
  }));

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayLog = logs.find((l) => l.logDate.slice(0, 10) === today.toISOString().slice(0, 10)) ?? null;

  // Manager team view — find all Sales/Customer Care/Support staff + today's log
  let teamToday: {
    id: string;
    firstName: string;
    lastName: string;
    roleTitle: string;
    todayLog: typeof todayLog;
  }[] = [];

  if (isManager) {
    const tomorrow = new Date(today.getTime() + 86400000);
    const followUpRoles = ["sales", "customer care", "support"];
    const followUpStaff = await db.staffMember.findMany({
      where: {
        companyId: staff.companyId,
        status: "active",
        role: {
          OR: followUpRoles.map((r) => ({ title: { contains: r, mode: "insensitive" as const } })),
        },
      },
      include: {
        role: { select: { title: true } },
        followUpLogs: {
          where: { logDate: { gte: today, lt: tomorrow } },
          take: 1,
        },
      },
    });

    teamToday = followUpStaff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      roleTitle: s.role?.title ?? "",
      todayLog: s.followUpLogs[0]
        ? {
            id: s.followUpLogs[0].id,
            logDate: s.followUpLogs[0].logDate.toISOString(),
            isCleared: s.followUpLogs[0].isCleared,
            screenshotUrl: s.followUpLogs[0].screenshotUrl,
            notes: s.followUpLogs[0].notes,
            submittedAt: s.followUpLogs[0].submittedAt.toISOString(),
          }
        : null,
    }));
  }

  return (
    <FollowUpClient
      initialLogs={logs}
      initialTeam={teamToday}
      todayLog={todayLog}
      isManager={isManager}
      staffId={staff.id}
      currentMonth={month}
      currentYear={year}
    />
  );
}
