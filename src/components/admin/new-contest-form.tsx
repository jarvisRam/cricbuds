"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

export function NewContestForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [weekLabel, setWeekLabel] = useState("");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weekLabel || !deadline) return;

    setSaving(true);
    const res = await fetch("/api/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekLabel,
        deadline: new Date(deadline).toISOString(),
      }),
    });

    if (res.ok) {
      const contest = await res.json();
      router.push(`/contest/${contest.id}`);
    } else {
      alert("Failed to create contest");
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekLabel">Week / Round Name</Label>
            <Input
              id="weekLabel"
              placeholder="e.g., Week 5, Round 3"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prediction Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Players can place predictions until this time
            </p>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {saving ? "Creating..." : "Create Contest"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
