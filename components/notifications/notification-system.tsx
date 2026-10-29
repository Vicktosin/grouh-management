"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  urgency: "low" | "normal" | "high" | "critical";
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
};

type NotifContextValue = {
  notifications: Notif[];
  unreadCount: number;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotifContext = createContext<NotifContextValue>({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  setPanelOpen: () => {},
  markRead: () => {},
  markAllRead: () => {},
});

export const useNotifications = () => useContext(NotifContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const URGENCY_STYLE: Record<string, { border: string; bg: string; icon: string; iconColor: string; barColor: string }> = {
  low:      { border: "var(--border)",    bg: "var(--surface)", icon: "ℹ", iconColor: "var(--text-subtle)", barColor: "var(--border)" },
  normal:   { border: "#1c1d52",          bg: "var(--surface)", icon: "🔔", iconColor: "#1c1d52",           barColor: "#1c1d52" },
  high:     { border: "#f0be43",          bg: "var(--surface)", icon: "⚠", iconColor: "#c99a1a",            barColor: "#f0be43" },
  critical: { border: "#e05252",          bg: "var(--surface)", icon: "🚨", iconColor: "#e05252",            barColor: "#e05252" },
};

// ─── Individual toast ─────────────────────────────────────────────────────────

function Toast({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const s = URGENCY_STYLE[notif.urgency] ?? URGENCY_STYLE.normal;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t1);
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(onDismiss, 350);
  }

  return (
    <div
      style={{
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderLeft: `4px solid ${s.barColor}`,
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        width: 340,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{s.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{notif.title}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{notif.message}</p>
      </div>
      <button onClick={dismiss} style={{ color: "var(--text-subtle)", lineHeight: 1, fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "0 2px", flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Critical modal ───────────────────────────────────────────────────────────

function CriticalModal({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 20); }, []);

  function dismiss() { setVisible(false); setTimeout(onDismiss, 300); }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: `rgba(0,0,0,${visible ? 0.65 : 0})`,
      transition: "background 0.3s",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        transform: visible ? "scale(1)" : "scale(0.85)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        background: "var(--surface)",
        border: "2px solid #e05252",
        borderRadius: 20,
        padding: "36px 32px",
        maxWidth: 440,
        width: "90vw",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(224,82,82,0.3)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
        <p style={{ fontSize: 20, fontWeight: 800, color: "#e05252", marginBottom: 10 }}>{notif.title}</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28 }}>{notif.message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={dismiss}
            style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface-2)", color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}
          >
            Dismiss
          </button>
          {notif.relatedId && (
            <button
              onClick={() => { window.location.href = "/tasks"; dismiss(); }}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#e05252", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              View Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notification panel (history drawer) ─────────────────────────────────────

function NotificationPanel({ notifications, onMarkRead, onMarkAll, onClose }: {
  notifications: Notif[];
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 20); }, []);

  function close() { setVisible(false); setTimeout(onClose, 320); }

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.3)" }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9001,
        width: 380, maxWidth: "90vw",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Notifications</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{notifications.filter(n => !n.isRead).length} unread</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onMarkAll} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
              Mark all read
            </button>
            <button onClick={close} style={{ fontSize: 22, color: "var(--text-subtle)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {notifications.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-subtle)", fontSize: 13, padding: "40px 20px" }}>No notifications yet</p>
          ) : (
            notifications.map((n) => {
              const s = URGENCY_STYLE[n.urgency] ?? URGENCY_STYLE.normal;
              return (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) onMarkRead(n.id); }}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: n.isRead ? "transparent" : "rgba(28,29,82,0.04)",
                    cursor: n.isRead ? "default" : "pointer",
                    borderLeft: `3px solid ${n.isRead ? "transparent" : s.barColor}`,
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: "var(--text)" }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: "var(--text-subtle)", flexShrink: 0 }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                  {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.barColor, marginTop: 5, flexShrink: 0 }} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [toasts, setToasts] = useState<Notif[]>([]);
  const [criticalQueue, setCriticalQueue] = useState<Notif[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const seenIds = useRef(new Set<string>());
  const didInitialCheck = useRef(false);

  async function fetchNotifications(isInitial = false) {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Notif[] = data.notifications ?? [];

      // Find brand new ones we haven't shown yet
      const fresh = incoming.filter((n) => !seenIds.current.has(n.id));
      for (const n of fresh) seenIds.current.add(n.id);

      setNotifications(incoming);

      // On initial mount, don't toast everything — only unread ones
      const toToast = isInitial
        ? fresh.filter((n) => !n.isRead && n.urgency !== "low")
        : fresh.filter((n) => !n.isRead);

      const criticals = toToast.filter((n) => n.urgency === "critical");
      const normals   = toToast.filter((n) => n.urgency !== "critical");

      if (criticals.length > 0) setCriticalQueue((q) => [...q, ...criticals]);
      if (normals.length > 0)   setToasts((t) => [...t, ...normals.slice(0, 3)]);
    } catch {}
  }

  useEffect(() => {
    // Run overdue/due-soon check on mount
    if (!didInitialCheck.current) {
      didInitialCheck.current = true;
      fetch("/api/notifications/check", { method: "POST" }).then(() => fetchNotifications(true));
    }

    // Poll every 30s for new notifications
    const interval = setInterval(() => fetchNotifications(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss normal/high toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    if (latest.urgency === "high") return; // high stays until manually dismissed
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((n) => n.id !== latest.id));
    }, 6000);
    return () => clearTimeout(t);
  }, [toasts]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const currentCritical = criticalQueue[0] ?? null;

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, panelOpen, setPanelOpen, markRead, markAllRead }}>
      {children}

      {/* Toast stack — top-right */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9500, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((n) => (
          <div key={n.id} style={{ pointerEvents: "all" }}>
            <Toast notif={n} onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== n.id))} />
          </div>
        ))}
      </div>

      {/* Critical modal */}
      {currentCritical && (
        <CriticalModal
          notif={currentCritical}
          onDismiss={() => {
            markRead(currentCritical.id);
            setCriticalQueue((q) => q.slice(1));
          }}
        />
      )}

      {/* Notification panel */}
      {panelOpen && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAll={markAllRead}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </NotifContext.Provider>
  );
}
