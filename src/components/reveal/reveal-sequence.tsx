"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultItem {
  userId: string;
  userName: string;
  userImage: string | null;
  totalDiff: number;
  accuracy: number | null;
  rank: number;
  points: number;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center text-sm font-bold text-muted-foreground">
      #{rank}
    </span>
  );
}

export function RevealSequence({ results }: { results: ResultItem[] }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const reversed = [...results].reverse();

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#FFD700", "#FFA500", "#FF6347", "#00FF00", "#1E90FF"];

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();
  }, []);

  function startReveal() {
    setIsRevealing(true);
    setRevealedCount(0);
  }

  useEffect(() => {
    if (!isRevealing) return;
    if (revealedCount >= reversed.length) {
      fireConfetti();
      return;
    }
    const timer = setTimeout(
      () => setRevealedCount((c) => c + 1),
      revealedCount === 0 ? 500 : 800
    );
    return () => clearTimeout(timer);
  }, [isRevealing, revealedCount, reversed.length, fireConfetti]);

  if (!isRevealing) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-6xl">🏆</div>
        <p className="text-muted-foreground">Ready to see the results?</p>
        <Button onClick={startReveal} size="lg">
          Reveal Winner
        </Button>

        <div className="w-full space-y-2 mt-4">
          {results.map((r) => (
            <Card key={r.userId}>
              <CardContent className="flex items-center gap-3 py-3">
                <RankIcon rank={r.rank} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.userImage ?? undefined} />
                  <AvatarFallback>
                    {r.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">
                    {r.accuracy != null ? `${r.accuracy}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.points} pts
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4">
      <AnimatePresence>
        {reversed.slice(0, revealedCount).map((r, i) => (
          <motion.div
            key={r.userId}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <Card
              className={
                r.rank === 1
                  ? "border-yellow-500/50 bg-yellow-500/10"
                  : r.rank === 2
                    ? "border-gray-400/50 bg-gray-400/5"
                    : r.rank === 3
                      ? "border-amber-700/50 bg-amber-700/5"
                      : undefined
              }
            >
              <CardContent className="flex items-center gap-3 py-3">
                <RankIcon rank={r.rank} />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={r.userImage ?? undefined} />
                  <AvatarFallback>
                    {r.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      r.rank === 1 ? "text-lg text-yellow-500" : "text-sm"
                    }`}
                  >
                    {r.userName}
                    {r.rank === 1 && " 🏆"}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${r.rank === 1 ? "text-base text-yellow-500" : "text-sm"}`}>
                    {r.accuracy != null ? `${r.accuracy}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.points} pts
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {revealedCount < reversed.length && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-2xl"
          >
            ⏳
          </motion.div>
        </div>
      )}

      {revealedCount >= reversed.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <p className="text-lg font-bold text-yellow-500">
            🎉 {results[0]?.userName} wins!
          </p>
          <p className="text-sm text-muted-foreground">
            {results[0]?.accuracy != null
              ? `${results[0].accuracy}% prediction accuracy`
              : "Most accurate predictor"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
