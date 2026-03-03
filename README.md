# Accountability Tracker (MVP)

A minimal daily goals tracker built with Next.js (App Router), React, and TypeScript.

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
- Local persistence with `localStorage` scoped by auth state:
  - Signed in: `goals:<uid>`
  - Signed out: `goals:guest`
  - Optional import button to copy guest data into account data
- Mobile tabs for `Today`, `Progress`, and `Settings`
- Keyboard UX:
  - `Enter` adds a goal
  - `Escape` clears add-goal input

## Tech choices

- Next.js App Router
- TypeScript, functional React components
- Tailwind CSS for utility-first styling
- Recharts for analytics visualizations
- Firebase Web SDK (Auth only for this phase)
- Local store module (`src/lib/goalsStore.ts`) for CRUD + persistence
- Stats helpers (`src/lib/stats.ts`) for continuous day-range analytics data
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

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000`

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
