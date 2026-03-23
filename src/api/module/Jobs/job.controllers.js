import { db } from "../../../infra/postgres/index.js";
import {
  sendResponse,
  sendPaginatedResponce,
} from "../../../utils/response.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { validate } from "../../middlewares/handlerValidation.js";
import jobServices from "./job.services.js";
import jobSchemaValidation, {
  jobIdSchema,
  validateHandlerConfig,
} from "./job.validator.js";

const createJob = asyncHandler(async (req, res) => {
  const data = await validate(jobSchemaValidation.createJobSchema, req.body);

  //validator Config validation
  //to add new job with handler it's that their hander and their validation should
  //already in registry
  await validateHandlerConfig(data.handlerType, data.handlerConfig);

  const result = await jobServices.createJob(db, data);
  sendResponse(res, {
    message: "Job created successfully",
    data: result,
    statusCode: 201,
  });
});

const getAllJobsList = asyncHandler(async (req, res) => {
  const query = await validate(
    jobSchemaValidation.getAllJobsQuerySchema,
    req.query,
  );

  const { data, pagination } = await jobServices.getAlljobsList(db, query);

  sendPaginatedResponce(res, data, { ...pagination });
});

const getSingleList = asyncHandler(async (req, res) => {
  const { id } = await validate(jobIdSchema, req.params);

  const job = await jobServices.getSingleJob(db, id);

  sendResponse(res, { data: job });
});

const updateJob = asyncHandler(async (req, res) => {
  const { id, ...data } = await validate(jobSchemaValidation.updateJobSchema, {
    ...req.body,
    id: req.params.id,
  });

  if (data.handlerType || data.handlerConfig) {
    const handlerType =
      data.handlerType ?? (await jobServices.getSingleJob(db, id)).handlerType;

    await validateHandlerConfig(handlerType, data.handlerConfig ?? {});
  }

  const result = await jobServices.updateJob(db, id, data);

  sendResponse(res, { message: "Job updated successfully", data: result });
});

const toggleJob = asyncHandler(async (req, res) => {
  const { id, isActive } = await validate(jobSchemaValidation.toggleJobSchema, {
    ...req.body,
    id: req.params.id,
  });

  const result = await jobServices.toggleJob(db, id, isActive);
  sendResponse(res, {
    message: `Job ${isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = await validate(jobIdSchema, req.params);

  await jobServices.deleteJob(db, id);

  sendResponse(res, { message: "Job deleted successfully" });
});

const getJobsExecutionHistory = asyncHandler(async (req, res) => {
  const { id, ...query } = await validate(
    jobSchemaValidation.getExecutionHistoryQuerySchema,
    { ...req.query, id: req.params.id },
  );

  const { data, pagination } = await jobServices.getJobExecutionHistory(
    db,
    id,
    query,
  );

  sendPaginatedResponce(res, data, pagination);
});

const jobControllers = {
  createJob,
  updateJob,
  toggleJob,
  deleteJob,
  getAllJobsList,
  getSingleList,
  getJobsExecutionHistory,
};

export default jobControllers;
