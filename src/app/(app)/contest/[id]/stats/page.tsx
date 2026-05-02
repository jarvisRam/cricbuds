import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests, actualStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StatsEntryForm } from "@/components/stats/stats-entry-form";

export default async function StatsPage({
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

  const [myStats] = await db
    .select()
    .from(actualStats)
    .where(
      and(
        eq(actualStats.contestId, id),
        eq(actualStats.userId, session!.user.id)
      )
    );

  const isEditable = contest.status !== "revealed";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">My Match Stats</h1>
        <p className="text-sm text-muted-foreground">{contest.weekLabel}</p>
      </div>

      <StatsEntryForm
        contestId={id}
        existing={
          myStats
            ? {
                runs: myStats.runs,
                wickets: myStats.wickets,
                catches: myStats.catches,
                missed: myStats.missed,
                rainedOff: myStats.rainedOff,
              }
            : null
        }
        disabled={!isEditable}
      />
    </div>
  );
}
