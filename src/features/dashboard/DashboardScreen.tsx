'use client';

import { AccountMenu } from '@/features/auth/AccountMenu';
import type { AuthUser } from '@/features/auth/schemas';
import { CryptoTable } from '@/features/market/CryptoTable';
import { PriceChart } from '@/features/market/PriceChart';
import { type ConnectionStatus, useMarketSocket } from '@/features/market/useMarketSocket';
import { OrderHistory } from '@/features/trading/OrderHistory';
import { Portfolio } from '@/features/trading/Portfolio';
import { TradingForm } from '@/features/trading/TradingForm';

const CONNECTION = {
  connecting: { label: 'Connecting…', dot: 'bg-amber-400' },
  live: { label: 'Live', dot: 'bg-emerald-400' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-amber-400' },
} satisfies Record<ConnectionStatus, { label: string; dot: string }>;

export function DashboardScreen({ user }: { user: AuthUser | null }) {
  const { label, dot } = CONNECTION[useMarketSocket()];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-emerald-400 to-sky-500 text-neutral-950 shadow-lg shadow-emerald-500/20"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 16.5 9 10l4 4 8-8.5" />
              <path d="M15 5.5h6v6" />
            </svg>
          </span>
          <div>
            <h1 className="text-lg font-semibold text-neutral-50 sm:text-xl">Crypto Trading Dashboard</h1>
            <p className="text-xs text-neutral-500">Simulated market · demo account</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p
            role="status"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300"
          >
            <span aria-hidden="true" className="relative grid size-2 place-items-center">
              <span className={`absolute size-full rounded-full opacity-70 motion-safe:animate-ping ${dot}`} />
              <span className={`size-2 rounded-full ${dot}`} />
            </span>
            {label}
          </p>
          <AccountMenu user={user} />
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="min-w-0">
          <CryptoTable />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <TradingForm />
          <Portfolio />
        </aside>
        <div className="min-w-0">
          <PriceChart />
        </div>
        <div className="min-w-0">
          <OrderHistory />
        </div>
      </main>
    </div>
  );
}
