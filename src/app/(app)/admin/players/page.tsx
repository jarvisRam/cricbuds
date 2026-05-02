import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PlayerManager } from "@/components/admin/player-manager";

export default async function PlayersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const allUsers = await db.select().from(users);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Manage Players</h1>
      <PlayerManager
        players={allUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          image: u.image,
        }))}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
