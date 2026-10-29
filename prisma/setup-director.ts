import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const email = "director@grouhacademy.com";

  // Look up the Supabase auth user UUID via raw SQL (auth schema)
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id::text FROM auth.users WHERE email = ${email} LIMIT 1
  `;

  if (rows.length === 0) {
    console.error(`No Supabase auth user found for ${email}`);
    console.error("Make sure you have accepted the invite email and set a password first.");
    process.exit(1);
  }

  const userId = rows[0].id;
  console.log(`Found auth user: ${userId}`);

  // Find the Director role
  const directorRole = await db.role.findFirst({
    where: { companyId: "grouh-academy", title: "Director" },
  });

  if (!directorRole) {
    console.error("Director role not found. Run prisma db seed first.");
    process.exit(1);
  }

  // Upsert so re-running is safe
  const staff = await db.staffMember.upsert({
    where: { email },
    create: {
      userId,
      companyId: "grouh-academy",
      roleId: directorRole.id,
      firstName: "Emmanuel",
      lastName: "Thomas",
      email,
      status: "active",
    },
    update: {
      userId,
      roleId: directorRole.id,
      status: "active",
    },
  });

  console.log(`✔ Director profile created: ${staff.firstName} ${staff.lastName} (${staff.email})`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
