import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { api, SavingsSeries } from "../lib/api";
import { formatCurrency, formatCurrencyShort } from "../lib/format";
import {
  MARKET_PRESETS,
  buildInvestmentSeries,
  totalContributed,
  InvestmentInputs,
} from "../lib/investment";
import { Card, CardTitle } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Input, Select, Label } from "../components/ui/Field";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

const isoToTs = (iso: string) => new Date(`${iso}T00:00:00.000Z`).getTime();

const formatAxisDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });

interface ChartRow {
  t: number;
  actual?: number | null;
  projected?: number | null;
  invested?: number | null;
}

export default function SavingsPage() {
  const [series, setSeries] = useState<SavingsSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Investment calculator inputs.
  const [presetKey, setPresetKey] = useState("sp500");
  const [customRate, setCustomRate] = useState(7);
  const [initialAmount, setInitialAmount] = useState<number | null>(null);
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [horizonYears, setHorizonYears] = useState(10);
  const [showInvested, setShowInvested] = useState(true);

  useEffect(() => {
    api
      .get<SavingsSeries>("/analytics/savings")
      .then((res) => setSeries(res.data))
      .catch(() => setError("Could not load savings data."))
      .finally(() => setLoading(false));
  }, []);

  const preset = MARKET_PRESETS.find((p) => p.key === presetKey) ?? MARKET_PRESETS[0];
  const annualRatePct = preset.key === "custom" ? customRate : preset.annualRatePct;
  const effectiveInitial = initialAmount ?? series?.currentBalance ?? 0;

  const projectedEnd = useMemo(() => {
    if (!series) return null;
    const withProjection = series.points.filter((p) => p.projected != null);
    return withProjection.length ? withProjection[withProjection.length - 1].projected : null;
  }, [series]);

  const investmentInputs: InvestmentInputs | null = useMemo(() => {
    if (!series) return null;
    const actuals = series.points.filter((p) => p.actual != null);
    const startTs = actuals.length ? isoToTs(actuals[actuals.length - 1].date) : Date.now();
    return {
      startTs,
      initialAmount: effectiveInitial,
      monthlyContribution,
      annualRatePct,
      horizonMonths: horizonYears * 12,
    };
  }, [series, effectiveInitial, monthlyContribution, annualRatePct, horizonYears]);

  const chartData: ChartRow[] = useMemo(() => {
    if (!series) return [];
    const byTs = new Map<number, ChartRow>();
    const upsert = (t: number, patch: Partial<ChartRow>) => {
      byTs.set(t, { ...(byTs.get(t) ?? { t }), ...patch });
    };

    for (const p of series.points) {
      upsert(isoToTs(p.date), { actual: p.actual, projected: p.projected });
    }
    if (showInvested && investmentInputs) {
      for (const ip of buildInvestmentSeries(investmentInputs)) {
        upsert(ip.t, { invested: ip.invested });
      }
    }
    return Array.from(byTs.values()).sort((a, b) => a.t - b.t);
  }, [series, showInvested, investmentInputs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl2" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl2" />
        <Skeleton className="h-80 w-full rounded-xl2" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon={TrendingUp} title="Couldn't load savings" description={error} />
    );
  }
  if (!series) return null;

  const hasHistory = series.points.some((p) => p.actual != null);
  const investedSeries =
    showInvested && investmentInputs ? buildInvestmentSeries(investmentInputs) : [];
  const investedEnd = investedSeries.length ? investedSeries[investedSeries.length - 1].invested : null;
  const growth =
    investedEnd != null && investmentInputs ? investedEnd - totalContributed(investmentInputs) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Track your balance and model what investing could look like.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard label="Current savings" value={formatCurrencyShort(series.currentBalance)} />
        <StatCard
          label="Projected (trend)"
          tone="brand"
          value={projectedEnd != null ? formatCurrencyShort(projectedEnd) : "—"}
        />
        <StatCard
          label={`If invested (${horizonYears}y)`}
          tone="positive"
          value={investedEnd != null ? formatCurrencyShort(investedEnd) : "—"}
        />
        <StatCard
          label="Est. market growth"
          tone="positive"
          value={growth != null ? formatCurrencyShort(growth) : "—"}
        />
      </div>

      {/* Market calculator */}
      <Card className="animate-fade-up">
        <CardTitle
          action={
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={showInvested}
                onChange={(e) => setShowInvested(e.target.checked)}
                className="accent-brand"
              />
              Show on chart
            </label>
          }
        >
          Market calculator
        </CardTitle>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div>
            <Label>Fund / ETF</Label>
            <Select value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
              {MARKET_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                  {p.ticker ? ` (${p.ticker})` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Annual return %</Label>
            <Input
              type="number"
              className="nums"
              value={annualRatePct}
              disabled={preset.key !== "custom"}
              onChange={(e) => setCustomRate(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Initial amount</Label>
            <Input
              type="number"
              className="nums"
              value={Math.round(effectiveInitial)}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Monthly</Label>
            <Input
              type="number"
              className="nums"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Horizon (years)</Label>
            <Select value={horizonYears} onChange={(e) => setHorizonYears(Number(e.target.value))}>
              {[1, 3, 5, 10, 20, 30].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
          Illustrative only. Returns compound monthly at the assumed rate; markets don't grow in a
          straight line and past performance doesn't guarantee future results.
        </p>
      </Card>

      <Card className="animate-fade-up">
        <CardTitle>Savings over time</CardTitle>
        {hasHistory || showInvested ? (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatAxisDate}
                tick={{ fill: "#64748b", fontSize: 11 }}
                stroke="rgba(255,255,255,0.1)"
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                stroke="rgba(255,255,255,0.1)"
                tickFormatter={(v) => formatCurrencyShort(Number(v))}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "#0e1626",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  boxShadow: "0 8px 30px -12px rgba(0,0,0,0.8)",
                }}
                labelStyle={{ color: "#94a3b8" }}
                labelFormatter={(v) => formatAxisDate(Number(v))}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual savings"
                stroke="#818cf8"
                fill="url(#actualFill)"
                strokeWidth={2}
                connectNulls
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected savings"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="6 4"
                connectNulls
                dot={false}
              />
              {showInvested && (
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="If invested"
                  stroke="#34d399"
                  strokeWidth={2}
                  connectNulls
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No savings history yet"
            description="History builds up as your balances are recorded on each transaction sync and daily."
          />
        )}
      </Card>
    </div>
  );
}
