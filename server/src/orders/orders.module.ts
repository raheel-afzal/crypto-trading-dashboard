import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MarketModule } from '../market/market.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule, MarketModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
