"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Campaigns",  href: "/marketing" },
  { label: "Channels & Performance", href: "/marketing/channels" },
  { label: "Strategy Board", href: "/marketing/strategy" },
];

export function MarketingNav() {
  const path = usePathname();
  return (
    <div className="flex gap-1 mb-7 p-1 rounded-xl w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: active ? "#1c1d52" : "transparent",
              color: active ? "white" : "var(--text-muted)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
