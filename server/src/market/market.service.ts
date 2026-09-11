import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { roundTo } from '../common/round.js';
import type { Coin, CoinSymbol, PricePoint } from './coins.js';

const TICK_INTERVAL_MS = 2_000;
const HISTORY_LENGTH = 150;

interface CoinState {
  symbol: CoinSymbol;
  name: string;
  price: number;
  open24h: number;
  volume24h: number;
  volatility: number;
  updatedAt: string;
  history: PricePoint[];
}

type CoinSeed = Pick<CoinState, 'symbol' | 'name' | 'price' | 'volume24h' | 'volatility'>;

function gaussian(): number {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

function roundPrice(price: number): number {
  return roundTo(price, price >= 1 ? 2 : 4);
}

function createCoin(seed: CoinSeed): CoinState {
  const now = Date.now();
  const history: PricePoint[] = [];
  let price = seed.price;
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    history.unshift({ timestamp: new Date(now - i * TICK_INTERVAL_MS).toISOString(), price: roundPrice(price) });
    price /= 1 + seed.volatility * gaussian();
  }

  return {
    ...seed,
    open24h: seed.price / (1 + (Math.random() - 0.5) * 0.08),
    updatedAt: new Date(now).toISOString(),
    history,
  };
}

@Injectable()
export class MarketService implements OnModuleInit, OnModuleDestroy {
  private readonly coins: Record<CoinSymbol, CoinState> = {
    BTC: createCoin({ symbol: 'BTC', name: 'Bitcoin', price: 65_000, volume24h: 32_400_000_000, volatility: 0.0012 }),
    ETH: createCoin({ symbol: 'ETH', name: 'Ethereum', price: 3_450, volume24h: 15_800_000_000, volatility: 0.0016 }),
    SOL: createCoin({ symbol: 'SOL', name: 'Solana', price: 148, volume24h: 2_900_000_000, volatility: 0.0024 }),
    XRP: createCoin({ symbol: 'XRP', name: 'XRP', price: 0.52, volume24h: 1_400_000_000, volatility: 0.002 }),
    BNB: createCoin({ symbol: 'BNB', name: 'BNB', price: 585, volume24h: 1_900_000_000, volatility: 0.0015 }),
  };
  private readonly ticks = new Subject<Coin[]>();
  private timer?: NodeJS.Timeout;

  readonly ticks$ = this.ticks.asObservable();

  onModuleInit() {
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
    this.ticks.complete();
  }

  getCoins(): Coin[] {
    return Object.values(this.coins).map(({ symbol, name, price, open24h, volume24h, updatedAt }) => ({
      symbol,
      name,
      price,
      change24h: roundTo(((price - open24h) / open24h) * 100, 2),
      volume24h: Math.round(volume24h),
      updatedAt,
    }));
  }

  getPrice(symbol: CoinSymbol): number {
    return this.coins[symbol].price;
  }

  getHistory(symbol: CoinSymbol): PricePoint[] {
    return this.coins[symbol].history;
  }

  private tick() {
    const updatedAt = new Date().toISOString();
    for (const coin of Object.values(this.coins)) {
      coin.price = roundPrice(coin.price * (1 + coin.volatility * gaussian()));
      coin.volume24h *= 1 + 0.002 * gaussian();
      coin.updatedAt = updatedAt;
      coin.history.push({ timestamp: updatedAt, price: coin.price });
      if (coin.history.length > HISTORY_LENGTH) coin.history.shift();
    }
    this.ticks.next(this.getCoins());
  }
}
