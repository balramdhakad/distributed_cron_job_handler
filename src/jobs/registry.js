import env from "../config/env.js";
import { logger } from "../infra/logger.js";
import { redis } from "../infra/redis/index.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

const APPLICATION_PREFIX = env.jobSechdularConfig.prefix;
const PREFIX = `${APPLICATION_PREFIX}:handler:`;

const localHandlers = new Map();

const scanKeys = async (pattern) => {
  const keys = [];
  let cursor = "0";

  do {
    const [nextCursor, batch] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");

  return keys;
};

export const register = async (type, fn, schema = null) => {
  if (typeof fn !== "function") {
    throw new ValidationError(
      `Handler for "${type}" must be a function, got ${typeof fn}`,
    );
  }

  localHandlers.set(type, { fn, schema });
  await redis.set(`${PREFIX}${type}`, "1");

  logger.info(`Registry Registered handler: ${type}`);
};

export const execute = async (type, config) => {
  const entry = localHandlers.get(type);

  if (!entry) throw new NotFoundError(`No handler registered for type: "${type}"`);

  return entry.fn(config);
};

export const hasHandler = async (type) => {
  const exists = await redis.exists(`${PREFIX}${type}`);
  return exists === 1;
};

export const listHandlers = async () => {
  const keys = await scanKeys(`${PREFIX}*`);
  return keys.map((k) => k.slice(PREFIX.length)).sort();
};

export const getSchema = (type) => localHandlers.get(type)?.schema ?? null;
