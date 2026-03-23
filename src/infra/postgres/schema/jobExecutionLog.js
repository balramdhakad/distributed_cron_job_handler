import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "./helper.js";
import { Jobs } from "./jobSchema.js";
import { sql } from "drizzle-orm";
export const jobExexutions = pgTable(
  "job_executions",
  {
    id: uuidv7(),
    jobId: uuid("job_id").references(() => Jobs.id, { onDelete: "cascade" }),
    status: varchar("job_status", { length: 20 }).notNull().default("running"),

    scheduleAt: timestamp("schedule_at"),
    startedAt: timestamp("started_at")
      .notNull()
      .default(sql`now()`),
    finishedAt: timestamp("finished_at"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    executedBy: varchar("executed_by", { length: 255 }).notNull(), //workerId custom
  },

  (table) => [
    // prevent two execution logs for the same job run
    // partial: allows multiple NULLs (manual/ad-hoc triggers have no scheduled time)
    uniqueIndex("uq_executions_job_id_schedule_at")
      .on(table.jobId, table.scheduleAt)
      .where(sql`${table.scheduleAt} IS NOT NULL`),

    // get all logs of a specific job
    index("idx_executions_job_id").on(table.jobId),

    // find all failed or running jobs
    index("idx_executions_status").on(table.status),

    // get stuck jobs - running older than X mins
    index("idx_executions_started_at")
      .on(table.startedAt)
      .where(sql`${table.status}::text = 'running'`),

    // monitoring dashboard - latest runs per job
    index("idx_executions_job_id_started_at").on(table.jobId, table.startedAt),
  ],
);
