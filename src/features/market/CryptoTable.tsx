import { useQuery } from '@tanstack/react-query';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { useTicketStore } from '@/features/trading/useTicketStore';
import { getErrorMessage } from '@/lib/api/errors';
import { coinsQuery } from './api';
import { CryptoRow } from './CryptoRow';

export function CryptoTable() {
  const { data: coins, error, refetch } = useQuery(coinsQuery);
  const selectedSymbol = useTicketStore((state) => state.symbol);
  const openTicket = useTicketStore((state) => state.openTicket);

  return (
    <Panel title="Markets">
      {coins ? (
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <table className="w-full min-w-xl text-sm">
            <caption className="sr-only">Live market prices</caption>
            <thead>
              <tr className="text-xs text-neutral-400">
                <th scope="col" className="pb-2 pr-4 text-left font-medium">Asset</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">Price</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">24h change</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">24h volume</th>
                <th scope="col" className="pb-2 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => (
                <CryptoRow key={coin.symbol} coin={coin} isSelected={coin.symbol === selectedSymbol} onTrade={openTicket} />
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
