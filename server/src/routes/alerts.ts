import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { checkBucketThresholds } from "../services/alertService";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ alerts });
});

router.post("/:id/read", async (req: AuthedRequest, res) => {
  const alert = await prisma.alert.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!alert) {
    return res.status(404).json({ error: "Alert not found" });
  }
  const updated = await prisma.alert.update({ where: { id: alert.id }, data: { read: true } });
  res.json({ alert: updated });
});

// Manually trigger a threshold check (also runs on a schedule, see src/jobs/alertJob.ts)
router.post("/check", async (req: AuthedRequest, res) => {
  await checkBucketThresholds(req.userId!);
  res.json({ status: "checked" });
});

export default router;
