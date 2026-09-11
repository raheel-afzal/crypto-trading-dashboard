const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const subDollarUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 });
const quantity = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });
const change = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, signDisplay: 'exceptZero' });

export function formatUsd(value: number): string {
  return (value !== 0 && Math.abs(value) < 1 ? subDollarUsd : usd).format(value);
}

export function formatQuantity(value: number): string {
  return quantity.format(value);
}

export function formatPercent(value: number): string {
  return percent.format(value / 100);
}

export function formatChange(value: number): string {
  return change.format(value / 100);
}
