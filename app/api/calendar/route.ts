import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// GET /api/calendar
//   ?all=1                    → list all calendars for the company
//   ?calendarId=xxx&month=3&year=2026  → slots for that calendar + month
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);

    // List all calendars
    if (searchParams.get("all") === "1") {
      const calendars = await db.contentCalendar.findMany({
        where: { companyId: staff.companyId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, description: true, color: true, createdAt: true },
      });
      return NextResponse.json({ calendars });
    }

    // Slots for a calendar + month
    const calendarId = searchParams.get("calendarId");
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year  = parseInt(searchParams.get("year")  || String(new Date().getFullYear()));

    if (!calendarId) return NextResponse.json({ error: "calendarId required" }, { status: 400 });

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1); // exclusive

    const calendar = await db.contentCalendar.findUnique({
      where: { id: calendarId },
      include: {
        slots: {
          where: { date: { gte: start, lt: end } },
          orderBy: [{ date: "asc" }, { slotIndex: "asc" }],
        },
      },
    });

    if (!calendar) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      calendar: {
        ...calendar,
        createdAt: calendar.createdAt.toISOString(),
        updatedAt: calendar.updatedAt.toISOString(),
        slots: calendar.slots.map((s) => ({
          ...s,
          date: s.date.toISOString(),
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/calendar  — create a new named calendar
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { level: true } } },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const isManager = (staff.role?.level ?? 3) <= 2;
    if (!isManager) return NextResponse.json({ error: "Managers only" }, { status: 403 });

    const body = await req.json();
    const { name, description, color } = body;

    const calendar = await db.contentCalendar.create({
      data: {
        companyId: staff.companyId,
        name: name ?? "New Calendar",
        description: description || null,
        color: color ?? "#1c1d52",
      },
    });

    return NextResponse.json({ calendar: { ...calendar, createdAt: calendar.createdAt.toISOString(), updatedAt: calendar.updatedAt.toISOString() } });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/calendar?id=xxx  — delete a calendar + all its slots
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { level: true } } },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const isManager = (staff.role?.level ?? 3) <= 2;
    if (!isManager) return NextResponse.json({ error: "Managers only" }, { status: 403 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.contentCalendar.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
