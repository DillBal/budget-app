// Single source of truth for money/number formatting so figures look the same
// on every page.

export function formatCurrency(value: number, fractionDigits = 2): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

// Whole-dollar variant for headline stats and chart axes.
export function formatCurrencyShort(value: number): string {
  return formatCurrency(value, 0);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
