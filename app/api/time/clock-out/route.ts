import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { entryId } = await req.json();

    const entry = await db.timeEntry.update({
      where: { id: entryId },
      data: { clockOut: new Date() },
    });

    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
