import { Pool } from "pg";
import env from "../../config/env.js";


const pool = new Pool({
  connectionString: env.postgresConfig.DATABASE_URL,
  max: 10,
});

pool.on("error", (err) => {
  console.error(`Database connection Error : ${err}`);
});

export const dbConnectionLog = async () => {
  await pool.query(`SELECT 1`);
  console.log("Database is connected");
};

export const closeDb = async () => {
  await pool.end();
};
