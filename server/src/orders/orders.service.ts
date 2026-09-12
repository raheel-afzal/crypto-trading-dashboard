import { Injectable, type OnApplicationBootstrap, UnprocessableEntityException } from '@nestjs/common';
import { USERS } from '../auth/users.js';
import { roundTo } from '../common/round.js';
import type { Order as OrderRow } from '../generated/prisma/client.js';
import type { CoinSymbol } from '../market/coins.js';
import { MarketService } from '../market/market.service.js';
import { INITIAL_CASH, type Portfolio, toPortfolio } from '../portfolio/portfolio.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    coin: row.coin,
    type: row.type,
    quantity: Number(row.quantity),
    price: Number(row.price),
    total: Number(row.total),
    status: row.status,
    timestamp: row.timestamp.toISOString(),
  };
}

// Replays the demo history in memory so a new account can be written in one statement.
function openingBooks(now: number) {
  const holdings = new Map<CoinSymbol, number>();
  let cashBalance = INITIAL_CASH;

  const orders = SEED_ORDERS.map(({ hoursAgo, ...fill }) => {
    const total = orderTotal(fill.quantity, fill.price);
    const direction = fill.type === 'buy' ? 1 : -1;
    cashBalance = roundTo(cashBalance - direction * total, 8);
    holdings.set(fill.coin, roundTo((holdings.get(fill.coin) ?? 0) + direction * fill.quantity, 8));
    return { ...fill, total, status: 'filled' as const, timestamp: new Date(now - hoursAgo * HOUR_MS) };
  });

  return {
    cashBalance,
    orders,
    holdings: [...holdings].filter(([, quantity]) => quantity > 0).map(([symbol, quantity]) => ({ symbol, quantity })),
  };
}

@Injectable()
export class OrdersService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.prisma.user.count()) > 0) return;

    const now = Date.now();
    for (const user of USERS) {
      const { cashBalance, holdings, orders } = openingBooks(now);
      await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          passwordHash: user.passwordHash,
          cashBalance,
          holdings: { create: holdings },
          orders: { create: orders },
        },
      });
    }
  }

  async findAll(userId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({ where: { userId }, orderBy: { timestamp: 'desc' } });
    return rows.map(toOrder);
  }

  async place(userId: string, request: OrderRequest): Promise<OrderResult> {
    const marketPrice = this.market.getPrice(request.coin);

    return this.prisma.$transaction(async (tx) => {
      // Lock the account for this transaction so two orders cannot spend the same balance.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

      const [user, holding] = await Promise.all([
        tx.user.findUniqueOrThrow({ where: { id: userId }, select: { cashBalance: true } }),
        tx.holding.findUnique({ where: { userId_symbol: { userId, symbol: request.coin } } }),
      ]);

      const rejection = checkOrder(request, {
        marketPrice,
        cashBalance: Number(user.cashBalance),
        heldQuantity: Number(holding?.quantity ?? 0),
      });
      if (rejection) {
        throw new UnprocessableEntityException({ statusCode: 422, error: 'Unprocessable Entity', ...rejection });
      }

      const { coin, type, quantity } = request;
      const total = orderTotal(quantity, marketPrice);
      const direction = type === 'buy' ? 1 : -1;
      const remaining = roundTo(Number(holding?.quantity ?? 0) + direction * quantity, 8);
      const cashBalance = roundTo(Number(user.cashBalance) - direction * total, 8);

      const [row] = await Promise.all([
        tx.order.create({
          data: { userId, coin, type, quantity, price: marketPrice, total, status: 'filled', timestamp: new Date() },
        }),
        tx.user.update({ where: { id: userId }, data: { cashBalance } }),
        remaining > 0
          ? tx.holding.upsert({
              where: { userId_symbol: { userId, symbol: coin } },
              create: { userId, symbol: coin, quantity: remaining },
              update: { quantity: remaining },
            })
          : tx.holding.deleteMany({ where: { userId, symbol: coin } }),
      ]);

      const holdings = await tx.holding.findMany({ where: { userId }, select: { symbol: true, quantity: true } });
      return { order: toOrder(row), portfolio: toPortfolio(cashBalance, holdings) };
    });
  }
}
