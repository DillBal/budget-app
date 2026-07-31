import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { api, Bucket } from "../lib/api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function load() {
    const res = await api.get("/buckets");
    setBuckets(res.data.buckets);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/buckets", { name, monthlyLimit: parseFloat(limit), color });
    setName("");
    setLimit("");
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/buckets/${id}`);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Buckets</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2"
        >
          <Plus size={16} /> New bucket
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
          <input
            required
            placeholder="Bucket name (e.g. Groceries)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Monthly limit ($)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${color === c ? "ring-2 ring-white" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2 text-sm">
            Create bucket
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : buckets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Wallet className="mx-auto mb-3" size={32} />
          <p>No buckets yet. Create one to start allocating your budget.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {buckets.map((bucket) => {
            const pct = bucket.monthlyLimit > 0 ? Math.min(100, (bucket.spentThisMonth / bucket.monthlyLimit) * 100) : 0;
            const over = bucket.spentThisMonth > bucket.monthlyLimit;
            return (
              <div key={bucket.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <p className="font-medium">{bucket.name}</p>
                  </div>
                  <button onClick={() => remove(bucket.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${over ? "bg-red-500" : ""}`}
                    style={{ width: `${pct}%`, backgroundColor: over ? undefined : bucket.color }}
                  />
                </div>
                <p className={`text-xs mt-1 ${over ? "text-red-400" : "text-slate-400"}`}>
                  ${bucket.spentThisMonth.toFixed(2)} of ${bucket.monthlyLimit.toFixed(2)} spent this month
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
