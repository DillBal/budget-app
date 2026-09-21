import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api, AlertItem } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { Card } from "../components/ui/Card";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.get("/alerts");
    setAlerts(res.data.alerts);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await api.post(`/alerts/${id}/read`);
    await load();
  }

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        </p>
      </div>

      {loading ? (
        <SkeletonList count={4} lines={1} />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="You'll be notified here when a bucket approaches or exceeds its limit."
        />
      ) : (
        <div className="grid gap-2">
          {alerts.map((a) => (
            <Card
              key={a.id}
              className={`animate-fade-up flex items-start justify-between gap-4 py-3 ${
                a.read ? "opacity-60" : "border-brand/20 bg-brand/[0.07]"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    a.read ? "bg-slate-600" : "bg-brand"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{a.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
              {!a.read && (
                <button
                  onClick={() => markRead(a.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-brand-soft transition-colors hover:bg-brand/10"
                >
                  Mark read
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
