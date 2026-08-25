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
import { api, SavingsSeries } from "../lib/api";
import {
  MARKET_PRESETS,
  buildInvestmentSeries,
  totalContributed,
  InvestmentInputs,
} from "../lib/investment";

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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

  // Default the initial amount to the current savings balance once loaded.
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
      const row = byTs.get(t) ?? { t };
      byTs.set(t, { ...row, ...patch });
    };

    for (const p of series.points) {
      const t = isoToTs(p.date);
      upsert(t, { actual: p.actual, projected: p.projected });
    }

    if (showInvested && investmentInputs) {
      for (const ip of buildInvestmentSeries(investmentInputs)) {
        upsert(ip.t, { invested: ip.invested });
      }
    }

    return Array.from(byTs.values()).sort((a, b) => a.t - b.t);
  }, [series, showInvested, investmentInputs]);

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!series) return null;

  const hasHistory = series.points.some((p) => p.actual != null);
  const investedEnd =
    showInvested && investmentInputs
      ? buildInvestmentSeries(investmentInputs).slice(-1)[0]?.invested ?? null
      : null;
  const growth =
    investedEnd != null && investmentInputs ? investedEnd - totalContributed(investmentInputs) : null;

  const inputCls =
    "w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-100";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Savings</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Current savings</p>
          <p className="text-2xl font-bold">{currency(series.currentBalance)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Projected (trend)</p>
          <p className="text-2xl font-bold text-sky-300">
            {projectedEnd != null ? currency(projectedEnd) : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">If invested ({horizonYears}y)</p>
          <p className="text-2xl font-bold text-emerald-300">
            {investedEnd != null ? currency(investedEnd) : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Est. market growth</p>
          <p className="text-2xl font-bold text-emerald-300">
            {growth != null ? currency(growth) : "—"}
          </p>
        </div>
      </div>

      {/* Market calculator controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400">Market calculator</h2>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showInvested}
              onChange={(e) => setShowInvested(e.target.checked)}
            />
            Show on chart
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Fund / ETF</span>
            <select className={inputCls} value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
              {MARKET_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                  {p.ticker ? ` (${p.ticker})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-400 space-y-1">
            <span>Annual return %</span>
            <input
              type="number"
              className={inputCls}
              value={annualRatePct}
              disabled={preset.key !== "custom"}
              onChange={(e) => setCustomRate(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-400 space-y-1">
            <span>Initial amount</span>
            <input
              type="number"
              className={inputCls}
              value={Math.round(effectiveInitial)}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-400 space-y-1">
            <span>Monthly contribution</span>
            <input
              type="number"
              className={inputCls}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-400 space-y-1">
            <span>Horizon (years)</span>
            <select
              className={inputCls}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
            >
              {[1, 3, 5, 10, 20, 30].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Illustrative only. Returns compound monthly at the assumed rate; markets don't grow in a
          straight line and past performance doesn't guarantee future results.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">Savings over time</h2>
        {hasHistory || showInvested ? (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatAxisDate}
                tick={{ fill: "#64748b", fontSize: 11 }}
                stroke="#334155"
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                stroke="#334155"
                tickFormatter={(v) => currency(Number(v))}
                width={70}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                labelFormatter={(v) => formatAxisDate(Number(v))}
                formatter={(value: number) => currency(value)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual savings"
                stroke="#6366f1"
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
          <p className="text-slate-500 text-sm">
            No savings history yet. History builds up over time as your balances are recorded
            (on each transaction sync and daily). Check back after your first sync.
          </p>
        )}
      </div>
    </div>
  );
}
