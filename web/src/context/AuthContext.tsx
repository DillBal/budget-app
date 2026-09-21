import { useState, ReactNode } from "react";
import { api } from "../lib/api";
import { isDemoEnabled, setDemoActive } from "../lib/demoFlag";
import { AuthContext, User } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token: string, user: User) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
  }

  async function register(email: string, password: string, name?: string) {
    const res = await api.post("/auth/register", { email, password, name });
    persist(res.data.token, res.data.user);
  }

  // Dev-only: sign in without an account. Requests are served by the offline
  // demo adapter, so no backend or database is needed.
  function loginDemo() {
    if (!isDemoEnabled()) return;
    setDemoActive(true);
    persist("demo-token", { id: "demo-user", email: "demo@example.com", name: "Demo" });
  }

  function logout() {
    setDemoActive(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
