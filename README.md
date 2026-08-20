# Budget App

A personal budget app that connects to your bank accounts and credit cards via [Plaid](https://plaid.com), lets you create your own budget "buckets," alerts you when you approach spending limits, and lets you lock/unlock linked cards.

- `server/` — Node.js/Express + Prisma (Postgres) API. Handles auth, Plaid linking/sync, buckets, alerts, and card controls.
- `web/` — React + Vite PWA. Installable to your iPhone home screen via Safari's "Add to Home Screen." A React Native app can be added later, reusing the same `server/` API.

## 1. Prerequisites

- Node.js 18+
- A free [Plaid developer account](https://dashboard.plaid.com/signup) (sandbox mode is free and uses fake bank data — good for development/testing)

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, PLAID_CLIENT_ID, PLAID_SECRET (from https://dashboard.plaid.com/developers/keys)
# DATABASE_URL should be a Postgres connection string.
npx prisma migrate dev --name init
npm run dev
```

The API runs on `http://localhost:4000` by default.

## 3. Frontend setup

```bash
cd web
npm install
npm run dev
```

The app runs on `http://localhost:5173`. In dev, the Vite dev server proxies `/api/*` to `http://localhost:4000`.

Open it in your browser, or on your iPhone (same Wi-Fi network, using your machine's LAN IP) and tap Share → "Add to Home Screen" to install it as a PWA.

## 4. Using Plaid in sandbox mode

When you click "Connect account" in the Accounts page, Plaid Link will open. In `sandbox` mode, use these test credentials:

- Username: `user_good`
- Password: `pass_good`

This links a fake bank with fake accounts/transactions so you can fully exercise the buckets, alerts, and sync flow without a real bank account. When ready for production, apply for Plaid production access and switch `PLAID_ENV=production` with production keys.

## 5. Feature overview

- **Bank/card linking**: `POST /api/plaid/link-token` + `POST /api/plaid/exchange-public-token` use Plaid Link to connect real (or sandbox) bank/credit accounts. `POST /api/plaid/sync-transactions` pulls new transactions.
- **Buckets**: Create custom budget categories (`POST /api/buckets`) with a monthly limit, color, and alert thresholds. Assign transactions to buckets manually or via auto-categorization rules (`POST /api/buckets/:id/rules`) matching merchant name, category, or keyword.
- **Alerts**: An hourly cron job (`server/src/jobs/alertJob.ts`) checks each bucket's spend against its thresholds (default 80%/100%) and creates in-app alerts, plus optional email alerts if SMTP is configured in `.env`.
- **Card lock/unlock**: `POST /api/cards/:accountId/lock` and `/unlock`.

### Important limitation: card lock/unlock

There is **no universal API** that lets a third-party app freeze an arbitrary bank debit/credit card. Real support requires the card **issuer's own API**:

- If you use a card-issuing platform you control (Stripe Issuing, Marqeta, Lithic), full lock/unlock is possible.
- Most major banks (Chase, Capital One, Bank of America, Amex, etc.) only expose "lock card" inside their own first-party apps — there's no public third-party API for this.

This app ships with a `MockCardControlProvider` (see `server/src/services/cardControlService.ts`) so the full lock/unlock flow works end-to-end in the UI and database. To wire up a real issuer, implement the `CardControlProvider` interface for that issuer's API and register it with `registerCardControlProvider(...)`.

## 6. Roadmap: native iPhone app

The backend is a plain REST API, so a React Native (Expo) app can be added later under a `mobile/` folder, reusing all the same endpoints, and unlocking full native push notifications for budget alerts (iOS PWAs have limited push notification support).
