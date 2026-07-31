import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const bucketSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
  monthlyLimit: z.number().nonnegative(),
  alertThresholds: z.array(z.number().min(1).max(200)).optional(),
});

router.get("/", async (req: AuthedRequest, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const buckets = await prisma.bucket.findMany({
    where: { userId: req.userId! },
    include: { rules: true },
  });

  const withSpend = await Promise.all(
    buckets.map(async (bucket) => {
      const sum = await prisma.transaction.aggregate({
        where: { bucketId: bucket.id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      });
      return {
        ...bucket,
        alertThresholds: JSON.parse(bucket.alertThresholds),
        spentThisMonth: sum._sum.amount ?? 0,
      };
    })
  );

  res.json({ buckets: withSpend });
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = bucketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, color, icon, monthlyLimit, alertThresholds } = parsed.data;

  try {
    const bucket = await prisma.bucket.create({
      data: {
        userId: req.userId!,
        name,
        color: color ?? "#6366f1",
        icon: icon ?? "wallet",
        monthlyLimit,
        alertThresholds: JSON.stringify(alertThresholds ?? [80, 100]),
      },
    });
    res.status(201).json({ bucket });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "You already have a bucket with that name" });
    }
    throw err;
  }
});

router.put("/:id", async (req: AuthedRequest, res) => {
  const parsed = bucketSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.bucket.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    return res.status(404).json({ error: "Bucket not found" });
  }

  const { alertThresholds, ...rest } = parsed.data;
  const bucket = await prisma.bucket.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(alertThresholds ? { alertThresholds: JSON.stringify(alertThresholds) } : {}),
    },
  });
  res.json({ bucket });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await prisma.bucket.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    return res.status(404).json({ error: "Bucket not found" });
  }
  await prisma.transaction.updateMany({ where: { bucketId: existing.id }, data: { bucketId: null } });
  await prisma.bucketRule.deleteMany({ where: { bucketId: existing.id } });
  await prisma.alert.deleteMany({ where: { bucketId: existing.id } });
  await prisma.bucket.delete({ where: { id: existing.id } });
  res.status(204).send();
});

router.post("/:id/rules", async (req: AuthedRequest, res) => {
  const schema = z.object({
    matchType: z.enum(["merchant", "category", "keyword"]),
    matchValue: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const bucket = await prisma.bucket.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!bucket) {
    return res.status(404).json({ error: "Bucket not found" });
  }

  const rule = await prisma.bucketRule.create({
    data: { bucketId: bucket.id, ...parsed.data },
  });

  // Apply rule retroactively to unassigned transactions
  const matchField = parsed.data.matchType === "merchant" ? "merchantName" : parsed.data.matchType === "category" ? "category" : "name";
  const contains = parsed.data.matchValue;
  await prisma.transaction.updateMany({
    where: {
      bucketId: null,
      account: { item: { userId: req.userId! } },
      [matchField]: { contains },
    } as any,
    data: { bucketId: bucket.id },
  });

  res.status(201).json({ rule });
});

router.put("/transactions/:transactionId/assign", async (req: AuthedRequest, res) => {
  const schema = z.object({ bucketId: z.string().nullable() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: req.params.transactionId, account: { item: { userId: req.userId! } } },
  });
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  if (parsed.data.bucketId) {
    const bucket = await prisma.bucket.findFirst({ where: { id: parsed.data.bucketId, userId: req.userId! } });
    if (!bucket) {
      return res.status(404).json({ error: "Bucket not found" });
    }
  }

  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { bucketId: parsed.data.bucketId },
  });
  res.json({ transaction: updated });
});

export default router;
