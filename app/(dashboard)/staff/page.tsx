import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { AddStaffForm } from "./add-staff-form";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let allStaff: {
    id: string; firstName: string; lastName: string; email: string;
    phone: string | null; status: string;
    role: { title: string; level: number } | null;
  }[] = [];
  let roles: { id: string; title: string }[] = [];
  let companyId = "";
  let isManager = false;

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user!.id }, include: { role: true } });
    if (staff) {
      companyId = staff.companyId;
      isManager = staff.role ? staff.role.level <= 2 : false;
      allStaff = await db.staffMember.findMany({
        where: { companyId: staff.companyId },
        include: { role: { select: { title: true, level: true } } },
        orderBy: [{ role: { level: "asc" } }, { firstName: "asc" }],
      });
      roles = await db.role.findMany({
        where: { companyId: staff.companyId, isActive: true },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      });
    }
  } catch {}

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Staff</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{allStaff.length} team member{allStaff.length !== 1 ? "s" : ""}</p>
        </div>
        {isManager && companyId && <AddStaffForm companyId={companyId} roles={roles} />}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {allStaff.map((member, i) => (
          <Link
            key={member.id}
            href={`/staff/${member.id}`}
            className="flex items-center gap-4 px-5 py-4 transition-colors"
            style={{
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
              borderBottom: i < allStaff.length - 1 ? "1px solid var(--border-subtle)" : "none",
              display: "flex",
            }}
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
              {member.firstName[0]}{member.lastName[0]}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{member.firstName} {member.lastName}</p>
              <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{member.email}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{member.role?.title ?? "No role"}</p>
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: member.status === "active" ? "var(--success)15" : "var(--surface-3)",
                color: member.status === "active" ? "var(--success)" : "var(--text-subtle)",
              }}>
                {member.status}
              </span>
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
