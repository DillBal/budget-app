import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { Skeleton } from "./components/ui/Skeleton";

// Route-level code splitting: each page (and the chart library it pulls in)
// is fetched only when that route is visited.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BucketsPage = lazy(() => import("./pages/BucketsPage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const SavingsPage = lazy(() => import("./pages/SavingsPage"));

function PageFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-40 w-full rounded-xl2" />
      <Skeleton className="h-24 w-full rounded-xl2" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/buckets" element={<BucketsPage />} />
          <Route path="/savings" element={<SavingsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
