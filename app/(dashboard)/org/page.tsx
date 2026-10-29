import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function OrgPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let roles: {
    id: string;
    title: string;
    level: number;
    roleType: string;
    parentRoleId: string | null;
    staff: { id: string; firstName: string; lastName: string }[];
  }[] = [];

  try {
    const staffMember = await db.staffMember.findUnique({ where: { userId: user!.id } });
    if (staffMember) {
      roles = await db.role.findMany({
        where: { companyId: staffMember.companyId, isActive: true },
        include: { staff: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: [{ level: "asc" }, { title: "asc" }],
      });
    }
  } catch {}

  const level1 = roles.filter((r) => r.level === 1);
  const level2 = roles.filter((r) => r.level === 2);
  const level3 = roles.filter((r) => r.level === 3);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Organisation Chart</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Structure and reporting lines</p>
      </div>

      {/* Level 1 — Director(s) */}
      <div className="flex justify-center mb-0">
        <div className="flex flex-wrap justify-center gap-4">
          {level1.map((role) => (
            <RoleCard key={role.id} role={role} tier="top" />
          ))}
        </div>
      </div>

      {/* Connector */}
      {level2.length > 0 && (
        <div className="flex justify-center">
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
        </div>
      )}

      {/* Level 2 — Operations Manager(s) */}
      {level2.length > 0 && (
        <>
          <div className="flex justify-center mb-0">
            <div className="flex flex-wrap justify-center gap-4">
              {level2.map((role) => (
                <RoleCard key={role.id} role={role} tier="mid" />
              ))}
            </div>
          </div>

          {/* Connector to level 3 */}
          {level3.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-px h-6" style={{ background: "var(--border)" }} />
              {/* Horizontal spread line */}
              <div className="h-px w-full max-w-3xl" style={{ background: "var(--border)" }} />
              <div className="w-px h-4" style={{ background: "transparent" }} />
            </div>
          )}
        </>
      )}

      {/* Level 3 — All other roles in a responsive grid */}
      {level3.length > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
        >
          {level3.map((role) => (
            <RoleCard key={role.id} role={role} tier="base" />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  tier,
}: {
  role: {
    id: string;
    title: string;
    level: number;
    roleType: string;
    staff: { id: string; firstName: string; lastName: string }[];
  };
  tier: "top" | "mid" | "base";
}) {
  const borderColor =
    tier === "top" ? "#1c1d52" : tier === "mid" ? "var(--success)" : "var(--border)";

  const accentColor =
    tier === "top" ? "#1c1d52" : tier === "mid" ? "var(--success)" : "var(--text-subtle)";

  return (
    <Link href={`/roles/${role.id}`}>
      <div
        className="rounded-xl p-4 transition-all hover:opacity-90 hover:scale-[1.02] cursor-pointer h-full"
        style={{
          background: "var(--surface)",
          border: `1.5px solid ${borderColor}`,
          minWidth: tier === "base" ? undefined : 200,
        }}
      >
        {/* Level badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: tier === "top" ? "#1c1d5215" : tier === "mid" ? "var(--success-subtle)" : "var(--surface-2)",
              color: accentColor,
            }}
          >
            L{role.level}
          </span>
          {role.roleType === "human-ai" && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-subtle)" }}>
              + AI
            </span>
          )}
        </div>

        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
          {role.title}
        </p>

        {/* Staff */}
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {role.staff.length === 0 ? (
            <p className="text-xs italic" style={{ color: "var(--text-subtle)" }}>Vacant</p>
          ) : (
            role.staff.map((s) => (
              <p key={s.id} className="text-xs font-medium" style={{ color: accentColor }}>
                {s.firstName} {s.lastName}
              </p>
            ))
          )}
        </div>
      </div>
    </Link>
  );
}
