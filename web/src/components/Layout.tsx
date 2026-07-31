import { NavLink, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Wallet, Landmark, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/buckets", label: "Buckets", icon: Wallet },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/alerts", label: "Alerts", icon: Bell },
];

export default function Layout() {
  const { token, logout } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col">
        <div className="p-4 hidden md:block">
          <h1 className="text-lg font-bold text-indigo-400">Budget App</h1>
        </div>
        <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap ${
                  isActive ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:text-slate-100"
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
          className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-red-400 md:mt-auto"
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
