"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoleForm({
  companyId,
  roles,
}: {
  companyId: string;
  roles: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    level: "3",
    parentRoleId: "",
    roleType: "human",
    description: "",
    responsibilities: "",
    requirements: "",
    qualifications: "",
  });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        level: Number(form.level),
        companyId,
        responsibilities: form.responsibilities.split("\n").filter(Boolean),
        requirements: form.requirements.split("\n").filter(Boolean),
        qualifications: form.qualifications.split("\n").filter(Boolean),
        parentRoleId: form.parentRoleId || null,
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const inputStyle = {
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white" }}>
        + Add Role
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Create New Role</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-subtle)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Role Title *</label>
                <input required style={inputStyle} placeholder="e.g. Social Media Manager" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Level</label>
                  <select style={inputStyle} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    <option value="1">1 — Director</option>
                    <option value="2">2 — Management</option>
                    <option value="3">3 — Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Role Type</label>
                  <select style={inputStyle} value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}>
                    <option value="human">Human</option>
                    <option value="human-ai">Human + AI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Reports To</label>
                <select style={inputStyle} value={form.parentRoleId} onChange={(e) => setForm({ ...form, parentRoleId: e.target.value })}>
                  <option value="">None (top level)</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
                <textarea rows={2} style={{ ...inputStyle, resize: "none" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Responsibilities (one per line)</label>
                <textarea rows={4} style={{ ...inputStyle, resize: "none" }} placeholder="Define the content strategy&#10;Write content copies&#10;..." value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Requirements (one per line)</label>
                <textarea rows={3} style={{ ...inputStyle, resize: "none" }} placeholder="2+ years experience&#10;Strong writing skills&#10;..." value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Qualifications (one per line)</label>
                <textarea rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="Bachelor's degree&#10;Relevant certification&#10;..." value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving…" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
