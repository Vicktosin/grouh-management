import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Migrating ContentCalendar schema…");

  // 1. Add new columns if they don't exist
  await db.$executeRawUnsafe(`
    ALTER TABLE "ContentCalendar"
      ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Main Calendar',
      ADD COLUMN IF NOT EXISTS "description" TEXT,
      ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#1c1d52';
  `);
  console.log("✔ Added name, description, color columns");

  // 2. Drop old columns
  await db.$executeRawUnsafe(`
    ALTER TABLE "ContentCalendar"
      DROP COLUMN IF EXISTS "month",
      DROP COLUMN IF EXISTS "year";
  `);
  console.log("✔ Dropped month, year columns");

  // 3. Drop old unique constraint (name varies by Postgres)
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ContentCalendar_companyId_month_year_key'
      ) THEN
        ALTER TABLE "ContentCalendar" DROP CONSTRAINT "ContentCalendar_companyId_month_year_key";
      END IF;
    END
    $$;
  `);
  console.log("✔ Dropped old unique constraint");

  // 4. Add new unique constraint if it doesn't exist
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ContentCalendar_companyId_name_key'
      ) THEN
        ALTER TABLE "ContentCalendar"
          ADD CONSTRAINT "ContentCalendar_companyId_name_key"
          UNIQUE ("companyId", "name");
      END IF;
    END
    $$;
  `);
  console.log("✔ Added new unique constraint (companyId, name)");

  console.log("Migration complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
