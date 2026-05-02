import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { results, users } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1)
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3)
    return <Award className="h-5 w-5 text-amber-700" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">
      #{rank}
    </span>
  );
}

export default async function LeaderboardPage() {
  await auth();
  const db = getDb();

  const leaderboard = await db
    .select({
      userId: results.userId,
      userName: users.name,
      userImage: users.image,
      totalPoints: sql<number>`sum(${results.points})`.as("total_points"),
      totalContests: sql<number>`count(${results.contestId})`.as(
        "total_contests"
      ),
      wins: sql<number>`sum(case when ${results.rank} = 1 then 1 else 0 end)`.as(
        "wins"
      ),
      avgAccuracy: sql<number | null>`round(avg(${results.accuracy}))`.as(
        "avg_accuracy"
      ),
    })
    .from(results)
    .innerJoin(users, eq(results.userId, users.id))
    .groupBy(results.userId, users.name, users.image)
    .orderBy(desc(sql`sum(${results.points})`));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Season Standings</p>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-muted-foreground">No results yet</p>
            <p className="text-sm text-muted-foreground">
              Complete a contest to see the leaderboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <Card
              key={entry.userId}
              className={
                i === 0
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : i === 1
                    ? "border-gray-400/30"
                    : i === 2
                      ? "border-amber-700/30"
                      : undefined
              }
            >
              <CardContent className="flex items-center gap-3 py-3">
                <RankDisplay rank={i + 1} />
                <Avatar className="h-9 w-9">
                  <AvatarImage src={entry.userImage ?? undefined} />
                  <AvatarFallback>
                    {(entry.userName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {entry.userName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.wins} win{Number(entry.wins) !== 1 ? "s" : ""} ·{" "}
                    {entry.totalContests} contest
                    {Number(entry.totalContests) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{entry.totalPoints} pts</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.avgAccuracy != null
                      ? `${entry.avgAccuracy}% accuracy`
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
