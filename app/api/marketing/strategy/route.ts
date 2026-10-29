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

    const type = new URL(req.url).searchParams.get("type");

    const entries = await db.marketingStrategy.findMany({
      where: { companyId: staff.companyId, ...(type ? { type } : {}) },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      entries: entries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
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

    const { title, type, targetCompany, body, status } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const entry = await db.marketingStrategy.create({
      data: {
        companyId: staff.companyId,
        createdById: staff.id,
        title: title.trim(),
        type: type ?? "research",
        targetCompany: targetCompany ?? "all",
        body: body ?? "",
        status: status ?? "draft",
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({
      entry: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, ...updates } = await req.json();
    const entry = await db.marketingStrategy.update({
      where: { id },
      data: updates,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({
      entry: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() },
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
    await db.marketingStrategy.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
