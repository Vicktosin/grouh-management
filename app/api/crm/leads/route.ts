import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, source, notes, assigneeId, companyId } = body;

    const lead = await db.lead.create({
      data: {
        name: name || null,
        phone: phone || null,
        email: email || null,
        source: source || null,
        notes: notes || null,
        assigneeId,
        companyId,
        status: "new",
      },
    });

    return NextResponse.json(lead);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const lead = await db.lead.update({ where: { id }, data });

    return NextResponse.json(lead);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
