import { sql, eq, and, desc, count } from "drizzle-orm";
import { Jobs } from "../../../infra/postgres/schema/jobSchema.js";
import { jobExexutions } from "../../../infra/postgres/schema/jobExecutionLog.js";
import dbHandler from "../../../utils/dbWrapper.js";

const isJobExistWithJobName = async (db, jobName) => {
  const [row] = await db
    .select({ id: Jobs.id })
    .from(Jobs)
    .where(eq(Jobs.name, jobName))
    .limit(1);
  return !!row;
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
      maxRuns: jobData.maxRuns ?? null,
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
  maxRuns: Jobs.maxRuns,
  runCount: Jobs.runCount,
  nextRunAt: Jobs.nextRunAt,
  createdAt: Jobs.createdAt,
  updatedAt: Jobs.updatedAt,
};

// plain list ordered by latest first
const getAllJobsList = async (db, { where, limit, offset }) =>
  db
    .select(listColumns)
    .from(Jobs)
    .where(where)
    .orderBy(desc(Jobs.createdAt))
    .limit(limit)
    .offset(offset);
//if search is their
const searchJobsList = async (db, { where, scoreExpr, limit, offset }) =>
  db
    .select({ ...listColumns, score: scoreExpr })
    .from(Jobs)
    .where(where)
    .orderBy(desc(scoreExpr), desc(Jobs.createdAt))
    .limit(limit)
    .offset(offset);

// total count for pagination
const countJobs = async (db, { where }) => {
  const [result] = await db.select({ count: count() }).from(Jobs).where(where);
  return Number(result.count);
};

// find job by id
const findById = async (db, id) => {
  const [job] = await db.select().from(Jobs).where(eq(Jobs.id, id));
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

// executions for one job, latest first
const findExecutionsByJobId = async (db, { where, limit, offset }) =>
  db
    .select()
    .from(jobExexutions)
    .where(where)
    .orderBy(desc(jobExexutions.startedAt))
    .limit(limit)
    .offset(offset);

// total count for execution history pagination
const countExecutions = async (db, { where }) => {
  const [result] = await db
    .select({ count: count() })
    .from(jobExexutions)
    .where(where);
  return Number(result.count);
};

//wraped all function under all Repositories or batter error handling
const jobRepository = {
  isJobExistWithJobName: dbHandler(isJobExistWithJobName),
  createJob: dbHandler(createJob),
  getAllJobsList: dbHandler(getAllJobsList),
  searchJobsList: dbHandler(searchJobsList),
  countJobs: dbHandler(countJobs),
  findById: dbHandler(findById),
  updateById: dbHandler(updateById),
  deleteById: dbHandler(deleteById),
  findExecutionsByJobId: dbHandler(findExecutionsByJobId),
  countExecutions: dbHandler(countExecutions),
};

export default jobRepository;
