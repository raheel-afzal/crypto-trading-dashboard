import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { type OrderRequest, orderRequestSchema } from './order-validation.js';
import { type Order, type OrderResult, OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(): Order[] {
    return this.orders.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  place(@Body({ schema: orderRequestSchema }) request: OrderRequest): OrderResult {
    return this.orders.place(request);
  }
}
