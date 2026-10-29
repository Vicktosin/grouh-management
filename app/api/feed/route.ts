import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

async function getStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return db.staffMember.findUnique({
    where: { userId: user.id },
    include: { role: { select: { level: true } } },
  });
}

// Extract @[Name](staffId) markers from content
function parseMentions(content: string): string[] {
  const ids: string[] = [];
  const re = /@\[.+?\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) ids.push(m[1]);
  return [...new Set(ids)];
}

// GET /api/feed?limit=20&before=<cursor>
export async function GET(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const before = searchParams.get("before"); // cursor: createdAt ISO

    const posts = await db.companyPost.findMany({
      where: {
        companyId: staff.companyId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, roleId: true } },
        mentions: { include: { staff: { select: { id: true, firstName: true, lastName: true } } } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        type: p.type,
        isPinned: p.isPinned,
        eventDate: p.eventDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        author: p.author,
        mentions: p.mentions.map((m) => ({
          staffId: m.staffId,
          firstName: m.staff.firstName,
          lastName: m.staff.lastName,
        })),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/feed — create a post (managers only)
export async function POST(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((staff.role?.level ?? 3) > 2) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { content, type, eventDate } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const mentionIds = parseMentions(content);

    // Resolve @all → every active staff member in the company
    const isAllMention = content.includes("@all");
    let allStaffIds: string[] = [];
    if (isAllMention) {
      const everyone = await db.staffMember.findMany({
        where: { companyId: staff.companyId, status: "active" },
        select: { id: true },
      });
      allStaffIds = everyone.map((s) => s.id).filter((id) => id !== staff.id);
    }

    const taggedIds = [...new Set([...mentionIds, ...allStaffIds])].filter((id) => id !== staff.id);

    const post = await db.companyPost.create({
      data: {
        companyId: staff.companyId,
        authorId: staff.id,
        content: content.trim(),
        type: type ?? "general",
        eventDate: eventDate ? new Date(eventDate) : null,
        mentions: taggedIds.length > 0
          ? { create: taggedIds.map((staffId) => ({ staffId })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        mentions: { include: { staff: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    // Create notifications for mentioned staff
    if (taggedIds.length > 0) {
      const authorName = `${staff.firstName} ${staff.lastName}`;
      await db.notification.createMany({
        data: taggedIds.map((staffId) => ({
          staffId,
          companyId: staff.companyId,
          type: "mention",
          urgency: type === "announcement" ? "high" : "normal",
          title: type === "announcement" ? "You were mentioned in an announcement" : "You were mentioned",
          message: `${authorName} mentioned you: "${content.replace(/@\[.+?\]\([^)]+\)/g, (m: string) => "@" + m.slice(2, m.indexOf("]"))).slice(0, 80)}${content.length > 80 ? "…" : ""}"`,
          relatedId: post.id,
          isRead: false,
        })),
      });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        type: post.type,
        isPinned: post.isPinned,
        eventDate: post.eventDate?.toISOString() ?? null,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        mentions: post.mentions.map((m) => ({
          staffId: m.staffId,
          firstName: m.staff.firstName,
          lastName: m.staff.lastName,
        })),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH /api/feed — pin/unpin (managers only)
export async function PATCH(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((staff.role?.level ?? 3) > 2) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, isPinned } = await req.json();
    const post = await db.companyPost.update({ where: { id }, data: { isPinned } });
    return NextResponse.json({ ok: true, isPinned: post.isPinned });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/feed?id=xxx (author or manager)
export async function DELETE(req: NextRequest) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const post = await db.companyPost.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isManager = (staff.role?.level ?? 3) <= 2;
    if (post.authorId !== staff.id && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.companyPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
