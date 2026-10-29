import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// POST /api/notifications/check
// Called on page load — creates any missing overdue/due-soon notifications.
// Deduplication: skips if a notification for the same relatedId+type was created in last 20h.

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ ok: false });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayAfter  = new Date(today.getTime() + 2 * 86400000);
    const cutoff20h = new Date(now.getTime() - 20 * 3600000);

    // Tasks assigned to this staff member that are not completed
    const activeTasks = await db.task.findMany({
      where: { assigneeId: staff.id, status: { not: "completed" } },
      select: { id: true, title: true, dueDate: true, priority: true },
    });

    // Recent notifications for deduplication
    const recentNotifs = await db.notification.findMany({
      where: { staffId: staff.id, createdAt: { gte: cutoff20h } },
      select: { relatedId: true, type: true },
    });
    const alreadySent = new Set(recentNotifs.map((n) => `${n.type}:${n.relatedId}`));

    type NotifInput = { staffId: string; companyId: string; type: string; urgency: string; title: string; message: string; relatedId: string };
    const toCreate: NotifInput[] = [];

    for (const task of activeTasks) {
      if (!task.dueDate) continue;

      const due = new Date(task.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const msOverdue = today.getTime() - dueDay.getTime();
      const hoursOverdue = msOverdue / 3600000;

      if (dueDay < today) {
        // Overdue
        const type = "task_overdue";
        const key  = `${type}:${task.id}`;
        if (!alreadySent.has(key)) {
          const urgency = hoursOverdue > 24 ? "critical" : "high";
          toCreate.push({
            staffId: staff.id,
            companyId: staff.companyId,
            type,
            urgency,
            title: urgency === "critical" ? "Task Critically Overdue" : "Task Overdue",
            message: `"${task.title}" was due on ${dueDay.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} and is still open.`,
            relatedId: task.id,
          });
        }
      } else if (dueDay >= today && dueDay < dayAfter) {
        // Due today or tomorrow
        const type = "task_due_soon";
        const key  = `${type}:${task.id}`;
        const isToday = dueDay.getTime() === today.getTime();
        if (!alreadySent.has(key)) {
          toCreate.push({
            staffId: staff.id,
            companyId: staff.companyId,
            type,
            urgency: "high",
            title: isToday ? "Task Due Today" : "Task Due Tomorrow",
            message: `"${task.title}" is due ${isToday ? "today" : "tomorrow"}. Make sure it's on track.`,
            relatedId: task.id,
          });
        }
      }
    }

    if (toCreate.length > 0) {
      await db.notification.createMany({ data: toCreate });
    }

    return NextResponse.json({ created: toCreate.length });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
