import cron from "node-cron";
import { prisma } from "../prisma";
import { captureBalanceSnapshot } from "../services/savingsService";

// Runs once a day (00:05): records each user's total savings balance so we can
// chart savings over time and project a trend.
export function startSnapshotJob() {
  cron.schedule("5 0 * * *", async () => {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      try {
        await captureBalanceSnapshot(user.id);
      } catch (err) {
        console.error(`Failed to capture balance snapshot for user ${user.id}:`, err);
      }
    }
  });
}
