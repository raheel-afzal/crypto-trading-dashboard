# Crypto Trading Dashboard

[![CI](https://github.com/raheel-afzal/crypto-trading-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/raheel-afzal/crypto-trading-dashboard/actions/workflows/ci.yml)

Real-time trading dashboard for BTC, ETH, SOL, XRP and BNB: live prices over WebSocket, market orders with server-side validation, and portfolio tracking.

**Live demo:** <https://crypto-trading-dashboard-bay.vercel.app> — sign in with **demo@trading.dev / demo1234**. The API sleeps after 15 minutes idle, so the first load can take up to a minute.

![Crypto trading dashboard](docs/dashboard.png)

<img src="docs/mobile.png" alt="Dashboard on mobile" width="320">

**Web:** Next.js 16, React 19, TypeScript, Tailwind 4, TanStack Query, Zustand, axios, Recharts
**API:** NestJS 12, Prisma 7 + PostgreSQL, Zod, ws · **Tests:** Vitest

## Run

Needs Node 22.12+ and a Postgres database (Render, Neon, Supabase or local).

```bash
npm install
cp server/.env.example server/.env   # set DATABASE_URL
npm run dev
```

The API applies migrations on start and seeds the two demo accounts the first time it finds an empty database.

Dashboard on <http://localhost:3000>, API on <http://localhost:4000>.

| Script | |
| --- | --- |
| `npm run dev` | API and web together (`dev:api` / `dev:web` for one) |
| `npm test` | API tests (service tests need `TEST_DATABASE_URL`, a throwaway database) |
| `npm run lint`, `npm run typecheck` | checks (`typecheck -w server` for the API) |
| `npm run build` | web build (`build -w server` for the API) |

Sign in with **demo@trading.dev / demo1234** (or alex@trading.dev / alex1234), or create your own account from the sign-in page.

Optional env: `NEXT_PUBLIC_API_URL`, `PORT`, `CORS_ORIGIN`, `JWT_SECRET` (defaults to a per-process key, so restarting the API ends open sessions).

## API

| Endpoint | |
| --- | --- |
| `POST /api/auth/login` | sign in, returns a JWT |
| `POST /api/auth/signup` | create an account, returns a JWT |
| `GET /api/coins` | price, 24h change, 24h volume |
| `GET /api/coins/:symbol/history` | last 5 minutes of ticks |
| `GET /api/portfolio` | cash balance and holdings |
| `GET /api/orders` | complete order history |
| `POST /api/orders` | place a market order |
| `ws://localhost:4000/ws` | snapshot on connect, then a frame every 2s |

Portfolio and order routes need an `Authorization: Bearer <token>` header; market data and the socket are public.

An order fills at the live market price when the submitted price is within 1% of it. Bad input returns 400; slippage, insufficient holdings and insufficient cash return 422 with an `errorCode` and a readable message.

## Notes

- Accounts, balances and orders live in Postgres; the demo accounts open with $100,000 and a short trade history, a new account with the same cash and no positions, and tokens scope every request to one account.
- Prices are simulated in memory and streamed straight to clients — ticks are never written to the database.
- Orders apply to the UI immediately and roll back to the pre-order snapshot if the server rejects them.
