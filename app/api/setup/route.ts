import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Only allowed if no staff members exist yet (first-run only)
    const existingCount = await db.staffMember.count({ where: { companyId: "grouh-academy" } });
    if (existingCount > 0) {
      return NextResponse.json({ error: "Setup already complete. Contact an existing director." }, { status: 403 });
    }

    const { firstName, lastName } = await req.json();
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name required" }, { status: 400 });
    }

    // Find the Director role
    const directorRole = await db.role.findFirst({
      where: { companyId: "grouh-academy", title: "Director" },
    });

    const staff = await db.staffMember.create({
      data: {
        userId: user.id,
        companyId: "grouh-academy",
        roleId: directorRole?.id ?? null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user.email!,
        status: "active",
      },
    });

    return NextResponse.json({ staff });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
