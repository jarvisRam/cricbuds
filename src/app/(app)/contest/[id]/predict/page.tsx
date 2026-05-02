import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests, users, predictions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { isPast } from "date-fns";
import { PredictionForm } from "@/components/prediction/prediction-form";

export default async function PredictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const db = getDb();

  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (!contest) notFound();

  const isOpen = contest.status === "open" && !isPast(contest.deadline);
  const allUsers = await db.select().from(users);
  const otherPlayers = allUsers.filter((u) => u.id !== session!.user.id);

  const myPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.contestId, id),
        eq(predictions.predictorId, session!.user.id)
      )
    );

  const existingMap: Record<
    string,
    { predRuns: number; predWickets: number; predCatches: number; predMissed: number; predRainedOff: boolean }
  > = {};
  for (const p of myPredictions) {
    existingMap[p.targetId] = {
      predRuns: p.predRuns,
      predWickets: p.predWickets,
      predCatches: p.predCatches,
      predMissed: p.predMissed,
      predRainedOff: p.predRainedOff,
    };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Predictions</h1>
        <p className="text-sm text-muted-foreground">{contest.weekLabel}</p>
      </div>

      {!isOpen && contest.status !== "revealed" ? (
        <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
          Predictions are locked for this contest
        </div>
      ) : contest.status === "revealed" ? (
        <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
          This contest has been revealed — predictions are closed
        </div>
      ) : null}

      <PredictionForm
        contestId={id}
        players={otherPlayers.map((u) => ({
          id: u.id,
          name: u.name ?? u.email,
          image: u.image,
        }))}
        existing={existingMap}
        disabled={!isOpen}
      />
    </div>
  );
}
