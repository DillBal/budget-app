import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Field";
import { isDemoEnabled } from "../lib/demoFlag";

export default function LoginPage() {
  const { token, login, register, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.formErrors?.[0] ??
          err?.response?.data?.error ??
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-brand-soft to-sky-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Budget App
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="rounded-xl2 border border-white/5 bg-surface/80 p-6 shadow-card backdrop-blur-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-negative/20 bg-negative/10 px-3 py-2 text-sm text-negative">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {isDemoEnabled() && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-wider text-slate-600">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  loginDemo();
                  navigate("/");
                }}
              >
                View demo (no account)
              </Button>
              <p className="mt-2 text-center text-[11px] text-slate-600">
                Sample data, offline. Dev builds only.
              </p>
            </>
          )}
        </div>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-6 w-full text-center text-xs text-slate-500 transition-colors hover:text-brand-soft"
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
