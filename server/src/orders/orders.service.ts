import { randomUUID } from 'node:crypto';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { CoinSymbol } from '../market/coins.js';
import { MarketService } from '../market/market.service.js';
import { type Portfolio, PortfolioService } from '../portfolio/portfolio.service.js';
import { checkOrder, type OrderRequest, type OrderType, orderTotal } from './order-validation.js';

export interface Order {
  id: string;
  coin: CoinSymbol;
  type: OrderType;
  quantity: number;
  price: number;
  total: number;
  status: 'filled';
  timestamp: string;
}

export interface OrderResult {
  order: Order;
  portfolio: Portfolio;
}

type Fill = Pick<Order, 'coin' | 'type' | 'quantity' | 'price'>;

const HOUR_MS = 3_600_000;

const SEED_ORDERS: (Fill & { hoursAgo: number })[] = [
  { coin: 'BTC', type: 'buy', quantity: 0.35, price: 61_240, hoursAgo: 142 },
  { coin: 'ETH', type: 'buy', quantity: 4.2, price: 3_180.25, hoursAgo: 139 },
  { coin: 'SOL', type: 'buy', quantity: 60, price: 136.8, hoursAgo: 120 },
  { coin: 'BNB', type: 'buy', quantity: 8, price: 562.1, hoursAgo: 114 },
  { coin: 'XRP', type: 'buy', quantity: 5_000, price: 0.4875, hoursAgo: 96 },
  { coin: 'SOL', type: 'sell', quantity: 15, price: 152.4, hoursAgo: 84 },
  { coin: 'BTC', type: 'buy', quantity: 0.15, price: 63_905, hoursAgo: 72 },
  { coin: 'ETH', type: 'sell', quantity: 1.2, price: 3_395.6, hoursAgo: 56 },
  { coin: 'XRP', type: 'sell', quantity: 2_000, price: 0.5412, hoursAgo: 44 },
  { coin: 'BNB', type: 'buy', quantity: 2, price: 578.3, hoursAgo: 28 },
  { coin: 'ETH', type: 'buy', quantity: 0.5, price: 3_428.1, hoursAgo: 9 },
  { coin: 'BTC', type: 'sell', quantity: 0.1, price: 64_720, hoursAgo: 2 },
];

@Injectable()
export class OrdersService {
  private readonly orders: Order[] = [];

  constructor(
    private readonly market: MarketService,
    private readonly portfolio: PortfolioService,
  ) {
    for (const { hoursAgo, ...fill } of SEED_ORDERS) {
      this.fill(fill, new Date(Date.now() - hoursAgo * HOUR_MS));
    }
  }

  findAll(): Order[] {
    return this.orders;
  }

  place(request: OrderRequest): OrderResult {
    const marketPrice = this.market.getPrice(request.coin);
    const rejection = checkOrder(request, {
      marketPrice,
      cashBalance: this.portfolio.getCashBalance(),
      heldQuantity: this.portfolio.getHolding(request.coin),
    });
    if (rejection) {
      throw new UnprocessableEntityException({ statusCode: 422, error: 'Unprocessable Entity', ...rejection });
    }

    const order = this.fill({ ...request, price: marketPrice }, new Date());
    return { order, portfolio: this.portfolio.getPortfolio() };
  }

  private fill({ coin, type, quantity, price }: Fill, filledAt: Date): Order {
    const order: Order = {
      id: randomUUID(),
      coin,
      type,
      quantity,
      price,
      total: orderTotal(quantity, price),
      status: 'filled',
      timestamp: filledAt.toISOString(),
    };
    this.portfolio.applyTrade(order);
    this.orders.unshift(order);
    return order;
  }
}
