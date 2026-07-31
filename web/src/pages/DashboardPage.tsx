import { useEffect, useState } from "react";
import { api, Bucket, AlertItem } from "../lib/api";

export default function DashboardPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/buckets"), api.get("/alerts")])
      .then(([b, a]) => {
        setBuckets(b.data.buckets);
        setAlerts(a.data.alerts.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const totalLimit = buckets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = buckets.reduce((sum, b) => sum + b.spentThisMonth, 0);

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total budget this month</p>
          <p className="text-2xl font-bold">${totalLimit.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total spent this month</p>
          <p className={`text-2xl font-bold ${totalSpent > totalLimit ? "text-red-400" : ""}`}>
            ${totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Buckets</h2>
        <div className="grid gap-2">
          {buckets.map((b) => {
            const pct = b.monthlyLimit > 0 ? Math.min(100, (b.spentThisMonth / b.monthlyLimit) * 100) : 0;
            return (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.name}</span>
                  <span className="text-slate-400">
                    ${b.spentThisMonth.toFixed(0)} / ${b.monthlyLimit.toFixed(0)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
                </div>
              </div>
            );
          })}
          {buckets.length === 0 && <p className="text-slate-500 text-sm">No buckets yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Recent alerts</h2>
        <div className="grid gap-2">
          {alerts.map((a) => (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm">
              {a.message}
            </div>
          ))}
          {alerts.length === 0 && <p className="text-slate-500 text-sm">No alerts yet.</p>}
        </div>
      </div>
    </div>
  );
}
