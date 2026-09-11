import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { getErrorMessage } from '@/lib/api/errors';
import { formatQuantity, formatUsd } from '@/lib/format';
import { ordersQuery } from './api';

const PAGE_SIZE = 8;

const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' });

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
    <Panel title="Order history" action={<span className="text-xs text-neutral-400">{orders.length} orders</span>}>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-400">No orders yet. Your executed trades will appear here.</p>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
            <table className="w-full min-w-2xl text-sm">
              <caption className="sr-only">Order history, page {currentPage} of {pageCount}</caption>
              <thead>
                <tr className="text-xs text-neutral-400">
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
                  <tr key={order.id} className="border-t border-white/5">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-neutral-400">{dateTime.format(new Date(order.timestamp))}</td>
                    <td className="py-2.5 pr-4 font-medium text-neutral-100">{order.coin}</td>
                    <td className={`py-2.5 pr-4 font-medium ${order.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {order.type === 'buy' ? 'Buy' : 'Sell'}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-200">{formatQuantity(order.quantity)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-200">{formatUsd(order.price)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-100">{formatUsd(order.total)}</td>
                    <td className="py-2.5">
                      {order.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-300">
                          <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Pending
                        </span>
                      ) : (
                        <span className="text-emerald-400">Filled</span>
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
