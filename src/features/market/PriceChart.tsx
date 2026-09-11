import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { useTicketStore } from '@/features/trading/useTicketStore';
import { getErrorMessage } from '@/lib/api/errors';
import { formatChange, formatUsd } from '@/lib/format';
import { coinHistoryQuery, coinsQuery } from './api';
import { CoinIcon, COIN_COLOR } from './CoinIcon';

const SURFACE = 'var(--color-chart-surface)';
const GRID = 'var(--color-chart-grid)';
const AXIS = 'var(--color-chart-axis)';

const clock = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const axisUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PriceChart() {
  const symbol = useTicketStore((state) => state.symbol);
  const selectSymbol = useTicketStore((state) => state.selectSymbol);
  const { data: coins } = useQuery(coinsQuery);
  const { data: history, error, refetch, isPlaceholderData } = useQuery({
    ...coinHistoryQuery(symbol),
    placeholderData: keepPreviousData,
  });

  const coin = coins?.find((item) => item.symbol === symbol);
  const last = history?.at(-1);

  const coinTabs = (
    <div role="group" aria-label="Chart asset" className="flex gap-0.5 rounded-lg bg-neutral-950/60 p-1">
      {coins?.map((item) => (
        <button
          key={item.symbol}
          type="button"
          aria-pressed={item.symbol === symbol}
          onClick={() => selectSymbol(item.symbol)}
          className="rounded-md px-2.5 py-1 text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-100 focus-visible:outline-2 focus-visible:outline-sky-400 aria-pressed:bg-white/10 aria-pressed:text-neutral-50"
        >
          {item.symbol}
        </button>
      ))}
    </div>
  );

  return (
    <Panel title={`${symbol} price · last 5 minutes`} action={coinTabs}>
      {history ? (
        <div className={`${COIN_COLOR[symbol]} transition-opacity ${isPlaceholderData ? 'opacity-50' : ''}`}>
          {coin && (
            <div className="mb-4 flex items-center gap-3">
              <CoinIcon symbol={coin.symbol} className="size-10" />
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-semibold text-neutral-50">{formatUsd(coin.price)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      coin.change24h >= 0 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
                    }`}
                  >
                    {formatChange(coin.change24h)} 24h
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">{coin.name}</p>
              </div>
            </div>
          )}

          <AreaChart responsive data={history} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} className="h-60 w-full">
            <defs>
              <linearGradient id="price-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => clock.format(new Date(value))}
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              minTickGap={48}
            />
            <YAxis
              orientation="right"
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => (value >= 1000 ? axisUsd.format(value) : formatUsd(value))}
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                const price = payload[0]?.value;
                if (!active || typeof price !== 'number' || typeof label !== 'string') return null;
                return (
                  <div className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs shadow-lg">
                    <p className="flex items-center gap-2 font-semibold tabular-nums text-neutral-50">
                      <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-current" />
                      {formatUsd(price)}
                    </p>
                    <p className="mt-0.5 text-neutral-400">{clock.format(new Date(label))}</p>
                  </div>
                );
              }}
            />
            <Area
              type="linear"
              dataKey="price"
              stroke="currentColor"
              strokeWidth={2}
              fill="url(#price-wash)"
              isAnimationActive={false}
              activeDot={{ r: 4, fill: 'currentColor', stroke: SURFACE, strokeWidth: 2 }}
            />
            {last && (
              <ReferenceDot x={last.timestamp} y={last.price} r={4} fill="currentColor" stroke={SURFACE} strokeWidth={2} />
            )}
          </AreaChart>

          <details className="mt-3 text-xs text-neutral-400">
            <summary className="cursor-pointer select-none hover:text-neutral-200">View data table</summary>
            <div className="mt-2 max-h-48 overflow-y-auto">
              <table className="w-full tabular-nums">
                <caption className="sr-only">{symbol} price history</caption>
                <thead>
                  <tr className="text-neutral-400">
                    <th scope="col" className="py-1 text-left font-medium">Time</th>
                    <th scope="col" className="py-1 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((point) => (
                    <tr key={point.timestamp} className="border-t border-white/5">
                      <td className="py-1">{clock.format(new Date(point.timestamp))}</td>
                      <td className="py-1 text-right text-neutral-200">{formatUsd(point.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      ) : error ? (
        <ErrorMessage title="Price history unavailable" message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <LoadingState label={`Loading ${symbol} price history`} rows={4} />
      )}
    </Panel>
  );
}
