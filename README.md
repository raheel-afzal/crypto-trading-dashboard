# Real-Time Crypto Trading Dashboard

[![CI](https://github.com/raheel-afzal/crypto-trading-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/raheel-afzal/crypto-trading-dashboard/actions/workflows/ci.yml)

A responsive, real-time trading dashboard for **BTC, ETH, SOL, XRP and BNB**. A Next.js + TypeScript frontend talks to a NestJS API that simulates a live market, validates and executes market orders, and streams prices over WebSocket.

## Stack

| Layer    | Tech                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router, React 19, React Compiler), TypeScript strict, Tailwind CSS 4, TanStack Query 5, Zustand 5, axios, Recharts 3 |
| Backend  | NestJS 12 (ESM, Express 5), WebSocket gateway on `@nestjs/platform-ws`, Zod 4 through Nest's `StandardSchemaValidationPipe` |
| Tests    | Vitest 5                                                                                                               |

## Getting started

Requires Node.js 22.12 or newer (built on Node 24).

```bash
npm install
npm run dev
```

`npm run dev` starts the API on <http://localhost:4000> and the dashboard on <http://localhost:3000>.

| Script              | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | API and web together (`npm run dev:api` / `npm run dev:web` run one each) |
| `npm test`          | API unit tests (Vitest)                                                  |
| `npm run lint`      | ESLint for web and API sources                                           |
| `npm run typecheck` | Type-check the web app (`npm run typecheck -w server` for the API)       |
| `npm run build`     | Production build of the web app (`npm run build -w server` for the API)  |

Optional environment variables: `NEXT_PUBLIC_API_URL` (web, default `http://localhost:4000`), `PORT` (API, default `4000`), `CORS_ORIGIN` (API, default `http://localhost:3000`).

## Project structure

```
app/                     Next.js routes only: layout, page, error boundary
src/
  features/
    dashboard/           DashboardScreen: composes the screen, owns the live connection
    market/              CryptoTable, CryptoRow, PriceChart, useMarketSocket, coin queries
    trading/             TradingForm, Portfolio, OrderHistory, usePlaceOrder, ticket store
  components/ui/         Shared primitives: Button, Panel, ErrorMessage, LoadingState
  lib/                   axios client, error parsing, query client, formatters
server/src/
  market/                price simulator, WebSocket gateway, coin endpoints
  portfolio/             in-memory account, portfolio endpoint
  orders/                order validation and execution, order endpoints
```

## API

| Method | Path                            | Response                                                      |
| ------ | ------------------------------- | ------------------------------------------------------------- |
| GET    | `/api/coins`                    | `Coin[]`: price, 24h change %, 24h volume (USD), `updatedAt` |
| GET    | `/api/coins/:symbol/history`    | `PricePoint[]`: the last 5 minutes of ticks, used by the chart |
| GET    | `/api/portfolio`                | `{ cashBalance, holdings: { symbol, quantity }[] }`           |
| GET    | `/api/orders`                   | `Order[]`: complete history, newest first, with `timestamp` and `status` |
| POST   | `/api/orders`                   | `200 { order, portfolio }`                                     |

### Placing an order

```json
POST /api/orders
{ "coin": "BTC", "type": "buy", "quantity": 0.25, "price": 65012.34 }
```

`price` is the price the user saw. The order fills at the **live market price**, provided the submitted price is within **1%** of it. Quantities and cash amounts are held to 8 decimal places, so an order worth a fraction of a cent still costs what it should.

Validation and trading errors share one body shape (a malformed JSON body or an unknown route falls back to Nest's default `{ statusCode, error, message }`):

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "errorCode": "INSUFFICIENT_FUNDS",
  "message": "Insufficient USD balance: order total $65,000.00 exceeds available cash of $51,525.37."
}
```

| Status | `errorCode`             | When                                                                                             |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`      | Unknown coin or type, quantity ≤ 0 or over 8 decimals, price not a finite positive number, unknown fields |
| 422    | `PRICE_SLIPPAGE`        | Submitted price is more than 1% away from the live price                                         |
| 422    | `INSUFFICIENT_HOLDINGS` | Selling more than is held                                                                        |
| 422    | `INSUFFICIENT_FUNDS`    | Buy total at the live price is more than the cash balance                                        |

### WebSocket: `ws://localhost:4000/ws`

The socket only sends, server to client. When a client connects it gets a snapshot right away, then one frame per market tick (every 2 seconds) carrying all five coins: `{ "event": "prices", "data": Coin[] }`.

## How it works

**Real-time.** `useMarketSocket` manages the connection. It connects on mount and buffers frames outside React, writing them into the TanStack Query cache at most once per animation frame. On disconnect it reconnects with exponential backoff (1 s up to 10 s). After an outage it invalidates every query, so the portfolio, orders and chart resync with the server. A status pill in the header shows *Live* or *Reconnecting…*. Rows are memoized, so a tick only re-renders the rows whose data changed.

**Optimistic orders.** `usePlaceOrder` saves a snapshot of the cached portfolio and order history, then applies the order right away: balance and holdings update, and a *Pending* row appears in the history.

- **Success:** the pending row is replaced by the server's filled order, and the portfolio by the server's portfolio.
- **Failure:** the snapshot is restored, and the form shows the backend's `message` word for word.

The submit button stays disabled while an order is in flight, so the snapshot is always the exact state from before the order.

**State.** Server data lives in TanStack Query; both the REST calls and the WebSocket write to it. The only client state shared between components is the trade ticket — the selected coin and side, written by the table's quick actions, the chart's asset tabs and the form itself — and it lives in a small Zustand store.

## Tests

`npm test` runs 47 Vitest tests:

- **Request validation:** the 400 rules.
- **Trading rules and their boundaries:** slippage, a buy that spends exactly the cash balance, selling an entire position, totals priced at the live price.
- **Order execution:** portfolio math, no floating-point dust, sub-cent totals, and rejected orders leave state untouched.

## Notes and assumptions

- All data is in memory: one demo account seeded with $100,000 and a short trade history (cash is $51,525.37 afterwards). Restarting the API resets it.
- Rejected orders are not stored, because a 4xx response means no state change. The history holds filled orders only, and `pending` exists only on the client.
- `GET /api/orders` returns the complete history, and the order table paginates it on the client (8 rows per page).
- The optional JWT auth and database persistence bonus items are not included.

## Scaling to 1,000 price updates per second for 10,000 users

- **Frontend.** Keep socket ingestion decoupled from rendering. This app already buffers frames and flushes once per animation frame; at that rate, use a 100 ms flush instead. Subscribe each row to its own symbol (a per-coin selector or Zustand slice) so a BTC tick re-renders only the BTC row, and virtualize long lists.
- **WebSocket layer.** Move sockets off the API servers to a horizontally scaled gateway, such as Socket.IO with the Redis adapter or AWS API Gateway WebSockets. Aggregate ticks server-side into fixed 100 ms frames that keep only the latest price per symbol, then broadcast one serialized frame per interval. This app already serializes each frame once and sends the same payload to every client.
- **Backend and database.** Keep live prices in Redis and never write ticks to the primary database. Fan ticks out through Redis pub/sub or Streams. Send orders through a queue (Redis Streams or Kafka) and persist them to PostgreSQL with batched inserts, keeping each account's balance check and update atomic (a single writer per account, or a transaction with a row lock).
