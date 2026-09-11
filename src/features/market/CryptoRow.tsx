import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import type { OrderType } from '@/features/trading/schemas';
import { formatChange, formatUsd } from '@/lib/format';
import type { Coin, CoinSymbol } from './schemas';

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

interface CryptoRowProps {
  coin: Coin;
  isSelected: boolean;
  onTrade: (symbol: CoinSymbol, type: OrderType) => void;
}

export const CryptoRow = memo(function CryptoRow({ coin, isSelected, onTrade }: CryptoRowProps) {
  return (
    <tr className={`border-t border-white/5 ${isSelected ? 'bg-sky-400/5' : ''}`}>
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <span className="font-semibold text-neutral-100">{coin.symbol}</span>
        <span className="ml-2 text-neutral-400">{coin.name}</span>
      </th>
      <td className="py-3 pr-4 text-right font-medium tabular-nums text-neutral-100">{formatUsd(coin.price)}</td>
      <td className={`py-3 pr-4 text-right tabular-nums ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {formatChange(coin.change24h)}
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-neutral-300">{compactUsd.format(coin.volume24h)}</td>
      <td className="py-3">
        <div className="flex justify-end gap-2">
          <Button variant="buy" aria-label={`Buy ${coin.name}`} onClick={() => onTrade(coin.symbol, 'buy')}>
            Buy
          </Button>
          <Button variant="sell" aria-label={`Sell ${coin.name}`} onClick={() => onTrade(coin.symbol, 'sell')}>
            Sell
          </Button>
        </div>
      </td>
    </tr>
  );
});
