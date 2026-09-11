'use client';

import { CryptoTable } from '@/features/market/CryptoTable';
import { PriceChart } from '@/features/market/PriceChart';
import { type ConnectionStatus, useMarketSocket } from '@/features/market/useMarketSocket';
import { OrderHistory } from '@/features/trading/OrderHistory';
import { Portfolio } from '@/features/trading/Portfolio';
import { TradingForm } from '@/features/trading/TradingForm';

const CONNECTION = {
  connecting: { label: 'Connecting…', dot: 'bg-amber-400' },
  live: { label: 'Live', dot: 'bg-emerald-400' },
  reconnecting: { label: 'Reconnecting…', dot: 'animate-pulse bg-amber-400' },
} satisfies Record<ConnectionStatus, { label: string; dot: string }>;

export function DashboardScreen() {
  const status = useMarketSocket();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50 sm:text-2xl">Crypto Trading Dashboard</h1>
          <p className="text-sm text-neutral-400">Market with live prices, instant orders and portfolio tracking</p>
        </div>
        <p
          role="status"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900 px-3 py-1 text-xs text-neutral-300"
        >
          <span aria-hidden="true" className={`size-2 rounded-full ${CONNECTION[status].dot}`} />
          {CONNECTION[status].label}
        </p>
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
