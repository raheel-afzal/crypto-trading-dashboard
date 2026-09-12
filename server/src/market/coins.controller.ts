import { Controller, Get, Param } from "@nestjs/common";
import {
  type Coin,
  type CoinSymbol,
  coinSymbolSchema,
  type PricePoint,
} from "./coins.js";
import { MarketService } from "./market.service.js";

@Controller("coins")
export class CoinsController {
  constructor(private readonly market: MarketService) {}

  @Get()
  findAll(): Coin[] {
    return this.market.getCoins();
  }

  @Get(":symbol/history")
  findHistory(
    @Param("symbol", { schema: coinSymbolSchema }) symbol: CoinSymbol,
  ): PricePoint[] {
    return this.market.getHistory(symbol);
  }
}
