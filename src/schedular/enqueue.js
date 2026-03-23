import { db } from "../infra/postgres/index.js";
import { logger } from "../infra/logger.js";
import { processingQueue } from "../infra/redis/queue.js";
import { getNextRunAt } from "../utils/cronJob.js";
import { updateNextRunAt } from "./query.repositories.js";
import { acquireLock, releaseLock } from "./redisLock.js";

export const enqueueJob = async (job) => {
  const lock = await acquireLock(job.id);

  if (!lock) return;

  try {
    const nextRunAt = getNextRunAt(
      job.cronExpression,
      job.timezone,
      job.nextRunAt,
    );

    //just update the query nextRunAt and enqueue to queue if everything is correct then remove lock
    // if failed don't update the nextRunAt and don't enqueue it
    await db.transaction(async (tx) => {
      await updateNextRunAt(tx, job.id, nextRunAt);

      const schduledAt = new Date(job.nextRunAt);
      await processingQueue.add(
        job.name,
        { job, schduledAt },
        {
          jobId: `${job.id}-${nextRunAt.getTime()}`,
          attempts: job.maxRetry + 1,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: { count: 100, age: 60 * 60 * 24 },
          removeOnFail: { count: 500, age: 60 * 60 * 24 * 7 },
        },
      );
    });

    logger.info(`Scheduler Enqueued job "${job.name}"`);
  } catch (err) {
    logger.error(
      `Scheduler Failed to enqueue job "${job.name}": ${err.message}`,
    );
  } finally {
    try {
      await releaseLock(lock);
    } catch (lockErr) {
      logger.error(
        `Scheduler failed to release lock for job "${job.name}": ${lockErr.message}`,
      );
    }
  }
};
