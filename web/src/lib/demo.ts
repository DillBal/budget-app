// Offline demo dataset + a fake axios adapter.
//
// This module is ONLY dynamically imported when `import.meta.env.DEV` is true
// (see api.ts), so Vite drops it from production bundles. It lets the whole UI
// be exercised with no backend, no database, and no Plaid connection.

import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { Account, AlertItem, Bucket, SavingsPoint } from "./api";

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEMO_USER = { id: "demo-user", email: "demo@example.com", name: "Demo" };
export const DEMO_TOKEN = "demo-token";

// ---------------------------------------------------------------------------
// Mutable in-memory state so create/delete/toggle actions feel real.
// ---------------------------------------------------------------------------

let buckets: Bucket[] = [
  {
    id: "b1",
    name: "Groceries",
    color: "#22c55e",
    icon: "wallet",
    monthlyLimit: 600,
    alertThresholds: [80, 100],
    spentThisMonth: 412.55,
    rules: [{ id: "r1", matchType: "category", matchValue: "FOOD_AND_DRINK" }],
  },
  {
    id: "b2",
    name: "Dining out",
    color: "#f59e0b",
    icon: "wallet",
    monthlyLimit: 250,
    alertThresholds: [80, 100],
    spentThisMonth: 288.1,
    rules: [],
  },
  {
    id: "b3",
    name: "Transport",
    color: "#06b6d4",
    icon: "wallet",
    monthlyLimit: 200,
    alertThresholds: [80, 100],
    spentThisMonth: 94.2,
    rules: [],
  },
  {
    id: "b4",
    name: "Utilities",
    color: "#6366f1",
    icon: "wallet",
    monthlyLimit: 300,
    alertThresholds: [80, 100],
    spentThisMonth: 241,
    rules: [],
  },
  {
    id: "b5",
    name: "Fun money",
    color: "#ec4899",
    icon: "wallet",
    monthlyLimit: 150,
    alertThresholds: [80, 100],
    spentThisMonth: 63.75,
    rules: [],
  },
];

let accounts: Account[] = [
  {
    id: "a1",
    plaidAccountId: "pa1",
    name: "Everyday Checking",
    mask: "4821",
    type: "depository",
    subtype: "checking",
    currentBalance: 3240.18,
    availableBalance: 3190.18,
    item: { institution: "Chase" },
    cardControl: { locked: false },
  },
  {
    id: "a2",
    plaidAccountId: "pa2",
    name: "High-Yield Savings",
    mask: "9910",
    type: "depository",
    subtype: "savings",
    currentBalance: 12480.42,
    availableBalance: 12480.42,
    item: { institution: "Ally" },
    cardControl: null,
  },
  {
    id: "a3",
    plaidAccountId: "pa3",
    name: "Travel Rewards Card",
    mask: "1177",
    type: "credit",
    subtype: "credit card",
    currentBalance: -842.63,
    availableBalance: 4157.37,
    item: { institution: "Amex" },
    cardControl: { locked: true },
  },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

let alerts: AlertItem[] = [
  {
    id: "al1",
    type: "budget_threshold",
    message: "Dining out is at 115% of its $250 monthly limit.",
    threshold: 100,
    read: false,
    createdAt: hoursAgo(3),
  },
  {
    id: "al2",
    type: "budget_threshold",
    message: "Utilities has reached 80% of its $300 monthly limit.",
    threshold: 80,
    read: false,
    createdAt: hoursAgo(19),
  },
  {
    id: "al3",
    type: "card_locked",
    message: "Travel Rewards Card •••• 1177 was locked.",
    threshold: null,
    read: true,
    createdAt: hoursAgo(52),
  },
  {
    id: "al4",
    type: "budget_threshold",
    message: "Groceries has reached 80% of its $600 monthly limit.",
    threshold: 80,
    read: true,
    createdAt: hoursAgo(96),
  },
];

// ---------------------------------------------------------------------------
// Savings history: ~120 days of daily snapshots with an upward trend + noise,
// so the chart, trend projection, and dashboard sparkline all have real shape.
// ---------------------------------------------------------------------------

function buildSavingsPoints(): { currentBalance: number; points: SavingsPoint[] } {
  const days = 120;
  const start = 9200;
  const perDay = 27; // ~$810/month saved
  const todayUtc = new Date();
  const anchor = Date.UTC(
    todayUtc.getUTCFullYear(),
    todayUtc.getUTCMonth(),
    todayUtc.getUTCDate()
  );

  const points: SavingsPoint[] = [];
  let seed = 7;
  const rand = () => {
    // Deterministic pseudo-random so the demo looks identical each reload.
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const values: number[] = [];
  for (let i = days; i >= 0; i--) {
    const t = anchor - i * DAY_MS;
    const drift = (rand() - 0.45) * 120;
    const value = start + (days - i) * perDay + drift;
    values.push(value);
    points.push({
      date: new Date(t).toISOString().slice(0, 10),
      actual: Math.round(value * 100) / 100,
      projected: null,
    });
  }

  // Linear-trend projection for the next ~3 months, matching the server shape.
  const n = values.length;
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * values[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastValue = values[n - 1];
  points[points.length - 1].projected = Math.round(lastValue * 100) / 100;
  for (let d = 15; d <= 90; d += 15) {
    const projected = slope * (n - 1 + d) + intercept;
    points.push({
      date: new Date(anchor + d * DAY_MS).toISOString().slice(0, 10),
      actual: null,
      projected: Math.round(projected * 100) / 100,
    });
  }

  return { currentBalance: Math.round(lastValue * 100) / 100, points };
}

const savings = buildSavingsPoints();

// ---------------------------------------------------------------------------
// Fake adapter
// ---------------------------------------------------------------------------

function respond(config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {} as AxiosResponse["headers"],
    config,
  };
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data as Record<string, unknown>;
}

// Small delay so loading skeletons are actually visible while developing.
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export const demoAdapter: AxiosAdapter = async (config) => {
  const path = (config.url ?? "").replace(/^\/+/, "");
  const method = (config.method ?? "get").toLowerCase();
  const body = parseBody(config);

  await delay();

  // --- auth -----------------------------------------------------------------
  if (path.startsWith("auth/")) {
    return respond(config, { token: DEMO_TOKEN, user: DEMO_USER });
  }

  // --- buckets --------------------------------------------------------------
  if (path === "buckets" && method === "get") {
    return respond(config, { buckets });
  }
  if (path === "buckets" && method === "post") {
    const bucket: Bucket = {
      id: `b${Date.now()}`,
      name: String(body.name ?? "New bucket"),
      color: String(body.color ?? "#6366f1"),
      icon: "wallet",
      monthlyLimit: Number(body.monthlyLimit ?? 0),
      alertThresholds: [80, 100],
      spentThisMonth: 0,
      rules: [],
    };
    buckets = [...buckets, bucket];
    return respond(config, { bucket }, 200);
  }
  if (path.startsWith("buckets/") && method === "delete") {
    const id = path.split("/")[1];
    buckets = buckets.filter((b) => b.id !== id);
    return respond(config, null, 200);
  }

  // --- alerts ---------------------------------------------------------------
  if (path === "alerts" && method === "get") {
    return respond(config, { alerts });
  }
  if (path.startsWith("alerts/") && path.endsWith("/read")) {
    const id = path.split("/")[1];
    alerts = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    return respond(config, { ok: true });
  }

  // --- plaid / accounts -----------------------------------------------------
  if (path === "plaid/accounts") {
    return respond(config, { accounts });
  }
  if (path === "plaid/sync-transactions") {
    return respond(config, { syncedTransactions: 12 });
  }
  if (path === "plaid/link-token") {
    // Plaid Link can't run offline; surface a clear message instead of hanging.
    return respond(config, { error: "Connecting accounts is unavailable in demo mode." }, 400);
  }

  // --- card controls --------------------------------------------------------
  if (path.startsWith("cards/")) {
    const [, id, action] = path.split("/");
    accounts = accounts.map((a) =>
      a.id === id ? { ...a, cardControl: { locked: action === "lock" } } : a
    );
    return respond(config, { ok: true });
  }

  // --- analytics ------------------------------------------------------------
  if (path.startsWith("analytics/savings")) {
    return respond(config, savings);
  }

  return respond(config, { error: `No demo handler for ${method.toUpperCase()} /${path}` }, 404);
};
