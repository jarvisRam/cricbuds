import { getPointsForRank } from "./constants";

interface Prediction {
  predictorId: string;
  targetId: string;
  predRuns: number;
  predWickets: number;
  predCatches: number;
  predMissed: number;
  predRainedOff: boolean;
}

interface ActualStat {
  userId: string;
  runs: number;
  wickets: number;
  catches: number;
  missed: number;
  rainedOff: boolean;
}

export interface RankedResult {
  userId: string;
  totalDiff: number;
  accuracy: number;
  rank: number;
  points: number;
}

export function calculateResults(
  predictions: Prediction[],
  actuals: ActualStat[]
): RankedResult[] {
  const actualsByUser = new Map(actuals.map((a) => [a.userId, a]));

  const grouped = new Map<string, Prediction[]>();
  for (const pred of predictions) {
    const list = grouped.get(pred.predictorId) ?? [];
    list.push(pred);
    grouped.set(pred.predictorId, list);
  }

  const scores: { userId: string; totalDiff: number; accuracy: number }[] = [];

  for (const [predictorId, preds] of grouped) {
    let totalDiff = 0;
    let maxPossible = 0;
    let validPredictions = 0;

    for (const pred of preds) {
      const actual = actualsByUser.get(pred.targetId);
      if (!actual) continue;
      validPredictions++;

      const bothRain = pred.predRainedOff && actual.rainedOff;

      if (bothRain) {
        // Perfect rain prediction — treat as 4 perfectly predicted stats
        maxPossible += 4;
      } else {
        totalDiff += Math.abs(pred.predRuns - actual.runs);
        totalDiff += Math.abs(pred.predWickets - actual.wickets);
        totalDiff += Math.abs(pred.predCatches - actual.catches);
        totalDiff += Math.abs(pred.predMissed - actual.missed);
        maxPossible += Math.max(pred.predRuns, actual.runs);
        maxPossible += Math.max(pred.predWickets, actual.wickets);
        maxPossible += Math.max(pred.predCatches, actual.catches);
        maxPossible += Math.max(pred.predMissed, actual.missed);
      }
    }

    if (validPredictions > 0) {
      const accuracy =
        maxPossible > 0
          ? Math.max(0, Math.round(100 * (1 - totalDiff / maxPossible)))
          : 100; // All predictions were correct rain calls
      scores.push({ userId: predictorId, totalDiff, accuracy });
    }
  }

  scores.sort((a, b) => a.totalDiff - b.totalDiff);

  const ranked: RankedResult[] = [];
  let currentRank = 1;
  for (let i = 0; i < scores.length; i++) {
    if (i > 0 && scores[i].totalDiff > scores[i - 1].totalDiff) {
      currentRank = i + 1;
    }
    ranked.push({
      userId: scores[i].userId,
      totalDiff: scores[i].totalDiff,
      accuracy: scores[i].accuracy,
      rank: currentRank,
      points: getPointsForRank(currentRank),
    });
  }

  return ranked;
}
