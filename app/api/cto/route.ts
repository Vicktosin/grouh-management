import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

function dayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function getStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true } } },
  });
}

// ─── GET ─────────────────────────────────────────────────────────────────────
// ?section=focus|stack|ideas
export async function GET(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const section = new URL(req.url).searchParams.get("section");

    if (section === "focus") {
      const today = dayStart(new Date());
      const tomorrow = new Date(today.getTime() + 86400000);
      const items = await db.devFocusItem.findMany({
        where: { companyId: staff.companyId, date: { gte: today, lt: tomorrow } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ items });
    }

    if (section === "stack") {
      const tools = await db.softwareTool.findMany({
        where: { companyId: staff.companyId },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return NextResponse.json({ tools });
    }

    if (section === "ideas") {
      const ideas = await db.productIdea.findMany({
        where: { companyId: staff.companyId },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ideas });
    }

    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// body: { type: "focus"|"tool"|"idea", ...fields }
export async function POST(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.type === "focus") {
      const today = dayStart(new Date());
      const item = await db.devFocusItem.create({
        data: { companyId: staff.companyId, staffId: staff.id, text: body.text, date: today },
      });
      return NextResponse.json({ item });
    }

    if (body.type === "tool") {
      const tool = await db.softwareTool.create({
        data: {
          companyId: staff.companyId,
          name: body.name,
          category: body.category ?? "other",
          usedBy: body.usedBy ?? "all",
          url: body.url || null,
          monthlyCost: parseFloat(body.monthlyCost ?? "0") || 0,
          status: body.status ?? "active",
          notes: body.notes || null,
        },
      });
      return NextResponse.json({ tool });
    }

    if (body.type === "idea") {
      const idea = await db.productIdea.create({
        data: {
          companyId: staff.companyId,
          createdById: staff.id,
          title: body.title,
          description: body.description || null,
          status: body.status ?? "concept",
          targetCompany: body.targetCompany ?? "all",
          priority: body.priority ?? "medium",
        },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      });
      return NextResponse.json({ idea });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// body: { type, id, ...updates }
export async function PATCH(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.type === "focus") {
      const item = await db.devFocusItem.update({
        where: { id: body.id },
        data: { isDone: body.isDone },
      });
      return NextResponse.json({ item });
    }

    if (body.type === "tool") {
      const { type: _t, id, ...updates } = body;
      if (updates.monthlyCost !== undefined) updates.monthlyCost = parseFloat(updates.monthlyCost) || 0;
      const tool = await db.softwareTool.update({ where: { id }, data: updates });
      return NextResponse.json({ tool });
    }

    if (body.type === "idea") {
      const { type: _t, id, ...updates } = body;
      const idea = await db.productIdea.update({
        where: { id },
        data: updates,
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      });
      return NextResponse.json({ idea });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
// ?type=focus|tool|idea&id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id   = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (type === "focus") { await db.devFocusItem.delete({ where: { id } }); }
    else if (type === "tool")  { await db.softwareTool.delete({ where: { id } }); }
    else if (type === "idea")  { await db.productIdea.delete({ where: { id } }); }
    else return NextResponse.json({ error: "Unknown type" }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
