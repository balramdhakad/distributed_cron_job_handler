import { sql, eq, and, desc } from "drizzle-orm";
import { Jobs } from "../../../infra/postgres/schema/jobSchema.js";
import { jobExexutions } from "../../../infra/postgres/schema/jobExecutionLog.js";
import { getNextRunAt } from "../../../utils/cronJob.js";
import { ConflictError, NotFoundError } from "../../../utils/errors.js";
import jobRepository from "./job.repositories.js";

const createJob = async (db, job) => {
  const alreadyExistWithName = await jobRepository.isJobExistWithJobName(
    db,
    job.name,
  );
  if (alreadyExistWithName) {
    throw new ConflictError("Job With this Job name already Exist");
  }

  const nextRunAt = getNextRunAt(job.cronExpression, job.timezone);
  const result = await jobRepository.createJob(db, { ...job, nextRunAt });
  return result;
};

const getAlljobsList = async (db, { page, limit, isActive, search }) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  if (isActive !== undefined) conditions.push(eq(Jobs.isActive, isActive));
  const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

  let jobs, total;

  if (search) {
    const scoreExpr = sql`GREATEST(
      similarity(${Jobs.name}, ${search}),
      similarity(${Jobs.handlerType}, ${search})
    )`;

    const searchCondition = sql`(${Jobs.name} % ${search} OR ${Jobs.handlerType} % ${search})`;
    const where = baseWhere ? and(baseWhere, searchCondition) : searchCondition;

    [jobs, total] = await Promise.all([
      jobRepository.searchJobsList(db, { where, scoreExpr, limit, offset }),
      jobRepository.countJobs(db, { where }),
    ]);
  } else {
    [jobs, total] = await Promise.all([
      jobRepository.getAllJobsList(db, { where: baseWhere, limit, offset }),
      jobRepository.countJobs(db, { where: baseWhere }),
    ]);
  }

  return {
    data: jobs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

const getSingleJob = async (db, id) => {
  const job = await jobRepository.findById(db, id);
  if (!job) throw new NotFoundError("Job not found");
  return job;
};

const updateJob = async (db, id, data) => {
  const job = await jobRepository.findById(db, id);
  if (!job) throw new NotFoundError("Job not found");

  const updates = { ...data };

  // recalculate nextRunAt only if schedule changed
  if (data.cronExpression || data.timezone) {
    const cronExpression = data.cronExpression ?? job.cronExpression;
    const timezone = data.timezone ?? job.timezone;
    updates.nextRunAt = getNextRunAt(cronExpression, timezone);
  }

  const result = await jobRepository.updateById(db, id, updates);
  return result;
};

const toggleJob = async (db, id, isActive) => {
  const job = await jobRepository.findById(db, id);
  if (!job) throw new NotFoundError("Job not found");

  if (job.isActive === isActive && job.nextRunAt !== null) return job;

  const nextRunAt = isActive
    ? getNextRunAt(job.cronExpression, job.timezone)
    : null;

  return jobRepository.updateById(db, id, { isActive, nextRunAt });
};

const deleteJob = async (db, id) => {
  const job = await jobRepository.findById(db, id);
  if (!job) throw new NotFoundError("Job not found");

  await jobRepository.deleteById(db, id);
};

const getJobExecutionHistory = async (db, jobId, { page, limit, status }) => {
  const job = await jobRepository.findById(db, jobId);
  if (!job) throw new NotFoundError("Job not found");

  const offset = (page - 1) * limit;
  
  const conditions = [eq(jobExexutions.jobId, jobId)];
  if (status) conditions.push(eq(jobExexutions.status, status));
  const where = and(...conditions);

  const [executions, total] = await Promise.all([
    jobRepository.findExecutionsByJobId(db, { where, limit, offset }),
    jobRepository.countExecutions(db, { where }),
  ]);

  return {
    data: executions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

const jobServices = {
  getAlljobsList,
  getSingleJob,
  createJob,
  toggleJob,
  deleteJob,
  updateJob,
  getJobExecutionHistory,
};

export default jobServices;
