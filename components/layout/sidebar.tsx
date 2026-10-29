"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/components/notifications/notification-system";

// ─── Live clock widget ────────────────────────────────────────────────────────

function SidebarClock({ clockedInAt }: { clockedInAt: string | null }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const elapsed = clockedInAt ? now.getTime() - new Date(clockedInAt).getTime() : 0;
  const elapsedHrs = Math.floor(elapsed / 3600000);
  const elapsedMins = Math.floor((elapsed % 3600000) / 60000);
  const elapsedSecs = Math.floor((elapsed % 60000) / 1000);
  const elapsedStr = `${String(elapsedHrs).padStart(2, "0")}:${String(elapsedMins).padStart(2, "0")}:${String(elapsedSecs).padStart(2, "0")}`;

  const clockInTime = clockedInAt
    ? new Date(clockedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      className="mx-2 mb-2 rounded-xl px-3 py-3"
      style={{
        background: clockedInAt ? "rgba(95,187,70,0.18)" : "rgba(95,187,70,0.10)",
        border: "1px solid rgba(95,187,70,0.35)",
      }}
    >
      {/* Current time */}
      <p
        className="font-bold tabular-nums leading-none"
        style={{ fontSize: "1.35rem", color: "white", letterSpacing: "0.04em" }}
      >
        {timeStr}
      </p>

      {/* Clocked-in status */}
      {clockedInAt ? (
        <div className="mt-2">
          <p className="text-sm font-bold tabular-nums" style={{ color: "#5fbb46", letterSpacing: "0.04em" }}>
            {elapsedStr}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            in since {clockInTime}
          </p>
        </div>
      ) : (
        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Not clocked in
        </p>
      )}
    </div>
  );
}

// ─── Nav item definitions ────────────────────────────────────────────────────

const ALL_NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "org",
    label: "Organisation",
    href: "/org",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6v4" />
        <rect x="3" y="10" width="6" height="4" rx="1" />
        <rect x="15" y="10" width="6" height="4" rx="1" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    key: "roles",
    label: "Roles",
    href: "/roles",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M15 6a3 3 0 0 1 0 6" />
        <path d="M3 20a8 8 0 0 1 12 0" />
        <path d="M18 18a5 5 0 0 1 3 2" />
      </svg>
    ),
  },
  {
    key: "staff",
    label: "Staff",
    href: "/staff",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "tasks",
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "time",
    label: "Time",
    href: "/time",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    key: "kpis",
    label: "KPIs",
    href: "/kpis",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M18 17l-5-5-3 3-4-4" />
      </svg>
    ),
  },
  {
    key: "crm",
    label: "CRM",
    href: "/crm",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: "calendar",
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    key: "files",
    label: "Files",
    href: "/files",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: "marketing",
    label: "Marketing",
    href: "/marketing",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    key: "cto",
    label: "CTO Hub",
    href: "/cto",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 8h2l1 3 2-5 1 3h2" />
      </svg>
    ),
  },
  {
    key: "followup",
    label: "Follow-up",
    href: "/followup",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.18 1.03" />
        <path d="M21 3l-9 9" />
        <path d="M15 3h6v6" />
      </svg>
    ),
  },
] as const;

type NavKey = (typeof ALL_NAV_ITEMS)[number]["key"];

// ─── Role → allowed nav keys ─────────────────────────────────────────────────

function getAllowedKeys(roleTitle: string | null, roleLevel: number): NavKey[] {
  // Directors and Operations Managers see everything
  if (roleLevel <= 2) {
    return ALL_NAV_ITEMS.map((i) => i.key);
  }

  // Base pages every staff member sees
  const base: NavKey[] = ["dashboard", "tasks", "kpis", "time", "files"];

  // Content / creative roles → Calendar
  const contentRoles = [
    "Content Strategist",
    "Graphic Designer",
    "Social Media Manager",
    "Motion Animator",
    "Digital Marketing Strategist",
  ];
  if (roleTitle && contentRoles.some((r) => roleTitle.toLowerCase().includes(r.toLowerCase()))) {
    base.push("calendar");
  }

  // Marketing roles → Marketing hub
  if (roleTitle && roleTitle.toLowerCase().includes("market")) {
    base.push("marketing");
  }

  // Sales / Customer Care → CRM
  if (roleTitle && (roleTitle.toLowerCase().includes("sales") || roleTitle.toLowerCase().includes("customer care"))) {
    base.push("crm");
  }

  // Sales / Customer Care / Support → Follow-up tracker
  if (roleTitle && (
    roleTitle.toLowerCase().includes("sales") ||
    roleTitle.toLowerCase().includes("customer care") ||
    roleTitle.toLowerCase().includes("support")
  )) {
    base.push("followup");
  }

  return base;
}

// ─── Sidebar component ───────────────────────────────────────────────────────

export function Sidebar({
  roleTitle,
  roleLevel,
  newTaskCount = 0,
  clockedInAt = null,
}: {
  roleTitle: string | null;
  roleLevel: number;
  newTaskCount?: number;
  clockedInAt?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();
  const { unreadCount, setPanelOpen } = useNotifications();

  const allowedKeys = getAllowedKeys(roleTitle, roleLevel);
  const visibleItems = ALL_NAV_ITEMS.filter((item) => allowedKeys.includes(item.key));

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="flex flex-col h-screen w-56 shrink-0 fixed left-0 top-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Brand */}
      <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--success)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: "white" }}>Grouh</p>
          <p className="text-xs font-medium leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>Management</p>
        </div>
      </div>

      {/* Role badge */}
      {roleTitle && (
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{roleTitle}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                background: active ? "var(--sidebar-active-bg)" : "transparent",
                color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover-bg)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {item.icon}
              {item.label}
              {item.key === "tasks" && newTaskCount > 0 && !active && (
                <span
                  className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ background: "var(--success)", color: "white", fontSize: 10 }}
                >
                  {newTaskCount}
                </span>
              )}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Live clock widget */}
      <SidebarClock clockedInAt={clockedInAt} />

      {/* Bottom */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {/* Notification bell */}
        <button
          onClick={() => setPanelOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover-bg)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Notifications
          {unreadCount > 0 && (
            <span
              className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: "#e05252", color: "white", fontSize: 10, minWidth: 18, textAlign: "center" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover-bg)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          {theme === "light" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: pathname === "/profile" ? "var(--sidebar-active-bg)" : "transparent",
            color: pathname === "/profile" ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
          }}
          onMouseEnter={(e) => { if (pathname !== "/profile") (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover-bg)"; }}
          onMouseLeave={(e) => { if (pathname !== "/profile") (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          My Profile
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(224,82,82,0.15)"; (e.currentTarget as HTMLElement).style.color = "#ff8080"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
