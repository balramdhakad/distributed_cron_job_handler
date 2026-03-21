import { pgEnum } from "drizzle-orm/pg-core";


export const jobExecutionStatusEnum = pgEnum("job_status", [
  "retrying",
  "running",
  "success",
  "failed",
]);