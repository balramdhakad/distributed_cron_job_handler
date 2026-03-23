import { and, eq, sql } from "drizzle-orm";
import dbHandler from "../utils/dbWrapper.js";
import { jobExexutions } from "../infra/postgres/schema/jobExecutionLog.js";
import { Jobs } from "../infra/postgres/schema/jobSchema.js";

const _createExecutionLog = async (db, { jobId, scheduledAt, executedBy }) => {

  const [log] = await db
    .insert(jobExexutions)
    .values({
      jobId,
      status: "running",
      scheduleAt: scheduledAt,
      startedAt: new Date(),
      executedBy,
    })
    .onConflictDoNothing()
    .returning();

  if (log) return log;

  const [existing] = await db
    .select()
    .from(jobExexutions)
    .where(
      and(
        eq(jobExexutions.jobId, jobId),
        scheduledAt
          ? eq(jobExexutions.scheduleAt, scheduledAt)
          : sql`${jobExexutions.scheduleAt} IS NULL`,
      ),
    )
    .limit(1);

  return existing ?? null;
};

const _markExecutionSuccess = async (db, executionId) => {
  await db
    .update(jobExexutions)
    .set({ status: "success", finishedAt: new Date() })
    .where(eq(jobExexutions.id, executionId));
};

const _getExecutionLog = async (db, { jobId, scheduledAt }) => {
  const [log] = await db
    .select()
    .from(jobExexutions)
    .where(
      and(
        eq(jobExexutions.jobId, jobId),
        scheduledAt
          ? eq(jobExexutions.scheduleAt, scheduledAt)
          : sql`${jobExexutions.scheduleAt} IS NULL`,
      ),
    )
    .limit(1);
  return log ?? null;
};

const _markExecutionFailed = async (
  db,
  executionId,
  { errorMessage, retryCount, status },
) => {
  await db
    .update(jobExexutions)
    .set({ status, finishedAt: new Date(), errorMessage, retryCount })
    .where(eq(jobExexutions.id, executionId));
};

const _updateJobAfterSuccess = async (db, jobId, { newRunCount, maxReached }) => {
  await db
    .update(Jobs)
    .set({
      runCount: newRunCount,
      ...(maxReached && { isActive: false, nextRunAt: null }),
      updatedAt: new Date(),
    })
    .where(eq(Jobs.id, jobId));
};

const _deactivateJob = async (db, jobId) => {
  await db
    .update(Jobs)
    .set({ isActive: false, nextRunAt: null, updatedAt: new Date() })
    .where(eq(Jobs.id, jobId));
};

export const createExecutionLog = dbHandler(_createExecutionLog);
export const markExecutionSuccess = dbHandler(_markExecutionSuccess);
export const markExecutionFailed = dbHandler(_markExecutionFailed);
export const getExecutionLog = dbHandler(_getExecutionLog);
export const updateJobAfterSuccess = dbHandler(_updateJobAfterSuccess);
export const deactivateJob = dbHandler(_deactivateJob);
