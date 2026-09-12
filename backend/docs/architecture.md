# Stride Backend Architecture

## Overview

Stride is a running tracker inspired by GitHub's contribution graph. The backend is built with Next.js (API routes only), PostgreSQL, and Auth0 for authentication.

## Project Structure

```
backend/
├── app/
│   └── api/
│       └── v1/
│           ├── auth/me/          # GET - Auto-provision user from Auth0 token
│           ├── dashboard/        # GET - Aggregated home screen data
│           ├── runs/             # CRUD + state machine
│           │   ├── [id]/
│           │   │   ├── pause/    # POST - Pause active run
│           │   │   ├── resume/   # POST - Resume paused run
│           │   │   ├── finish/   # POST - Finish run & calculate metrics
│           │   │   ├── discard/  # POST - Discard unfinished run
│           │   │   └── track-points/  # POST - Batch GPS ingestion
│           ├── contributions/    # GET - Yearly contribution graph
│           ├── stats/overview/   # GET - User statistics
│           ├── users/
│           │   └── [username]/   # GET - Public profile
│           └── account/
│               ├── export/       # GET - Data export
│               └── deletion/     # DELETE - Account removal
│
├── db/
│   ├── schema/                   # Drizzle ORM schemas
│   ├── migrations/               # Generated migrations
│   ├── index.ts                  # Database connection
│   └── seed.ts                   # Development seed data
│
├── modules/
│   ├── auth/                     # Auth0 JWT verification & user provisioning
│   ├── users/                    # User settings management
│   ├── runs/                     # Run state machine & CRUD
│   ├── gps/                      # Track point ingestion
│   ├── metrics/                  # Server-side calculation
│   ├── contributions/            # Contribution graph logic
│   ├── streaks/                  # Streak calculation
│   ├── statistics/               # Aggregated stats
│   └── profiles/                 # Public profile logic
│
├── lib/
│   ├── auth0.ts                  # JWKS caching, token verification
│   ├── errors.ts                 # Typed error classes
│   ├── logging.ts                # Structured logger
│   ├── request-id.ts             # Request ID middleware
│   └── geo.ts                    # Haversine, GPS filtering, metrics
│
├── middleware/
│   └── auth.ts                   # requireAuth(), getAuthUser()
│
├── schemas/                      # Zod validation schemas
├── tests/                        # Vitest tests
├── drizzle/                      # Migration files
└── docs/                         # Documentation
```

## Key Design Principles

1. **Auth0 owns identity** - No custom authentication
2. **Runs are source of truth** - Contributions, streaks, stats are derived
3. **Server calculates canonical metrics** - Don't trust client GPS calculations
4. **Idempotency via `clientRunId`** - Critical for offline-first
5. **All derived data is rebuildable** - Algorithms can change

## Data Flow

```
Mobile App
    ↓
POST /api/v1/runs (start)
    ↓
POST /api/v1/runs/:id/track-points (GPS ingestion)
    ↓
POST /api/v1/runs/:id/finish
    ↓
┌─────────────────────────────────┐
│ Server-side calculation:        │
│ 1. Calculate distance (Haversine)│
│ 2. Calculate duration & pace    │
│ 3. Calculate elevation          │
│ 4. Generate splits              │
│ 5. Update daily activity        │
│ 6. Update contribution graph    │
│ 7. Update streaks               │
└─────────────────────────────────┘
    ↓
GET /api/v1/dashboard (aggregated data)
```

## Database Schema

### Canonical Data
- `users` - User profiles (Auth0 identity + Stride data)
- `runs` - Run records (source of truth)
- `run_track_points` - GPS coordinates
- `run_pause_periods` - Pause tracking

### Derived Data
- `daily_activities` - Aggregated daily stats
- `run_splits` - Kilometer splits

## API Design

### Response Format
```json
{
  "data": { ... }
}
```

### Error Format
```json
{
  "error": {
    "code": "RUN_NOT_FOUND",
    "message": "Run not found",
    "requestId": "req_abc123"
  }
}
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <auth0_access_token>
```

## State Machine

### Run States
```
recording → paused → recording → completed
recording → discarded
paused → discarded
```

Invalid transitions return `409 Conflict`.

## Offline Support

1. Mobile generates `clientRunId` (UUID)
2. Run created with `clientRunId`
3. GPS points uploaded in batches
4. Server deduplicates by `(run_id, sequence)`
5. Same `clientRunId` returns existing run (idempotent)

## Metrics Calculation

Server recalculates on finish:
- Distance (Haversine with GPS filtering)
- Duration & moving duration
- Average pace & speed
- Elevation gain/loss
- KM splits

## Performance Targets

- 10,000 users
- 100,000 users
- 1,000,000+ runs

Focus: good indexes, efficient queries, pagination, batch inserts.
