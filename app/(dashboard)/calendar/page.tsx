import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CalendarClient } from "./calendar-client";

export default async function ContentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let staff = null;
  let calendar = null;

  try {
    staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (staff) {
      calendar = await db.contentCalendar.upsert({
        where: { companyId_month_year: { companyId: staff.companyId, month, year } },
        create: { companyId: staff.companyId, month, year },
        update: {},
        include: { slots: { orderBy: [{ date: "asc" }, { slotIndex: "asc" }] } },
      });
    }
  } catch {}

  const serialized = calendar ? {
    ...calendar,
    createdAt: calendar.createdAt.toISOString(),
    updatedAt: calendar.updatedAt.toISOString(),
    slots: calendar.slots.map((s: { id: string; calendarId: string; date: Date; slotIndex: number; title: string | null; platform: string | null; contentType: string | null; driveUrl: string | null; status: string; notes: string | null; createdAt: Date; updatedAt: Date }) => ({
      ...s,
      date: s.date.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  } : null;

  return <CalendarClient initialCalendar={serialized} initialMonth={month} initialYear={year} />;
}
