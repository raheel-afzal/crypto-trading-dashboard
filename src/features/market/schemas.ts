export type CoinSymbol = 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'BNB';

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

export interface PricesMessage {
  event: 'prices';
  data: Coin[];
}
