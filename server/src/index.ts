import express from "express";
import cors from "cors";
import { config } from "./config";
import { startAlertJob } from "./jobs/alertJob";
import { startSnapshotJob } from "./jobs/snapshotJob";

import authRoutes from "./routes/auth";
import plaidRoutes from "./routes/plaid";
import bucketRoutes from "./routes/buckets";
import cardRoutes from "./routes/cards";
import alertRoutes from "./routes/alerts";
import analyticsRoutes from "./routes/analytics";

const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/plaid", plaidRoutes);
app.use("/api/buckets", bucketRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

startAlertJob();
startSnapshotJob();

app.listen(config.port, () => {
  console.log(`Budget app API listening on http://localhost:${config.port}`);
});
