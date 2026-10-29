import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { RoleForm } from "./role-form";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let roles: {
    id: string; title: string; level: number; roleType: string;
    isActive: boolean; responsibilities: string[];
    _count: { staff: number };
    parent: { title: string } | null;
  }[] = [];
  let isDirector = false;

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: true },
    });

    if (staff) {
      roles = await db.role.findMany({
        where: { companyId: staff.companyId },
        include: {
          parent: { select: { title: true } },
          _count: { select: { staff: true } },
        },
        orderBy: [{ level: "asc" }, { title: "asc" }],
      });
      isDirector = staff.role ? staff.role.level === 1 : false;
    }
  } catch {}

  const levelLabel: Record<number, string> = {
    1: "Directors",
    2: "Management",
    3: "Team",
  };

  const grouped = roles.reduce<Record<number, typeof roles>>((acc, r) => {
    acc[r.level] = acc[r.level] ?? [];
    acc[r.level].push(r);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Roles</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>All positions in the organisation</p>
        </div>
        {isDirector && staff && <RoleForm companyId={staff.companyId} roles={roles.map((r) => ({ id: r.id, title: r.title }))} />}
      </div>

      {Object.entries(grouped).map(([level, items]) => (
        <section key={level} className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
            Level {level} — {levelLabel[Number(level)] ?? "Staff"}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {items.map((role) => (
              <Link
                key={role.id}
                href={`/roles/${role.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{role.title}</p>
                    {!role.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}>Inactive</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
                      {role.roleType === "human-ai" ? "Human + AI" : "Human"}
                    </span>
                  </div>
                  {role.parent && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Reports to: {role.parent.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{role._count.staff}</p>
                    <p className="text-xs" style={{ color: "var(--text-subtle)" }}>staff</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {roles.length === 0 && (
        <div className="py-20 text-center" style={{ color: "var(--text-subtle)" }}>
          <p className="text-sm">No roles defined yet.</p>
          {isDirector && <p className="text-xs mt-1">Click &quot;Add Role&quot; to get started.</p>}
        </div>
      )}
    </div>
  );
}
