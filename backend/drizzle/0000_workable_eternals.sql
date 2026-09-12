CREATE TYPE "public"."run_status" AS ENUM('recording', 'paused', 'completed', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."week_starts_on" AS ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');--> statement-breakpoint
CREATE TABLE "daily_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_date" text NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"total_distance_meters" double precision DEFAULT 0 NOT NULL,
	"total_duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_pause_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"split_number" integer NOT NULL,
	"distance_meters" double precision NOT NULL,
	"duration_seconds" integer NOT NULL,
	"pace_seconds_per_km" integer NOT NULL,
	"elevation_gain_meters" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_track_points" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"altitude_meters" double precision,
	"accuracy_meters" double precision,
	"speed_mps" double precision,
	"heading_degrees" double precision,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_run_id" text NOT NULL,
	"status" "run_status" DEFAULT 'recording' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"title" text DEFAULT 'Running Activity' NOT NULL,
	"distance_meters" double precision DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"moving_duration_seconds" integer DEFAULT 0 NOT NULL,
	"average_pace_seconds_per_km" integer DEFAULT 0 NOT NULL,
	"average_speed_mps" double precision DEFAULT 0 NOT NULL,
	"max_speed_mps" double precision DEFAULT 0 NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"elevation_gain_meters" integer DEFAULT 0 NOT NULL,
	"elevation_loss_meters" integer DEFAULT 0 NOT NULL,
	"start_latitude" double precision,
	"start_longitude" double precision,
	"end_latitude" double precision,
	"end_longitude" double precision,
	"route_polyline" text,
	"notes" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"distance_unit" text DEFAULT 'km' NOT NULL,
	"pace_unit" text DEFAULT 'min/km' NOT NULL,
	"week_starts_on" "week_starts_on" DEFAULT 'MON' NOT NULL,
	"default_run_visibility" "visibility" DEFAULT 'private' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"auth0_user_id" text NOT NULL,
	"email" text,
	"username" text,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"unit_system" "unit_system" DEFAULT 'metric' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_auth0_user_id_unique" UNIQUE("auth0_user_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_pause_periods" ADD CONSTRAINT "run_pause_periods_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_splits" ADD CONSTRAINT "run_splits_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_track_points" ADD CONSTRAINT "run_track_points_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_activities_user_id" ON "daily_activities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_activities_user_date" ON "daily_activities" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_run_pause_periods_run_id" ON "run_pause_periods" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_run_splits_run_id" ON "run_splits" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_run_splits_run_split_number" ON "run_splits" USING btree ("run_id","split_number");--> statement-breakpoint
CREATE INDEX "idx_run_track_points_run_id" ON "run_track_points" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_run_track_points_run_sequence" ON "run_track_points" USING btree ("run_id","sequence");--> statement-breakpoint
CREATE INDEX "idx_run_track_points_run_recorded_at" ON "run_track_points" USING btree ("run_id","recorded_at");--> statement-breakpoint
CREATE INDEX "idx_runs_user_id" ON "runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_runs_started_at" ON "runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_runs_status" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_runs_user_client_run_id" ON "runs" USING btree ("user_id","client_run_id");--> statement-breakpoint
CREATE INDEX "idx_users_auth0_user_id" ON "users" USING btree ("auth0_user_id");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");