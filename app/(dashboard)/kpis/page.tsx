import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { KPIReportForm } from "./kpi-report-form";

export default async function KPIsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let kpis: {
    id: string; name: string; description: string | null;
    measurementPeriod: string; targetValue: number; unit: string | null;
    reports: { id: string; value: number; periodStart: Date; periodEnd: Date; notes: string | null; submittedAt: Date }[];
  }[] = [];

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user!.id }, include: { role: true } });
    if (staff?.roleId) {
      kpis = await db.kPI.findMany({
        where: { roleId: staff.roleId },
        include: {
          reports: {
            where: { staffId: staff.id },
            orderBy: { submittedAt: "desc" },
            take: 3,
          },
        },
      });
    }
  } catch {}

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>My KPIs</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Key performance indicators for your role</p>
      </div>

      {kpis.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--text-subtle)" }}>
          <p className="text-sm">No KPIs have been set for your role yet.</p>
          <p className="text-xs mt-1">Your manager will define them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {kpis.map((kpi) => {
            const latest = kpi.reports[0];
            const pct = latest ? Math.min(100, Math.round((latest.value / kpi.targetValue) * 100)) : null;
            return (
              <div key={kpi.id} className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{kpi.name}</h2>
                    {kpi.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{kpi.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Target: {kpi.targetValue}{kpi.unit ? ` ${kpi.unit}` : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                      {kpi.measurementPeriod === "weekly" ? "Weekly" : "Monthly"}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {pct !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                        Last: {latest?.value}{kpi.unit ? ` ${kpi.unit}` : ""}
                      </span>
                      <span className="text-xs font-medium" style={{ color: pct >= 100 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--danger)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--danger)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Recent reports */}
                {kpi.reports.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {kpi.reports.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                        <span style={{ color: "var(--text-muted)" }}>{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</span>
                        <span className="font-medium" style={{ color: "var(--text)" }}>{r.value}{kpi.unit ? ` ${kpi.unit}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}

                {staff && <KPIReportForm kpiId={kpi.id} staffId={staff.id} period={kpi.measurementPeriod} unit={kpi.unit} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
