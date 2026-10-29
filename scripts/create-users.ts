import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!key) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { email: "content@grouhacademy.com",     password: "3h4KH8RXKJfVgHS", label: "Content Strategist" },
  { email: "support@grouhacademy.com",     password: "3h4KH8RXKJfVgHS", label: "Support Officer"    },
  { email: "customercare@grouhacademy.com", password: "3h4KH8RXKJfVgHS", label: "Customer Care"     },
];

async function main() {
  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error) {
      console.error(`❌  ${u.label} (${u.email}): ${error.message}`);
    } else {
      console.log(`✅  ${u.label} (${u.email}) created — id: ${data.user.id}`);
    }
  }
}

main();
