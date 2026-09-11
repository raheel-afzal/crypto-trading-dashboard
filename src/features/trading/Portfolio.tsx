import { useIsMutating, useQuery } from '@tanstack/react-query';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { coinsQuery } from '@/features/market/api';
import { CoinIcon, COIN_COLOR } from '@/features/market/CoinIcon';
import { getErrorMessage } from '@/lib/api/errors';
import { formatPercent, formatQuantity, formatUsd } from '@/lib/format';
import { portfolioQuery } from './api';

const BAR_WIDTH = 56;

export function Portfolio() {
  const { data: portfolio, error: portfolioError, refetch: refetchPortfolio } = useQuery(portfolioQuery);
  const { data: coins, error: coinsError, refetch: refetchCoins } = useQuery(coinsQuery);
  const isUpdating = useIsMutating() > 0;

  if (!portfolio || !coins) {
    const error = portfolioError ?? coinsError;
    return (
      <Panel title="Portfolio">
        {error ? (
          <ErrorMessage
            title="Portfolio unavailable"
            message={getErrorMessage(error)}
            onRetry={() => {
              void refetchPortfolio();
              void refetchCoins();
            }}
          />
        ) : (
          <LoadingState label="Loading portfolio" rows={4} />
        )}
      </Panel>
    );
  }

  const prices = new Map(coins.map((coin) => [coin.symbol, coin.price]));
  const positions = portfolio.holdings
    .map((holding) => ({ ...holding, value: holding.quantity * (prices.get(holding.symbol) ?? 0) }))
    .sort((a, b) => b.value - a.value);
  const holdingsValue = positions.reduce((sum, position) => sum + position.value, 0);
  const netValue = portfolio.cashBalance + holdingsValue;

  return (
    <Panel title="Portfolio" action={isUpdating && <span className="text-xs text-amber-300">Updating…</span>}>
      <p className="text-xs text-neutral-400">Net portfolio value</p>
      <p className="mt-1 text-3xl font-semibold text-neutral-50">{formatUsd(netValue)}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-neutral-950/60 p-3">
          <dt className="text-xs text-neutral-400">Cash balance</dt>
          <dd className="mt-1 font-medium tabular-nums text-neutral-100">{formatUsd(portfolio.cashBalance)}</dd>
        </div>
        <div className="rounded-lg bg-neutral-950/60 p-3">
          <dt className="text-xs text-neutral-400">Holdings value</dt>
          <dd className="mt-1 font-medium tabular-nums text-neutral-100">{formatUsd(holdingsValue)}</dd>
        </div>
      </dl>

      {positions.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">No holdings yet. Buy an asset to get started.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Asset breakdown</caption>
          <thead>
            <tr className="text-xs text-neutral-500">
              <th scope="col" className="pb-2 text-left font-medium">Asset</th>
              <th scope="col" className="pb-2 text-right font-medium">Value</th>
              <th scope="col" className="pb-2 pl-3 text-right font-medium">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const share = (position.value / netValue) * 100;
              return (
                <tr key={position.symbol} className="border-t border-white/5">
                  <th scope="row" className="py-2.5 text-left font-normal">
                    <span className="flex items-center gap-2.5">
                      <CoinIcon symbol={position.symbol} className="size-7" />
                      <span>
                        <span className="block font-medium text-neutral-100">{position.symbol}</span>
                        <span className="block text-xs tabular-nums text-neutral-400">{formatQuantity(position.quantity)}</span>
                      </span>
                    </span>
                  </th>
                  <td className="py-2.5 text-right tabular-nums text-neutral-100">{formatUsd(position.value)}</td>
                  <td className="py-2.5 pl-3 text-right">
                    <span className="block tabular-nums text-neutral-300">{formatPercent(share)}</span>
                    <svg
                      viewBox={`0 0 ${BAR_WIDTH} 4`}
                      aria-hidden="true"
                      className={`mt-1.5 ml-auto block h-1 w-14 ${COIN_COLOR[position.symbol]}`}
                    >
                      <rect width={BAR_WIDTH} height="4" rx="2" className="fill-white/10" />
                      <rect width={(share / 100) * BAR_WIDTH} height="4" rx="2" fill="currentColor" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
