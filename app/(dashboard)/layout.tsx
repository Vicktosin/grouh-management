import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationProvider } from "@/components/notifications/notification-system";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let roleTitle: string | null = null;
  let roleLevel: number = 3;
  let newTaskCount: number = 0;
  let clockedInAt: string | null = null;

  try {
    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { title: true, level: true } } },
    });
    if (staff?.role) {
      roleTitle = staff.role.title;
      roleLevel = staff.role.level;
    }
    if (staff) {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      newTaskCount = await db.task.count({
        where: { assigneeId: staff.id, status: { not: "completed" }, createdAt: { gte: cutoff } },
      });
      const active = await db.timeEntry.findFirst({
        where: { staffId: staff.id, clockOut: null },
        select: { clockIn: true },
      });
      if (active) clockedInAt = active.clockIn.toISOString();
    }
  } catch {}

  return (
    <NotificationProvider>
      <div className="flex min-h-screen">
        <Sidebar roleTitle={roleTitle} roleLevel={roleLevel} newTaskCount={newTaskCount} clockedInAt={clockedInAt} />
        <main className="flex-1 ml-56 min-h-screen" style={{ background: "var(--background)" }}>
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}
