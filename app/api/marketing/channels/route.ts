import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

async function getStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return db.staffMember.findUnique({ where: { userId: user.id } });
}

export async function GET(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = new URL(req.url).searchParams.get("campaignId");

    const [channels, performance] = await Promise.all([
      db.marketingChannel.findMany({
        where: { companyId: staff.companyId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      }),
      db.channelPerformance.findMany({
        where: {
          companyId: staff.companyId,
          ...(campaignId ? { campaignId } : {}),
        },
        include: {
          campaign: { select: { id: true, name: true } },
          channel:  { select: { id: true, name: true } },
        },
        orderBy: { loggedAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      channels,
      performance: performance.map((p) => ({
        ...p,
        loggedAt: p.loggedAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.type === "channel") {
      const ch = await db.marketingChannel.create({
        data: { companyId: staff.companyId, name: body.name.trim(), type: body.channelType ?? "digital" },
      });
      return NextResponse.json({ channel: ch });
    }

    if (body.type === "performance") {
      const p = await db.channelPerformance.create({
        data: {
          companyId: staff.companyId,
          campaignId: body.campaignId,
          channelId: body.channelId,
          periodLabel: body.periodLabel ?? "",
          spend: parseFloat(body.spend ?? "0") || 0,
          reach: parseFloat(body.reach ?? "0") || 0,
          impressions: parseFloat(body.impressions ?? "0") || 0,
          clicks: parseFloat(body.clicks ?? "0") || 0,
          conversions: parseFloat(body.conversions ?? "0") || 0,
          notes: body.notes || null,
        },
        include: {
          campaign: { select: { id: true, name: true } },
          channel:  { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ performance: { ...p, loggedAt: p.loggedAt.toISOString() } });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, ...updates } = await req.json();
    const ch = await db.marketingChannel.update({ where: { id }, data: updates });
    return NextResponse.json({ channel: ch });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id   = searchParams.get("id");
    const type = searchParams.get("type") ?? "channel";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (type === "performance") await db.channelPerformance.delete({ where: { id } });
    else await db.marketingChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
