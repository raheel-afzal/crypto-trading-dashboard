import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import type { OrderType } from '@/features/trading/schemas';
import { formatChange, formatUsd } from '@/lib/format';
import { CoinIcon } from './CoinIcon';
import type { Coin, CoinSymbol, PricePoint } from './schemas';

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

interface CryptoRowProps {
  coin: Coin;
  history?: PricePoint[];
  isSelected: boolean;
  onSelect: (symbol: CoinSymbol) => void;
  onTrade: (symbol: CoinSymbol, type: OrderType) => void;
}

function Sparkline({ points }: { points: PricePoint[] }) {
  const prices = points.filter((_, index) => (points.length - 1 - index) % 5 === 0).map((point) => point.price);
  if (prices.length < 2) return null;

  const low = Math.min(...prices);
  const range = Math.max(...prices) - low || 1;
  const step = 100 / (prices.length - 1);
  const line = prices
    .map((price, index) => `${(index * step).toFixed(1)},${(21 - ((price - low) / range) * 18).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`h-6 w-24 ${prices[prices.length - 1] >= prices[0] ? 'text-emerald-400' : 'text-rose-400'}`}
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export const CryptoRow = memo(function CryptoRow({ coin, history, isSelected, onSelect, onTrade }: CryptoRowProps) {
  const previous = history?.at(-2)?.price;
  const trend = previous === undefined ? 0 : Math.sign(coin.price - previous);

  return (
    <tr className={`border-t border-white/5 transition-colors ${isSelected ? 'bg-white/4' : 'hover:bg-white/2'}`}>
      <th
        scope="row"
        className={`py-2.5 pr-2 text-left font-normal sm:pr-4 ${isSelected ? 'shadow-[inset_2px_0_0_var(--color-sky-400)]' : ''}`}
      >
        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(coin.symbol)}
          className="flex items-center gap-2 rounded-lg text-left transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 sm:gap-3"
        >
          <CoinIcon symbol={coin.symbol} className="size-7 sm:size-8" />
          <span>
            <span className="block font-semibold text-neutral-100">{coin.symbol}</span>
            <span className="hidden text-xs text-neutral-400 sm:block">{coin.name}</span>
          </span>
        </button>
      </th>
      <td className="py-2.5 pr-2 text-right sm:pr-4">
        <span
          key={coin.updatedAt}
          className={`block font-medium tabular-nums text-neutral-100 ${
            trend > 0 ? 'animate-tick-up' : trend < 0 ? 'animate-tick-down' : ''
          }`}
        >
          {formatUsd(coin.price)}
        </span>
        <span className="block text-xs tabular-nums sm:hidden">
          <span className={coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatChange(coin.change24h)}</span>
          <span className="text-neutral-500"> · {compactUsd.format(coin.volume24h)} vol</span>
        </span>
      </td>
      <td
        className={`hidden py-2.5 pr-2 text-right font-medium tabular-nums sm:table-cell sm:pr-4 ${
          coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {formatChange(coin.change24h)}
      </td>
      <td className="hidden py-2.5 pr-4 text-right tabular-nums text-neutral-300 sm:table-cell">
        {compactUsd.format(coin.volume24h)}
      </td>
      <td className="hidden py-2.5 pr-4 md:table-cell">{history && <Sparkline points={history} />}</td>
      <td className="py-2.5">
        <div className="flex justify-end gap-1.5 sm:gap-2">
          <Button variant="buySoft" aria-label={`Buy ${coin.name}`} onClick={() => onTrade(coin.symbol, 'buy')}>
            Buy
          </Button>
          <Button variant="sellSoft" aria-label={`Sell ${coin.name}`} onClick={() => onTrade(coin.symbol, 'sell')}>
            Sell
          </Button>
        </div>
      </td>
    </tr>
  );
});
