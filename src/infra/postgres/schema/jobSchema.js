import {
  boolean,
  pgTable,
  text,
  integer,
  index,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "./helper";
import { sql } from "drizzle-orm";

export const Jobs = pgTable(
  "jobs",
  {
    id: uuidv7(),
    //name must be unique so no problem in monitering
    name: varchar("name", { length: 255 }).notNull(),

    //time after or at time should run
    cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),

    //which function need to execute
    handlerType: text("handler_type").notNull(),

    //function perameters
    handlerConfig: jsonb("handler_config").notNull().default({}),

    isActive: boolean("is_active").notNull().default(true),

    //if failed then number of times retry will be performed if retyable error
    maxRetry: integer("max_retry").notNull().default(3),

    //no of times successful run job
    maxTimeRun: integer("max_time_run").notNull().default(1),

    runCount: integer("run_count").notNull().default(0),

    //decide when should run for next time
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("index_to_fetch_next_run_at")
      .on(table.nextRunAt)
      .where(sql`${table.isActive} = true`),

    //get job by name
    index("idx_jobs_name").on(table.name),
  ],
);
