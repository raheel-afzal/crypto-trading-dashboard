import { Module } from '@nestjs/common';
import { MarketModule } from './market/market.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';

@Module({
  imports: [MarketModule, PortfolioModule, OrdersModule],
})
export class AppModule {}
