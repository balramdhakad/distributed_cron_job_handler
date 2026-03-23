import env from "../config/env.js";
import { logger } from "./logger.js";
import { redis } from "./redis/index.js";
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";

const PREFIX = `${env.jobSechdularConfig.prefix}:handler:`;

const localHandlers = new Map();

const scanKeys = async (pattern) => {
  const keys = [];
  let cursor = "0";

  do {
    const [next, batch] = await redis
      .scan(cursor, "MATCH", pattern, "COUNT", 100)
      .catch((err) => {
        throw new AppError(`Handler registry scan failed: ${err.message}`, 503, "REGISTRY_SCAN_ERROR");
      });
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");

  return keys;
};

export const register = async (type, fn, schema = null) => {
  if (typeof fn !== "function")
    throw new ValidationError(`Handler "${type}" must be a function, got ${typeof fn}`);

  try {
    localHandlers.set(type, { fn, schema });
    await redis.set(`${PREFIX}${type}`, "1");
    logger.info(`Handler registered: "${type}"`);
  } catch (err) {
    localHandlers.delete(type);
    throw new AppError(`Failed to register handler "${type}": ${err.message}`, 503, "REGISTRY_ERROR");
  } 
};

export const execute = async (type, config) => {
  const entry = localHandlers.get(type);
  if (!entry) throw new NotFoundError(`No handler registered for type: "${type}"`);
  return entry.fn(config);
};

export const hasHandler = async (type) => {
  try {
    return (await redis.exists(`${PREFIX}${type}`)) === 1;
  } catch (err) {
    throw new AppError(`Registry lookup failed for "${type}": ${err.message}`, 503, "REGISTRY_ERROR");
  }
};

export const listHandlers = async () => {
  const keys = await scanKeys(`${PREFIX}*`);
  return keys.map((k) => k.slice(PREFIX.length)).sort();
};

export const getSchema = (type) => localHandlers.get(type)?.schema ?? null;
