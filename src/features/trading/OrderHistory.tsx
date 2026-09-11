import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { CoinIcon } from '@/features/market/CoinIcon';
import { getErrorMessage } from '@/lib/api/errors';
import { formatQuantity, formatUsd } from '@/lib/format';
import { ordersQuery } from './api';

const PAGE_SIZE = 8;

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

export function OrderHistory() {
  const { data: orders, error, refetch } = useQuery(ordersQuery);
  const [page, setPage] = useState(1);

  if (!orders) {
    return (
      <Panel title="Order history">
        {error ? (
          <ErrorMessage title="Order history unavailable" message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <LoadingState label="Loading order history" rows={4} />
        )}
      </Panel>
    );
  }

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleOrders = orders.slice(start, start + PAGE_SIZE);

  return (
    <Panel title="Order history" action={<span className="text-xs text-neutral-500">{orders.length} orders</span>}>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-400">No orders yet. Your executed trades will appear here.</p>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
            <table className="w-full min-w-xl text-sm">
              <caption className="sr-only">Order history, page {currentPage} of {pageCount}</caption>
              <thead>
                <tr className="text-xs text-neutral-500">
                  <th scope="col" className="pb-2 pr-4 text-left font-medium">Time</th>
                  <th scope="col" className="pb-2 pr-4 text-left font-medium">Asset</th>
                  <th scope="col" className="pb-2 pr-4 text-left font-medium">Type</th>
                  <th scope="col" className="pb-2 pr-4 text-right font-medium">Quantity</th>
                  <th scope="col" className="pb-2 pr-4 text-right font-medium">Price</th>
                  <th scope="col" className="pb-2 pr-4 text-right font-medium">Total</th>
                  <th scope="col" className="pb-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className={`border-t border-white/5 ${order.status === 'pending' ? 'bg-amber-400/5' : ''}`}>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-neutral-400">
                      <time dateTime={order.timestamp}>{dateTime.format(new Date(order.timestamp))}</time>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2 font-medium text-neutral-100">
                        <CoinIcon symbol={order.coin} className="size-6" />
                        {order.coin}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          order.type === 'buy' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {order.type === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-200">{formatQuantity(order.quantity)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-200">{formatUsd(order.price)}</td>
                    <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-neutral-100">{formatUsd(order.total)}</td>
                    <td className="py-2.5">
                      {order.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
                          <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
                          Filled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
            <p>
              Showing {start + 1}–{start + visibleOrders.length} of {orders.length}
            </p>
            <nav aria-label="Order history pages" className="flex items-center gap-2">
              <Button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="tabular-nums">
                Page {currentPage} of {pageCount}
              </span>
              <Button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>
                Next
              </Button>
            </nav>
          </div>
        </>
      )}
    </Panel>
  );
}
