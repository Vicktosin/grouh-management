import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FileHub, type FileItem, type FolderItem } from "./file-hub";

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staff = null;
  let isManager = false;
  let initialFiles: FileItem[] = [];
  let initialFolders: FolderItem[] = [];
  let taskOptions: { id: string; title: string }[] = [];

  try {
    staff = await db.staffMember.findUnique({
      where: { userId: user!.id },
      include: { role: { select: { level: true } } },
    });

    if (staff) {
      isManager = (staff.role?.level ?? 3) <= 2;

      const [files, folders, tasks] = await Promise.all([
        db.driveFile.findMany({
          where: { companyId: staff.companyId },
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
        isManager
          ? db.task.findMany({
              where: { companyId: staff.companyId, status: { not: "completed" } },
              select: { id: true, title: true },
              orderBy: { createdAt: "desc" },
              take: 50,
            })
          : Promise.resolve([]),
      ]);

      initialFiles = files.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      }));
      initialFolders = folders.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }));
      taskOptions = tasks;
    }
  } catch {}

  if (!staff) {
    return <div className="p-8"><p style={{ color: "var(--text-muted)" }}>Profile not found.</p></div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <FileHub
        initialFiles={initialFiles}
        initialFolders={initialFolders}
        taskOptions={taskOptions}
        isManager={isManager}
      />
    </div>
  );
}
