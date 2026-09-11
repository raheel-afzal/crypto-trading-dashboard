import { Injectable } from '@nestjs/common';
import { roundTo } from '../common/round.js';
import { COIN_SYMBOLS, type CoinSymbol } from '../market/coins.js';
import type { Order } from '../orders/orders.service.js';

const INITIAL_CASH = 100_000;

export interface Holding {
  symbol: CoinSymbol;
  quantity: number;
}

export interface Portfolio {
  cashBalance: number;
  holdings: Holding[];
}

@Injectable()
export class PortfolioService {
  private cashBalance = INITIAL_CASH;
  private readonly holdings = new Map<CoinSymbol, number>();

  getPortfolio(): Portfolio {
    return {
      cashBalance: this.cashBalance,
      holdings: COIN_SYMBOLS.filter((symbol) => this.holdings.has(symbol)).map((symbol) => ({
        symbol,
        quantity: this.getHolding(symbol),
      })),
    };
  }

  getCashBalance(): number {
    return this.cashBalance;
  }

  getHolding(symbol: CoinSymbol): number {
    return this.holdings.get(symbol) ?? 0;
  }

  applyTrade({ coin, type, quantity, total }: Order): void {
    const direction = type === 'buy' ? 1 : -1;
    const remaining = roundTo(this.getHolding(coin) + direction * quantity, 8);
    if (remaining > 0) this.holdings.set(coin, remaining);
    else this.holdings.delete(coin);
    this.cashBalance = roundTo(this.cashBalance - direction * total, 8);
  }
}
