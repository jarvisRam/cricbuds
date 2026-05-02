import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { predictions, contests } from "@/lib/db/schema";
import { predictionSchema } from "@/lib/validations";
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
    const allPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.contestId, id));
    return NextResponse.json(allPredictions);
  }

  const myPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.contestId, id),
        eq(predictions.predictorId, session.user.id)
      )
    );

  return NextResponse.json(myPredictions);
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

  if (contest.status !== "open" || new Date() > contest.deadline) {
    if (contest.status === "open") {
      await db
        .update(contests)
        .set({ status: "locked" })
        .where(eq(contests.id, id));
    }
    return NextResponse.json({ error: "Predictions are closed" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = predictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const selfPrediction = parsed.data.predictions.find(
    (p) => p.targetId === session.user.id
  );
  if (selfPrediction) {
    return NextResponse.json({ error: "Cannot predict yourself" }, { status: 400 });
  }

  await db
    .delete(predictions)
    .where(
      and(
        eq(predictions.contestId, id),
        eq(predictions.predictorId, session.user.id)
      )
    );

  if (parsed.data.predictions.length > 0) {
    await db.insert(predictions).values(
      parsed.data.predictions.map((p) => ({
        contestId: id,
        predictorId: session.user.id,
        targetId: p.targetId,
        predRuns: p.predRuns,
        predWickets: p.predWickets,
        predCatches: p.predCatches,
        predMissed: p.predMissed,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
