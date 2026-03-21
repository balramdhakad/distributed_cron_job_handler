import { eq } from "drizzle-orm";
import { jobExexutions } from "../infra/postgres/schema/jobExecutionLog.js";

export const createExecutionLog = async (db, { jobId, scheduledAt, executedBy }) => {
  const [log] = await db
    .insert(jobExexutions)
    .values({
      jobId,
      status: "running",
      sechduedAt: scheduledAt,
      startedAt: new Date(),
      executedBy,
    })
    .returning();

  return log;
};

export const markExecutionSuccess = async (db, executionId) => {
  await db
    .update(jobExexutions)
    .set({
      status: "success",
      finishedAt: new Date(),
    })
    .where(eq(jobExexutions.id, executionId));
};

export const markExecutionFailed = async (db, executionId, { errorMessage, retryCount, status }) => {
  await db
    .update(jobExexutions)
    .set({
      status,
      finishedAt: new Date(),
      errorMessage,
      retryCount,
    })
    .where(eq(jobExexutions.id, executionId));
};
