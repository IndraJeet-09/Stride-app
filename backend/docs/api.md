# API Documentation

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <auth0_access_token>
```

## Response Format

### Success
```json
{
  "data": { ... }
}
```

### Error
```json
{
  "error": {
    "code": "RUN_NOT_FOUND",
    "message": "Run not found",
    "requestId": "req_abc123"
  }
}
```

## Endpoints

### Auth

#### GET /auth/me
Get or create user from Auth0 token.

**Response:**
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "username": "runner123",
      "displayName": "Runner",
      "avatarUrl": "https://...",
      "bio": "I run",
      "timezone": "Asia/Kolkata",
      "unitSystem": "metric",
      "isPublic": true
    }
  }
}
```

### Runs

#### POST /runs
Start a new run.

**Request:**
```json
{
  "clientRunId": "uuid-from-mobile",
  "startedAt": "2026-09-12T06:45:00+05:30",
  "timezone": "Asia/Kolkata",
  "title": "Morning Run"
}
```

**Response (201):**
```json
{
  "data": {
    "run": {
      "id": "run_abc123",
      "status": "recording",
      "startedAt": "2026-09-12T01:15:00Z",
      "title": "Morning Run"
    }
  }
}
```

#### GET /runs
List user's runs with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string: recording, paused, completed, discarded)
- `sort` (string: asc, desc, default: desc)

**Response:**
```json
{
  "data": [
    {
      "id": "run_abc123",
      "title": "Morning Run",
      "status": "completed",
      "startedAt": "2026-09-12T01:15:00Z",
      "distanceMeters": 8420,
      "durationSeconds": 2551,
      "averagePaceSecondsPerKm": 303,
      "elevationGainMeters": 84,
      "calories": 606,
      "visibility": "private"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 82,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### GET /runs/:id
Get run detail.

**Response:**
```json
{
  "data": {
    "id": "run_abc123",
    "title": "Morning Run",
    "status": "completed",
    "startedAt": "2026-09-12T01:15:00Z",
    "endedAt": "2026-09-12T01:57:31Z",
    "timezone": "Asia/Kolkata",
    "distanceMeters": 8420,
    "durationSeconds": 2551,
    "movingDurationSeconds": 2551,
    "averagePaceSecondsPerKm": 303,
    "averageSpeedMps": 3.3,
    "maxSpeedMps": 4.2,
    "elevationGainMeters": 84,
    "elevationLossMeters": 78,
    "calories": 606,
    "startLatitude": 12.9716,
    "startLongitude": 77.5946,
    "endLatitude": 12.9716,
    "endLongitude": 77.5946,
    "routePolyline": "...",
    "notes": null,
    "visibility": "private"
  }
}
```

#### POST /runs/:id/pause
Pause an active run.

**Response:**
```json
{
  "data": {
    "run": {
      "id": "run_abc123",
      "status": "paused",
      "startedAt": "2026-09-12T01:15:00Z"
    }
  }
}
```

#### POST /runs/:id/resume
Resume a paused run.

**Response:**
```json
{
  "data": {
    "run": {
      "id": "run_abc123",
      "status": "recording",
      "startedAt": "2026-09-12T01:15:00Z"
    }
  }
}
```

#### POST /runs/:id/finish
Finish a run and calculate metrics.

**Request:**
```json
{
  "endedAt": "2026-09-12T01:57:31+05:30",
  "notes": "Great run!"
}
```

**Response:**
```json
{
  "data": {
    "run": {
      "id": "run_abc123",
      "status": "completed",
      "startedAt": "2026-09-12T01:15:00Z",
      "endedAt": "2026-09-12T01:57:31Z",
      "distanceMeters": 8420,
      "durationSeconds": 2551,
      "movingDurationSeconds": 2551,
      "averagePaceSecondsPerKm": 303,
      "elevationGainMeters": 84,
      "elevationLossMeters": 78,
      "calories": 606
    }
  }
}
```

#### POST /runs/:id/discard
Discard an unfinished run.

**Response:**
```json
{
  "data": {
    "run": {
      "id": "run_abc123",
      "status": "discarded"
    }
  }
}
```

#### POST /runs/:id/track-points
Batch ingest GPS track points.

**Request:**
```json
{
  "points": [
    {
      "sequence": 1,
      "latitude": 12.9716,
      "longitude": 77.5946,
      "altitudeMeters": 812,
      "accuracyMeters": 8,
      "speedMps": 2.8,
      "headingDegrees": 180,
      "recordedAt": "2026-09-12T01:15:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "acceptedCount": 1,
    "totalBatch": 1,
    "lastSequence": 1
  }
}
```

### Dashboard

#### GET /dashboard
Get aggregated home screen data.

**Response:**
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "username": "runner123",
      "displayName": "Runner"
    },
    "streak": {
      "current": 6,
      "longest": 18,
      "currentStreakStartDate": "2026-09-07",
      "lastActiveDate": "2026-09-12"
    },
    "weekly": {
      "distanceMeters": 18400,
      "durationSeconds": 6400,
      "runCount": 4
    },
    "monthly": {
      "distanceMeters": 84200,
      "runCount": 12
    },
    "recentRun": {
      "id": "run_abc123",
      "title": "Morning Run",
      "distanceMeters": 8420,
      "durationSeconds": 2551,
      "averagePaceSecondsPerKm": 303,
      "startedAt": "2026-09-12T01:15:00Z"
    },
    "contributionPreview": [...],
    "stats": {
      "totalRuns": 82,
      "totalDistanceMeters": 431200,
      "totalDurationSeconds": 154200,
      "longestRunMeters": 12800,
      "fastestPaceSecondsPerKm": 250
    }
  }
}
```

### Contributions

#### GET /contributions
Get contribution graph data for a year.

**Query Parameters:**
- `year` (number, required)

**Response:**
```json
{
  "data": {
    "year": 2026,
    "timezone": "UTC",
    "days": [
      {
        "date": "2026-01-01",
        "runCount": 0,
        "distanceMeters": 0,
        "level": 0
      },
      {
        "date": "2026-09-12",
        "runCount": 1,
        "distanceMeters": 8420,
        "level": 3
      }
    ]
  }
}
```

**Contribution Levels:**
- 0: No activity
- 1: < 3 km
- 2: 3-6 km
- 3: 6-10 km
- 4: > 10 km

### Statistics

#### GET /stats/overview
Get user statistics.

**Response:**
```json
{
  "data": {
    "overview": {
      "totalRuns": 82,
      "totalDistanceMeters": 431200,
      "totalDurationSeconds": 154200,
      "averageDistanceMeters": 5258,
      "averagePaceSecondsPerKm": 303,
      "longestRunMeters": 12800,
      "fastestPaceSecondsPerKm": 250,
      "currentStreak": 6,
      "longestStreak": 18,
      "runsThisWeek": 4,
      "distanceThisWeekMeters": 18400,
      "distanceThisMonthMeters": 84200,
      "distanceThisYearMeters": 431200
    },
    "personalRecords": {
      "fastest1k": 240,
      "fastest5k": 1350,
      "fastest10k": 2900,
      "longestRunMeters": 12800,
      "highestElevationMeters": 120
    }
  }
}
```

### Users

#### GET /users/:username
Get public profile.

**Response:**
```json
{
  "data": {
    "id": "usr_abc123",
    "username": "runner123",
    "displayName": "Runner",
    "avatarUrl": "https://...",
    "bio": "I run",
    "createdAt": "2026-01-01T00:00:00Z",
    "stats": {
      "totalRuns": 82,
      "totalDistanceMeters": 431200,
      "currentStreak": 6,
      "longestStreak": 18
    },
    "recentRuns": [
      {
        "id": "run_abc123",
        "title": "Morning Run",
        "distanceMeters": 8420,
        "startedAt": "2026-09-12T01:15:00Z"
      }
    ]
  }
}
```

### Account

#### GET /account/export
Request data export.

**Response:**
```json
{
  "data": {
    "message": "Data export is being prepared",
    "estimatedTime": "5-10 minutes",
    "downloadUrl": null
  }
}
```

#### DELETE /account/deletion
Request account deletion.

**Response:**
```json
{
  "data": {
    "message": "Account deletion request received",
    "gracePeriod": "30 days",
    "note": "Your account will be permanently deleted after 30 days."
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHENTICATED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Invalid request data |
| NOT_FOUND | 404 | Resource not found |
| RUN_NOT_FOUND | 404 | Run not found |
| INVALID_RUN_STATE | 409 | Invalid state transition |
| DUPLICATE_CLIENT_RUN | 409 | Run with clientRunId exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
