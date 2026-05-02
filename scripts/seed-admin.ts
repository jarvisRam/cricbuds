import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx dotenv -e .env.local -- npx tsx scripts/seed-admin.ts <admin-email>");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existing) {
    console.log(`User ${email} already exists (role: ${existing.role})`);
    if (existing.role !== "admin") {
      await db
        .update(schema.users)
        .set({ role: "admin" })
        .where(eq(schema.users.id, existing.id));
      console.log(`Updated ${email} to admin role`);
    }
    return;
  }

  await db.insert(schema.users).values({
    email,
    role: "admin",
  });

  console.log(`Created admin user: ${email}`);
}

main().catch(console.error);
