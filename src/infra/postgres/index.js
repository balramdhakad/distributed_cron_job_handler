import { Pool } from "pg";
import env from "../../config/env.js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";
import { sql } from "drizzle-orm";
import { logger } from "../logger.js";

const pool = new Pool({
  connectionString: env.postgresConfig.DATABASE_URL,
  max: 20,
});

pool.on("error", (err) => {
  logger.error(`Database pool error: ${err.message}`);
});

export const db = drizzle(pool, {
  schema,
  // logger: env.serverConfig.environment !== "production",
});

export const dbConnectionLog = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    logger.info("Database connected successfully");
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    throw err;
  }
};

export const closeDb = async () => {
  try {
    await pool.end();
    logger.info("Database pool closed");
  } catch (err) {
    logger.error(`Failed to close database pool: ${err.message}`);
    throw err;
  }
};
