"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewLeadForm({ staffId, companyId }: { staffId: string; companyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "whatsapp", notes: "" });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigneeId: staffId, companyId }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: "", phone: "", email: "", source: "whatsapp", notes: "" });
    router.refresh();
  }

  const inputStyle = {
    background: "var(--surface-3)", border: "1px solid var(--border)",
    color: "var(--text)", borderRadius: "8px", padding: "8px 12px",
    fontSize: "14px", width: "100%", outline: "none",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white" }}>
        + Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Add Lead Manually</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-subtle)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Name</label>
                <input style={inputStyle} placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Phone</label>
                  <input style={inputStyle} placeholder="+234..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Source</label>
                  <select style={inputStyle} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="ad">Ad</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                <input type="email" style={inputStyle} placeholder="optional" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Notes</label>
                <textarea rows={3} style={{ ...inputStyle, resize: "none" }} placeholder="What did they enquire about?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving…" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
