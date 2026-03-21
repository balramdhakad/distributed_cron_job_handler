import { db } from "../infra/postgres/index.js";
import { logger } from "../infra/logger.js";
import { processingQueue } from "../infra/redis/queue.js";
import { getNextRunAt } from "../utils/cronJob.js";
import { updateNextRunAt } from "./query.js";
import { acquireLock, releaseLock } from "./redisLock.js";

//flow job nextRun at will be updated and enqueue job to queue and releaseLock
//if some operation failed then release lock don't updateNextRun or enqueue
// let other sechdular or sechdular on next time pick the job

export const enqueueJob = async (job) => {
  const lock = await acquireLock(job.id);
  if (!lock) return;

  try {
    const nextRunAt = getNextRunAt(job.cronExpression, job.timezone);

    await db.transaction(async (tx) => {
      await updateNextRunAt(tx, job.id, nextRunAt);
    

      await processingQueue.add(
        job.name,
        { job },
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
    await releaseLock(lock);
  }
};
