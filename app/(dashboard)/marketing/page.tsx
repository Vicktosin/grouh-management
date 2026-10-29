import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { CampaignsClient } from "./campaigns-client";

export default async function MarketingPage() {
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

  const [campaigns, channels] = await Promise.all([
    db.campaign.findMany({
      where: { companyId: staff.companyId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        channels: { include: { channel: { select: { id: true, name: true, type: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.marketingChannel.findMany({
      where: { companyId: staff.companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CampaignsClient
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        targetCompany: c.targetCompany,
        description: c.description,
        status: c.status,
        budget: c.budget,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        createdBy: c.createdBy,
        channels: c.channels.map((cc) => cc.channel),
      }))}
      initialChannels={channels}
    />
  );
}
