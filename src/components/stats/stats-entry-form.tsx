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
  const [values, setValues] = useState<StatsValues>(
    existing ?? { runs: 0, wickets: 0, catches: 0, missed: 0 }
  );

  function updateValue(field: keyof StatsValues, value: string) {
    const num = parseInt(value) || 0;
    setValues((prev) => ({ ...prev, [field]: Math.max(0, num) }));
  }

  async function handleSubmit() {
    setSaving(true);
    await fetch(`/api/contests/${contestId}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
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

        {statFields.map((stat) => (
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
        ))}

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
