import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, assigneeId, creatorId, companyId, priority, dueDate } = body;

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        assigneeId,
        creatorId,
        companyId,
        priority: priority ?? "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "pending",
      },
    });

    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const task = await db.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
