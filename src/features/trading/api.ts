import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Order, OrderRequest, OrderResult, Portfolio } from './schemas';

export const portfolioQuery = queryOptions({
  queryKey: ['portfolio'],
  queryFn: async () => (await api.get<Portfolio>('/portfolio')).data,
});

export const ordersQuery = queryOptions({
  queryKey: ['orders'],
  queryFn: async () => (await api.get<Order[]>('/orders')).data,
});

export async function placeOrder(request: OrderRequest): Promise<OrderResult> {
  return (await api.post<OrderResult>('/orders', request)).data;
}
