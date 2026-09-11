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

interface Account {
  cashBalance: number;
  holdings: Map<CoinSymbol, number>;
}

@Injectable()
export class PortfolioService {
  private readonly accounts = new Map<string, Account>();

  getPortfolio(userId: string): Portfolio {
    const account = this.account(userId);
    return {
      cashBalance: account.cashBalance,
      holdings: COIN_SYMBOLS.filter((symbol) => account.holdings.has(symbol)).map((symbol) => ({
        symbol,
        quantity: this.getHolding(userId, symbol),
      })),
    };
  }

  getCashBalance(userId: string): number {
    return this.account(userId).cashBalance;
  }

  getHolding(userId: string, symbol: CoinSymbol): number {
    return this.account(userId).holdings.get(symbol) ?? 0;
  }

  applyTrade(userId: string, { coin, type, quantity, total }: Order): void {
    const account = this.account(userId);
    const direction = type === 'buy' ? 1 : -1;
    const remaining = roundTo(this.getHolding(userId, coin) + direction * quantity, 8);
    if (remaining > 0) account.holdings.set(coin, remaining);
    else account.holdings.delete(coin);
    account.cashBalance = roundTo(account.cashBalance - direction * total, 8);
  }

  private account(userId: string): Account {
    const existing = this.accounts.get(userId);
    if (existing) return existing;

    const account: Account = { cashBalance: INITIAL_CASH, holdings: new Map() };
    this.accounts.set(userId, account);
    return account;
  }
}
