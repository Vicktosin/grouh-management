import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ files: [], folders: [] });

    const folderId = req.nextUrl.searchParams.get("folderId") ?? undefined;

    const [files, folders] = await Promise.all([
      db.driveFile.findMany({
        where: { companyId: staff.companyId, ...(folderId ? { folderId } : {}) },
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          taskLinks: { include: { task: { select: { id: true, title: true, status: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.driveFolder.findMany({
        where: { companyId: staff.companyId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({ files, folders });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await db.staffMember.findUnique({ where: { userId: user.id } });
    if (!staff) return NextResponse.json({ error: "No profile" }, { status: 403 });

    const body = await req.json();
    const { type, name, color, title, description, driveUrl, fileType, driveFileId, folderId, taskIds } = body;

    // Create folder
    if (type === "folder") {
      const folder = await db.driveFolder.create({
        data: { companyId: staff.companyId, name, color: color ?? "#5fbb46", createdById: staff.id },
      });
      return NextResponse.json({ folder });
    }

    // Create file
    const file = await db.driveFile.create({
      data: {
        companyId: staff.companyId,
        uploadedById: staff.id,
        title,
        description: description || null,
        driveUrl,
        fileType: fileType ?? "file",
        driveFileId: driveFileId || null,
        folderId: folderId || null,
        taskLinks: taskIds?.length
          ? { create: taskIds.map((taskId: string) => ({ taskId })) }
          : undefined,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        taskLinks: { include: { task: { select: { id: true, title: true, status: true } } } },
      },
    });

    return NextResponse.json({ file });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const type = req.nextUrl.searchParams.get("type") ?? "file";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (type === "folder") {
      await db.driveFolder.delete({ where: { id } });
    } else {
      await db.driveFile.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
