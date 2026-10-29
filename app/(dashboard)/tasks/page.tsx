import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDate, TASK_STATUS, TASK_PRIORITY } from "@/lib/utils";
import { TaskForm } from "./task-form";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let myTasks: {
    id: string; title: string; description: string | null;
    status: string; priority: string; dueDate: Date | null;
    creator: { firstName: string; lastName: string };
  }[] = [];
  let allStaff: { id: string; firstName: string; lastName: string; role: { title: string } | null }[] = [];
  let isManager = false;
  let teamTasks: typeof myTasks = [];

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: true },
    });

    if (staff) {
      isManager = staff.role ? staff.role.level <= 2 : false;

      myTasks = await db.task.findMany({
        where: { assigneeId: staff.id },
        include: { creator: { select: { firstName: true, lastName: true } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      });

      if (isManager) {
        allStaff = await db.staffMember.findMany({
          where: { companyId: staff.companyId, status: "active" },
          include: { role: { select: { title: true } } },
          orderBy: { firstName: "asc" },
        });
        teamTasks = await db.task.findMany({
          where: { creatorId: staff.id },
          include: { creator: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
      }
    }
  } catch {}

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your assigned tasks and to-dos</p>
        </div>
        {isManager && staff && (
          <TaskForm
            creatorId={staff.id}
            companyId={staff.companyId}
            staffList={allStaff.map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              role: s.role?.title ?? "",
            }))}
          />
        )}
      </div>

      {/* My Tasks */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
          My Tasks <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>({myTasks.length})</span>
        </h2>
        <TaskTable tasks={myTasks} />
      </section>

      {/* Tasks I created */}
      {isManager && teamTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Tasks I Assigned</h2>
          <TaskTable tasks={teamTasks} />
        </section>
      )}
    </div>
  );
}

type TaskRow = {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: Date | null;
  creator: { firstName: string; lastName: string };
};

function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl py-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-subtle)" }}>No tasks</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {tasks.map((task, i) => {
        const status = TASK_STATUS[task.status as keyof typeof TASK_STATUS];
        const priority = TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY];
        return (
          <div
            key={task.id}
            className="flex items-center gap-4 px-5 py-4"
            style={{
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
              borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{task.title}</p>
              {task.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{task.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {task.dueDate && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                  {formatDate(task.dueDate)}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-3)", color: priority?.color.split(" ")[0].replace("text-", "") }}>
                {priority?.label}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: status?.color.split(" ")[1] ?? "var(--surface-3)", color: status?.color.split(" ")[0] }}>
                {status?.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
