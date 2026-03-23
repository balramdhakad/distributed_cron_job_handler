import env from "../config/env.js";
import { logger } from "../infra/logger.js";
import { db } from "../infra/postgres/index.js";
import { redis, startRedis } from "../infra/redis/index.js";
import { enqueueJob } from "./enqueue.js";
import { fetchExecutableJobs } from "./query.repositories.js";

const TIME_INTERVAL = env.jobSechdularConfig.poolIntervalTime;
const MAX_JOBS_PER_POLL = env.jobSechdularConfig.maxJobsPerPool || 50;

let isPolling = false;

const pollAndEnqueue = async () => {
  if (isPolling) return;
  isPolling = true;

  try {
    const dueJobs = await fetchExecutableJobs(db, MAX_JOBS_PER_POLL);
    logger.info(`Scheduler found ${dueJobs.length} due jobs`);
    if (dueJobs.length === 0) return;
    await Promise.allSettled(dueJobs.map(enqueueJob));
  } catch (err) {
    logger.error(`Scheduler poll error: ${err.message}`);
  } finally {
    isPolling = false;
  }
};

const waitForPoll = (timeoutMs = 10000) =>
  new Promise((resolve) => {
    if (!isPolling) return resolve(true);

    const checkIsPoolingRunning = setInterval(() => {
      if (!isPolling) {
        clearInterval(checkIsPoolingRunning);
        resolve(true);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkIsPoolingRunning);
      resolve(false);
    }, timeoutMs).unref();
  });

const startScheduler = async () => {
  await startRedis();
  logger.info(`Scheduler starting polling every ${TIME_INTERVAL}ms`);

  await pollAndEnqueue();
  const timer = setInterval(pollAndEnqueue, TIME_INTERVAL);

  const shutdown = async (signal) => {
    logger.info(`${signal} received stopping scheduler`);

    clearInterval(timer);

    const finished = await waitForPoll();
    if (!finished) logger.warn("Active poll did not finish in time proceeding anyway");

    await redis.quit().catch((err) =>
      logger.error(`Redis quit error: ${err.message}`),
    );

    logger.info("Scheduler shut down");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startScheduler().catch((err) => {
  logger.error(`Failed to start scheduler: ${err.message}`);
  process.exit(1);
});
