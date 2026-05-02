import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests, predictions, actualStats, results } from "@/lib/db/schema";
import { calculateResults } from "@/lib/scoring";
import { eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();

  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (contest.status === "revealed") {
    return NextResponse.json({ error: "Already revealed" }, { status: 400 });
  }

  const allPredictions = await db
    .select()
    .from(predictions)
    .where(eq(predictions.contestId, id));

  const allStats = await db
    .select()
    .from(actualStats)
    .where(eq(actualStats.contestId, id));

  if (allStats.length === 0) {
    return NextResponse.json({ error: "No stats submitted yet" }, { status: 400 });
  }

  const ranked = calculateResults(allPredictions, allStats);

  await db.delete(results).where(eq(results.contestId, id));

  if (ranked.length > 0) {
    await db.insert(results).values(
      ranked.map((r) => ({
        contestId: id,
        userId: r.userId,
        totalDiff: r.totalDiff,
        rank: r.rank,
        points: r.points,
      }))
    );
  }

  await db
    .update(contests)
    .set({ status: "revealed", revealedAt: new Date() })
    .where(eq(contests.id, id));

  return NextResponse.json({ results: ranked });
}
