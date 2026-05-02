import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  image: text("image"),
  role: text("role", { enum: ["admin", "player"] })
    .notNull()
    .default("player"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contests = pgTable("contests", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekLabel: text("week_label").notNull(),
  status: text("status", { enum: ["open", "locked", "revealed"] })
    .notNull()
    .default("open"),
  deadline: timestamp("deadline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revealedAt: timestamp("revealed_at"),
});

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    predictorId: uuid("predictor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    predRuns: integer("pred_runs").notNull().default(0),
    predWickets: integer("pred_wickets").notNull().default(0),
    predCatches: integer("pred_catches").notNull().default(0),
    predMissed: integer("pred_missed").notNull().default(0),
    predRainedOff: boolean("pred_rained_off").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.contestId, t.predictorId, t.targetId)]
);

export const actualStats = pgTable(
  "actual_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    runs: integer("runs").notNull().default(0),
    wickets: integer("wickets").notNull().default(0),
    catches: integer("catches").notNull().default(0),
    missed: integer("missed").notNull().default(0),
    rainedOff: boolean("rained_off").notNull().default(false),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.contestId, t.userId)]
);

export const results = pgTable(
  "results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalDiff: integer("total_diff").notNull(),
    rank: integer("rank").notNull(),
    points: integer("points").notNull().default(0),
  },
  (t) => [unique().on(t.contestId, t.userId)]
);
