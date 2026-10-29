"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function KPIReportForm({
  kpiId,
  staffId,
  period,
  unit,
}: {
  kpiId: string;
  staffId: string;
  period: string;
  unit: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ value: "", notes: "", periodStart: "", periodEnd: "" });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/kpis/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpiId,
        staffId,
        value: Number(form.value),
        notes: form.notes,
        periodStart: new Date(form.periodStart),
        periodEnd: new Date(form.periodEnd),
      }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ value: "", notes: "", periodStart: "", periodEnd: "" });
    router.refresh();
  }

  const inputStyle = {
    background: "var(--surface-3)", border: "1px solid var(--border)",
    color: "var(--text)", borderRadius: "8px", padding: "8px 12px",
    fontSize: "14px", width: "100%", outline: "none",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)" }}>
        + Submit Result
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Submit KPI Result</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-subtle)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Result {unit ? `(${unit})` : ""} *
                </label>
                <input required type="number" style={inputStyle} placeholder="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Period Start *</label>
                  <input required type="date" style={inputStyle} value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Period End *</label>
                  <input required type="date" style={inputStyle} value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Notes</label>
                <textarea rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="Any context or notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
