# Database Schema

## Overview

Stride uses PostgreSQL with Drizzle ORM. The schema is defined in `db/schema/index.ts`.

## Tables

### users

User accounts with Auth0 identity.

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| auth0_user_id | text | UNIQUE, NOT NULL |
| email | text | NULLABLE |
| username | text | UNIQUE, NULLABLE |
| display_name | text | NULLABLE |
| avatar_url | text | NULLABLE |
| bio | text | NULLABLE |
| timezone | text | NOT NULL, DEFAULT 'UTC' |
| unit_system | enum | NOT NULL, DEFAULT 'metric' |
| is_public | boolean | NOT NULL, DEFAULT true |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() |
| deleted_at | timestamptz | NULLABLE |

**Indexes:**
- `idx_users_auth0_user_id` on (auth0_user_id)
- `idx_users_username` on (username)

### user_settings

Per-user preferences.

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | text | PK, FK → users |
| distance_unit | text | NOT NULL, DEFAULT 'km' |
| pace_unit | text | NOT NULL, DEFAULT 'min/km' |
| week_starts_on | enum | NOT NULL, DEFAULT 'MON' |
| default_run_visibility | enum | NOT NULL, DEFAULT 'private' |
| notifications_enabled | boolean | NOT NULL, DEFAULT true |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() |

### runs

Running activities (source of truth).

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| user_id | text | NOT NULL, FK → users |
| client_run_id | text | NOT NULL |
| status | enum | NOT NULL, DEFAULT 'recording' |
| started_at | timestamptz | NOT NULL |
| ended_at | timestamptz | NULLABLE |
| timezone | text | NOT NULL, DEFAULT 'UTC' |
| title | text | NOT NULL, DEFAULT 'Running Activity' |
| distance_meters | double | NOT NULL, DEFAULT 0 |
| duration_seconds | integer | NOT NULL, DEFAULT 0 |
| moving_duration_seconds | integer | NOT NULL, DEFAULT 0 |
| average_pace_seconds_per_km | integer | NOT NULL, DEFAULT 0 |
| average_speed_mps | double | NOT NULL, DEFAULT 0 |
| max_speed_mps | double | NOT NULL, DEFAULT 0 |
| calories | integer | NOT NULL, DEFAULT 0 |
| elevation_gain_meters | integer | NOT NULL, DEFAULT 0 |
| elevation_loss_meters | integer | NOT NULL, DEFAULT 0 |
| start_latitude | double | NULLABLE |
| start_longitude | double | NULLABLE |
| end_latitude | double | NULLABLE |
| end_longitude | double | NULLABLE |
| route_polyline | text | NULLABLE |
| notes | text | NULLABLE |
| visibility | enum | NOT NULL, DEFAULT 'private' |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() |
| deleted_at | timestamptz | NULLABLE |

**Indexes:**
- `idx_runs_user_id` on (user_id)
- `idx_runs_started_at` on (started_at)
- `idx_runs_status` on (status)
- `idx_runs_user_client_run_id` UNIQUE on (user_id, client_run_id)

### run_track_points

GPS coordinates for runs.

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| run_id | text | NOT NULL, FK → runs |
| sequence | integer | NOT NULL |
| latitude | double | NOT NULL |
| longitude | double | NOT NULL |
| altitude_meters | double | NULLABLE |
| accuracy_meters | double | NULLABLE |
| speed_mps | double | NULLABLE |
| heading_degrees | double | NULLABLE |
| recorded_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |

**Indexes:**
- `idx_run_track_points_run_id` on (run_id)
- `idx_run_track_points_run_sequence` UNIQUE on (run_id, sequence)
- `idx_run_track_points_run_recorded_at` on (run_id, recorded_at)

### run_pause_periods

Pause tracking for runs.

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| run_id | text | NOT NULL, FK → runs |
| started_at | timestamptz | NOT NULL |
| ended_at | timestamptz | NULLABLE |
| duration_seconds | integer | NULLABLE |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |

**Indexes:**
- `idx_run_pause_periods_run_id` on (run_id)

### run_splits

Kilometer splits.

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| run_id | text | NOT NULL, FK → runs |
| split_number | integer | NOT NULL |
| distance_meters | double | NOT NULL |
| duration_seconds | integer | NOT NULL |
| pace_seconds_per_km | integer | NOT NULL |
| elevation_gain_meters | integer | NOT NULL, DEFAULT 0 |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |

**Indexes:**
- `idx_run_splits_run_id` on (run_id)
- `idx_run_splits_run_split_number` UNIQUE on (run_id, split_number)

### daily_activities

Aggregated daily stats for contribution graph.

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK |
| user_id | text | NOT NULL, FK → users |
| activity_date | text | NOT NULL (YYYY-MM-DD) |
| run_count | integer | NOT NULL, DEFAULT 0 |
| total_distance_meters | double | NOT NULL, DEFAULT 0 |
| total_duration_seconds | integer | NOT NULL, DEFAULT 0 |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() |

**Indexes:**
- `idx_daily_activities_user_id` on (user_id)
- `idx_daily_activities_user_date` UNIQUE on (user_id, activity_date)

## Enums

### run_status
- `recording` - Run is in progress
- `paused` - Run is paused
- `completed` - Run is finished
- `discarded` - Run was cancelled

### unit_system
- `metric` - Kilometers, meters
- `imperial` - Miles, feet

### visibility
- `private` - Only visible to owner
- `public` - Visible on public profile

### week_starts_on
- `MON` - Monday
- `TUE` - Tuesday
- `WED` - Wednesday
- `THU` - Thursday
- `FRI` - Friday
- `SAT` - Saturday
- `SUN` - Sunday

## Migrations

### Generate Migration
```bash
npm run db:generate
```

### Run Migration
```bash
npm run db:migrate
```

### Push Schema (Development)
```bash
npm run db:push
```

### Studio (Visual Editor)
```bash
npm run db:studio
```

## Seed Data

```bash
npm run db:seed
```

Creates:
- 1 test user (auth0_user_id: "auth0|test_user_123")
- 5 sample runs across multiple dates
- Daily activity records
