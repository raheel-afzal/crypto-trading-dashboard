import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Panel } from '@/components/ui/Panel';
import { coinsQuery } from '@/features/market/api';
import { CoinIcon } from '@/features/market/CoinIcon';
import { getErrorMessage } from '@/lib/api/errors';
import { formatQuantity, formatUsd } from '@/lib/format';
import { portfolioQuery } from './api';
import { usePlaceOrder } from './usePlaceOrder';
import { useTicketStore } from './useTicketStore';

const ORDER_TYPES = [
  { value: 'buy', label: 'Buy', checked: 'peer-checked:bg-emerald-500' },
  { value: 'sell', label: 'Sell', checked: 'peer-checked:bg-rose-500' },
] as const;

// Leaves room for the 1% slippage the server allows between the shown price and the fill price.
const SLIPPAGE_HEADROOM = 1.01;
const PERCENTS = [0.25, 0.5, 0.75, 1] as const;

export function TradingForm() {
  const { symbol, type, focusRequest, selectSymbol, selectType } = useTicketStore();
  const { data: coins } = useQuery(coinsQuery);
  const { data: portfolio } = useQuery(portfolioQuery);
  const placeOrder = usePlaceOrder();
  const [quantityInput, setQuantityInput] = useState('');
  const quantityRef = useRef<HTMLInputElement>(null);
  const assetId = useId();
  const quantityId = useId();

  useEffect(() => {
    if (focusRequest > 0) quantityRef.current?.focus();
  }, [focusRequest]);

  const coin = coins?.find((item) => item.symbol === symbol);
  const quantity = Number(quantityInput);
  const hasQuantity = quantityInput.trim() !== '' && Number.isFinite(quantity) && quantity > 0;
  const total = coin && hasQuantity ? quantity * coin.price : 0;
  const held = portfolio?.holdings.find((holding) => holding.symbol === symbol)?.quantity ?? 0;
  const available = type === 'buy' ? portfolio && formatUsd(portfolio.cashBalance) : portfolio && `${formatQuantity(held)} ${symbol}`;
  const affordable = portfolio && coin ? portfolio.cashBalance / (coin.price * SLIPPAGE_HEADROOM) : 0;
  const maxQuantity = type === 'buy' ? affordable : held;
  const exceedsAvailable = hasQuantity && portfolio !== undefined && (type === 'buy' ? total > portfolio.cashBalance : quantity > held);
  // Feedback belongs to the order that was sent, not to a ticket the user has since changed.
  const isCurrentTicket = placeOrder.variables?.coin === symbol && placeOrder.variables?.type === type;

  function clearFeedback() {
    if (!placeOrder.isPending) placeOrder.reset();
  }

  function fillPercent(percent: number) {
    const filled = Math.floor(maxQuantity * percent * 1e8) / 1e8;
    setQuantityInput(filled > 0 ? filled.toFixed(8).replace(/\.?0+$/, '') : '');
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coin || !hasQuantity) return;
    placeOrder.mutate(
      { coin: coin.symbol, type, quantity, price: coin.price },
      { onSuccess: () => setQuantityInput('') },
    );
  }

  return (
    <Panel title="Place order">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-950 p-1">
          <legend className="sr-only">Order type</legend>
          {ORDER_TYPES.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => {
                  selectType(option.value);
                  clearFeedback();
                }}
                className="peer sr-only"
              />
              <span
                className={`block cursor-pointer rounded-md py-2 text-center text-sm font-semibold text-neutral-400 transition-colors peer-checked:text-neutral-950 peer-focus-visible:outline-2 peer-focus-visible:outline-sky-400 ${option.checked}`}
              >
                {option.label}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="text-sm">
          <label htmlFor={assetId} className="text-neutral-400">
            Asset
          </label>
          <div className="relative mt-1">
            <CoinIcon symbol={symbol} className="pointer-events-none absolute top-1/2 left-2.5 size-7 -translate-y-1/2" />
            <select
              id={assetId}
              value={symbol}
              onChange={(event) => {
                const next = coins?.find((item) => item.symbol === event.target.value);
                if (next) selectSymbol(next.symbol);
                clearFeedback();
              }}
              className="block w-full rounded-lg border border-white/10 bg-neutral-950 py-2.5 pr-3 pl-11 text-neutral-100 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {coins ? (
                coins.map((item) => (
                  <option key={item.symbol} value={item.symbol}>
                    {item.symbol} · {item.name}
                  </option>
                ))
              ) : (
                <option value={symbol}>{symbol}</option>
              )}
            </select>
          </div>
        </div>

        <div className="text-sm">
          <label htmlFor={quantityId} className="text-neutral-400">
            Quantity
          </label>
          <div className="mt-1 flex items-center rounded-lg border border-white/10 bg-neutral-950 focus-within:outline-2 focus-within:outline-sky-400">
            <input
              id={quantityId}
              ref={quantityRef}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              autoComplete="off"
              value={quantityInput}
              onChange={(event) => {
                setQuantityInput(event.target.value);
                clearFeedback();
              }}
              className="w-full bg-transparent px-3 py-2.5 tabular-nums text-neutral-100 outline-none"
            />
            <span className="px-3 font-medium text-neutral-400">{symbol}</span>
          </div>

          <div role="group" aria-label="Quick amount" className="mt-2 grid grid-cols-4 gap-1.5">
            {PERCENTS.map((percent) => (
              <Button key={percent} disabled={maxQuantity <= 0} onClick={() => fillPercent(percent)}>
                {percent === 1 ? 'Max' : `${percent * 100}%`}
              </Button>
            ))}
          </div>

          {exceedsAvailable && (
            <p className="mt-2 text-xs text-amber-300">
              Above your available {type === 'buy' ? 'cash' : `${symbol}`} — the order will be rejected.
            </p>
          )}
        </div>

        <dl className="space-y-2 rounded-lg bg-neutral-950/60 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-400">Market price</dt>
            <dd className="tabular-nums text-neutral-100">{coin ? formatUsd(coin.price) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-400">Available</dt>
            <dd className="tabular-nums text-neutral-100">{available ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-white/5 pt-2">
            <dt className="text-neutral-400">Estimated total</dt>
            <dd className="font-semibold tabular-nums text-neutral-50">{formatUsd(total)}</dd>
          </div>
        </dl>

        <div>
          <Button
            type="submit"
            variant={type}
            size="md"
            className="w-full"
            disabled={!coin || !hasQuantity || placeOrder.isPending}
          >
            {placeOrder.isPending ? 'Placing order…' : `${type === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
          </Button>
          {placeOrder.isError && isCurrentTicket && (
            <div className="mt-4">
              <ErrorMessage title="Order failed" message={getErrorMessage(placeOrder.error)} />
            </div>
          )}
          <div role="status" className="empty:hidden">
            {placeOrder.isSuccess && isCurrentTicket && (
              <p className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mt-0.5 size-4 shrink-0 text-emerald-400"
                >
                  <circle cx="10" cy="10" r="7.25" />
                  <path d="m6.75 10.25 2.25 2.25 4.25-4.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-emerald-100">Order filled</span>
                  <span className="mt-0.5 block text-emerald-200/90">
                    {placeOrder.data.order.type === 'buy' ? 'Bought' : 'Sold'}{' '}
                    {formatQuantity(placeOrder.data.order.quantity)} {placeOrder.data.order.coin} at{' '}
                    {formatUsd(placeOrder.data.order.price)} · total {formatUsd(placeOrder.data.order.total)}
                  </span>
                </span>
              </p>
            )}
          </div>
        </div>
      </form>
    </Panel>
  );
}
