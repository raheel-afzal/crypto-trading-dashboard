import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Coin, CoinSymbol, PricePoint } from './schemas';

export const coinsQuery = queryOptions({
  queryKey: ['coins'],
  queryFn: async () => (await api.get<Coin[]>('/coins')).data,
  staleTime: Infinity,
});

export function coinHistoryQuery(symbol: CoinSymbol) {
  return queryOptions({
    queryKey: ['history', symbol],
    queryFn: async () => (await api.get<PricePoint[]>(`/coins/${symbol}/history`)).data,
    staleTime: Infinity,
  });
}
