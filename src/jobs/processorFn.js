import { UnrecoverableError } from "bullmq";
import { db } from "../infra/postgres/index.js";
import { logger } from "../infra/logger.js";
import { execute } from "../infra/registry.js";
import { NonRetryableError } from "../utils/errors.js";
import {
  createExecutionLog,
  getExecutionLog,
  markExecutionSuccess,
  markExecutionFailed,
  updateJobAfterSuccess,
  deactivateJob,
} from "./worker.repositories.js";

const isNonRetryable = (err) =>
  (typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode < 500 &&
    err.statusCode !== 429) ||
  err instanceof NonRetryableError;

export const processor = async (bullJob, workerId) => {
  const { job, schduledAt } = bullJob.data;

  const maxAttempts = bullJob.opts.attempts ?? job.maxRetry + 1;
  const scheduledAt = schduledAt ? new Date(schduledAt) : null;

  let log = await getExecutionLog(db, { jobId: job.id, scheduledAt });
  if (!log) {
    log = await createExecutionLog(db, {
      jobId: job.id,
      scheduledAt,
      executedBy: workerId,
    });
  }

  try {
    //ready to execute handlerType fn
    await execute(job.handlerType, job.handlerConfig);

    const newRunCount = job.runCount + 1;
    const maxReached = job.maxRuns !== null && newRunCount >= job.maxRuns;

    await updateJobAfterSuccess(db, job.id, { newRunCount, maxReached });
    await markExecutionSuccess(db, log.id);

    logger.info(`Worker: job "${job.name}" completed successfully`);
  } catch (error) {
    logger.error(
      `Worker: job "${job.name}" failed [${error.statusCode ?? "no statusCode"} — ${error.message}]`,
    );

    if (isNonRetryable(error)) {
      try {
        await deactivateJob(db, job.id);
        await markExecutionFailed(db, log.id, {
          errorMessage: error.message,
          retryCount: bullJob.attemptsMade,
          status: "failed",
        });
      } catch (dbErr) {
        logger.error(
          `Worker failed to deactivate job "${job.name}" after permanent failure: ${dbErr.message}`,
        );
      }

      throw new UnrecoverableError(error.message);
    }

    const willRetry = bullJob.attemptsMade + 1 < maxAttempts;

    if (willRetry) {
      await markExecutionFailed(db, log.id, {
        errorMessage: error.message,
        retryCount: bullJob.attemptsMade,
        status: "retrying",
      });
    } else {
      await deactivateJob(db, job.id);
      await markExecutionFailed(db, log.id, {
        errorMessage: error.message,
        retryCount: bullJob.attemptsMade,
        status: "failed",
      });
    }

    throw error;
  }
};
