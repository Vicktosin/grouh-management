import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { staffId } = await req.json();

    // Ensure no active entry
    const existing = await db.timeEntry.findFirst({
      where: { staffId, clockOut: null },
    });

    if (existing) {
      return NextResponse.json({ error: "Already clocked in" }, { status: 400 });
    }

    const entry = await db.timeEntry.create({
      data: { staffId, clockIn: new Date() },
    });

    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
