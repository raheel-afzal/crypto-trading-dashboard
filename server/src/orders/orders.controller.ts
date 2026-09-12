import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.service.js";
import { CurrentUser, JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { type OrderRequest, orderRequestSchema } from "./order-validation.js";
import {
  type Order,
  type OrderResult,
  OrdersService,
} from "./orders.service.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Order[]> {
    return this.orders.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  place(
    @CurrentUser() user: AuthUser,
    @Body({ schema: orderRequestSchema }) request: OrderRequest,
  ): Promise<OrderResult> {
    return this.orders.place(user.id, request);
  }
}
