import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests } from "@/lib/db/schema";
import { createContestSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const allContests = await db
    .select()
    .from(contests)
    .orderBy(desc(contests.createdAt));

  return NextResponse.json(allContests);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createContestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const db = getDb();
  const [contest] = await db
    .insert(contests)
    .values({
      weekLabel: parsed.data.weekLabel,
      deadline: new Date(parsed.data.deadline),
    })
    .returning();

  return NextResponse.json(contest, { status: 201 });
}
