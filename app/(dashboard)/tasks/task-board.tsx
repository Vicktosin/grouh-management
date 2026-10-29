"use client";

import { useState, useMemo, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Person = { id: string; firstName: string; lastName: string };

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt?: string;
  creator: Person;
  assignee: Person;
};

type StaffOption = { id: string; name: string; role: string };

type ColumnId = "overdue" | "today" | "week" | "month" | "later";

type Column = {
  id: ColumnId;
  label: string;
  sublabel: string;
  accent: string;
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  { id: "overdue", label: "Overdue", sublabel: "Past due", accent: "#e05252" },
  { id: "today", label: "Today", sublabel: "Due today", accent: "#f0be43" },
  { id: "week", label: "This Week", sublabel: "Next 7 days", accent: "#5fbb46" },
  { id: "month", label: "This Month", sublabel: "Rest of month", accent: "#1c1d52" },
  { id: "later", label: "Later", sublabel: "No date / future", accent: "#8892a4" },
];

function getColumnId(dueDateStr: string | null): ColumnId {
  if (!dueDateStr) return "later";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDateStr);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "week";
  if (due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear()) return "month";
  return "later";
}

// ─── Priority / status helpers ────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; bg: string; color: string }> = {
  low:    { label: "Low",    bg: "rgba(95,187,70,0.12)",  color: "#5fbb46" },
  medium: { label: "Med",    bg: "rgba(240,190,67,0.15)", color: "#c99a1a" },
  high:   { label: "High",   bg: "rgba(224,82,82,0.12)",  color: "#e05252" },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; next: string }> = {
  pending:     { label: "To Do",       bg: "rgba(136,146,164,0.15)", color: "#8892a4", next: "in_progress" },
  in_progress: { label: "In Progress", bg: "rgba(240,190,67,0.15)",  color: "#c99a1a", next: "review" },
  review:      { label: "Review",      bg: "rgba(28,29,82,0.12)",    color: "#1c1d52",  next: "completed" },
  completed:   { label: "Done",        bg: "rgba(95,187,70,0.12)",   color: "#5fbb46",  next: "pending" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fullName(p: Person) {
  return `${p.firstName} ${p.lastName}`;
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  task,
  staffList,
  onSave,
  onClose,
}: {
  task: BoardTask;
  staffList: StaffOption[];
  onSave: (updated: Partial<BoardTask> & { id: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assigneeId: task.assignee.id,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      }),
    });
    const updated = await res.json();
    setSaving(false);
    onSave(updated);
    onClose();
  }

  const inp = {
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Edit Task</h2>
          <button onClick={onClose} style={{ color: "var(--text-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Title</label>
            <input style={inp} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={3} style={{ ...inp, resize: "none" as const }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Status</label>
              <select style={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Priority</label>
              <select style={inp} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Due Date</label>
            <input type="date" style={inp} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isManager,
  showAssignee,
  staffList,
  onUpdated,
}: {
  task: BoardTask;
  isManager: boolean;
  showAssignee: boolean;
  staffList: StaffOption[];
  onUpdated: (t: BoardTask) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cycling, setCycling] = useState(false);

  const priority = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
  const status = STATUS_META[task.status] ?? STATUS_META.pending;

  async function cycleStatus() {
    if (!isManager) return;
    setCycling(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: status.next }),
    });
    const updated = await res.json();
    setCycling(false);
    onUpdated(updated);
  }

  return (
    <>
      <div
        className="rounded-xl p-3 mb-2 cursor-pointer transition-all"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          opacity: task.status === "completed" ? 0.6 : 1,
        }}
        onClick={() => isManager && setEditing(true)}
      >
        <p className="text-sm font-medium leading-snug mb-2" style={{ color: "var(--text)" }}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority */}
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: priority.bg, color: priority.color }}>
            {priority.label}
          </span>

          {/* Status — clickable for managers */}
          <button
            onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
            disabled={cycling || !isManager}
            className="text-xs px-1.5 py-0.5 rounded-full font-medium transition-opacity"
            style={{
              background: status.bg,
              color: status.color,
              cursor: isManager ? "pointer" : "default",
              border: "none",
              opacity: cycling ? 0.6 : 1,
            }}
            title={isManager ? `Click to advance → ${STATUS_META[status.next]?.label}` : undefined}
          >
            {status.label}
          </button>

          {/* Due date */}
          {task.dueDate && (
            <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>
              {fmtDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee / creator row */}
        {showAssignee && (
          <p className="text-xs mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-subtle)" }}>
            {fullName(task.assignee)}
          </p>
        )}
        {!showAssignee && (
          <p className="text-xs mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-subtle)" }}>
            Assigned by {fullName(task.creator)}
          </p>
        )}
      </div>

      {editing && (
        <EditModal
          task={task}
          staffList={staffList}
          onSave={(updated) => onUpdated(updated as BoardTask)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  isManager,
  showAssignee,
  staffList,
  onUpdated,
  onAddTask,
}: {
  col: Column;
  tasks: BoardTask[];
  isManager: boolean;
  showAssignee: boolean;
  staffList: StaffOption[];
  onUpdated: (t: BoardTask) => void;
  onAddTask: (col: ColumnId) => void;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl min-w-0"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{col.label}</span>
          <span
            className="text-xs font-bold px-1.5 rounded-full"
            style={{ background: tasks.length ? col.accent : "var(--surface-3)", color: tasks.length ? "white" : "var(--text-subtle)" }}
          >
            {tasks.length}
          </span>
        </div>
        {isManager && (
          <button
            onClick={() => onAddTask(col.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-lg leading-none transition-opacity hover:opacity-70"
            style={{ color: "var(--text-subtle)" }}
            title={`Add task to ${col.label}`}
          >
            +
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="p-3 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
        {tasks.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: "var(--text-subtle)" }}>
            {col.sublabel}
          </p>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              isManager={isManager}
              showAssignee={showAssignee}
              staffList={staffList}
              onUpdated={onUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Add task quick form ──────────────────────────────────────────────────────

function AddTaskModal({
  defaultColumn,
  creatorId,
  companyId,
  staffList,
  onAdded,
  onClose,
}: {
  defaultColumn: ColumnId;
  creatorId: string;
  companyId: string;
  staffList: StaffOption[];
  onAdded: (t: BoardTask) => void;
  onClose: () => void;
}) {
  function colToDate(col: ColumnId): string {
    const d = new Date();
    if (col === "overdue" || col === "today") return d.toISOString().slice(0, 10);
    if (col === "week") {
      d.setDate(d.getDate() + 3);
      return d.toISOString().slice(0, 10);
    }
    if (col === "month") {
      d.setDate(d.getDate() + 14);
      return d.toISOString().slice(0, 10);
    }
    return "";
  }

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: staffList[0]?.id ?? "",
    priority: "medium",
    dueDate: colToDate(defaultColumn),
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, creatorId, companyId }),
    });
    const newTask = await res.json();
    setSaving(false);
    onAdded(newTask);
    onClose();
  }

  const inp = {
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Assign New Task</h2>
          <button onClick={onClose} style={{ color: "var(--text-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Task Title *</label>
            <input required style={inp} placeholder="e.g. Upload Week 3 course videos" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={2} style={{ ...inp, resize: "none" as const }} placeholder="Any extra details…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Assign To *</label>
            <select required style={inp} value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Select staff member</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Priority</label>
              <select style={inp} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Due Date</label>
              <input type="date" style={inp} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

export function TaskBoard({
  initialTasks,
  isManager,
  currentStaffId,
  creatorId,
  companyId,
  staffList,
}: {
  initialTasks: BoardTask[];
  isManager: boolean;
  currentStaffId: string;
  creatorId: string;
  companyId: string;
  staffList: StaffOption[];
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [view, setView] = useState<"mine" | "team">("mine");
  const [loading, setLoading] = useState(false);
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null);

  // Load team tasks when toggling to team view
  async function handleViewToggle(next: "mine" | "team") {
    setView(next);
    if (next === "team") {
      setLoading(true);
      const res = await fetch("/api/tasks?view=all");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setLoading(false);
    } else {
      setLoading(true);
      const res = await fetch("/api/tasks?view=mine");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setLoading(false);
    }
  }

  const filteredTasks = useMemo(() => {
    if (view === "mine") return tasks.filter((t) => t.assignee?.id === currentStaffId);
    return tasks;
  }, [tasks, view, currentStaffId]);

  // Group by column
  const columnTasks = useMemo(() => {
    const map: Record<ColumnId, BoardTask[]> = { overdue: [], today: [], week: [], month: [], later: [] };
    for (const t of filteredTasks) {
      if (t.status === "completed") continue;
      map[getColumnId(t.dueDate)].push(t);
    }
    return map;
  }, [filteredTasks]);

  const completedTasks = useMemo(() => filteredTasks.filter((t) => t.status === "completed"), [filteredTasks]);

  const onUpdated = useCallback((updated: BoardTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const onAdded = useCallback((newTask: BoardTask) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const showAssignee = view === "team";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {view === "mine" ? "Your task board" : "All team tasks"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isManager && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {(["mine", "team"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewToggle(v)}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: view === v ? "var(--accent)" : "var(--surface)",
                    color: view === v ? "white" : "var(--text-muted)",
                  }}
                >
                  {v === "mine" ? "My Tasks" : "Team View"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
          Loading…
        </div>
      )}

      {!loading && (
        <>
          {/* Board */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={columnTasks[col.id]}
                isManager={isManager}
                showAssignee={showAssignee}
                staffList={staffList}
                onUpdated={onUpdated}
                onAddTask={(colId) => setAddingToColumn(colId)}
              />
            ))}
          </div>

          {/* Completed (collapsed) */}
          {completedTasks.length > 0 && (
            <details className="mt-6">
              <summary
                className="cursor-pointer text-sm font-medium select-none"
                style={{ color: "var(--text-muted)" }}
              >
                Completed ({completedTasks.length})
              </summary>
              <div className="mt-3 grid gap-2">
                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.6 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5fbb46" strokeWidth="2.5">
                      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                    </svg>
                    <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>{t.title}</span>
                    {showAssignee && (
                      <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>{fullName(t.assignee)}</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* Add task modal */}
      {addingToColumn && (
        <AddTaskModal
          defaultColumn={addingToColumn}
          creatorId={creatorId}
          companyId={companyId}
          staffList={staffList}
          onAdded={onAdded}
          onClose={() => setAddingToColumn(null)}
        />
      )}
    </div>
  );
}
