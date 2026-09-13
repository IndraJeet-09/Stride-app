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

export const syncStatusEnum = pgEnum("sync_status", [
  "idle",
  "syncing",
  "complete",
  "failed",
  "reconnect_required",
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

// Strava connections table
export const stravaConnections = pgTable(
  "strava_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stravaAthleteId: text("strava_athlete_id").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    grantedScopes: text("granted_scopes").notNull().default(""),
    syncStatus: syncStatusEnum("sync_status").notNull().default("idle"),
    lastSyncStartedAt: timestamp("last_sync_started_at", { withTimezone: true }),
    lastSyncCompletedAt: timestamp("last_sync_completed_at", { withTimezone: true }),
    lastSyncError: text("last_sync_error"),
    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    disconnectedAt: timestamp("disconnected_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_strava_connections_user_id").on(table.userId),
    uniqueIndex("idx_strava_connections_athlete_id").on(table.stravaAthleteId),
  ]
);

// Runs table (stores imported Strava activity data)
export const runs = pgTable(
  "runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stravaActivityId: text("strava_activity_id"),
    name: text("name").notNull().default("Running Activity"),
    activityType: text("activity_type").notNull().default("Run"),
    sportType: text("sport_type").notNull().default("Run"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("UTC"),
    distanceMeters: doublePrecision("distance_meters").notNull().default(0),
    movingDurationSeconds: integer("moving_duration_seconds")
      .notNull()
      .default(0),
    elapsedTimeSeconds: integer("elapsed_time_seconds").notNull().default(0),
    averageSpeedMps: doublePrecision("average_speed_mps").notNull().default(0),
    maxSpeedMps: doublePrecision("max_speed_mps").notNull().default(0),
    averagePaceSecondsPerKm: integer("average_pace_seconds_per_km")
      .notNull()
      .default(0),
    elevationGainMeters: doublePrecision("elevation_gain_meters")
      .notNull()
      .default(0),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    calories: integer("calories").notNull().default(0),
    trainer: boolean("trainer").notNull().default(false),
    commute: boolean("commute").notNull().default(false),
    private: boolean("private").notNull().default(false),
    stravaUrl: text("strava_url"),
    startedAtLocal: timestamp("started_at_local", { withTimezone: true }),
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
    index("idx_runs_activity_type").on(table.activityType),
    uniqueIndex("idx_runs_strava_activity_id").on(table.stravaActivityId),
    uniqueIndex("idx_runs_user_strava_activity").on(
      table.userId,
      table.stravaActivityId
    ),
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
export type StravaConnection = typeof stravaConnections.$inferSelect;
export type NewStravaConnection = typeof stravaConnections.$inferInsert;
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type DailyActivity = typeof dailyActivities.$inferSelect;
