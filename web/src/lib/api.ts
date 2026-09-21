import axios from "axios";
import { isDemoActive } from "./demoFlag";

const explicitApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = explicitApiUrl && explicitApiUrl.length > 0 ? explicitApiUrl : "";

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
});

api.interceptors.request.use(async (cfg) => {
  // In demo mode, swap in a fake adapter so requests never hit the network.
  // `import.meta.env.DEV` is statically false in production, so this dynamic
  // import (and the whole demo dataset) is dropped from the prod bundle.
  if (import.meta.env.DEV && isDemoActive()) {
    const { demoAdapter } = await import("./demo");
    cfg.adapter = demoAdapter;
  }

  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export interface Bucket {
  id: string;
  name: string;
  color: string;
  icon: string;
  monthlyLimit: number;
  alertThresholds: number[];
  spentThisMonth: number;
  rules: { id: string; matchType: string; matchValue: string }[];
}

export interface Account {
  id: string;
  plaidAccountId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  item: { institution: string | null };
  cardControl: { locked: boolean } | null;
}

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  threshold: number | null;
  read: boolean;
  createdAt: string;
}

export interface SavingsPoint {
  date: string;
  actual: number | null;
  projected: number | null;
}

export interface SavingsSeries {
  currentBalance: number;
  points: SavingsPoint[];
}
