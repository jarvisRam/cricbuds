"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface StatsValues {
  runs: number;
  wickets: number;
  catches: number;
  missed: number;
  rainedOff: boolean;
}

const statFields = [
  { key: "runs" as const, label: "Runs Scored", emoji: "🏏" },
  { key: "wickets" as const, label: "Wickets Taken", emoji: "🎯" },
  { key: "catches" as const, label: "Catches Taken", emoji: "🧤" },
  { key: "missed" as const, label: "Catches Missed", emoji: "❌" },
];

export function StatsEntryForm({
  contestId,
  existing,
  disabled,
}: {
  contestId: string;
  existing: StatsValues | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [rainedOff, setRainedOff] = useState(existing?.rainedOff ?? false);
  const [values, setValues] = useState<Omit<StatsValues, "rainedOff">>(
    existing ?? { runs: 0, wickets: 0, catches: 0, missed: 0 }
  );

  function updateValue(field: keyof Omit<StatsValues, "rainedOff">, value: string) {
    const num = parseInt(value) || 0;
    setValues((prev) => ({ ...prev, [field]: Math.max(0, num) }));
  }

  async function handleSubmit() {
    setSaving(true);
    await fetch(`/api/contests/${contestId}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rainedOff }),
    });
    router.push(`/contest/${contestId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {existing && (
          <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span>Stats submitted — you can update them until reveal</span>
          </div>
        )}

        {/* Rained off toggle */}
        {!disabled && (
          <button
            type="button"
            onClick={() => setRainedOff((v) => !v)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors text-sm font-medium ${
              rainedOff
                ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
                : "border-muted text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"
            }`}
          >
            🌧️ {rainedOff ? "Game Rained Off (tap to undo)" : "Game Rained Off?"}
          </button>
        )}

        {rainedOff ? (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <p className="text-blue-400 font-medium">🌧️ Rained off</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone who predicted rain for you gets full marks
            </p>
          </div>
        ) : (
          statFields.map((stat) => (
            <div key={stat.key} className="space-y-1">
              <label className="text-sm font-medium">
                {stat.emoji} {stat.label}
              </label>
              <Input
                type="number"
                min={0}
                value={values[stat.key]}
                onChange={(e) => updateValue(stat.key, e.target.value)}
                disabled={disabled}
                className="text-lg h-12"
              />
            </div>
          ))
        )}

        {!disabled && (
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving
              ? "Saving..."
              : existing
                ? "Update Stats"
                : "Submit Stats"}
          </Button>
        )}

        {disabled && (
          <p className="text-sm text-muted-foreground text-center">
            This contest has been revealed — stats are locked
          </p>
        )}
      </CardContent>
    </Card>
  );
}
