import { getDb } from "@/lib/db";
import { contests, results, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { RevealSequence } from "@/components/reveal/reveal-sequence";

export default async function RevealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await auth();
  const db = getDb();

  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (!contest || contest.status !== "revealed") notFound();

  const contestResults = await db
    .select({
      userId: results.userId,
      totalDiff: results.totalDiff,
      accuracy: results.accuracy,
      rank: results.rank,
      points: results.points,
      userName: users.name,
      userImage: users.image,
    })
    .from(results)
    .innerJoin(users, eq(results.userId, users.id))
    .where(eq(results.contestId, id))
    .orderBy(asc(results.rank));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">{contest.weekLabel}</h1>
        <p className="text-sm text-muted-foreground">Results</p>
      </div>

      <RevealSequence
        results={contestResults.map((r) => ({
          userId: r.userId,
          userName: r.userName ?? "Unknown",
          userImage: r.userImage,
          totalDiff: r.totalDiff,
          accuracy: r.accuracy,
          rank: r.rank,
          points: r.points,
        }))}
      />
    </div>
  );
}
