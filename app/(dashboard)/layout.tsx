import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let roleTitle: string | null = null;
  let roleLevel: number = 3;

  try {
    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { title: true, level: true } } },
    });
    if (staff?.role) {
      roleTitle = staff.role.title;
      roleLevel = staff.role.level;
    }
  } catch {}

  return (
    <div className="flex min-h-screen">
      <Sidebar roleTitle={roleTitle} roleLevel={roleLevel} />
      <main className="flex-1 ml-56 min-h-screen" style={{ background: "var(--background)" }}>
        {children}
      </main>
    </div>
  );
}
