import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { contests } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { Clock, Trophy, ChevronRight } from "lucide-react";

function statusColor(status: string) {
  switch (status) {
    case "open":
      return "default";
    case "locked":
      return "secondary";
    case "revealed":
      return "outline";
    default:
      return "default";
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const db = getDb();

  const allContests = await db
    .select()
    .from(contests)
    .orderBy(desc(contests.createdAt));

  const current = allContests.find((c) => c.status !== "revealed");
  const recent = allContests.filter((c) => c.status === "revealed").slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Ready to predict some cricket?
        </p>
      </div>

      {current ? (
        <Link href={`/contest/${current.id}`}>
          <Card className="border-primary/50 transition-colors hover:border-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{current.weekLabel}</CardTitle>
                <Badge variant={statusColor(current.status)}>
                  {current.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {current.status === "open" ? (
                    isPast(current.deadline) ? (
                      <span className="text-destructive">Deadline passed</span>
                    ) : (
                      <span>
                        Closes{" "}
                        {formatDistanceToNow(current.deadline, {
                          addSuffix: true,
                        })}
                      </span>
                    )
                  ) : (
                    <span>Waiting for stats & reveal</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-2">🏏</div>
            <p className="text-muted-foreground">No active contest right now</p>
            <p className="text-sm text-muted-foreground">
              {session?.user?.role === "admin"
                ? "Create one from the Admin panel"
                : "Ask your admin to start a new week"}
            </p>
          </CardContent>
        </Card>
      )}

      {recent.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4" />
            Recent Results
          </h2>
          {recent.map((c) => (
            <Link key={c.id} href={`/contest/${c.id}/reveal`}>
              <Card className="transition-colors hover:bg-accent/50 mb-2">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{c.weekLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.revealedAt
                        ? format(c.revealedAt, "MMM d, yyyy")
                        : "Revealed"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
