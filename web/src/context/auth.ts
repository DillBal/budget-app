import { createContext, useContext } from "react";

export interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
}

// Kept in a component-free module so <AuthProvider> stays Fast Refresh
// compatible (a file exporting both a component and non-components breaks it).
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
