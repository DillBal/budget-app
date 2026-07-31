import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getCardControlProvider } from "../services/cardControlService";
import { createAlert } from "../services/alertService";

const router = Router();
router.use(requireAuth);

router.post("/:accountId/lock", async (req: AuthedRequest, res) => {
  const account = await prisma.account.findFirst({
    where: { id: req.params.accountId, item: { userId: req.userId! } },
    include: { cardControl: true },
  });
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  try {
    const providerName = account.cardControl?.provider ?? "mock";
    const provider = getCardControlProvider(providerName);
    await provider.lock(account.plaidAccountId);

    const cardControl = await prisma.cardControl.upsert({
      where: { accountId: account.id },
      update: { locked: true, provider: providerName, lastAction: new Date() },
      create: { accountId: account.id, locked: true, provider: providerName, lastAction: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    await createAlert({
      userId: req.userId!,
      type: "card_locked",
      message: `Card ending in ${account.mask ?? "????"} (${account.name}) has been locked.`,
      userEmail: user?.email,
    });

    res.json({ cardControl });
  } catch (err: any) {
    console.error("Card lock error:", err);
    res.status(502).json({
      error:
        "Failed to lock card via provider. Note: real card lock requires issuer-specific API access; the mock provider is used by default.",
    });
  }
});

router.post("/:accountId/unlock", async (req: AuthedRequest, res) => {
  const account = await prisma.account.findFirst({
    where: { id: req.params.accountId, item: { userId: req.userId! } },
    include: { cardControl: true },
  });
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  try {
    const providerName = account.cardControl?.provider ?? "mock";
    const provider = getCardControlProvider(providerName);
    await provider.unlock(account.plaidAccountId);

    const cardControl = await prisma.cardControl.upsert({
      where: { accountId: account.id },
      update: { locked: false, provider: providerName, lastAction: new Date() },
      create: { accountId: account.id, locked: false, provider: providerName, lastAction: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    await createAlert({
      userId: req.userId!,
      type: "card_unlocked",
      message: `Card ending in ${account.mask ?? "????"} (${account.name}) has been unlocked.`,
      userEmail: user?.email,
    });

    res.json({ cardControl });
  } catch (err: any) {
    console.error("Card unlock error:", err);
    res.status(502).json({ error: "Failed to unlock card via provider." });
  }
});

export default router;
