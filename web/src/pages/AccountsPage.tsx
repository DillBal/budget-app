import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Lock, Unlock, Landmark, Plus } from "lucide-react";
import { api, Account } from "../lib/api";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadAccounts = useCallback(async () => {
    const res = await api.get("/plaid/accounts");
    setAccounts(res.data.accounts);
  }, []);

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false));
  }, [loadAccounts]);

  async function createLinkToken() {
    const res = await api.post("/plaid/link-token");
    setLinkToken(res.data.linkToken);
  }

  const onSuccess = useCallback(
    async (publicToken: string) => {
      await api.post("/plaid/exchange-public-token", { publicToken });
      await loadAccounts();
    },
    [loadAccounts]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  async function syncTransactions() {
    setSyncing(true);
    try {
      await api.post("/plaid/sync-transactions");
    } finally {
      setSyncing(false);
    }
  }

  async function toggleLock(account: Account) {
    setBusyAccountId(account.id);
    try {
      const locked = account.cardControl?.locked;
      await api.post(`/cards/${account.id}/${locked ? "unlock" : "lock"}`);
      await loadAccounts();
    } finally {
      setBusyAccountId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Accounts</h1>
        <div className="flex gap-2">
          <button
            onClick={syncTransactions}
            disabled={syncing}
            className="text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg px-3 py-2"
          >
            {syncing ? "Syncing..." : "Sync transactions"}
          </button>
          <button
            onClick={createLinkToken}
            className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2"
          >
            <Plus size={16} /> Connect account
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-6">
        Card lock/unlock uses a mock provider by default. Real card freezing requires your specific
        card issuer's API — see the README for details.
      </p>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Landmark className="mx-auto mb-3" size={32} />
          <p>No accounts connected yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-slate-500">
                  {account.item.institution ?? "Unknown institution"} •••• {account.mask} • {account.subtype}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  {account.currentBalance != null ? `$${account.currentBalance.toFixed(2)}` : "—"}
                </p>
              </div>
              <button
                onClick={() => toggleLock(account)}
                disabled={busyAccountId === account.id}
                className={`flex items-center gap-1 text-xs rounded-lg px-3 py-2 disabled:opacity-50 ${
                  account.cardControl?.locked
                    ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                    : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
                }`}
              >
                {account.cardControl?.locked ? <Lock size={14} /> : <Unlock size={14} />}
                {account.cardControl?.locked ? "Locked" : "Unlocked"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
