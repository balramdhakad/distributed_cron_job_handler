import { Worker } from "bullmq";
import { hostname } from "os";
import { logger } from "../infra/logger.js";
import { defaultRedisOptions } from "../infra/redis/index.js";
import { processingQueueName } from "../infra/redis/queue.js";
import { registerAllHandlers } from "./handlers/index.js";
import { processor } from "./processorFn.js";

const resolveWorkerId = () => `worker-${hostname()}-${process.pid}`;

export const startWorker = async (workerId) => {
  await registerAllHandlers();

  const worker = new Worker(
    processingQueueName,
    (bullJob) => processor(bullJob, workerId),
    {
      connection: { ...defaultRedisOptions, maxRetriesPerRequest: null },
      concurrency: 5,
      lockDuration: 30000,
      lockRenewTime: 15000,
      stalledInterval: 30000,
    },
  );

  worker.on("completed", (job) =>
    logger.info(`[${workerId}] BullMQ job "${job.name}" done`),
  );

  worker.on("failed", (job, err) =>
    logger.error(`[${workerId}] BullMQ job "${job?.name}" failed — ${err.message}`),
  );

  logger.info(`[${workerId}] Worker started`);

  return worker;
};

const workerId = resolveWorkerId();

startWorker(workerId)
  .then((worker) => {
    const shutdown = async (signal) => {
      logger.info(`[${workerId}] ${signal} received — shutting down`);
      await worker.close();
      logger.info(`[${workerId}] Worker closed`);
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error(`[${workerId}] Failed to start worker: ${err.message}`);
    process.exit(1);
  });
