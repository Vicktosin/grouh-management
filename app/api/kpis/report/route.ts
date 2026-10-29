import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kpiId, staffId, value, notes, periodStart, periodEnd } = body;

    const report = await db.kPIReport.create({
      data: {
        kpiId,
        staffId,
        value: Number(value),
        notes: notes || null,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
