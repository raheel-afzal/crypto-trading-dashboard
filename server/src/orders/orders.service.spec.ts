import { UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketService } from '../market/market.service.js';
import { PortfolioService } from '../portfolio/portfolio.service.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  let market: MarketService;
  let portfolio: PortfolioService;
  let orders: OrdersService;

  beforeEach(() => {
    market = new MarketService();
    vi.spyOn(market, 'getPrice').mockReturnValue(100);
    portfolio = new PortfolioService();
    orders = new OrdersService(market, portfolio);
  });

  it('seeds a portfolio that is consistent with the seeded order history', () => {
    const history = orders.findAll();
    const cash = history.reduce((sum, order) => sum + (order.type === 'buy' ? -order.total : order.total), 100_000);
    expect(portfolio.getCashBalance()).toBeCloseTo(cash, 2);

    for (const { symbol, quantity } of portfolio.getPortfolio().holdings) {
      const held = history
        .filter((order) => order.coin === symbol)
        .reduce((sum, order) => sum + (order.type === 'buy' ? order.quantity : -order.quantity), 0);
      expect(quantity).toBeCloseTo(held, 8);
    }
  });

  it('fills a buy at the live market price and updates cash and holdings', () => {
    const cash = portfolio.getCashBalance();
    const held = portfolio.getHolding('SOL');

    const result = orders.place({ coin: 'SOL', type: 'buy', quantity: 2.5, price: 100.5 });

    expect(result.order).toMatchObject({ coin: 'SOL', type: 'buy', quantity: 2.5, price: 100, total: 250, status: 'filled' });
    expect(result.portfolio.cashBalance).toBeCloseTo(cash - 250, 2);
    expect(portfolio.getHolding('SOL')).toBeCloseTo(held + 2.5, 8);
    expect(orders.findAll()[0]).toBe(result.order);
  });

  it('credits cash and drops the holding when a position is fully sold', () => {
    const cash = portfolio.getCashBalance();
    const held = portfolio.getHolding('BNB');

    orders.place({ coin: 'BNB', type: 'sell', quantity: held, price: 100 });

    expect(portfolio.getCashBalance()).toBeCloseTo(cash + held * 100, 2);
    expect(portfolio.getPortfolio().holdings.map((holding) => holding.symbol)).not.toContain('BNB');
  });

  it('keeps holdings free of floating-point dust', () => {
    orders.place({ coin: 'SOL', type: 'buy', quantity: 0.1, price: 100 });
    orders.place({ coin: 'SOL', type: 'buy', quantity: 0.2, price: 100 });
    const held = portfolio.getHolding('SOL');

    orders.place({ coin: 'SOL', type: 'sell', quantity: held, price: 100 });

    expect(portfolio.getHolding('SOL')).toBe(0);
  });

  it('charges sub-cent totals instead of rounding them away', () => {
    vi.spyOn(market, 'getPrice').mockReturnValue(65_000);
    const cash = portfolio.getCashBalance();

    const { order } = orders.place({ coin: 'BTC', type: 'buy', quantity: 0.00000001, price: 65_000 });

    expect(order.total).toBe(0.00065);
    expect(portfolio.getCashBalance()).toBeCloseTo(cash - 0.00065, 8);
  });

  it('rejects with a 422 error code and leaves portfolio and history untouched', () => {
    const before = portfolio.getPortfolio();
    const count = orders.findAll().length;

    expect(() => orders.place({ coin: 'BTC', type: 'buy', quantity: 5_000, price: 100 })).toThrow(UnprocessableEntityException);
    expect(() => orders.place({ coin: 'BTC', type: 'sell', quantity: 5_000, price: 100 })).toThrow(
      expect.objectContaining({ status: 422, response: expect.objectContaining({ errorCode: 'INSUFFICIENT_HOLDINGS' }) }),
    );
    expect(portfolio.getPortfolio()).toEqual(before);
    expect(orders.findAll()).toHaveLength(count);
  });
});
