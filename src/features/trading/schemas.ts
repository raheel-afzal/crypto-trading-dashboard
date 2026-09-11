import type { CoinSymbol } from '@/features/market/schemas';

export type OrderType = 'buy' | 'sell';

export type OrderStatus = 'pending' | 'filled';

export interface OrderRequest {
  coin: CoinSymbol;
  type: OrderType;
  quantity: number;
  price: number;
}

export interface Order extends OrderRequest {
  id: string;
  total: number;
  status: OrderStatus;
  timestamp: string;
}

export interface Holding {
  symbol: CoinSymbol;
  quantity: number;
}

export interface Portfolio {
  cashBalance: number;
  holdings: Holding[];
}

export interface OrderResult {
  order: Order;
  portfolio: Portfolio;
}
