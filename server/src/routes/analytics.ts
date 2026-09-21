import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { prisma } from "../prisma";
import { captureBalanceSnapshot, getSavingsSeries } from "../services/savingsService";

const router = Router();
router.use(requireAuth);

// Returns actual savings-balance history plus a linear-trend projection.
router.get("/savings", async (req: AuthedRequest, res) => {
  const historyDays = Math.min(Math.max(parseInt(String(req.query.historyDays ?? "180"), 10) || 180, 30), 730);
  const projectMonths = Math.min(Math.max(parseInt(String(req.query.projectMonths ?? "3"), 10) || 3, 1), 12);

  // Ensure there is at least one data point for today so the chart isn't empty
  // on first visit (history builds up over time as this runs on sync + daily).
  // Skip if today's snapshot already exists, so repeat views (and the
  // dashboard sparkline) don't trigger redundant Plaid balance calls.
  try {
    const today = new Date();
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const existing = await prisma.balanceSnapshot.findUnique({
      where: { userId_date: { userId: req.userId!, date: startOfToday } },
    });
    if (!existing) {
      await captureBalanceSnapshot(req.userId!);
    }
  } catch (err) {
    console.error("Failed to capture balance snapshot:", err);
  }

  const series = await getSavingsSeries(req.userId!, historyDays, projectMonths);
  res.json(series);
});

export default router;
