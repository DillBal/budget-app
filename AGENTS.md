# Agent notes

## Layout
- `server/` — Express + Prisma (**Postgres**) API on port 4000.
- `web/` — React + Vite PWA (Tailwind, Recharts).

## Commands
Run from the respective directory.

| Task | server/ | web/ |
| --- | --- | --- |
| Dev | `npm run dev` | `npm run dev` |
| Build | `npm run build` | `npm run build` |
| Test | `npm test` | `npm test` |
| Lint | — (none configured) | `npm run lint` |

Prisma (in `server/`): `npx prisma generate`, `npx prisma migrate dev`, `npx prisma migrate deploy`.

## Demo mode (local UI testing, no backend)
`npm run dev` in `web/` shows a **"View demo (no account)"** button on the login page. It fakes
auth and swaps in an offline axios adapter with sample data — no backend, DB, or Plaid needed.

- Flags: `web/src/lib/demoFlag.ts` (tiny, always bundled but inert in prod)
- Dataset + adapter: `web/src/lib/demo.ts` (dynamically imported only when `import.meta.env.DEV`,
  so it is tree-shaken out of production builds — verified)
- Exit via "Log out", which clears the `demoMode` localStorage key.
- Connecting accounts is intentionally unsupported in demo mode (Plaid Link needs a real token).

## Gotchas
- **Local DB**: `server/.env` `DATABASE_URL` points at Render's *internal* host
  (`dpg-...-a:5432`), which only resolves inside Render. For local end-to-end work you need
  Render's **External Database URL** or a local Postgres. Prisma connects lazily, so the server
  boots and `/health` responds even when the DB is unreachable.
- **No local Postgres/Docker** on this machine, so `prisma migrate diff --shadow-database-url`
  hangs. New migrations have been hand-written under `server/prisma/migrations/`.
- Prisma schema is Postgres; the initial migration SQL was regenerated for Postgres.

## Deployment
Single domain: **Vercel** hosts `web/` and rewrites `/api/*` to the Render API
(see `web/vercel.json`); **Render** runs the API + Postgres.

- Render build: `npm ci && npx prisma generate && npm run build`
- Render start: `npx prisma migrate deploy && npm start`
- Render env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (the web origin, no path), Plaid vars.
- The web app calls the API via relative `/api` by default; `VITE_API_URL` overrides it.

## Conventions
- Money/number formatting goes through `web/src/lib/format.ts` (`formatCurrency`, etc.)
  and the `.nums` class for tabular figures.
- Shared UI primitives live in `web/src/components/ui/` — prefer them over ad-hoc Tailwind
  (`Card`, `Button`, `Input`/`Select`/`Label`, `Skeleton`, `EmptyState`, `StatCard`,
  `ProgressBar`, `ProgressRing`).
- Semantic Tailwind tokens: `canvas`, `surface`, `brand`, `positive`, `caution`, `negative`.
- Routes are lazy-loaded in `web/src/App.tsx`; keep Recharts imports inside lazily-loaded
  modules so it stays out of the initial bundle.
