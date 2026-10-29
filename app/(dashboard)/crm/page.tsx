import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDate, LEAD_STATUS } from "@/lib/utils";
import Link from "next/link";
import { NewLeadForm } from "./new-lead-form";
import { ScreenshotUpload } from "./screenshot-upload";

export default async function CRMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let leads: {
    id: string; name: string | null; phone: string | null; email: string | null;
    source: string | null; status: string; createdAt: Date;
    _count: { interactions: number };
  }[] = [];

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user!.id } });
    if (staff) {
      leads = await db.lead.findMany({
        where: { companyId: staff.companyId },
        include: { _count: { select: { interactions: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {}

  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>CRM</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Lead management and follow-up tracking</p>
        </div>
        <div className="flex gap-3">
          {staff && <ScreenshotUpload staffId={staff.id} companyId={staff.companyId} />}
          {staff && <NewLeadForm staffId={staff.id} companyId={staff.companyId} />}
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {Object.entries(LEAD_STATUS).map(([key, { label, color }]) => (
          <div key={key} className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{statusCounts[key] ?? 0}</p>
            <p className="text-xs mt-0.5" style={{ color: color.split(" ")[0] }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Leads table */}
      {leads.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--text-subtle)" }}>
          <p className="text-sm">No leads yet. Upload a WhatsApp screenshot or add one manually.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {["Contact", "Phone", "Source", "Status", "Touches", "Added"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const status = LEAD_STATUS[lead.status as keyof typeof LEAD_STATUS];
                return (
                  <tr
                    key={lead.id}
                    style={{
                      background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      borderBottom: i < leads.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${lead.id}`} className="font-medium hover:underline" style={{ color: "var(--accent-hover)" }}>
                        {lead.name ?? "Unknown"}
                      </Link>
                      {lead.email && <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{lead.phone ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{lead.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: status?.color.split(" ")[1], color: status?.color.split(" ")[0] }}>
                        {status?.label ?? lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: lead._count.interactions >= 3 ? "var(--success)" : "var(--text-muted)" }}>
                      {lead._count.interactions}/3
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-subtle)" }}>{formatDate(lead.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
