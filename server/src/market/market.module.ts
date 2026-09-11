import { Module } from '@nestjs/common';
import { CoinsController } from './coins.controller.js';
import { MarketGateway } from './market.gateway.js';
import { MarketService } from './market.service.js';

@Module({
  controllers: [CoinsController],
  providers: [MarketService, MarketGateway],
  exports: [MarketService],
})
export class MarketModule {}
