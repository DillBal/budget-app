import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((cfg) => {
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
