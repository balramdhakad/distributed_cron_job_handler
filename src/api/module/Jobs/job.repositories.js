import { sql, eq, and, desc, count, asc } from "drizzle-orm";
import { Jobs } from "../../../infra/postgres/schema/jobSchema.js";
import { jobExexutions } from "../../../infra/postgres/schema/jobExecutionLog.js";

const isJobExistWithJobName = async (db, jobName) => {
  const result = await db.execute(
    sql`SELECT EXISTS (SELECT 1 FROM jobs WHERE name = ${jobName})`,
  );
  return result.rows[0].exists;
};


const createJob = async (db, jobData) => {
  const [job] = await db
    .insert(Jobs)
    .values({
      name: jobData.name,
      cronExpression: jobData.cronExpression,
      timezone: jobData.timezone ?? "UTC",
      handlerType: jobData.handlerType,
      handlerConfig: jobData.handlerConfig ?? {},
      isActive: jobData.isActive ?? true,
      maxRetry: jobData.maxRetry ?? 3,
      maxTimeRun: jobData.maxRuns ?? 1,
      nextRunAt: jobData.nextRunAt ?? null,
    })
    .returning();
  return job;
};

const listColumns = {
  id: Jobs.id,
  name: Jobs.name,
  cronExpression: Jobs.cronExpression,
  timezone: Jobs.timezone,
  handlerType: Jobs.handlerType,
  isActive: Jobs.isActive,
  maxRetry: Jobs.maxRetry,
  maxTimeRun: Jobs.maxTimeRun,
  runCount: Jobs.runCount,
  nextRunAt: Jobs.nextRunAt,
  createdAt: Jobs.createdAt,
  updatedAt: Jobs.updatedAt,
};

//search and filter all jobs 
const getAllJobsList = async (db, { page, limit, isActive, search }) => {
  const offset = (page - 1) * limit;

  const baseConditions = [];
  if (isActive !== undefined) baseConditions.push(eq(Jobs.isActive, isActive));
  const baseWhere =
    baseConditions.length > 0 ? and(...baseConditions) : undefined;

  if (search) {
    const scoreExpr = sql`GREATEST(
      similarity(${Jobs.name}, ${search}),
      similarity(${Jobs.handlerType}, ${search})
    )`;

    const searchCondition = sql`(
      ${Jobs.name} % ${search} OR ${Jobs.handlerType} % ${search}
    )`;

    const where = baseWhere ? and(baseWhere, searchCondition) : searchCondition;

    const [jobs, totalResult] = await Promise.all([
      db
        .select({ ...listColumns, score: scoreExpr })
        .from(Jobs)
        .where(where)
        .orderBy(desc(scoreExpr), desc(Jobs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(Jobs).where(where),
    ]);

    return { jobs, total: Number(totalResult[0].count) };
  }

  const [jobs, totalResult] = await Promise.all([
    db
      .select(listColumns)
      .from(Jobs)
      .where(baseWhere)
      .orderBy(desc(Jobs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(Jobs).where(baseWhere),
  ]);

  return { jobs, total: Number(totalResult[0].count) };
};

const findById = async (db, id) => {
  const [job] = await 
  db.select()
  .from(Jobs)
  .where(eq(Jobs.id, id));

  return job ?? null;
};

const updateById = async (db, id, data) => {
  const [job] = await db
    .update(Jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Jobs.id, id))
    .returning();
  return job ?? null;
};

const deleteById = async (db, id) => {
  const [job] = await db
    .delete(Jobs)
    .where(eq(Jobs.id, id))
    .returning({ id: Jobs.id });
  return job ?? null;
};


const findExecutionsByJobId = async (db, jobId, { page, limit, status }) => {
  const offset = (page - 1) * limit;

  const conditions = [eq(jobExexutions.jobId, jobId)];
  if (status) conditions.push(eq(jobExexutions.status, status));
  const where = and(...conditions);

  const [executions, totalResult] = await Promise.all([
    db
      .select()
      .from(jobExexutions)
      .where(where)
      .orderBy(desc(jobExexutions.startedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(jobExexutions).where(where),
  ]);

  return { executions, total: Number(totalResult[0].count) };
};

const jobRepository = {
  isJobExistWithJobName,
  createJob,
  getAllJobsList,
  findById,
  updateById,
  deleteById,
  findExecutionsByJobId,
};

export default jobRepository;
