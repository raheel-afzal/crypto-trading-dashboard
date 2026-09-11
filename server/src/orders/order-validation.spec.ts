import { describe, expect, it } from 'vitest';
import { checkOrder, type OrderRequest, orderRequestSchema } from './order-validation.js';

const validRequest: OrderRequest = { coin: 'BTC', type: 'buy', quantity: 0.5, price: 65_000 };

function validationMessages(input: unknown): string[] {
  const result = orderRequestSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('orderRequestSchema', () => {
  it('accepts a well-formed order', () => {
    expect(orderRequestSchema.parse(validRequest)).toEqual(validRequest);
  });

  it.each([0, -1, -0.00000001])('rejects quantity %s because it must be greater than 0', (quantity) => {
    expect(validationMessages({ ...validRequest, quantity })).toEqual(['quantity must be greater than 0']);
  });

  it.each(['1', null, undefined, Number.NaN, Number.POSITIVE_INFINITY])('rejects non-finite quantity %s', (quantity) => {
    expect(validationMessages({ ...validRequest, quantity })).toEqual(['quantity must be a finite number']);
  });

  it('limits quantity precision to 8 decimal places', () => {
    expect(validationMessages({ ...validRequest, quantity: 0.123456789 })).toEqual(['quantity supports at most 8 decimal places']);
    expect(validationMessages({ ...validRequest, quantity: 0.00000001 })).toEqual([]);
  });

  it.each([0, -65_000])('rejects non-positive price %s', (price) => {
    expect(validationMessages({ ...validRequest, price })).toEqual(['price must be a positive number']);
  });

  it.each(['65000', null, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects non-finite price %s', (price) => {
    expect(validationMessages({ ...validRequest, price })).toEqual(['price must be a finite number']);
  });

  it.each(['DOGE', 'btc', ''])('rejects unsupported coin "%s"', (coin) => {
    expect(validationMessages({ ...validRequest, coin })).toEqual(['coin must be one of: BTC, ETH, SOL, XRP, BNB']);
  });

  it.each(['hold', 'BUY', undefined])('rejects order type %s', (type) => {
    expect(validationMessages({ ...validRequest, type })).toEqual(['type must be either "buy" or "sell"']);
  });

  it('rejects unknown fields', () => {
    expect(validationMessages({ ...validRequest, leverage: 10 })).toEqual(['Unrecognized key: "leverage"']);
  });

  it.each([null, [], 'BTC'])('rejects a non-object body %j', (body) => {
    expect(validationMessages(body)).toEqual(['order must be a JSON object']);
  });

  it('reports every invalid field at once', () => {
    expect(validationMessages({ coin: 'DOGE', type: 'buy', quantity: 0, price: -1 })).toHaveLength(3);
  });
});

describe('checkOrder', () => {
  const context = { marketPrice: 65_000, cashBalance: 50_000, heldQuantity: 0.5 };
  const buy = (quantity: number, price = context.marketPrice): OrderRequest => ({ coin: 'BTC', type: 'buy', quantity, price });
  const sell = (quantity: number, price = context.marketPrice): OrderRequest => ({ coin: 'BTC', type: 'sell', quantity, price });

  it('accepts a buy within the cash balance', () => {
    expect(checkOrder(buy(0.5), context)).toBeNull();
  });

  it('accepts a buy whose total equals the cash balance exactly', () => {
    expect(checkOrder(buy(1, 50_000), { ...context, marketPrice: 50_000 })).toBeNull();
  });

  it('rejects a buy whose total exceeds the cash balance', () => {
    expect(checkOrder(buy(1), context)).toEqual({
      errorCode: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient USD balance: order total $65,000.00 exceeds available cash of $50,000.00.',
    });
  });

  it('prices the buy constraint at the live market price, not the submitted price', () => {
    const result = checkOrder(buy(1, 49_600), { marketPrice: 50_000, cashBalance: 49_800, heldQuantity: 0 });
    expect(result?.errorCode).toBe('INSUFFICIENT_FUNDS');
  });

  it('accepts selling exactly the held quantity', () => {
    expect(checkOrder(sell(0.5), context)).toBeNull();
  });

  it('rejects selling more than the held quantity', () => {
    expect(checkOrder(sell(0.50000001), context)).toEqual({
      errorCode: 'INSUFFICIENT_HOLDINGS',
      message: 'Insufficient BTC balance: tried to sell 0.50000001 BTC but only 0.5 BTC is available.',
    });
  });

  it('rejects selling a coin that is not held', () => {
    expect(checkOrder(sell(0.1), { ...context, heldQuantity: 0 })?.errorCode).toBe('INSUFFICIENT_HOLDINGS');
  });

  it('does not apply the cash constraint to sells', () => {
    expect(checkOrder(sell(0.5), { ...context, cashBalance: 0 })).toBeNull();
  });

  it.each([64_350, 65_650])('accepts price %s on the 1%% slippage boundary', (price) => {
    expect(checkOrder(buy(0.1, price), context)).toBeNull();
  });

  it.each([64_349.99, 65_650.01])('rejects price %s beyond the 1%% slippage tolerance', (price) => {
    expect(checkOrder(buy(0.1, price), context)).toEqual({
      errorCode: 'PRICE_SLIPPAGE',
      message: expect.stringContaining('outside the 1% slippage tolerance of the current BTC price $65,000.00'),
    });
  });

  it('checks slippage before balances', () => {
    expect(checkOrder(buy(100, 70_000), context)?.errorCode).toBe('PRICE_SLIPPAGE');
  });
});
