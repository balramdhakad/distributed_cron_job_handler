import { and, asc, eq, lte } from "drizzle-orm";
import { Jobs } from "../infra/postgres/schema/jobSchema.js";



export const fetchExecutableJobs = async (db,limit = 50) => {
  return db
    .select()
    .from(Jobs)
    .where(and(lte(Jobs.nextRunAt, new Date()), eq(Jobs.isActive, true)))
    .orderBy(asc(Jobs.nextRunAt))
    .limit(limit);
};

export const updateNextRunAt = async (tx, jobId, nextRunAt) => {
  await tx
    .update(Jobs)
    .set({ nextRunAt, updatedAt: new Date() })
    .where(eq(Jobs.id, jobId));
};
