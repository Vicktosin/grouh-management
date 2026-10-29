import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { TaskBoard, type BoardTask } from "./task-board";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let isManager = false;
  let initialTasks: BoardTask[] = [];
  let allStaff: { id: string; firstName: string; lastName: string; role: { title: string } | null }[] = [];

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: true },
    });

    if (staff) {
      isManager = (staff.role?.level ?? 3) <= 2;

      const raw = await db.task.findMany({
        where: { assigneeId: staff.id, status: { not: "completed" } },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      });

      initialTasks = raw.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));

      if (isManager) {
        allStaff = await db.staffMember.findMany({
          where: { companyId: staff.companyId, status: "active" },
          include: { role: { select: { title: true } } },
          orderBy: { firstName: "asc" },
        });
      }
    }
  } catch {}

  if (!staff) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--text-muted)" }}>Profile not found.</p>
      </div>
    );
  }

  const staffList = allStaff.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    role: s.role?.title ?? "",
  }));

  return (
    <div className="p-6 lg:p-8 max-w-full">
      <TaskBoard
        initialTasks={initialTasks}
        isManager={isManager}
        currentStaffId={staff.id}
        creatorId={staff.id}
        companyId={staff.companyId}
        staffList={staffList}
      />
    </div>
  );
}
