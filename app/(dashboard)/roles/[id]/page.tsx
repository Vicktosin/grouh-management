import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditRoleForm } from "./edit-role-form";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentStaff = null;
  let role = null;

  try {
    currentStaff = await db.staffMember.findUnique({ where: { userId: user!.id }, include: { role: true } });
    role = await db.role.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, title: true } },
        children: { select: { id: true, title: true } },
        staff: { select: { id: true, firstName: true, lastName: true, status: true } },
        kpis: true,
      },
    });
  } catch {}

  if (!role) return notFound();

  const isDirector = currentStaff?.role ? currentStaff.role.level === 1 : false;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/roles" className="text-sm" style={{ color: "var(--text-muted)" }}>← Back to Roles</Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>{role.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
              {role.roleType === "human-ai" ? "Human + AI" : "Human"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              Level {role.level}
            </span>
            {!role.isActive && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}>Inactive</span>
            )}
          </div>
        </div>
        {isDirector && (
          <EditRoleForm
            role={{
              id: role.id,
              title: role.title,
              level: role.level,
              roleType: role.roleType,
              description: role.description ?? "",
              responsibilities: role.responsibilities,
              requirements: role.requirements,
              qualifications: role.qualifications,
              parentRoleId: role.parent?.id ?? "",
            }}
          />
        )}
      </div>

      {/* Reporting */}
      {(role.parent || role.children.length > 0) && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Reporting Structure</h2>
          {role.parent && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Reports to:</span>
              <Link href={`/roles/${role.parent.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--accent-hover)" }}>{role.parent.title}</Link>
            </div>
          )}
          {role.children.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Manages:</span>
              <div className="flex gap-2 flex-wrap">
                {role.children.map((c: { id: string; title: string }) => (
                  <Link key={c.id} href={`/roles/${c.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--info)" }}>{c.title}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {role.description && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{role.description}</p>
        </div>
      )}

      {/* Responsibilities */}
      {role.responsibilities.length > 0 && (
        <Section title="Responsibilities" items={role.responsibilities} />
      )}
      {role.requirements.length > 0 && (
        <Section title="Requirements" items={role.requirements} />
      )}
      {role.qualifications.length > 0 && (
        <Section title="Qualifications" items={role.qualifications} />
      )}

      {/* Current staff */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
          Current Staff <span className="font-normal text-xs ml-1" style={{ color: "var(--text-muted)" }}>({role.staff.length})</span>
        </h2>
        {role.staff.length === 0 ? (
          <p className="text-sm py-4 text-center rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-subtle)" }}>
            Position vacant
          </p>
        ) : (
          <div className="space-y-2">
            {role.staff.map((s: { id: string; firstName: string; lastName: string; status: string }) => (
              <Link key={s.id} href={`/staff/${s.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <span className="text-sm" style={{ color: "var(--text)" }}>{s.firstName} {s.lastName}</span>
                <span className="ml-auto text-xs" style={{ color: s.status === "active" ? "var(--success)" : "var(--text-subtle)" }}>{s.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl p-5 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-subtle)" }}>{title}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
