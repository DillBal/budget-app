import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2, Wallet, X } from "lucide-react";
import { api, Bucket } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Field";
import { ProgressBar } from "../components/ui/ProgressBar";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get("/buckets");
    setBuckets(res.data.buckets);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/buckets", { name, monthlyLimit: parseFloat(limit), color });
      setName("");
      setLimit("");
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/buckets/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buckets</h1>
          <p className="mt-0.5 text-sm text-slate-500">Allocate a monthly limit per category.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New bucket"}
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-up">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Bucket name</Label>
              <Input
                required
                autoFocus
                placeholder="e.g. Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Monthly limit</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={`Select color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                      color === c ? "ring-2 ring-white ring-offset-2 ring-offset-surface" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create bucket"}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonList count={4} lines={2} />
      ) : buckets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No buckets yet"
          description="Create one to start allocating your budget across categories."
          action={<Button size="sm" onClick={() => setShowForm(true)}>Create a bucket</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {buckets.map((bucket) => {
            const over = bucket.spentThisMonth > bucket.monthlyLimit;
            return (
              <Card key={bucket.id} className="group animate-fade-up">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <p className="font-medium">{bucket.name}</p>
                  </div>
                  <button
                    onClick={() => remove(bucket.id)}
                    aria-label={`Delete ${bucket.name}`}
                    className="rounded-md p-1.5 text-slate-500 opacity-0 transition-all hover:bg-negative/10 hover:text-negative focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <ProgressBar
                  value={bucket.spentThisMonth}
                  max={bucket.monthlyLimit}
                  color={bucket.color}
                  over={over}
                />
                <p className={`nums mt-2 text-xs ${over ? "text-negative" : "text-slate-400"}`}>
                  {formatCurrency(bucket.spentThisMonth)} of {formatCurrency(bucket.monthlyLimit)}
                  {over && " • over budget"}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
