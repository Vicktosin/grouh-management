import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, level, parentRoleId, roleType, description, responsibilities, requirements, qualifications, companyId } = body;

    const role = await db.role.create({
      data: {
        title,
        level: Number(level),
        parentRoleId: parentRoleId || null,
        roleType: roleType ?? "human",
        description: description || null,
        responsibilities: responsibilities ?? [],
        requirements: requirements ?? [],
        qualifications: qualifications ?? [],
        companyId,
      },
    });

    return NextResponse.json(role);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const role = await db.role.update({
      where: { id },
      data,
    });

    return NextResponse.json(role);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.role.update({ where: { id }, data: { isActive: false } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
