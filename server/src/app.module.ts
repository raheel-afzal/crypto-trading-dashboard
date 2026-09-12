import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { MarketModule } from "./market/market.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PortfolioModule } from "./portfolio/portfolio.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MarketModule,
    PortfolioModule,
    OrdersModule,
  ],
})
export class AppModule {}
