export const CONTEST_STATUS = {
  OPEN: "open",
  LOCKED: "locked",
  REVEALED: "revealed",
} as const;

export type ContestStatus =
  (typeof CONTEST_STATUS)[keyof typeof CONTEST_STATUS];

export const POINTS_BY_RANK: Record<number, number> = {
  1: 10,
  2: 7,
  3: 5,
  4: 3,
  5: 2,
};

export const DEFAULT_POINTS = 1;

export function getPointsForRank(rank: number): number {
  return POINTS_BY_RANK[rank] ?? DEFAULT_POINTS;
}
