import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests, predictions, actualStats, users } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, isPast, format } from "date-fns";
import {
  Clock,
  Target,
  BarChart3,
  Sparkles,
  Lock,
  ChevronRight,
} from "lucide-react";
import { ContestAdminControls } from "@/components/contest/contest-admin-controls";

export default async function ContestPage({
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

  const [predCount] = await db
    .select({ value: count() })
    .from(predictions)
    .where(eq(predictions.contestId, id));

  const [statsCount] = await db
    .select({ value: count() })
    .from(actualStats)
    .where(eq(actualStats.contestId, id));

  const allUsers = await db.select().from(users);

  const myPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.contestId, id),
        eq(predictions.predictorId, session!.user.id)
      )
    );

  const [myStats] = await db
    .select()
    .from(actualStats)
    .where(
      and(
        eq(actualStats.contestId, id),
        eq(actualStats.userId, session!.user.id)
      )
    );

  const statsSubmitters = await db
    .select({ userId: actualStats.userId })
    .from(actualStats)
    .where(eq(actualStats.contestId, id));

  const submitterIds = new Set(statsSubmitters.map((s) => s.userId));

  const isAdmin = session!.user.role === "admin";
  const isOpen = contest.status === "open" && !isPast(contest.deadline);
  const isLocked =
    contest.status === "locked" ||
    (contest.status === "open" && isPast(contest.deadline));
  const isRevealed = contest.status === "revealed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{contest.weekLabel}</h1>
        <Badge
          variant={
            isRevealed ? "outline" : isLocked ? "secondary" : "default"
          }
        >
          {isRevealed ? "REVEALED" : isLocked ? "LOCKED" : "OPEN"}
        </Badge>
      </div>

      {isOpen && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Predictions close{" "}
            {formatDistanceToNow(contest.deadline, { addSuffix: true })}
          </span>
        </div>
      )}

      {isLocked && !isRevealed && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>
            Predictions locked — enter your match stats
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/contest/${id}/predict`}>
          <Card
            className={`transition-colors hover:bg-accent/50 ${
              isOpen ? "border-primary/50" : ""
            }`}
          >
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Predictions</span>
              <span className="text-xs text-muted-foreground">
                {myPredictions.length} placed
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/contest/${id}/stats`}>
          <Card
            className={`transition-colors hover:bg-accent/50 ${
              isLocked && !isRevealed && !myStats ? "border-primary/50" : ""
            }`}
          >
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">My Stats</span>
              <span className="text-xs text-muted-foreground">
                {myStats ? "Submitted ✓" : "Not yet"}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {isRevealed && (
        <Link href={`/contest/${id}/reveal`}>
          <Card className="border-primary/50 transition-colors hover:border-primary">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">View Results</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {isAdmin && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Admin Controls
          </h2>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stats Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {allUsers
                  .filter((u) => u.role !== "admin" || submitterIds.has(u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{u.name ?? u.email}</span>
                      <span
                        className={
                          submitterIds.has(u.id)
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }
                      >
                        {submitterIds.has(u.id) ? "✓" : "—"}
                      </span>
                    </div>
                  ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {statsCount.value} of {allUsers.length} submitted
              </p>
            </CardContent>
          </Card>

          <ContestAdminControls
            contestId={id}
            currentStatus={contest.status}
            isDeadlinePast={isPast(contest.deadline)}
          />
        </div>
      )}
    </div>
  );
}
