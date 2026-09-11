import { z } from 'zod';
import { roundTo } from '../common/round.js';
import { coinSymbolSchema } from '../market/coins.js';

const MAX_SLIPPAGE = 0.01;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 });
const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 });

export const orderRequestSchema = z.strictObject(
  {
    coin: coinSymbolSchema,
    type: z.enum(['buy', 'sell'], { error: 'type must be either "buy" or "sell"' }),
    quantity: z
      .number({ error: 'quantity must be a finite number' })
      .gt(0, { error: 'quantity must be greater than 0' })
      .refine((value) => Number(value.toFixed(8)) === value, { error: 'quantity supports at most 8 decimal places' }),
    price: z.number({ error: 'price must be a finite number' }).gt(0, { error: 'price must be a positive number' }),
  },
  { error: (issue) => (issue.code === 'invalid_type' ? 'order must be a JSON object' : undefined) },
);

export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderType = OrderRequest['type'];

export interface OrderContext {
  marketPrice: number;
  cashBalance: number;
  heldQuantity: number;
}

export interface OrderRejection {
  errorCode: 'PRICE_SLIPPAGE' | 'INSUFFICIENT_HOLDINGS' | 'INSUFFICIENT_FUNDS';
  message: string;
}

export function orderTotal(quantity: number, price: number): number {
  return roundTo(quantity * price, 8);
}

export function checkOrder(order: OrderRequest, { marketPrice, cashBalance, heldQuantity }: OrderContext): OrderRejection | null {
  if (Math.abs(order.price - marketPrice) / marketPrice > MAX_SLIPPAGE) {
    return {
      errorCode: 'PRICE_SLIPPAGE',
      message: `Price ${usd.format(order.price)} is outside the ${MAX_SLIPPAGE * 100}% slippage tolerance of the current ${order.coin} price ${usd.format(marketPrice)}.`,
    };
  }

  if (order.type === 'sell' && order.quantity > heldQuantity) {
    return {
      errorCode: 'INSUFFICIENT_HOLDINGS',
      message: `Insufficient ${order.coin} balance: tried to sell ${amount.format(order.quantity)} ${order.coin} but only ${amount.format(heldQuantity)} ${order.coin} is available.`,
    };
  }

  const total = orderTotal(order.quantity, marketPrice);
  if (order.type === 'buy' && total > cashBalance) {
    return {
      errorCode: 'INSUFFICIENT_FUNDS',
      message: `Insufficient USD balance: order total ${usd.format(total)} exceeds available cash of ${usd.format(cashBalance)}.`,
    };
  }

  return null;
}
