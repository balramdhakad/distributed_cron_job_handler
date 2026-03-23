import { and, asc, eq, lte } from "drizzle-orm";
import { Jobs } from "../infra/postgres/schema/jobSchema.js";
import dbHandler from "../utils/dbWrapper.js";

const _fetchExecutableJobs = async (db, limit = 50) =>
  db
    .select()
    .from(Jobs)
    .where(and(lte(Jobs.nextRunAt, new Date()), eq(Jobs.isActive, true)))
    .orderBy(asc(Jobs.nextRunAt))
    .limit(limit);

const _updateNextRunAt = async (tx, jobId, nextRunAt) => {
  await tx
    .update(Jobs)
    .set({ nextRunAt, updatedAt: new Date() })
    .where(eq(Jobs.id, jobId));
};


export const fetchExecutableJobs = dbHandler(_fetchExecutableJobs);
export const updateNextRunAt = dbHandler(_updateNextRunAt);
