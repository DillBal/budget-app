import nodemailer from "nodemailer";
import { prisma } from "../prisma";
import { config } from "../config";

const transporter = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  : null;

export async function createAlert(params: {
  userId: string;
  bucketId?: string;
  type: string;
  message: string;
  threshold?: number;
  userEmail?: string;
}) {
  const alert = await prisma.alert.create({
    data: {
      userId: params.userId,
      bucketId: params.bucketId,
      type: params.type,
      message: params.message,
      threshold: params.threshold,
    },
  });

  if (transporter && params.userEmail) {
    try {
      await transporter.sendMail({
        from: config.smtp.fromEmail,
        to: params.userEmail,
        subject: "Budget App Alert",
        text: params.message,
      });
    } catch (err) {
      console.error("Failed to send alert email:", err);
    }
  }

  return alert;
}

/**
 * Checks all buckets for a user against current month spend and their
 * configured alertThresholds (e.g. [80, 100]), creating an Alert for any
 * threshold newly crossed since the last check.
 */
export async function checkBucketThresholds(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const buckets = await prisma.bucket.findMany({ where: { userId } });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  for (const bucket of buckets) {
    const spendResult = await prisma.transaction.aggregate({
      where: { bucketId: bucket.id, date: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    const spent = spendResult._sum.amount ?? 0;
    const pct = bucket.monthlyLimit > 0 ? (spent / bucket.monthlyLimit) * 100 : 0;
    const thresholds: number[] = JSON.parse(bucket.alertThresholds || "[]");

    for (const threshold of thresholds) {
      if (pct >= threshold) {
        const alreadyAlerted = await prisma.alert.findFirst({
          where: {
            bucketId: bucket.id,
            type: "budget_threshold",
            threshold,
            createdAt: { gte: startOfMonth },
          },
        });
        if (!alreadyAlerted) {
          await createAlert({
            userId,
            bucketId: bucket.id,
            type: "budget_threshold",
            threshold,
            message: `You've spent ${pct.toFixed(0)}% of your "${bucket.name}" budget ($${spent.toFixed(
              2
            )} of $${bucket.monthlyLimit.toFixed(2)}).`,
            userEmail: user.email,
          });
        }
      }
    }
  }
}
