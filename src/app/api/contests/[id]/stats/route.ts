import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { actualStats, contests } from "@/lib/db/schema";
import { statsSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (contest.status === "revealed") {
    const allStats = await db
      .select()
      .from(actualStats)
      .where(eq(actualStats.contestId, id));
    return NextResponse.json(allStats);
  }

  const [myStats] = await db
    .select()
    .from(actualStats)
    .where(
      and(
        eq(actualStats.contestId, id),
        eq(actualStats.userId, session.user.id)
      )
    );

  return NextResponse.json(myStats ?? null);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (contest.status === "revealed") {
    return NextResponse.json({ error: "Contest already revealed" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = statsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(actualStats)
    .where(
      and(
        eq(actualStats.contestId, id),
        eq(actualStats.userId, session.user.id)
      )
    );

  const statsToSave = {
    rainedOff: parsed.data.rainedOff ?? false,
    // Force all stats to 0 when rained off
    runs: parsed.data.rainedOff ? 0 : parsed.data.runs,
    wickets: parsed.data.rainedOff ? 0 : parsed.data.wickets,
    catches: parsed.data.rainedOff ? 0 : parsed.data.catches,
    missed: parsed.data.rainedOff ? 0 : parsed.data.missed,
  };

  if (existing) {
    await db
      .update(actualStats)
      .set({ ...statsToSave, submittedAt: new Date() })
      .where(eq(actualStats.id, existing.id));
  } else {
    await db.insert(actualStats).values({
      contestId: id,
      userId: session.user.id,
      ...statsToSave,
    });
  }

  return NextResponse.json({ success: true });
}
