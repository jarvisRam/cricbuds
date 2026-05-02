"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Trash2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);

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

  async function deleteContest() {
    if (!confirm("Delete this contest? This will also remove all predictions. This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/contests/${contestId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete contest");
      setDeleting(false);
    }
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
    <div className="flex flex-col gap-2">
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

      {currentStatus === "open" && (
        <Button
          onClick={deleteContest}
          disabled={deleting}
          variant="ghost"
          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Contest"}
        </Button>
      )}
    </div>
  );
}
