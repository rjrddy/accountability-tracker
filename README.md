# Accountability Tracker (MVP)

A minimal daily goals tracker built with Next.js (App Router), React, and TypeScript.

## Environment model

This repository is maintained and run in one production environment on this machine.
No multi-developer clone workflow is assumed.

## Features

- Pick a date (defaults to today)
- Add goals for that date
- Toggle completion
- Edit goal text
- Delete goals
- Clear completed goals for the selected day
- Progress summary (`x/y completed` + percentage)
- Trends chart (7/14/30/90 days) with metric toggle:
  - Completion %
  - Completed count
- Git-like contribution grid (last 12 weeks or 365 days):
  - Hover details for each day
  - Click a day to jump to that date
- Firebase Authentication (Google sign-in)
- Username onboarding after sign-in (required before app use)
- Signed-in persistence via Postgres (Prisma + authenticated API routes)
- Signed-out guest mode via `localStorage` (`goals:guest`)
- Mobile tabs for `Today`, `Progress`, and `Settings`
- Top-level tabs for `Today`, `Progress`, `Friends`, and `Settings`
- Friends tab with mock social features:
  - Unique username in local adapter
  - Add/search friend by username
  - Incoming/outgoing requests with accept/decline/cancel
  - Friend comparison view (daily list, heatmap, trend chart overlay)
- Keyboard UX:
  - `Enter` adds a goal
  - `Escape` clears add-goal input

## Tech choices

- Next.js App Router
- TypeScript, functional React components
- Tailwind CSS for utility-first styling
- Recharts for analytics visualizations
- Firebase Web SDK (client auth)
- Firebase Admin SDK (server token verification)
- Prisma ORM + PostgreSQL
- Local store module (`src/lib/goalsStore.ts`) for CRUD + persistence
- Stats helpers (`src/lib/stats.ts`) for continuous day-range analytics data
- Backend-agnostic social adapter interface (`src/lib/social/socialAdapter.ts`)
- Mock social adapter with localStorage backing (`src/lib/social/mockSocialAdapter.ts`)
- Vitest for unit tests
- ESLint via `eslint-config-next`

## Firebase setup

1. Create a Firebase project and enable **Authentication > Google** provider.
2. Add authorized domains:
   - `localhost`
   - Your deployed app domain
3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

## Vercel env vars required for Firebase

Set these in Vercel Project Settings -> Environment Variables (at minimum for **Production**):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

Important: after adding or changing Firebase env vars in Vercel, you must redeploy for changes to take effect.

## Postgres + Prisma setup

1. Provision a Postgres database (or Vercel Postgres).
2. Add `PRISMA_DATABASE_URL` to `.env.local`:

```bash
PRISMA_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
# Optional from Vercel integration:
POSTGRES_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
```

3. Run Prisma migration + client generation:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Note: Prisma CLI reads `.env` by default. This project’s npm scripts load `.env.local` and map
`POSTGRES_URL` to `PRISMA_DATABASE_URL` when needed, so `npm run build` works with Vercel-pulled envs.

For production deploys (including Vercel), migrations run via build script:

```bash
npm run build
```
This runs `prisma migrate deploy && next build`.

## Production deploy (Vercel)

1. Attach Vercel Postgres to the project.
2. Set required Vercel env vars (Production):
   - `PRISMA_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_*`
   - `FIREBASE_ADMIN_*` (or `GOOGLE_APPLICATION_CREDENTIALS`)
3. Redeploy after any env change.
4. Build runs migrations via `prisma migrate deploy` automatically.

## Firebase Admin setup (API auth)

Use one of these options for server verification:

1. `GOOGLE_APPLICATION_CREDENTIALS` path to service account JSON, or
2. Explicit env vars in `.env.local`:

```bash
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Without valid Firebase Admin credentials, authenticated API routes will return `401`.

## Run (production machine)

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Create/apply migration when schema changes:

```bash
npx prisma migrate dev --name init
```

4. Start server in dev mode when needed:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Test

```bash
npm run test
```

## Lint

```bash
npm run lint
```

## Build + start production

```bash
npm run build
npm run start
```

## Data model

Goals are stored in `localStorage` by date key (`YYYY-MM-DD`):

```ts
type Goal = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type GoalsByDate = Record<string, Goal[]>;
```
