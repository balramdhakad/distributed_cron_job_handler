import { Queue } from "bullmq";
import { defaultRedisOptions, redis } from "./index.js";

export const processingQueueName = "job-processing-Queue";

export const processingQueue = new Queue(processingQueueName, {
  connection: { ...defaultRedisOptions, maxRetriesPerRequest: null },
});
