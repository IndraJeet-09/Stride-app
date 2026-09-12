import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const runStatusEnum = pgEnum("run_status", [
  "recording",
  "paused",
  "completed",
  "discarded",
]);

export const unitSystemEnum = pgEnum("unit_system", ["metric", "imperial"]);

export const visibilityEnum = pgEnum("visibility", ["private", "public"]);

export const weekStartsOnEnum = pgEnum("week_starts_on", [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    auth0UserId: text("auth0_user_id").notNull().unique(),
    email: text("email"),
    username: text("username").unique(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    timezone: text("timezone").notNull().default("UTC"),
    unitSystem: unitSystemEnum("unit_system").notNull().default("metric"),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_users_auth0_user_id").on(table.auth0UserId),
    index("idx_users_username").on(table.username),
  ]
);

// User settings table
export const userSettings = pgTable(
  "user_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    distanceUnit: text("distance_unit").notNull().default("km"),
    paceUnit: text("pace_unit").notNull().default("min/km"),
    weekStartsOn: weekStartsOnEnum("week_starts_on").notNull().default("MON"),
    defaultRunVisibility: visibilityEnum("default_run_visibility")
      .notNull()
      .default("private"),
    notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

// Runs table
export const runs = pgTable(
  "runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientRunId: text("client_run_id").notNull(),
    status: runStatusEnum("status").notNull().default("recording"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("UTC"),
    title: text("title").notNull().default("Running Activity"),
    distanceMeters: doublePrecision("distance_meters").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    movingDurationSeconds: integer("moving_duration_seconds")
      .notNull()
      .default(0),
    averagePaceSecondsPerKm: integer("average_pace_seconds_per_km")
      .notNull()
      .default(0),
    averageSpeedMps: doublePrecision("average_speed_mps").notNull().default(0),
    maxSpeedMps: doublePrecision("max_speed_mps").notNull().default(0),
    calories: integer("calories").notNull().default(0),
    elevationGainMeters: integer("elevation_gain_meters").notNull().default(0),
    elevationLossMeters: integer("elevation_loss_meters").notNull().default(0),
    startLatitude: doublePrecision("start_latitude"),
    startLongitude: doublePrecision("start_longitude"),
    endLatitude: doublePrecision("end_latitude"),
    endLongitude: doublePrecision("end_longitude"),
    routePolyline: text("route_polyline"),
    notes: text("notes"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_runs_user_id").on(table.userId),
    index("idx_runs_started_at").on(table.startedAt),
    index("idx_runs_status").on(table.status),
    uniqueIndex("idx_runs_user_client_run_id").on(table.userId, table.clientRunId),
  ]
);

// Run track points table
export const runTrackPoints = pgTable(
  "run_track_points",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    altitudeMeters: doublePrecision("altitude_meters"),
    accuracyMeters: doublePrecision("accuracy_meters"),
    speedMps: doublePrecision("speed_mps"),
    headingDegrees: doublePrecision("heading_degrees"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_run_track_points_run_id").on(table.runId),
    uniqueIndex("idx_run_track_points_run_sequence").on(table.runId, table.sequence),
    index("idx_run_track_points_run_recorded_at").on(table.runId, table.recordedAt),
  ]
);

// Run pause periods table
export const runPausePeriods = pgTable(
  "run_pause_periods",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_run_pause_periods_run_id").on(table.runId)]
);

// Run splits table
export const runSplits = pgTable(
  "run_splits",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    splitNumber: integer("split_number").notNull(),
    distanceMeters: doublePrecision("distance_meters").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    paceSecondsPerKm: integer("pace_seconds_per_km").notNull(),
    elevationGainMeters: integer("elevation_gain_meters").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_run_splits_run_id").on(table.runId),
    uniqueIndex("idx_run_splits_run_split_number").on(table.runId, table.splitNumber),
  ]
);

// Daily activities table
export const dailyActivities = pgTable(
  "daily_activities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: text("activity_date").notNull(),
    runCount: integer("run_count").notNull().default(0),
    totalDistanceMeters: doublePrecision("total_distance_meters")
      .notNull()
      .default(0),
    totalDurationSeconds: integer("total_duration_seconds")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_daily_activities_user_id").on(table.userId),
    uniqueIndex("idx_daily_activities_user_date").on(table.userId, table.activityDate),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type RunTrackPoint = typeof runTrackPoints.$inferSelect;
export type RunPausePeriod = typeof runPausePeriods.$inferSelect;
export type RunSplit = typeof runSplits.$inferSelect;
export type DailyActivity = typeof dailyActivities.$inferSelect;
