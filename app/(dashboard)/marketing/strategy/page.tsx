import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { StrategyClient } from "./strategy-client";

export default async function StrategyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const staff = await db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true, title: true } } },
  });
  if (!staff) redirect("/login");

  const isManager  = (staff.role?.level ?? 3) <= 2;
  const isMarketer = staff.role?.title?.toLowerCase().includes("market") ?? false;
  if (!isManager && !isMarketer) redirect("/dashboard");

  const entries = await db.marketingStrategy.findMany({
    where: { companyId: staff.companyId },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <StrategyClient
      initialEntries={entries.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        targetCompany: e.targetCompany,
        body: e.body,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        createdBy: e.createdBy,
      }))}
    />
  );
}
