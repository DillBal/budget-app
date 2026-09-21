import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Lock, Unlock, Landmark, Plus, RefreshCw } from "lucide-react";
import { api, Account } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const res = await api.get("/plaid/accounts");
    setAccounts(res.data.accounts);
  }, []);

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false));
  }, [loadAccounts]);

  async function createLinkToken() {
    setLinkError(null);
    try {
      const res = await api.post("/plaid/link-token");
      setLinkToken(res.data.linkToken);
    } catch (err: any) {
      setLinkError(
        err?.response?.data?.error ?? "Couldn't start account linking. Please try again."
      );
    }
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="mt-0.5 text-sm text-slate-500">Linked banks and cards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={syncTransactions} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing" : "Sync"}
          </Button>
          <Button size="sm" onClick={createLinkToken}>
            <Plus size={16} /> Connect
          </Button>
        </div>
      </div>

      {linkError && (
        <p className="rounded-lg border border-caution/20 bg-caution/10 px-3 py-2 text-sm text-caution">
          {linkError}
        </p>
      )}

      {loading ? (
        <SkeletonList count={3} lines={2} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts connected"
          description="Connect a bank or credit card to start syncing transactions."
          action={<Button size="sm" onClick={createLinkToken}>Connect account</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => {
            const locked = account.cardControl?.locked;
            return (
              <Card
                key={account.id}
                className="animate-fade-up flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{account.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {account.item.institution ?? "Unknown institution"} •••• {account.mask} •{" "}
                    {account.subtype}
                  </p>
                  <p className="nums mt-1.5 text-lg font-semibold">
                    {account.currentBalance != null ? formatCurrency(account.currentBalance) : "—"}
                  </p>
                </div>
                <button
                  onClick={() => toggleLock(account)}
                  disabled={busyAccountId === account.id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                    locked
                      ? "border-negative/20 bg-negative/10 text-negative hover:bg-negative/20"
                      : "border-positive/20 bg-positive/10 text-positive hover:bg-positive/20"
                  }`}
                >
                  {locked ? <Lock size={14} /> : <Unlock size={14} />}
                  {locked ? "Locked" : "Unlocked"}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-600">
        Card lock/unlock uses a mock provider by default. Real card freezing requires your specific
        card issuer's API — see the README for details.
      </p>
    </div>
  );
}
