import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

function dayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// GET /api/followup?month=10&year=2026
// Returns logs for the current user for that month (defaults to current).
// If isManager, returns all staff logs for today.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { level: true } } },
    });
    if (!staff) return NextResponse.json({ logs: [], teamToday: [] });

    const isManager = (staff.role?.level ?? 3) <= 2;
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getUTCMonth() + 1));
    const year  = parseInt(searchParams.get("year")  ?? String(now.getUTCFullYear()));

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = new Date(Date.UTC(year, month, 1));

    const logs = await db.followUpLog.findMany({
      where: { staffId: staff.id, logDate: { gte: start, lt: end } },
      orderBy: { logDate: "desc" },
    });

    let teamToday: object[] = [];
    if (isManager) {
      const today = dayStart(now);
      const tomorrow = new Date(today.getTime() + 86400000);
      const followUpRoles = ["sales", "customer care", "support"];
      const followUpStaff = await db.staffMember.findMany({
        where: {
          companyId: staff.companyId,
          status: "active",
          role: {
            OR: followUpRoles.map((r) => ({ title: { contains: r, mode: "insensitive" as const } })),
          },
        },
        include: {
          role: { select: { title: true } },
          followUpLogs: {
            where: { logDate: { gte: today, lt: tomorrow } },
            take: 1,
          },
        },
      });
      teamToday = followUpStaff.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        roleTitle: s.role?.title ?? "",
        todayLog: s.followUpLogs[0]
          ? {
              ...s.followUpLogs[0],
              logDate: s.followUpLogs[0].logDate.toISOString(),
              submittedAt: s.followUpLogs[0].submittedAt.toISOString(),
              updatedAt: s.followUpLogs[0].updatedAt.toISOString(),
            }
          : null,
      }));
    }

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        logDate: l.logDate.toISOString(),
        submittedAt: l.submittedAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      teamToday,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/followup — upsert today's log
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ error: "No profile" }, { status: 403 });

    const { isCleared, screenshotUrl, notes } = await req.json();
    const today = dayStart(new Date());

    const log = await db.followUpLog.upsert({
      where: { staffId_logDate: { staffId: staff.id, logDate: today } },
      create: {
        staffId: staff.id,
        companyId: staff.companyId,
        logDate: today,
        isCleared: !!isCleared,
        screenshotUrl: screenshotUrl || null,
        notes: notes || null,
      },
      update: {
        isCleared: !!isCleared,
        screenshotUrl: screenshotUrl !== undefined ? screenshotUrl || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
    });

    return NextResponse.json({
      log: {
        ...log,
        logDate: log.logDate.toISOString(),
        submittedAt: log.submittedAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
