import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { PortfolioModule } from '../portfolio/portfolio.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [MarketModule, PortfolioModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
