// Market-return presets. These are rough long-run historical *nominal* annual
// averages and are for illustration only, not financial advice.
//
// NOTE (live data seam): today these are static assumptions. To wire in live
// data later, replace `MARKET_PRESETS` with values fetched from a backend
// endpoint (e.g. GET /api/analytics/market-returns) that pulls trailing
// returns for each ticker from a market-data provider.
export interface MarketPreset {
  key: string;
  label: string;
  ticker?: string;
  annualRatePct: number;
}

export const MARKET_PRESETS: MarketPreset[] = [
  { key: "sp500", label: "S&P 500", ticker: "VOO", annualRatePct: 10 },
  { key: "total", label: "Total US Market", ticker: "VTI", annualRatePct: 9 },
  { key: "nasdaq", label: "Nasdaq-100", ticker: "QQQ", annualRatePct: 13 },
  { key: "world", label: "Total World", ticker: "VT", annualRatePct: 8 },
  { key: "bonds", label: "Total Bond", ticker: "BND", annualRatePct: 4 },
  { key: "custom", label: "Custom rate", annualRatePct: 7 },
];

export interface InvestmentPoint {
  t: number; // ms timestamp
  invested: number;
}

export interface InvestmentInputs {
  startTs: number;
  initialAmount: number;
  monthlyContribution: number;
  annualRatePct: number;
  horizonMonths: number;
}

// Compound an initial lump sum plus monthly contributions. Interest compounds
// monthly at annualRate/12; contributions are added at the end of each month.
export function buildInvestmentSeries({
  startTs,
  initialAmount,
  monthlyContribution,
  annualRatePct,
  horizonMonths,
}: InvestmentInputs): InvestmentPoint[] {
  const monthlyRate = annualRatePct / 100 / 12;
  const points: InvestmentPoint[] = [];
  const start = new Date(startTs);

  let value = initialAmount;
  points.push({ t: startTs, invested: value });

  for (let m = 1; m <= horizonMonths; m++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, start.getUTCDate()));
    points.push({ t: d.getTime(), invested: value });
  }

  return points;
}

// Total dollars the user actually put in (excludes growth).
export function totalContributed(inputs: InvestmentInputs): number {
  return inputs.initialAmount + inputs.monthlyContribution * inputs.horizonMonths;
}
