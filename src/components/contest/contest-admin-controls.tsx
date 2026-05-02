"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

export function ContestAdminControls({
  contestId,
  currentStatus,
  isDeadlinePast,
}: {
  contestId: string;
  currentStatus: string;
  isDeadlinePast: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function lockContest() {
    setLoading(true);
    await fetch(`/api/contests/${contestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "locked" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function revealContest() {
    setLoading(true);
    const res = await fetch(`/api/contests/${contestId}/reveal`, {
      method: "POST",
    });
    if (res.ok) {
      router.push(`/contest/${contestId}/reveal`);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reveal");
      setLoading(false);
    }
  }

  if (currentStatus === "revealed") return null;

  return (
    <div className="flex gap-2">
      {currentStatus === "open" && (
        <Button
          onClick={lockContest}
          disabled={loading}
          variant="secondary"
          className="flex-1"
        >
          <Lock className="mr-2 h-4 w-4" />
          {loading ? "Locking..." : "Lock Predictions"}
        </Button>
      )}

      {(currentStatus === "locked" ||
        (currentStatus === "open" && isDeadlinePast)) && (
        <Button
          onClick={revealContest}
          disabled={loading}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Revealing..." : "Reveal Winner"}
        </Button>
      )}
    </div>
  );
}
