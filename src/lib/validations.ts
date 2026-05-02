import { z } from "zod/v4";

export const createContestSchema = z.object({
  weekLabel: z.string().min(1),
  deadline: z.string().datetime(),
});

export const updateContestStatusSchema = z.object({
  status: z.enum(["open", "locked", "revealed"]),
});

export const predictionSchema = z.object({
  predictions: z.array(
    z.object({
      targetId: z.string().uuid(),
      predRuns: z.number().int().min(0),
      predWickets: z.number().int().min(0),
      predCatches: z.number().int().min(0),
      predMissed: z.number().int().min(0),
    })
  ),
});

export const statsSchema = z.object({
  runs: z.number().int().min(0),
  wickets: z.number().int().min(0),
  catches: z.number().int().min(0),
  missed: z.number().int().min(0),
});

export const addPlayerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});
