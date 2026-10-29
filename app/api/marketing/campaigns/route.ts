import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

async function getStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true } } },
  });
}

export async function GET(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = new URL(req.url).searchParams.get("status");

    const campaigns = await db.campaign.findMany({
      where: { companyId: staff.companyId, ...(status ? { status } : {}) },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        channels: { include: { channel: { select: { id: true, name: true, type: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        channels: c.channels.map((cc) => cc.channel),
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

    const { name, targetCompany, description, budget, startDate, endDate, channelIds } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const campaign = await db.campaign.create({
      data: {
        companyId: staff.companyId,
        createdById: staff.id,
        name: name.trim(),
        targetCompany: targetCompany ?? "all",
        description: description || null,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        channels: channelIds?.length
          ? { create: channelIds.map((channelId: string) => ({ channelId })) }
          : undefined,
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        channels: { include: { channel: { select: { id: true, name: true, type: true } } } },
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        startDate: campaign.startDate?.toISOString() ?? null,
        endDate: campaign.endDate?.toISOString() ?? null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        channels: campaign.channels.map((cc) => cc.channel),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, channelIds, ...updates } = await req.json();
    if (updates.budget !== undefined) updates.budget = updates.budget ? parseFloat(updates.budget) : null;
    if (updates.startDate !== undefined) updates.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.endDate !== undefined)   updates.endDate   = updates.endDate   ? new Date(updates.endDate)   : null;

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...updates,
        ...(channelIds !== undefined ? {
          channels: {
            deleteMany: {},
            create: channelIds.map((channelId: string) => ({ channelId })),
          },
        } : {}),
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        channels: { include: { channel: { select: { id: true, name: true, type: true } } } },
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        startDate: campaign.startDate?.toISOString() ?? null,
        endDate: campaign.endDate?.toISOString() ?? null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        channels: campaign.channels.map((cc) => cc.channel),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
