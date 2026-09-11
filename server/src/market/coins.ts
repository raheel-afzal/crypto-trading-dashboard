import { z } from 'zod';

export const COIN_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB'] as const;

export type CoinSymbol = (typeof COIN_SYMBOLS)[number];

export const coinSymbolSchema = z.enum(COIN_SYMBOLS, {
  error: `coin must be one of: ${COIN_SYMBOLS.join(', ')}`,
});

export interface Coin {
  symbol: CoinSymbol;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  updatedAt: string;
}

export interface PricePoint {
  timestamp: string;
  price: number;
}
