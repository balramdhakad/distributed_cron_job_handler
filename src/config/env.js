import dotenv from "dotenv";
dotenv.config();

const toNumber = (key, value) => {
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`${key} must be a number`);
  }
  return parsed;
};

const required = (key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return process.env[key];
};

const serverConfig = {
  PORT: process.env.PORT ? toNumber("PORT", process.env.PORT) : 5000,

  environment:
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development",
};

const postgresConfig = { DATABASE_URL: required("DATABASE_URL") };
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT
    ? toNumber("REDIS_PORT", process.env.REDIS_PORT)
    : 6379,
};

const jobSechdularConfig = {
  poolIntervalTime: process.env.POLL_INTERVAL_MS
    ? toNumber("POLL_INTERVAL_MS", process.env.POLL_INTERVAL_MS)
    : 30000,

  jobLockTTL: process.env.JOB_LOCK_TTL_MS
    ? toNumber("JOB_LOCK_TTL_MS", process.env.JOB_LOCK_TTL_MS)
    : 300000,
  prefix: process.env.PRIFIX || "distrutedCron",
};

const env = {
  serverConfig,
  redisConfig,
  postgresConfig,
  jobSechdularConfig,
};

export default env;
