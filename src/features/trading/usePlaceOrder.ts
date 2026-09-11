import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersQuery, placeOrder, portfolioQuery } from './api';
import type { Order, Portfolio } from './schemas';

function applyOrder({ cashBalance, holdings }: Portfolio, order: Order): Portfolio {
  const direction = order.type === 'buy' ? 1 : -1;
  const held = holdings.find((holding) => holding.symbol === order.coin)?.quantity ?? 0;
  const quantity = held + direction * order.quantity;
  const others = holdings.filter((holding) => holding.symbol !== order.coin);

  return {
    cashBalance: cashBalance - direction * order.total,
    holdings: quantity > 0 ? [...others, { symbol: order.coin, quantity }] : others,
  };
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: placeOrder,
    onMutate: async (request) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: portfolioQuery.queryKey }),
        queryClient.cancelQueries({ queryKey: ordersQuery.queryKey }),
      ]);

      const previousPortfolio = queryClient.getQueryData(portfolioQuery.queryKey);
      const previousOrders = queryClient.getQueryData(ordersQuery.queryKey);
      const pendingOrder: Order = {
        ...request,
        id: `pending-${Date.now()}`,
        total: request.quantity * request.price,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      if (previousPortfolio) queryClient.setQueryData(portfolioQuery.queryKey, applyOrder(previousPortfolio, pendingOrder));
      if (previousOrders) queryClient.setQueryData(ordersQuery.queryKey, [pendingOrder, ...previousOrders]);

      return { previousPortfolio, previousOrders, pendingId: pendingOrder.id };
    },
    onError: (_error, _request, snapshot) => {
      if (snapshot?.previousPortfolio) queryClient.setQueryData(portfolioQuery.queryKey, snapshot.previousPortfolio);
      if (snapshot?.previousOrders) queryClient.setQueryData(ordersQuery.queryKey, snapshot.previousOrders);
    },
    onSuccess: ({ order, portfolio }, _request, { pendingId }) => {
      queryClient.setQueryData(portfolioQuery.queryKey, portfolio);
      queryClient.setQueryData(ordersQuery.queryKey, (orders) => orders?.map((item) => (item.id === pendingId ? order : item)));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: portfolioQuery.queryKey });
      void queryClient.invalidateQueries({ queryKey: ordersQuery.queryKey });
    },
  });
}
