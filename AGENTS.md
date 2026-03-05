# AGENTS

## Architecture
- Client: Next.js App Router UI in `src/app/page.tsx` and `src/components/*`.
- Server: Route handlers under `src/app/api/*`.
- Database: Prisma models in `prisma/schema.prisma` using Postgres.
- Auth:
  - Firebase client SDK is used in browser-only files (`src/lib/firebaseClient.ts`, `src/context/AuthContext.tsx`).
  - Firebase Admin SDK is server-only (`src/lib/server/firebaseAdmin.ts`) and validates bearer tokens in API routes.

## Firebase Separation Rules
- Never import `src/lib/server/*` modules into client components (`"use client"` files).
- Never import `firebase-admin` in client-side code.
- API routes must enforce authentication via `requireUid`.

## Prisma Workflow
- Local schema iteration:
  - `npx prisma migrate dev --name <change-name>`
  - `npx prisma generate`
- Production/CI deploy:
  - `prisma migrate deploy` (already wired in `npm run build` when `PRISMA_DATABASE_URL` is present).
- Always commit both schema changes and generated migration files.

## Recurring Goals Model
- One-time goals remain in `Goal` (backward compatible).
- Recurring goals are represented by:
  - `GoalSeries`: recurrence rule (`DAILY`, `WEEKLY`, `MONTHLY`) and schedule metadata.
  - `GoalOccurrenceOverride`: per-date override text or skipped date.
  - `GoalCompletion`: per-date completion state for series occurrences.
- Weekly day convention: `0-6` where `0 = Sunday`.
- Monthly day behavior: if `dayOfMonth` does not exist in a month (e.g. 31st in April), that month is skipped.
- Effective daily list is resolved by combining:
  - one-time goals for date
  - matching series for date
  - per-date overrides
  - per-date completion records

## Coding Conventions
- TypeScript strict style: avoid `any`.
- Keep UI minimal, readable, and mobile-first with Tailwind.
- Preserve existing visual language.
- Do not import server-only modules into client code.

## Commands
- Dev: `npm run dev`
- Test: `npm run test`
- Lint: `npm run lint`
- Build: `npm run build`
