import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { contests, users } from "@/lib/db/schema";
import { desc, count } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, ChevronRight } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/dashboard");

  const db = getDb();

  const [allContests, [playerCount]] = await Promise.all([
    db.select().from(contests).orderBy(desc(contests.createdAt)).limit(10),
    db.select({ value: count() }).from(users),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/contest/new">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">New Contest</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/players">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex flex-col items-center gap-2 py-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Players</span>
              <span className="text-xs text-muted-foreground">
                {playerCount.value} total
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          All Contests
        </h2>
        {allContests.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No contests yet — create your first one!
            </CardContent>
          </Card>
        ) : (
          allContests.map((c) => (
            <Link key={c.id} href={`/contest/${c.id}`}>
              <Card className="transition-colors hover:bg-accent/50 mb-2">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{c.weekLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.status === "revealed"
                          ? "outline"
                          : c.status === "locked"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
