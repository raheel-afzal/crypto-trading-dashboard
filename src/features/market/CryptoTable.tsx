import { useQueries, useQuery } from '@tanstack/react-query';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { useTicketStore } from '@/features/trading/useTicketStore';
import { getErrorMessage } from '@/lib/api/errors';
import { coinHistoryQuery, coinsQuery } from './api';
import { CryptoRow } from './CryptoRow';

export function CryptoTable() {
  const { data: coins, error, refetch } = useQuery(coinsQuery);
  const histories = useQueries({ queries: (coins ?? []).map((coin) => coinHistoryQuery(coin.symbol)) });
  const selectedSymbol = useTicketStore((state) => state.symbol);
  const selectSymbol = useTicketStore((state) => state.selectSymbol);
  const openTicket = useTicketStore((state) => state.openTicket);

  return (
    <Panel title="Markets">
      {coins ? (
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <table className="w-full min-w-72 text-sm">
            <caption className="sr-only">Live market prices</caption>
            <thead>
              <tr className="text-xs text-neutral-500">
                <th scope="col" className="pb-2 pr-2 text-left font-medium sm:pr-4">Asset</th>
                <th scope="col" className="pb-2 pr-2 text-right font-medium sm:pr-4">Price</th>
                <th scope="col" className="hidden pb-2 pr-2 text-right font-medium sm:table-cell sm:pr-4">24h %</th>
                <th scope="col" className="hidden pb-2 pr-4 text-right font-medium sm:table-cell">24h volume</th>
                <th scope="col" className="hidden pb-2 pr-4 text-left font-medium md:table-cell">Last 5m</th>
                <th scope="col" className="pb-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, index) => (
                <CryptoRow
                  key={coin.symbol}
                  coin={coin}
                  history={histories[index]?.data}
                  isSelected={coin.symbol === selectedSymbol}
                  onSelect={selectSymbol}
                  onTrade={openTicket}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <ErrorMessage title="Market data unavailable" message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <LoadingState label="Loading market data" rows={5} />
      )}
    </Panel>
  );
}
