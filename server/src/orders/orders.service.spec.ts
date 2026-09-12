import { UnprocessableEntityException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '../generated/prisma/client.js';
import { MarketService } from '../market/market.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { OrdersService } from './orders.service.js';

// These run real SQL, so they need a throwaway database - never the live one.
const connectionString = process.env.TEST_DATABASE_URL;
const USER = 'demo';
const OTHER = 'alex';

describe.skipIf(!connectionString)('OrdersService', () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: String(connectionString) }) }) as unknown as PrismaService;
  let market: MarketService;
  let orders: OrdersService;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    market = new MarketService();
    vi.spyOn(market, 'getPrice').mockReturnValue(100);
    orders = new OrdersService(prisma, market);
    await orders.onApplicationBootstrap();
  });

  it('opens every demo account with a history that matches its balances', async () => {
    const history = await orders.findAll(USER);
    const cash = history.reduce((sum, order) => sum + (order.type === 'buy' ? -order.total : order.total), 100_000);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(Number(user.cashBalance)).toBeCloseTo(cash, 2);

    for (const holding of await prisma.holding.findMany({ where: { userId: USER } })) {
      const held = history
        .filter((order) => order.coin === holding.symbol)
        .reduce((sum, order) => sum + (order.type === 'buy' ? order.quantity : -order.quantity), 0);
      expect(Number(holding.quantity)).toBeCloseTo(held, 8);
    }
  });

  it('fills a buy at the live market price and updates cash and holdings', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: USER } });

    const result = await orders.place(USER, { coin: 'SOL', type: 'buy', quantity: 2.5, price: 100.5 });

    expect(result.order).toMatchObject({ coin: 'SOL', type: 'buy', quantity: 2.5, price: 100, total: 250, status: 'filled' });
    expect(result.portfolio.cashBalance).toBeCloseTo(Number(before.cashBalance) - 250, 2);
    expect((await orders.findAll(USER))[0].id).toBe(result.order.id);
  });

  it('credits cash and drops the holding when a position is fully sold', async () => {
    const held = await prisma.holding.findUniqueOrThrow({ where: { userId_symbol: { userId: USER, symbol: 'BNB' } } });

    const { portfolio } = await orders.place(USER, { coin: 'BNB', type: 'sell', quantity: Number(held.quantity), price: 100 });

    expect(portfolio.holdings.map((holding) => holding.symbol)).not.toContain('BNB');
    expect(await prisma.holding.findUnique({ where: { userId_symbol: { userId: USER, symbol: 'BNB' } } })).toBeNull();
  });

  it('keeps holdings free of floating-point dust', async () => {
    await orders.place(USER, { coin: 'SOL', type: 'buy', quantity: 0.1, price: 100 });
    await orders.place(USER, { coin: 'SOL', type: 'buy', quantity: 0.2, price: 100 });
    const held = await prisma.holding.findUniqueOrThrow({ where: { userId_symbol: { userId: USER, symbol: 'SOL' } } });

    await orders.place(USER, { coin: 'SOL', type: 'sell', quantity: Number(held.quantity), price: 100 });

    expect(await prisma.holding.findUnique({ where: { userId_symbol: { userId: USER, symbol: 'SOL' } } })).toBeNull();
  });

  it('charges sub-cent totals instead of rounding them away', async () => {
    vi.spyOn(market, 'getPrice').mockReturnValue(65_000);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: USER } });

    const { order } = await orders.place(USER, { coin: 'BTC', type: 'buy', quantity: 0.00000001, price: 65_000 });

    expect(order.total).toBe(0.00065);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(Number(after.cashBalance)).toBeCloseTo(Number(before.cashBalance) - 0.00065, 8);
  });

  it('rolls the transaction back when the order is rejected', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    const count = (await orders.findAll(USER)).length;

    await expect(orders.place(USER, { coin: 'BTC', type: 'buy', quantity: 5_000, price: 100 })).rejects.toThrow(UnprocessableEntityException);
    await expect(orders.place(USER, { coin: 'BTC', type: 'sell', quantity: 5_000, price: 100 })).rejects.toThrow(
      expect.objectContaining({ status: 422, response: expect.objectContaining({ errorCode: 'INSUFFICIENT_HOLDINGS' }) }),
    );

    const after = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(Number(after.cashBalance)).toBe(Number(before.cashBalance));
    expect(await orders.findAll(USER)).toHaveLength(count);
  });

  it('keeps accounts isolated between users', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: OTHER } });

    await orders.place(USER, { coin: 'SOL', type: 'buy', quantity: 10, price: 100 });

    const after = await prisma.user.findUniqueOrThrow({ where: { id: OTHER } });
    expect(Number(after.cashBalance)).toBe(Number(before.cashBalance));
    expect(await orders.findAll(OTHER)).toHaveLength(12);
    expect(await orders.findAll(USER)).toHaveLength(13);
  });
});
