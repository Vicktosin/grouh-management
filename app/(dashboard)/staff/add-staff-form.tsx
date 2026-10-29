"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddStaffForm({ companyId, roles }: { companyId: string; roles: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleId: "", password: "" });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, companyId }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }
    setLoading(false);
    setOpen(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", roleId: "", password: "" });
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
        + Add Staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Add Staff Member</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-subtle)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>First Name *</label>
                  <input required style={inputStyle} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Last Name *</label>
                  <input required style={inputStyle} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email *</label>
                <input required type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Temporary Password *</label>
                <input required type="password" style={inputStyle} placeholder="They can change it after login" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Role</label>
                  <select style={inputStyle} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                    <option value="">No role yet</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--danger)15", color: "var(--danger)" }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Creating…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
