import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests, predictions, actualStats } from "@/lib/db/schema";
import { updateContestStatusSchema } from "@/lib/validations";
import { eq, and, count } from "drizzle-orm";

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

  if (!contest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [predCount] = await db
    .select({ count: count() })
    .from(predictions)
    .where(eq(predictions.contestId, id));

  const [statsCount] = await db
    .select({ count: count() })
    .from(actualStats)
    .where(eq(actualStats.contestId, id));

  const myPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.contestId, id),
        eq(predictions.predictorId, session.user.id)
      )
    );

  const [myStats] = await db
    .select()
    .from(actualStats)
    .where(
      and(
        eq(actualStats.contestId, id),
        eq(actualStats.userId, session.user.id)
      )
    );

  return NextResponse.json({
    ...contest,
    predictionCount: predCount.count,
    statsCount: statsCount.count,
    myPredictionCount: myPredictions.length,
    hasSubmittedStats: !!myStats,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateContestStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(contests)
    .set({ status: parsed.data.status })
    .where(eq(contests.id, id))
    .returning();

  return NextResponse.json(updated);
}
