import { NavLink, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Wallet, Landmark, Bell, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "../context/auth";

const navItems = [
  { to: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard, end: true },
  { to: "/buckets", label: "Buckets", short: "Buckets", icon: Wallet },
  { to: "/savings", label: "Savings", short: "Savings", icon: TrendingUp },
  { to: "/accounts", label: "Accounts", short: "Accounts", icon: Landmark },
  { to: "/alerts", label: "Alerts", short: "Alerts", icon: Bell },
];

export default function Layout() {
  const { token, logout } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="pl-safe hidden w-60 shrink-0 flex-col border-r border-white/5 bg-surface/50 backdrop-blur-sm md:flex">
        <div className="px-5 py-6">
          <h1 className="bg-gradient-to-r from-brand-soft to-sky-400 bg-clip-text text-lg font-bold text-transparent">
            Budget App
          </h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand/15 text-brand-soft"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mb-4 mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-negative/10 hover:text-negative"
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="pt-safe sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-canvas/80 px-4 py-3 backdrop-blur-md md:hidden">
        <h1 className="bg-gradient-to-r from-brand-soft to-sky-400 bg-clip-text text-base font-bold text-transparent">
          Budget App
        </h1>
        <button
          onClick={logout}
          aria-label="Log out"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-negative"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Extra bottom padding on mobile so the tab bar never covers content. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar (native app pattern for the home-screen PWA) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-white/5 bg-canvas/90 backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around">
          {navItems.map(({ to, short, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors active:scale-95 ${
                  isActive ? "text-brand-soft" : "text-slate-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-brand/15" : ""
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  {short}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
