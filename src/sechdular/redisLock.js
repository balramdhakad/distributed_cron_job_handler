import { randomUUID } from "crypto";
import env from "../config/env.js";
import { redis } from "../infra/redis/index.js";

const JOB_LOCK_TTL_MS = env.jobSechdularConfig.jobLockTTL;
const APPLICATION_PREFIX = env.jobSechdularConfig.prefix;
const KEY_PREFIX = `${APPLICATION_PREFIX}:JOBS:`;

const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

//acquireLock
export const acquireLock = async (jobId, ttl = JOB_LOCK_TTL_MS, prefix = KEY_PREFIX) => {
  const key = `${prefix}:${jobId}`;
  const token = randomUUID();

  const result = await redis.set(key, token, "PX", ttl, "NX");
  if (result !== "OK") return null;

  return { key, token };
};

export const releaseLock = async ({ key, token }) => {
  const result = await redis.eval(RELEASE_SCRIPT, 1, key, token);
  return result === 1;
};
