import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Wallet, Bell, ArrowRight } from "lucide-react";
import { api, Bucket, AlertItem, SavingsSeries } from "../lib/api";
import { formatCurrency, formatCurrencyShort, formatDateTime } from "../lib/format";
import { Card, CardTitle } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton, SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";

const SavingsSparkline = lazy(() => import("../components/SavingsSparkline"));

export default function DashboardPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [savings, setSavings] = useState<SavingsSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/buckets"), api.get("/alerts")])
      .then(([b, a]) => {
        setBuckets(b.data.buckets);
        setAlerts(a.data.alerts.slice(0, 4));
      })
      .finally(() => setLoading(false));

    // Sparkline is supplementary; failure shouldn't break the dashboard.
    api
      .get<SavingsSeries>("/analytics/savings")
      .then((res) => setSavings(res.data))
      .catch(() => undefined);
  }, []);

  const totalLimit = buckets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = buckets.reduce((sum, b) => sum + b.spentThisMonth, 0);
  const remaining = totalLimit - totalSpent;
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const over = totalSpent > totalLimit;

  const sparkline = (savings?.points ?? []).filter((p) => p.actual != null);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-56 w-full rounded-xl2" />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Your spending at a glance this month.</p>
      </div>

      {/* Hero: budget ring + key figures */}
      <Card className="animate-fade-up">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <ProgressRing percent={pct} over={over}>
            <p className="nums text-3xl font-bold tracking-tight">{Math.round(pct)}%</p>
            <p className="text-xs text-slate-500">of budget</p>
          </ProgressRing>

          <div className="w-full flex-1 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Spent this month</p>
              <p className={`nums text-3xl font-bold tracking-tight ${over ? "text-negative" : ""}`}>
                {formatCurrency(totalSpent)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                of {formatCurrency(totalLimit)} budgeted
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {over ? "Over budget" : "Remaining"}
                </p>
                <p
                  className={`nums text-lg font-semibold ${
                    over ? "text-negative" : "text-positive"
                  }`}
                >
                  {formatCurrency(Math.abs(remaining))}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Savings</p>
                <p className="nums text-lg font-semibold text-slate-100">
                  {savings ? formatCurrencyShort(savings.currentBalance) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {sparkline.length >= 2 && (
          <div className="mt-5 border-t border-white/5 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Savings trend</p>
              <Link
                to="/savings"
                className="flex items-center gap-1 text-xs text-brand-soft hover:text-brand"
              >
                Details <ArrowRight size={12} />
              </Link>
            </div>
            <Suspense fallback={<Skeleton className="h-14 w-full" />}>
              <SavingsSparkline data={sparkline} />
            </Suspense>
          </div>
        )}
      </Card>

      {/* Buckets */}
      <section>
        <CardTitle
          action={
            <Link to="/buckets" className="text-xs text-brand-soft hover:text-brand">
              Manage
            </Link>
          }
        >
          Buckets
        </CardTitle>
        {buckets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No buckets yet"
            description="Create budget buckets to start tracking where your money goes."
            action={
              <Link to="/buckets">
                <Button size="sm">Create a bucket</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {buckets.map((b) => {
              const bOver = b.spentThisMonth > b.monthlyLimit;
              return (
                <Card key={b.id} className="animate-fade-up">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      <span className="text-sm font-medium">{b.name}</span>
                    </div>
                    <span className={`nums text-xs ${bOver ? "text-negative" : "text-slate-400"}`}>
                      {formatCurrencyShort(b.spentThisMonth)} / {formatCurrencyShort(b.monthlyLimit)}
                    </span>
                  </div>
                  <ProgressBar
                    value={b.spentThisMonth}
                    max={b.monthlyLimit}
                    color={b.color}
                    over={bOver}
                    className="h-1.5"
                  />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent alerts */}
      <section>
        <CardTitle
          action={
            <Link to="/alerts" className="text-xs text-brand-soft hover:text-brand">
              View all
            </Link>
          }
        >
          Recent alerts
        </CardTitle>
        {alerts.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts yet" description="You'll be notified here when a bucket nears its limit." />
        ) : (
          <div className="grid gap-2">
            {alerts.map((a) => (
              <Card key={a.id} className="animate-fade-up flex items-start gap-3 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{a.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(a.createdAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
