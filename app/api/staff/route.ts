import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, roleId, companyId, password } = body;

    const supabase = await createClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "Auth error" }, { status: 400 });
    }

    const staff = await db.staffMember.create({
      data: {
        userId: authData.user.id,
        firstName,
        lastName,
        email,
        phone: phone || null,
        roleId: roleId || null,
        companyId,
        status: "active",
      },
    });

    return NextResponse.json(staff);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const staff = await db.staffMember.update({
      where: { id },
      data,
    });

    return NextResponse.json(staff);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
