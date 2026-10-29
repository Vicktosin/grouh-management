"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Person = { id: string; firstName: string; lastName: string };
type TaskRef = { id: string; title: string; status: string };

export type FileItem = {
  id: string;
  title: string;
  description: string | null;
  driveUrl: string;
  fileType: string;
  driveFileId: string | null;
  folderId: string | null;
  createdAt: string;
  uploadedBy: Person;
  taskLinks: { task: TaskRef }[];
};

export type FolderItem = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

type TaskOption = { id: string; title: string };

// ─── Drive URL parser ─────────────────────────────────────────────────────────

function parseDriveUrl(url: string): { fileType: string; driveFileId: string | null } {
  try {
    if (url.includes("docs.google.com/document")) return { fileType: "doc", driveFileId: extractId(url) };
    if (url.includes("docs.google.com/spreadsheets")) return { fileType: "sheet", driveFileId: extractId(url) };
    if (url.includes("docs.google.com/presentation")) return { fileType: "slide", driveFileId: extractId(url) };
    if (url.includes("drive.google.com/drive/folders")) return { fileType: "folder-link", driveFileId: extractFolderId(url) };
    if (url.includes("drive.google.com/file/d/")) return { fileType: "file", driveFileId: extractId(url) };
    if (url.includes("drive.google.com/open?id=")) {
      const id = new URL(url).searchParams.get("id");
      return { fileType: "file", driveFileId: id };
    }
  } catch {}
  return { fileType: "file", driveFileId: null };
}

function extractId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function thumbnailUrl(driveFileId: string | null): string | null {
  if (!driveFileId) return null;
  return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`;
}

// ─── File type metadata ───────────────────────────────────────────────────────

const FILE_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  doc: {
    label: "Doc",
    color: "#4285f4",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  sheet: {
    label: "Sheet",
    color: "#0f9d58",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  slide: {
    label: "Slides",
    color: "#f4b400",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M10 9l5 3-5 3V9z" />
      </svg>
    ),
  },
  video: {
    label: "Video",
    color: "#db4437",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
  },
  image: {
    label: "Image",
    color: "#9c27b0",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  pdf: {
    label: "PDF",
    color: "#e05252",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM15 13h2M15 16h2" />
      </svg>
    ),
  },
  "folder-link": {
    label: "Folder",
    color: "#f0be43",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  file: {
    label: "File",
    color: "#8892a4",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
};

function getTypeMeta(type: string) {
  return FILE_TYPE_META[type] ?? FILE_TYPE_META.file;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Add file modal ───────────────────────────────────────────────────────────

function AddFileModal({
  folders,
  taskOptions,
  onAdded,
  onClose,
}: {
  folders: FolderItem[];
  taskOptions: TaskOption[];
  onAdded: (file: FileItem) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => (url ? parseDriveUrl(url) : { fileType: "file", driveFileId: null }), [url]);
  const thumb = thumbnailUrl(parsed.driveFileId);
  const typeMeta = getTypeMeta(parsed.fileType);

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !title) return;
    setSaving(true);
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "file",
        title,
        description,
        driveUrl: url,
        fileType: parsed.fileType,
        driveFileId: parsed.driveFileId,
        folderId: folderId || null,
        taskIds: selectedTaskIds,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.file) { onAdded(data.file); onClose(); }
  }

  const inp = {
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000088" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Add Drive File</h2>
          <button onClick={onClose} style={{ color: "var(--text-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL field */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Google Drive URL *</label>
            <input required style={inp} placeholder="Paste your Google Drive link here…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>

          {/* Auto-detected type + thumbnail preview */}
          {url && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeMeta.color}20`, color: typeMeta.color }}>
                {typeMeta.icon}
              </span>
              <div>
                <p className="text-xs font-semibold" style={{ color: typeMeta.color }}>{typeMeta.label} detected</p>
                {thumb && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Thumbnail will load from Drive</p>
                )}
              </div>
              {thumb && (
                <img src={thumb} alt="" className="ml-auto w-14 h-10 rounded object-cover" style={{ border: "1px solid var(--border)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Title *</label>
            <input required style={inp} placeholder="e.g. Q4 Brand Guidelines" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={2} style={{ ...inp, resize: "none" as const }} placeholder="What is this file? Who needs it? What is it used for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {folders.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Folder (optional)</label>
              <select style={inp} value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                <option value="">No folder</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Link to tasks */}
          {taskOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Link to Tasks (optional)</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {taskOptions.map((t) => {
                  const selected = selectedTaskIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTask(t.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: selected ? "var(--accent)" : "var(--surface-2)",
                        color: selected ? "white" : "var(--text-muted)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      {t.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Add File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add folder modal ─────────────────────────────────────────────────────────

function AddFolderModal({ onAdded, onClose }: { onAdded: (f: FolderItem) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#5fbb46");
  const [saving, setSaving] = useState(false);

  const COLORS = ["#5fbb46", "#1c1d52", "#f0be43", "#4285f4", "#db4437", "#9c27b0", "#8892a4"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "folder", name, color }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.folder) { onAdded(data.folder); onClose(); }
  }

  const inp = { background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", width: "100%", outline: "none" } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#00000088" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>New Folder</h2>
          <button onClick={onClose} style={{ color: "var(--text-subtle)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Folder Name *</label>
            <input required style={inp} placeholder="e.g. Brand Assets" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Colour</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{ background: c, border: color === c ? "3px solid white" : "2px solid transparent", transform: color === c ? "scale(1.2)" : "scale(1)", boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "…" : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── File card ────────────────────────────────────────────────────────────────

function FileCard({ file, isManager, onDeleted }: { file: FileItem; isManager: boolean; onDeleted: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const thumb = file.driveFileId ? thumbnailUrl(file.driveFileId) : null;
  const typeMeta = getTypeMeta(file.fileType);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Remove this file from the hub?")) return;
    setDeleting(true);
    await fetch(`/api/files?id=${file.id}&type=file`, { method: "DELETE" });
    onDeleted(file.id);
  }

  return (
    <a
      href={file.driveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-36 flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
        {thumb && !imgError ? (
          <img src={thumb} alt={file.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span style={{ color: typeMeta.color, opacity: 0.5, transform: "scale(2.5)" }}>{typeMeta.icon}</span>
        )}
        {/* Type badge */}
        <span
          className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${typeMeta.color}22`, color: typeMeta.color, backdropFilter: "blur(4px)" }}
        >
          {typeMeta.label}
        </span>
        {isManager && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(224,82,82,0.85)", color: "white" }}
            title="Remove"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{file.title}</p>
        {file.description && (
          <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>{file.description}</p>
        )}

        {/* Task chips */}
        {file.taskLinks.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.taskLinks.slice(0, 2).map(({ task }) => (
              <span key={task.id} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}>
                {task.title.length > 20 ? task.title.slice(0, 20) + "…" : task.title}
              </span>
            ))}
            {file.taskLinks.length > 2 && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-subtle)" }}>
                +{file.taskLinks.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs mt-2" style={{ color: "var(--text-subtle)" }}>
          {file.uploadedBy.firstName} {file.uploadedBy.lastName} · {fmtDate(file.createdAt)}
        </p>
      </div>
    </a>
  );
}

// ─── Main hub ─────────────────────────────────────────────────────────────────

export function FileHub({
  initialFiles,
  initialFolders,
  taskOptions,
  isManager,
}: {
  initialFiles: FileItem[];
  initialFolders: FolderItem[];
  taskOptions: TaskOption[];
  isManager: boolean;
}) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [addingFile, setAddingFile] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [search, setSearch] = useState("");

  const displayed = useMemo(() => {
    let list = files;
    if (activeFolderId) list = list.filter((f) => f.folderId === activeFolderId);
    if (search) list = list.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()) || f.description?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [files, activeFolderId, search]);

  const folderFileCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of files) { if (f.folderId) map[f.folderId] = (map[f.folderId] ?? 0) + 1; }
    return map;
  }, [files]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Files</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Shared Drive links — organised, described, linked to tasks</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button onClick={() => setAddingFolder(true)} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              + Folder
            </button>
            <button onClick={() => setAddingFile(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "white" }}>
              + Add File
            </button>
          </div>
        )}
      </div>

      {/* Folder tabs */}
      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setActiveFolderId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeFolderId === null ? "var(--accent)" : "var(--surface)",
              color: activeFolderId === null ? "white" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            All files
            <span className="text-xs opacity-70">{files.length}</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id === activeFolderId ? null : folder.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeFolderId === folder.id ? folder.color : "var(--surface)",
                color: activeFolderId === folder.id ? "white" : "var(--text-muted)",
                border: `1px solid ${activeFolderId === folder.id ? folder.color : "var(--border)"}`,
              }}
            >
              <span style={{ color: activeFolderId === folder.id ? "white" : folder.color }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              {folder.name}
              <span className="text-xs opacity-70">{folderFileCounts[folder.id] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <input
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: "10px",
            padding: "9px 14px",
            fontSize: "14px",
            width: "100%",
            maxWidth: 340,
            outline: "none",
          }}
        />
      </div>

      {/* File grid */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {search ? "No files match your search" : "No files yet"}
          </p>
          {isManager && !search && (
            <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Click "+ Add File" to share a Google Drive link</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {displayed.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isManager={isManager}
              onDeleted={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            />
          ))}
        </div>
      )}

      {addingFile && (
        <AddFileModal
          folders={folders}
          taskOptions={taskOptions}
          onAdded={(file) => { setFiles((prev) => [file, ...prev]); }}
          onClose={() => setAddingFile(false)}
        />
      )}
      {addingFolder && (
        <AddFolderModal
          onAdded={(folder) => setFolders((prev) => [...prev, folder])}
          onClose={() => setAddingFolder(false)}
        />
      )}
    </div>
  );
}
