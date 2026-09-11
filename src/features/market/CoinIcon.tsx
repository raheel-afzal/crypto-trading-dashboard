import type { ReactNode } from 'react';
import type { CoinSymbol } from './schemas';

export const COIN_COLOR: Record<CoinSymbol, string> = {
  BTC: 'text-coin-btc',
  ETH: 'text-coin-eth',
  SOL: 'text-coin-sol',
  XRP: 'text-coin-xrp',
  BNB: 'text-coin-bnb',
};

const MARKS: Record<CoinSymbol, ReactNode> = {
  BTC: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5.5v13M11.6 3.4v2.1M14.6 3.4v2.1M11.6 18.5v2.1M14.6 18.5v2.1" />
      <path d="M9 5.5h4.7a3.25 3.25 0 0 1 0 6.5H9" />
      <path d="M9 12h5.2a3.25 3.25 0 0 1 0 6.5H9" />
    </g>
  ),
  ETH: (
    <g fill="currentColor">
      <path d="M12 2.4 5.9 12.2 12 15.8l6.1-3.6L12 2.4Z" opacity="0.65" />
      <path d="M12 17.2 5.9 13.6 12 21.8l6.1-8.2L12 17.2Z" />
    </g>
  ),
  SOL: (
    <g fill="currentColor">
      <path d="M7.2 6h13.3l-3.7 3.2H3.5L7.2 6Z" />
      <path d="M3.5 10.4h13.3l3.7 3.2H7.2l-3.7-3.2Z" />
      <path d="M7.2 14.8h13.3l-3.7 3.2H3.5l3.7-3.2Z" />
    </g>
  ),
  XRP: (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4.4 5.2 8.8 9.6a4.5 4.5 0 0 0 6.4 0l4.4-4.4" />
      <path d="M4.4 18.8 8.8 14.4a4.5 4.5 0 0 1 6.4 0l4.4 4.4" />
    </g>
  ),
  BNB: (
    <g fill="currentColor">
      <path d="M12 3 15.6 6.6 13.8 8.4 12 6.6 10.2 8.4 8.4 6.6 12 3Z" />
      <path d="M12 21 8.4 17.4 10.2 15.6 12 17.4 13.8 15.6 15.6 17.4 12 21Z" />
      <path d="M12 9.4 14.6 12 12 14.6 9.4 12 12 9.4Z" />
      <path d="M5.6 9.4 8.2 12 5.6 14.6 3 12 5.6 9.4Z" />
      <path d="M18.4 9.4 21 12 18.4 14.6 15.8 12 18.4 9.4Z" />
    </g>
  ),
};

interface CoinIconProps {
  symbol: CoinSymbol;
  className?: string;
}

export function CoinIcon({ symbol, className = 'size-8' }: CoinIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full bg-current/12 ${COIN_COLOR[symbol]} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3/5 w-3/5">
        {MARKS[symbol]}
      </svg>
    </span>
  );
}
