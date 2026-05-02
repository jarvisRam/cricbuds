import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { addPlayerSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const allUsers = await db.select().from(users);
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = addPlayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Player already exists" }, { status: 409 });
  }

  const [player] = await db
    .insert(users)
    .values({ email: parsed.data.email, name: parsed.data.name ?? null })
    .returning();

  return NextResponse.json(player, { status: 201 });
}
