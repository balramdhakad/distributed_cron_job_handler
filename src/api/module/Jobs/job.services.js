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

const getAlljobsList = async (db, query) => {
  const { jobs, total } = await jobRepository.getAllJobsList(db, query);
  return {
    data: jobs,
    pagination: { total, page: query.page, limit: query.limit },
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

  // if name is changing ensure uniqueness
  if (data.name && data.name !== job.name) {
    const taken = await jobRepository.isJobExistWithJobName(db, data.name);
    if (taken) throw new ConflictError("Job with this name already exists");
  }

  const updates = { ...data };

  if ("maxRuns" in updates) {
    updates.maxTimeRun = updates.maxRuns;
    delete updates.maxRuns;
  }

  // recalculate nextRunAt only if schedule changed
  if (data.cronExpression || data.timezone) {
    const cronExpression = data.cronExpression ?? job.cronExpression;
    const timezone = data.timezone ?? job.timezone;
    updates.nextRunAt = getNextRunAt(cronExpression, timezone);
  }

  const result = await jobRepository.updateById(db, id, updates);
  return result;
};

const deleteJob = async (db, id) => {
  const job = await jobRepository.findById(db, id);
  if (!job) throw new NotFoundError("Job not found");

  await jobRepository.deleteById(db, id);
};

const getJobExecutionHistory = async (db, jobId, query) => {
  // ensure job exists first
  const job = await jobRepository.findById(db, jobId);
  if (!job) throw new NotFoundError("Job not found");

  const { executions, total } = await jobRepository.findExecutionsByJobId(
    db,
    jobId,
    query,
  );
  return { executions, total, page: query.page, limit: query.limit };
};

const jobServices = {
  getAlljobsList,
  getSingleJob,
  createJob,
  deleteJob,
  updateJob,
  getJobExecutionHistory,
};

export default jobServices;
