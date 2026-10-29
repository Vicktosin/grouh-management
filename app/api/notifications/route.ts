import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// GET /api/notifications — fetch recent notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ notifications: [] });

    const notifications = await db.notification.findMany({
      where: { staffId: staff.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ ok: true });

    const body = await req.json();

    if (body.all) {
      await db.notification.updateMany({ where: { staffId: staff.id, isRead: false }, data: { isRead: true } });
    } else if (body.id) {
      await db.notification.update({ where: { id: body.id }, data: { isRead: true } });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
