# Stride

Your runs. Your contributions.

A running tracker inspired by GitHub's contribution graph.

## Architecture

```
stride/
├── mobile/                  # Expo React Native application
│   ├── app/                 # Expo Router pages
│   ├── components/          # UI components
│   ├── lib/                 # Utilities and API client
│   └── ...
│
└── backend/                 # Next.js API server
    ├── app/api/v1/          # REST API endpoints
    ├── db/                  # Drizzle ORM schema & migrations
    ├── modules/             # Business logic modules
    ├── lib/                 # Shared utilities
    ├── middleware/           # Auth & request middleware
    ├── schemas/             # Zod validation schemas
    └── tests/               # Vitest tests
```

## Tech Stack

### Mobile
- Expo SDK 52
- React Native 0.76
- Expo Router
- NativeWind (TailwindCSS)
- Auth0 (Authentication)

### Backend
- Next.js 15 (API routes only)
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod (validation)
- Auth0 (JWT verification)
- Vitest (testing)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Auth0 account

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your Auth0 and PostgreSQL credentials
npm run db:generate
npm run db:migrate
npm run dev
```

## Documentation

- [Architecture](docs/architecture.md)
- [Auth0 Setup](docs/auth0-setup.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Offline Sync](docs/offline-sync.md)
- [Contribution System](docs/contribution-system.md)

## License

MIT
