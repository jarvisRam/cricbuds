import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { results, users, contests } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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

  if (!contest || contest.status !== "revealed") {
    return NextResponse.json({ error: "Results not available" }, { status: 404 });
  }

  const contestResults = await db
    .select({
      userId: results.userId,
      totalDiff: results.totalDiff,
      rank: results.rank,
      points: results.points,
      userName: users.name,
      userImage: users.image,
    })
    .from(results)
    .innerJoin(users, eq(results.userId, users.id))
    .where(eq(results.contestId, id))
    .orderBy(asc(results.rank));

  return NextResponse.json(contestResults);
}
