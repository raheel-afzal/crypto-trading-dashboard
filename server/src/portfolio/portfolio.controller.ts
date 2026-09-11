import { Controller, Get } from '@nestjs/common';
import { type Portfolio, PortfolioService } from './portfolio.service.js';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  get(): Portfolio {
    return this.portfolio.getPortfolio();
  }
}
