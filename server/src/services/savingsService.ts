import { prisma } from "../prisma";
import { plaidClient } from "../services/plaidClient";

// Account types that count toward "savings". We treat liquid depository
// accounts (checking + savings) as the user's savings balance.
const SAVINGS_ACCOUNT_TYPES = new Set(["depository"]);

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Refresh account balances from Plaid (best-effort) and return the current
// total savings balance for a user.
export async function computeTotalSavings(userId: string): Promise<number> {
  const items = await prisma.item.findMany({ where: { userId } });

  for (const item of items) {
    try {
      const resp = await plaidClient.accountsBalanceGet({ access_token: item.accessToken });
      for (const acc of resp.data.accounts) {
        await prisma.account.updateMany({
          where: { plaidAccountId: acc.account_id },
          data: {
            currentBalance: acc.balances.current ?? undefined,
            availableBalance: acc.balances.available ?? undefined,
          },
        });
      }
    } catch (err: any) {
      // If Plaid is unavailable, fall back to the last stored balances.
      console.error(`Balance refresh failed for item ${item.id}:`, err?.response?.data ?? err);
    }
  }

  const accounts = await prisma.account.findMany({ where: { item: { userId } } });
  return accounts
    .filter((a) => SAVINGS_ACCOUNT_TYPES.has(a.type))
    .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
}

// Capture (upsert) today's savings snapshot for a user.
export async function captureBalanceSnapshot(userId: string): Promise<void> {
  const totalSavings = await computeTotalSavings(userId);
  const date = startOfUtcDay(new Date());

  await prisma.balanceSnapshot.upsert({
    where: { userId_date: { userId, date } },
    update: { totalSavings },
    create: { userId, date, totalSavings },
  });
}

export interface SavingsPoint {
  date: string; // ISO date (YYYY-MM-DD)
  actual: number | null;
  projected: number | null;
}

export interface SavingsSeries {
  currentBalance: number;
  points: SavingsPoint[];
}

// Least-squares linear regression: y = slope * x + intercept, where x is the
// number of days since the first snapshot.
export function linearFit(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    // Not enough spread to fit a slope; assume flat at the mean.
    return { slope: 0, intercept: sumY / n };
  }
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface Snapshot {
  date: Date;
  totalSavings: number;
}

// Pure: build the savings time series (actual snapshots + a linear-trend
// projection). Extracted from getSavingsSeries so it can be unit-tested
// without a database.
export function buildSavingsPoints(snapshots: Snapshot[], projectMonths = 3): SavingsPoint[] {
  const points: SavingsPoint[] = snapshots.map((s) => ({
    date: toIsoDate(s.date),
    actual: s.totalSavings,
    projected: null,
  }));

  // Need at least 2 points to project a trend.
  if (snapshots.length >= 2) {
    const first = snapshots[0].date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const xs = snapshots.map((s) => (s.date.getTime() - first) / dayMs);
    const ys = snapshots.map((s) => s.totalSavings);
    const { slope, intercept } = linearFit(xs, ys);

    // Anchor the projection line at the last actual point for visual continuity.
    const lastX = xs[xs.length - 1];
    const lastActual = ys[ys.length - 1];
    if (points.length) points[points.length - 1].projected = lastActual;

    const lastDate = snapshots[snapshots.length - 1].date;
    const totalFutureDays = projectMonths * 30;
    const step = 15; // one projected point every ~2 weeks
    for (let d = step; d <= totalFutureDays; d += step) {
      const futureDate = new Date(lastDate.getTime() + d * dayMs);
      const x = lastX + d;
      const projected = slope * x + intercept;
      points.push({ date: toIsoDate(futureDate), actual: null, projected });
    }
  }

  return points;
}

// Build the savings time series (actual snapshots + a linear-trend projection).
export async function getSavingsSeries(
  userId: string,
  historyDays = 180,
  projectMonths = 3
): Promise<SavingsSeries> {
  const since = startOfUtcDay(new Date());
  since.setUTCDate(since.getUTCDate() - historyDays);

  const snapshots = await prisma.balanceSnapshot.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const currentBalance = snapshots.length
    ? snapshots[snapshots.length - 1].totalSavings
    : await computeTotalSavings(userId);

  const points = buildSavingsPoints(snapshots, projectMonths);

  return { currentBalance, points };
}
