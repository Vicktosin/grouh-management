"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ScreenshotUpload({ staffId, companyId }: { staffId: string; companyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Record<string, string> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", source: "whatsapp", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setParsed(null);
  }

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/crm/parse-screenshot", { method: "POST", body: fd });
    const data = await res.json();
    setParsed(data);
    setForm({
      name: data.name ?? "",
      phone: data.phone ?? "",
      source: "whatsapp",
      notes: data.summary ?? "",
    });
    setLoading(false);
  }

  async function handleSave() {
    setLoading(true);
    await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigneeId: staffId, companyId }),
    });
    setLoading(false);
    setOpen(false);
    setParsed(null);
    setPreview(null);
    setFile(null);
    router.refresh();
  }

  const inputStyle = {
    background: "var(--surface-3)", border: "1px solid var(--border)",
    color: "var(--text)", borderRadius: "8px", padding: "8px 12px",
    fontSize: "14px", width: "100%", outline: "none",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        Upload Screenshot
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000080" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Upload WhatsApp Screenshot</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-subtle)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Upload area */}
            <div
              className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer mb-4"
              style={{ border: "2px dashed var(--border)", background: "var(--surface-2)" }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="1.5" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click to upload a screenshot</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>PNG, JPG supported</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {file && !parsed && (
              <button
                onClick={handleParse}
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium mb-4"
                style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Analysing with AI…" : "Analyse Screenshot"}
              </button>
            )}

            {parsed && (
              <>
                <div className="rounded-lg px-4 py-3 mb-4 text-sm" style={{ background: "var(--success)15", border: "1px solid var(--success)30", color: "var(--success)" }}>
                  AI extracted lead info — review and edit below before saving.
                </div>
                {parsed.summary && (
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-muted)" }}><strong>Summary:</strong> {parsed.summary}</p>
                )}
                {parsed.next_action && (
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--info)" }}><strong>Next action:</strong> {parsed.next_action}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
                    <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Phone</label>
                    <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
                    <textarea rows={3} style={{ ...inputStyle, resize: "none" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                  <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Saving…" : "Save Lead"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
