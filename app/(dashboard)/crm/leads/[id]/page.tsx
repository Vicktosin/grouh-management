import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDateTime, LEAD_STATUS } from "@/lib/utils";
import { notFound } from "next/navigation";
import { LeadActions } from "./lead-actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let lead = null;

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user!.id } });
    lead = await db.lead.findUnique({
      where: { id },
      include: {
        interactions: { orderBy: { createdAt: "desc" } },
        screenshots: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    });
  } catch {}

  if (!lead) return notFound();

  const status = LEAD_STATUS[lead.status as keyof typeof LEAD_STATUS];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <a href="/crm" className="text-sm" style={{ color: "var(--text-muted)" }}>← Back to CRM</a>
      </div>

      {/* Lead header */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>{lead.name ?? "Unknown Contact"}</h1>
            <div className="flex items-center gap-3 mt-1">
              {lead.phone && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{lead.phone}</span>}
              {lead.email && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{lead.email}</span>}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: status?.color.split(" ")[1], color: status?.color.split(" ")[0] }}>
            {status?.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Source</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>{lead.source ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Assigned To</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>{lead.assignee.firstName} {lead.assignee.lastName}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Added</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>{formatDateTime(lead.createdAt)}</p>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-subtle)" }}>Notes</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {staff && <LeadActions leadId={lead.id} staffId={staff.id} currentStatus={lead.status} />}

      {/* Interactions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Interactions
            <span className="ml-2 text-xs font-normal" style={{ color: lead.interactions.length >= 3 ? "var(--success)" : "var(--text-muted)" }}>
              {lead.interactions.length}/3 touches
            </span>
          </h2>
        </div>

        {lead.interactions.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-subtle)" }}>No interactions logged yet</p>
        ) : (
          <div className="space-y-3">
            {lead.interactions.map((interaction: { id: string; type: string; notes: string | null; outcome: string | null; createdAt: Date }) => (
              <div key={interaction.id} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                    {interaction.type}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-subtle)" }}>{formatDateTime(interaction.createdAt)}</span>
                </div>
                {interaction.notes && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{interaction.notes}</p>}
                {interaction.outcome && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Outcome: {interaction.outcome}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
