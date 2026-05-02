"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Loader2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
  image: string | null;
}

interface PredictionValues {
  predRuns: number;
  predWickets: number;
  predCatches: number;
  predMissed: number;
  predRainedOff: boolean;
}

export function PredictionForm({
  contestId,
  players,
  existing,
  disabled,
}: {
  contestId: string;
  players: Player[];
  existing: Record<string, PredictionValues>;
  disabled: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, PredictionValues>>(() => {
    const init: Record<string, PredictionValues> = {};
    for (const p of players) {
      init[p.id] = existing[p.id] ?? {
        predRuns: 0,
        predWickets: 0,
        predCatches: 0,
        predMissed: 0,
        predRainedOff: false,
      };
    }
    return init;
  });

  const [enabledPlayers, setEnabledPlayers] = useState<Set<string>>(
    () => new Set(Object.keys(existing))
  );

  function togglePlayer(id: string) {
    setEnabledPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleRain(playerId: string) {
    setValues((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        predRainedOff: !prev[playerId].predRainedOff,
      },
    }));
  }

  function updateValue(
    playerId: string,
    field: keyof Omit<PredictionValues, "predRainedOff">,
    value: string
  ) {
    const num = parseInt(value) || 0;
    setValues((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: Math.max(0, num) },
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    const preds = Array.from(enabledPlayers).map((targetId) => ({
      targetId,
      ...values[targetId],
    }));

    await fetch(`/api/contests/${contestId}/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictions: preds }),
    });

    router.push(`/contest/${contestId}`);
    router.refresh();
  }

  const statFields: { key: keyof Omit<PredictionValues, "predRainedOff">; label: string; emoji: string }[] =
    [
      { key: "predRuns", label: "Runs", emoji: "🏏" },
      { key: "predWickets", label: "Wkts", emoji: "🎯" },
      { key: "predCatches", label: "Catch", emoji: "🧤" },
      { key: "predMissed", label: "Miss", emoji: "❌" },
    ];

  return (
    <div className="space-y-3">
      {players.map((player) => {
        const isEnabled = enabledPlayers.has(player.id);
        const isRained = values[player.id]?.predRainedOff ?? false;

        return (
          <Card
            key={player.id}
            className={!isEnabled ? "opacity-50" : undefined}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => !disabled && togglePlayer(player.id)}
                  disabled={disabled}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={player.image ?? undefined} />
                    <AvatarFallback>
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-sm truncate">{player.name}</CardTitle>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Rain toggle — only shown when player is enabled and not disabled */}
                  {isEnabled && !disabled && (
                    <button
                      type="button"
                      onClick={() => toggleRain(player.id)}
                      title="Predict game rained off"
                      className={`text-base px-2 py-0.5 rounded-md border transition-colors ${
                        isRained
                          ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
                          : "border-muted text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"
                      }`}
                    >
                      🌧️
                    </button>
                  )}

                  {/* Enabled checkbox */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      className={`h-5 w-5 rounded border ${
                        isEnabled
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      } flex items-center justify-center text-xs`}
                    >
                      {isEnabled && "✓"}
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isEnabled && (
              <CardContent>
                {isRained ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                    🌧️ <span>Predicting game rained off — all stats set to 0</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {statFields.map((stat) => (
                      <div key={stat.key} className="space-y-1">
                        <label className="text-xs text-muted-foreground text-center block">
                          {stat.emoji} {stat.label}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={values[player.id]?.[stat.key] ?? 0}
                          onChange={(e) =>
                            updateValue(player.id, stat.key, e.target.value)
                          }
                          disabled={disabled}
                          className="text-center h-9"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={saving || enabledPlayers.size === 0}
          className="w-full"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving
            ? "Saving..."
            : `Save Predictions (${enabledPlayers.size} player${
                enabledPlayers.size !== 1 ? "s" : ""
              })`}
        </Button>
      )}
    </div>
  );
}
