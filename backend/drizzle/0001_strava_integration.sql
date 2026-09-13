-- Strava Integration Migration
-- Creates strava_connections table and updates runs table for Strava data

-- Create sync_status enum
CREATE TYPE "public"."sync_status" AS ENUM('idle', 'syncing', 'complete', 'failed', 'reconnect_required');

--> statement-breakpoint
-- Create strava_connections table
CREATE TABLE "strava_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"strava_athlete_id" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"granted_scopes" text DEFAULT '' NOT NULL,
	"sync_status" "sync_status" DEFAULT 'idle' NOT NULL,
	"last_sync_started_at" timestamp with time zone,
	"last_sync_completed_at" timestamp with time zone,
	"last_sync_error" text,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnected_at" timestamp with time zone,
	CONSTRAINT "strava_connections_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "strava_connections_strava_athlete_id_unique" UNIQUE("strava_athlete_id"),
	CONSTRAINT "strava_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Create indexes for strava_connections
CREATE INDEX "idx_strava_connections_user_id" ON "strava_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_strava_connections_athlete_id" ON "strava_connections" USING btree ("strava_athlete_id");--> statement-breakpoint
-- Add new columns to runs table
ALTER TABLE "runs" ADD COLUMN "name" text DEFAULT 'Running Activity' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "activity_type" text DEFAULT 'Run' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "sport_type" text DEFAULT 'Run' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "elapsed_time_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "average_heartrate" double precision;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "max_heartrate" double precision;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "trainer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "commute" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "strava_url" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "started_at_local" timestamp with time zone;--> statement-breakpoint
-- Drop GPS columns that are no longer needed
ALTER TABLE "runs" DROP COLUMN IF EXISTS "start_latitude";--> statement-breakpoint
ALTER TABLE "runs" DROP COLUMN IF EXISTS "start_longitude";--> statement-breakpoint
ALTER TABLE "runs" DROP COLUMN IF EXISTS "end_latitude";--> statement-breakpoint
ALTER TABLE "runs" DROP COLUMN IF EXISTS "end_longitude";--> statement-breakpoint
ALTER TABLE "runs" DROP COLUMN IF EXISTS "elevation_loss_meters";--> statement-breakpoint
-- Drop the old title column (replaced by name)
ALTER TABLE "runs" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
-- Drop status column (no longer needed for Strava imports)
ALTER TABLE "runs" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
-- Drop durationSeconds column (replaced by movingDurationSeconds and elapsedTimeSeconds)
ALTER TABLE "runs" DROP COLUMN IF EXISTS "duration_seconds";--> statement-breakpoint
-- Create composite index for user + strava activity lookups
CREATE UNIQUE INDEX "idx_runs_user_strava_activity" ON "runs" USING btree ("user_id","strava_activity_id");--> statement-breakpoint
-- Create index for activity type filtering
CREATE INDEX "idx_runs_activity_type" ON "runs" USING btree ("activity_type");
