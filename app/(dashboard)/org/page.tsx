import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";

type RoleNode = {
  id: string;
  title: string;
  level: number;
  roleType: string;
  children: RoleNode[];
  staff: { id: string; firstName: string; lastName: string }[];
};

export default async function OrgPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let roles: {
    id: string; title: string; level: number; roleType: string; parentRoleId: string | null;
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

  // Build tree
  const map = new Map<string, RoleNode>();
  roles.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: RoleNode[] = [];
  map.forEach((node) => {
    const role = roles.find((r) => r.id === node.id);
    if (role?.parentRoleId && map.has(role.parentRoleId)) {
      map.get(role.parentRoleId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Organisation Chart</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Structure and reporting lines</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {roots.map((node) => <OrgNode key={node.id} node={node} />)}
      </div>
    </div>
  );
}

function OrgNode({ node }: { node: RoleNode }) {
  const levelColor: Record<number, string> = {
    1: "var(--accent)",
    2: "var(--info)",
    3: "var(--text-muted)",
  };

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <Link href={`/roles/${node.id}`}>
        <div
          className="rounded-xl px-5 py-4 text-center min-w-48 cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: "var(--surface)", border: `1px solid ${levelColor[node.level] ?? "var(--border)"}` }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{node.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
            {node.roleType === "human-ai" ? "Human + AI" : "Human"}
          </p>
          {node.staff.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {node.staff.map((s) => (
                <p key={s.id} className="text-xs" style={{ color: levelColor[node.level] ?? "var(--text-muted)" }}>
                  {s.firstName} {s.lastName}
                </p>
              ))}
            </div>
          )}
          {node.staff.length === 0 && (
            <p className="text-xs mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-subtle)" }}>
              Vacant
            </p>
          )}
        </div>
      </Link>

      {/* Children */}
      {node.children.length > 0 && (
        <>
          {/* Connector line */}
          <div className="w-px h-6" style={{ background: "var(--border)" }} />
          <div className="flex items-start gap-8">
            {node.children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                {node.children.length > 1 && (
                  <div className="w-px h-4" style={{ background: "var(--border)" }} />
                )}
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
