# Nex98usCode

A gamified coding learning platform built to make learning to code engaging, progressive, and rewarding.

## Features

- **Curriculum** — Structured coding lessons with an interactive code editor (Monaco + CodeMirror)
- **Nexus Path** — Visual learning roadmap tracking your progression
- **Games** — Coding challenges and mini-games to reinforce concepts
- **Playground** — Free-form code sandbox for experimentation
- **Leaderboard** — Compete with other learners
- **Achievements** — Unlock badges and rewards as you progress
- **Store** — Spend earned points on cosmetics and profile items
- **Profile & Calling Cards** — Customisable profile with emblem/calling card system
- **Energy System** — Hearts-based energy mechanic tied to lesson attempts
- **Onboarding** — Guided setup flow for new users
- **Free Tier with Ads** — The free tier is ad-supported to keep NexusCode free for everyone. Upgrading to Pro removes ads entirely.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, CSS Modules |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL via TypeORM |
| Auth | JWT (access tokens, bcrypt password hashing) |
| Security | Helmet, global rate limiting (Throttler), input validation (class-validator) |
| DevOps | Docker Compose |

## Project Structure

```
nexuscode-app/
├── frontend/   # Next.js App Router frontend
├── backend/    # NestJS REST API
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- PostgreSQL (or use Docker Compose)

### Environment Variables

Copy the example env files and fill in your own values. **Never commit `.env` files.**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Required backend variables: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `NODE_ENV`.

### Installation

```bash
# Install root helper scripts (dev/build/seed)
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Running with Docker (recommended)

```bash
docker compose up
```

### Running locally

```bash
# From project root (recommended)
npm run dev

# Or run each service manually
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

`npm run dev` automatically runs a preflight that clears stale listeners on ports `3000` and `3001` before starting both services.

## Security

- Passwords are hashed with bcrypt before storage — plaintext passwords are never persisted
- All API routes are rate-limited globally; authentication endpoints have a stricter limit
- HTTP security headers are set via Helmet
- Database credentials and secrets are loaded exclusively from environment variables
- `synchronize: true` (auto-migration) is disabled in production
- Backend startup performs fail-fast production env validation (`DB_*`, `JWT_SECRET`, `FRONTEND_URL`) and refuses to boot on invalid/missing values, weak or default DB passwords, the `postgres` superuser, and a remote DB without `DB_SSL=true`
- Dev Postgres is bound to `127.0.0.1` only; production uses `docker-compose.prod.yml`, which publishes no database port and requires all secrets from the environment

## Health Check

- Backend liveness/readiness endpoint: `GET /api/health`
- Example local URL: `http://localhost:3001/api/health`
- Returns `200` with `{ status: "ok", database: "up", ... }` when API + DB are healthy

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes.

## License

MIT — see [LICENSE](LICENSE) for details.