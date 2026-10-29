import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ChannelsClient } from "./channels-client";

export default async function ChannelsPage() {
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

  const [channels, performance, campaigns] = await Promise.all([
    db.marketingChannel.findMany({
      where: { companyId: staff.companyId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    db.channelPerformance.findMany({
      where: { companyId: staff.companyId },
      include: {
        campaign: { select: { id: true, name: true } },
        channel:  { select: { id: true, name: true } },
      },
      orderBy: { loggedAt: "desc" },
      take: 100,
    }),
    db.campaign.findMany({
      where: { companyId: staff.companyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ChannelsClient
      initialChannels={channels}
      initialPerformance={performance.map((p) => ({ ...p, loggedAt: p.loggedAt.toISOString() }))}
      initialCampaigns={campaigns}
    />
  );
}
