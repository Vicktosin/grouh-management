import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: {
        role: {
          include: { parent: { select: { title: true } } },
        },
      },
    });
  } catch {}

  if (!staff) {
    return (
      <div className="p-8">
        <div className="py-20 text-center" style={{ color: "var(--text-subtle)" }}>
          <p className="text-sm">Profile not configured yet. Contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your account and role details</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
            {staff.firstName[0]}{staff.lastName[0]}
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{staff.firstName} {staff.lastName}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{staff.role?.title ?? "No role assigned"}</p>
            <span className="text-xs px-2 py-0.5 rounded mt-1 inline-block" style={{
              background: staff.status === "active" ? "var(--success)15" : "var(--surface-3)",
              color: staff.status === "active" ? "var(--success)" : "var(--text-subtle)",
            }}>
              {staff.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem" }}>
          <Field label="Email" value={staff.email} />
          <Field label="Phone" value={staff.phone ?? "—"} />
          <Field label="Member since" value={formatDate(staff.createdAt)} />
          {staff.role?.parent && <Field label="Reports to" value={staff.role.parent.title} />}
        </div>
      </div>

      {/* Role description */}
      {staff.role && (
        <div className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Role: {staff.role.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
              {staff.role.roleType === "human-ai" ? "Human + AI" : "Human"}
            </span>
          </div>

          {staff.role.description && (
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{staff.role.description}</p>
          )}

          {staff.role.responsibilities.length > 0 && (
            <Section title="Responsibilities" items={staff.role.responsibilities} />
          )}
          {staff.role.requirements.length > 0 && (
            <Section title="Requirements" items={staff.role.requirements} />
          )}
          {staff.role.qualifications.length > 0 && (
            <Section title="Qualifications" items={staff.role.qualifications} />
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-subtle)" }}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
