import env from "../config/env.js";
import { logger } from "../infra/logger.js";
import { db } from "../infra/postgres/index.js";
import { enqueueJob } from "./enqueue.js";
import { fetchExecutableJobs } from "./query.js";

const TIME_INTERVAL = env.jobSechdularConfig.poolIntervalTime;
const MAX_JOBS_PER_POLL = 50;

const pollAndEnqueue = async () => {
  try {
    const dueJobs = await fetchExecutableJobs(db,MAX_JOBS_PER_POLL);
    if (dueJobs.length === 0) return;

    console.log(dueJobs)

    logger.info(`Scheduler Found ${dueJobs.length} due jobs`);

    await Promise.allSettled(dueJobs.map(enqueueJob));
  } catch (err) {
    logger.error(`Scheduler Poll error: ${err.message}`);
  }
};

export const startScheduler = async() => {
  logger.info(`Scheduler Starting : polling every ${TIME_INTERVAL}ms`);
  await pollAndEnqueue();
  setInterval(pollAndEnqueue, TIME_INTERVAL);
};
