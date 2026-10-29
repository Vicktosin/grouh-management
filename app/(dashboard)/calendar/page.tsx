import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CalendarClient, type CalendarMeta } from "./calendar-client";

export default async function ContentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  let staff = null;
  let isManager = false;
  let calendars: CalendarMeta[] = [];
  let firstCalendar = null;

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user.id },
      include: { role: { select: { level: true } } },
    });

    if (staff) {
      isManager = (staff.role?.level ?? 3) <= 2;

      const rawCalendars = await db.contentCalendar.findMany({
        where: { companyId: staff.companyId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, description: true, color: true, createdAt: true },
      });

      // If no calendars exist, auto-create a default one for managers
      if (rawCalendars.length === 0 && isManager) {
        const created = await db.contentCalendar.create({
          data: { companyId: staff.companyId, name: "Main Calendar", color: "#1c1d52" },
          select: { id: true, name: true, description: true, color: true, createdAt: true },
        });
        rawCalendars.push(created);
      }

      calendars = rawCalendars.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }));

      // Load slots for the first calendar
      if (calendars.length > 0) {
        const start = new Date(year, month - 1, 1);
        const end   = new Date(year, month, 1);
        const cal   = await db.contentCalendar.findUnique({
          where: { id: calendars[0].id },
          include: {
            slots: {
              where: { date: { gte: start, lt: end } },
              orderBy: [{ date: "asc" }, { slotIndex: "asc" }],
            },
          },
        });
        if (cal) {
          firstCalendar = {
            ...calendars[0],
            slots: cal.slots.map(s => ({
              ...s,
              date: s.date.toISOString(),
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
            })),
          };
        }
      }
    }
  } catch {}

  return (
    <CalendarClient
      initialCalendars={calendars}
      initialCalendar={firstCalendar}
      initialMonth={month}
      initialYear={year}
      isManager={isManager}
    />
  );
}
