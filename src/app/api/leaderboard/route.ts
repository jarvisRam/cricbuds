import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { results, users } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    })
    .from(results)
    .innerJoin(users, eq(results.userId, users.id))
    .groupBy(results.userId, users.name, users.image)
    .orderBy(desc(sql`sum(${results.points})`));

  return NextResponse.json(leaderboard);
}
