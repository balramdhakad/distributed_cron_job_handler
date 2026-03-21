import { Worker, UnrecoverableError } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../infra/postgres/index.js";
import { Jobs } from "../infra/postgres/schema/jobSchema.js";
import { logger } from "../infra/logger.js";
import { defaultRedisOptions } from "../infra/redis/index.js";
import { processingQueueName } from "../infra/redis/queue.js";
import { execute } from "../jobs/registry.js";
import {
  createExecutionLog,
  markExecutionSuccess,
  markExecutionFailed,
} from "../utils/executionLog.js";
import { isRetryable } from "../utils/errors.js";

const processor = async (bullJob) => {
  const { job } = bullJob.data;

  const log = await createExecutionLog(db, {
    jobId: job.id,
    scheduledAt: job.nextRunAt,
    executedBy: bullJob.id,
  });

  try {
    await execute(job.handlerType, job.handlerConfig);

    const newRunCount = job.runCount + 1;
    const maxReached = job.maxTimeRun !== null && newRunCount >= job.maxTimeRun;

    await db
      .update(Jobs)
      .set({
        runCount: newRunCount,
        ...(maxReached && { isActive: false, nextRunAt: null }),
        updatedAt: new Date(),
      })
      .where(eq(Jobs.id, job.id));

    await markExecutionSuccess(db, log.id);

    logger.info(`Worker Job "${job.name}" completed`);
  } catch (error) {
    //if validation Error or Some other error which waste resources
    //  if this function is execured again
    if (!isRetryable(error)) {
      await db
        .update(Jobs)
        .set({ isActive: false, nextRunAt: null, updatedAt: new Date() })
        .where(eq(Jobs.id, job.id));

      await markExecutionFailed(db, log.id, {
        errorMessage: error.message,
        retryCount: bullJob.attemptsMade,
        status: "failed",
      });

      throw new UnrecoverableError(error.message);
    }

    const willRetry = bullJob.attemptsMade + 1 < bullJob.opts.attempts;

    await markExecutionFailed(db, log.id, {
      errorMessage: error.message,
      retryCount: bullJob.attemptsMade,
      status: willRetry ? "retry" : "failed",
    });

    throw error;
  }
};

export const startWorker = () => {
  const worker = new Worker(
    processingQueueName,

    //main processing function
    processor,

    {
      connection: { ...defaultRedisOptions, maxRetriesPerRequest: null },
      concurrency: 10,
      lockDuration: 30000,
      lockRenewTime: 15000,
      stalledInterval: 30000,
    },
  );

  worker.on("completed", (job) =>
    logger.info(`Worker: BullMQ job "${job.name}" done`),
  );

  worker.on("failed", (job, err) =>
    logger.error(`Worker bullMQ job "${job?.name}" failed: ${err.message}`),
  );

  logger.info("Worker Started");

  return worker;
};
