"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Player {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export function PlayerManager({
  players: initialPlayers,
  currentUserId,
}: {
  players: Player[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setAdding(true);
    setError("");

    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setEmail("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add player");
    }
    setAdding(false);
  }

  async function removePlayer(id: string) {
    setRemoving(id);
    await fetch(`/api/admin/players/${id}`, { method: "DELETE" });
    router.refresh();
    setRemoving(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={addPlayer} className="flex gap-2">
            <Input
              type="email"
              placeholder="player@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={adding} size="sm">
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {initialPlayers.map((player) => (
          <Card key={player.id}>
            <CardContent className="flex items-center gap-3 py-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={player.image ?? undefined} />
                <AvatarFallback>
                  {(player.name ?? player.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {player.name ?? player.email}
                </p>
                {player.name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {player.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {player.role === "admin" && (
                  <Badge variant="secondary">Admin</Badge>
                )}
                {!player.name && (
                  <Badge variant="outline">Pending</Badge>
                )}
                {player.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                    disabled={removing === player.id}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    {removing === player.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
