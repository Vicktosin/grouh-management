import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, staffId, type, notes, outcome } = body;

    const interaction = await db.leadInteraction.create({
      data: {
        leadId,
        staffId,
        type,
        notes: notes || null,
        outcome: outcome || null,
        attempted: true,
      },
    });

    return NextResponse.json(interaction);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
