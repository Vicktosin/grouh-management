import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const calendar = await db.contentCalendar.findUnique({
      where: { companyId_month_year: { companyId: staff.companyId, month, year } },
      include: { slots: { orderBy: [{ date: "asc" }, { slotIndex: "asc" }] } },
    });

    return NextResponse.json({ calendar });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const body = await req.json();
    const { month, year } = body;

    const calendar = await db.contentCalendar.upsert({
      where: { companyId_month_year: { companyId: staff.companyId, month, year } },
      create: { companyId: staff.companyId, month, year },
      update: {},
      include: { slots: { orderBy: [{ date: "asc" }, { slotIndex: "asc" }] } },
    });

    return NextResponse.json({ calendar });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
