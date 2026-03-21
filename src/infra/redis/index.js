import Redis from "ioredis";
import env from "../../config/env.js";
import { logger } from "../logger.js";

export const defaultRedisOptions = {
  host: env.redisConfig.host,
  post: env.redisConfig.port,
  password: env.redisConfig.password,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

export const redis = new Redis(defaultRedisOptions);

redis.on("connect", () => {
  logger.info(`Redis Connection Success`);
});

redis.on("error", (error) => {
  logger.error(`Redis Connection Error :${error}`);
});

redis.on("close", () => {
  logger.error(`Redis Connection Closed`);
});

export const startRedis = async () => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error(`redis Connection Error : ${error}`);
  }
};

