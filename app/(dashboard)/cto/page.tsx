import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { CTOHub } from "./cto-hub";

export default async function CTOPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const staff = await db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true } } },
  });
  if (!staff) redirect("/login");

  // Only managers / directors can access CTO hub
  const isManager = (staff.role?.level ?? 3) <= 2;
  if (!isManager) redirect("/dashboard");

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 86400000);

  const [rawFocus, tools, rawIdeas] = await Promise.all([
    db.devFocusItem.findMany({
      where: { companyId: staff.companyId, date: { gte: today, lt: tomorrow } },
      orderBy: { createdAt: "asc" },
    }),
    db.softwareTool.findMany({
      where: { companyId: staff.companyId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.productIdea.findMany({
      where: { companyId: staff.companyId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const focusItems = rawFocus.map((f) => ({ id: f.id, text: f.text, isDone: f.isDone }));

  const toolItems = tools.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    usedBy: t.usedBy,
    url: t.url,
    monthlyCost: t.monthlyCost,
    status: t.status,
    notes: t.notes,
  }));

  const ideaItems = rawIdeas.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    status: i.status,
    targetCompany: i.targetCompany,
    priority: i.priority,
    createdAt: i.createdAt.toISOString(),
    createdBy: { firstName: i.createdBy.firstName, lastName: i.createdBy.lastName },
  }));

  return (
    <CTOHub
      initialFocus={focusItems}
      initialTools={toolItems}
      initialIdeas={ideaItems}
    />
  );
}
