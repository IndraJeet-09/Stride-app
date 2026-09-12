# Stride Backend

Production-quality backend for the Stride running tracker app.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Auth0 and PostgreSQL credentials

# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:4000/api/v1`.

## Tech Stack

- **Runtime**: Next.js 15 (API routes only)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Auth0 (JWT verification)
- **Validation**: Zod
- **Logging**: Pino (structured)
- **Testing**: Vitest

## Project Structure

```
backend/
├── app/api/v1/          # REST API endpoints
├── db/                  # Schema, migrations, seed
├── modules/             # Business logic
├── lib/                 # Shared utilities
├── middleware/           # Auth middleware
├── schemas/             # Zod validation
├── tests/               # Tests
└── docs/                # Documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/me | Get/create user from token |
| POST | /runs | Start a new run |
| GET | /runs | List runs (paginated) |
| GET | /runs/:id | Get run detail |
| POST | /runs/:id/pause | Pause run |
| POST | /runs/:id/resume | Resume run |
| POST | /runs/:id/finish | Finish run |
| POST | /runs/:id/discard | Discard run |
| POST | /runs/:id/track-points | Batch GPS upload |
| GET | /dashboard | Home screen data |
| GET | /contributions?year= | Contribution graph |
| GET | /stats/overview | User statistics |
| GET | /users/:username | Public profile |
| GET | /account/export | Request data export |
| DELETE | /account/deletion | Request account deletion |

## Documentation

- [Architecture](docs/architecture.md)
- [Auth0 Setup](docs/auth0-setup.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Offline Sync](docs/offline-sync.md)
- [Contribution System](docs/contribution-system.md)

## Development

```bash
npm run dev          # Start dev server on port 4000
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run linter
```

## Database

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed development data
```

## Production

```bash
npm run build        # Build for production
npm run start        # Start production server
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## License

MIT
