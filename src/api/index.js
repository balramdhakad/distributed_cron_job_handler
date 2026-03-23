import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { globalRateLimiter } from "./middlewares/rateLimit.js";
import jobRoutes from "./module/Jobs/job.routes.js";
import { sql } from "drizzle-orm";
import { db } from "../infra/postgres/index.js";
import { redis } from "../infra/redis/index.js";
import { addCorrelationId } from "./middlewares/correlationMiddleware.js";

const app = express();
app.use(express.json({ limit: "10KB" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.get("/health", async (req, res) => {
  const health = { database: "ok", redis: "ok" };
  let httpStatus = 200;

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    health.database = "error";
    httpStatus = 503;
  }

  try {
    await redis.ping();
  } catch {
    health.redis = "error";
    httpStatus = 503;
  }

  res.status(httpStatus).json({
    status: httpStatus === 200 ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: health,
  });
});

app.use(addCorrelationId);

app.use(globalRateLimiter);

app.use("/api/v1/jobs", jobRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "NOT_FOUND",
  });
});

app.use(errorHandler);
export default app;
