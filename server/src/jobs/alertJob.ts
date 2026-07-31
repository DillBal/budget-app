import cron from "node-cron";
import { prisma } from "../prisma";
import { checkBucketThresholds } from "../services/alertService";

// Runs every hour: checks every user's buckets against their alert thresholds.
export function startAlertJob() {
  cron.schedule("0 * * * *", async () => {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      try {
        await checkBucketThresholds(user.id);
      } catch (err) {
        console.error(`Failed to check thresholds for user ${user.id}:`, err);
      }
    }
  });
}
