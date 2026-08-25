import { Router } from "express";
import { CountryCode, Products } from "plaid";
import { plaidClient } from "../services/plaidClient";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { config } from "../config";
import { captureBalanceSnapshot } from "../services/savingsService";

const router = Router();
router.use(requireAuth);

router.post("/link-token", async (req: AuthedRequest, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.userId! },
      client_name: "Budget App",
      products: config.plaid.products as Products[],
      country_codes: config.plaid.countryCodes as CountryCode[],
      language: "en",
    });
    res.json({ linkToken: response.data.link_token });
  } catch (err: any) {
    console.error("Plaid link-token error:", err?.response?.data ?? err);
    res.status(500).json({ error: "Failed to create Plaid link token" });
  }
});

router.post("/exchange-public-token", async (req: AuthedRequest, res) => {
  const { publicToken } = req.body as { publicToken?: string };
  if (!publicToken) {
    return res.status(400).json({ error: "publicToken is required" });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const plaidItemId = exchange.data.item_id;

    const itemInfo = await plaidClient.itemGet({ access_token: accessToken });
    const institutionId = itemInfo.data.item.institution_id ?? undefined;

    const item = await prisma.item.create({
      data: {
        userId: req.userId!,
        plaidItemId,
        accessToken,
        institution: institutionId,
      },
    });

    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    for (const acc of accountsResponse.data.accounts) {
      await prisma.account.create({
        data: {
          itemId: item.id,
          plaidAccountId: acc.account_id,
          name: acc.name,
          officialName: acc.official_name ?? undefined,
          mask: acc.mask ?? undefined,
          type: acc.type,
          subtype: acc.subtype ?? undefined,
          currentBalance: acc.balances.current ?? undefined,
          availableBalance: acc.balances.available ?? undefined,
          isoCurrencyCode: acc.balances.iso_currency_code ?? undefined,
          cardControl: { create: { locked: false } },
        },
      });
    }

    res.status(201).json({ itemId: item.id });
  } catch (err: any) {
    console.error("Plaid exchange error:", err?.response?.data ?? err);
    res.status(500).json({ error: "Failed to link account" });
  }
});

router.post("/sync-transactions", async (req: AuthedRequest, res) => {
  try {
    const items = await prisma.item.findMany({ where: { userId: req.userId! } });
    let added = 0;

    for (const item of items) {
      const response = await plaidClient.transactionsSync({ access_token: item.accessToken });
      for (const tx of response.data.added) {
        const account = await prisma.account.findUnique({ where: { plaidAccountId: tx.account_id } });
        if (!account) continue;

        await prisma.transaction.upsert({
          where: { plaidTransactionId: tx.transaction_id },
          update: {
            amount: tx.amount,
            pending: tx.pending,
            name: tx.name,
            merchantName: tx.merchant_name ?? undefined,
            category: tx.personal_finance_category?.primary ?? tx.category?.[0] ?? undefined,
          },
          create: {
            accountId: account.id,
            plaidTransactionId: tx.transaction_id,
            amount: tx.amount,
            isoCurrencyCode: tx.iso_currency_code ?? undefined,
            name: tx.name,
            merchantName: tx.merchant_name ?? undefined,
            category: tx.personal_finance_category?.primary ?? tx.category?.[0] ?? undefined,
            pending: tx.pending,
            date: new Date(tx.date),
          },
        });
        added += 1;
      }
    }

    // Record a savings-balance snapshot so the savings chart has fresh data.
    try {
      await captureBalanceSnapshot(req.userId!);
    } catch (err) {
      console.error("Failed to capture balance snapshot during sync:", err);
    }

    res.json({ syncedTransactions: added });
  } catch (err: any) {
    console.error("Plaid sync error:", err?.response?.data ?? err);
    res.status(500).json({ error: "Failed to sync transactions" });
  }
});

router.get("/accounts", async (req: AuthedRequest, res) => {
  const accounts = await prisma.account.findMany({
    where: { item: { userId: req.userId! } },
    include: { cardControl: true, item: true },
  });
  res.json({ accounts });
});

export default router;
