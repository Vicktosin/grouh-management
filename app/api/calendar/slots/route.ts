import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { calendarId, date, slotIndex, title, platform, contentType, driveUrl, status, notes } = body;

    const slot = await db.contentSlot.upsert({
      where: { calendarId_date_slotIndex: { calendarId, date: new Date(date), slotIndex } },
      create: { calendarId, date: new Date(date), slotIndex, title, platform, contentType, driveUrl, status, notes },
      update: { title, platform, contentType, driveUrl, status, notes },
    });

    return NextResponse.json({ slot });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("id");
    if (!slotId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.contentSlot.delete({ where: { id: slotId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
