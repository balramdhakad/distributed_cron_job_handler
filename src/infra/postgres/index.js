import { Pool } from "pg";
import env from "../../config/env.js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: env.postgresConfig.DATABASE_URL,
  max: 10,
});

pool.on("error", (err) => {
  console.error(`Database connection Error : ${err}`);
});

export const db = drizzle(pool, {
  schema,
  logget: env.serverConfig.environment !== "production",
});

export const dbConnectionLog = async () => {
  await db.execute(sql`SELECT 1`);
  console.log("Database is connected");
};

export const closeDb = async () => {
  await pool.end();
};
