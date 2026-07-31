import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api, AlertItem } from "../lib/api";

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

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Alerts</h1>
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Bell className="mx-auto mb-3" size={32} />
          <p>No alerts yet.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between border rounded-lg p-3 text-sm ${
                a.read ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-indigo-600/10 border-indigo-600/30"
              }`}
            >
              <div>
                <p>{a.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              {!a.read && (
                <button onClick={() => markRead(a.id)} className="text-xs text-indigo-400 hover:text-indigo-300">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
