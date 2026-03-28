# Backend — Logic Looper API

## Setup

```bash
cd backend
npm install
```

## Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

### Required Variables
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `CORS_ORIGIN` | Frontend URL for CORS |

### Database Setup (Neon.tech)
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL` in `.env`
3. Run migrations:
```bash
npm run db:push
```

## Running

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/users/guest` | Create guest user |
| GET | `/api/users/:id` | Get user profile |
| POST | `/api/stats/sync` | Sync user stats |
| GET | `/api/stats/:userId` | Get user stats |
| GET | `/api/leaderboard` | Top players |
| GET | `/api/leaderboard/daily` | Today's ranking |
