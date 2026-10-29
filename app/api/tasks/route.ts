import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { level: true } } },
    });
    if (!staff) return NextResponse.json({ tasks: [] });

    const view = req.nextUrl.searchParams.get("view") ?? "mine";
    const isManager = (staff.role?.level ?? 3) <= 2;

    const where = view === "all" && isManager
      ? { companyId: staff.companyId, status: { not: "completed" } }
      : { assigneeId: staff.id, status: { not: "completed" } };

    const tasks = await db.task.findMany({
      where,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks: tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })) });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, dueDate, title, description, priority } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;

    const task = await db.task.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
