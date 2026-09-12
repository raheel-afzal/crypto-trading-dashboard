import { Injectable } from "@nestjs/common";
import { COIN_SYMBOLS, type CoinSymbol } from "../market/coins.js";
import { PrismaService } from "../prisma/prisma.service.js";

export const INITIAL_CASH = 100_000;

// Postgres returns decimals as objects; every amount crosses the API as a number.
type Numeric = number | { toString(): string };

export interface Holding {
  symbol: CoinSymbol;
  quantity: number;
}

export interface Portfolio {
  cashBalance: number;
  holdings: Holding[];
}

export function toPortfolio(
  cashBalance: Numeric,
  holdings: readonly { symbol: CoinSymbol; quantity: Numeric }[],
): Portfolio {
  const held = new Map(
    holdings.map((holding) => [holding.symbol, Number(holding.quantity)]),
  );
  return {
    cashBalance: Number(cashBalance),
    holdings: COIN_SYMBOLS.filter((symbol) => held.has(symbol)).map(
      (symbol) => ({
        symbol,
        quantity: held.get(symbol) ?? 0,
      }),
    ),
  };
}

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio(userId: string): Promise<Portfolio> {
    const [user, holdings] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { cashBalance: true },
      }),
      this.prisma.holding.findMany({
        where: { userId },
        select: { symbol: true, quantity: true },
      }),
    ]);

    return toPortfolio(user.cashBalance, holdings);
  }
}
