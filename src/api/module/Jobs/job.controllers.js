import { db } from "../../../infra/postgres/index.js";
import {
  sendResponse,
  sendPaginatedResponce,
} from "../../../utils/response.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { validate } from "../../middlewares/handlerValidation.js";
import jobServices from "./job.services.js";
import jobSchemaValidation, { validateHandlerConfig } from "./job.validator.js";

const createJob = asyncHandler(async (req, res) => {
  const data = await validate(jobSchemaValidation.createJobSchema, req.body);

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

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = await validate(jobIdSchema, req.params);

  await jobServices.deleteJob(db, id);

  sendResponse(res, { message: "Job deleted successfully" });
});

const getJobsExecutionHistory = asyncHandler(async (req, res) => {
  //validation
  const { id, ...query } = await validate(
    jobSchemaValidation.getExecutionHistoryQuerySchema,
    { ...req.query, id: req.params.id },
  );

  //service Call
  const { executions, total, page, limit } =
    await jobServices.getJobExecutionHistory(db, id, query);

  sendPaginatedResponce(res, executions, { total, page, limit });
});

const jobControllers = {
  createJob,
  updateJob,
  deleteJob,
  getAllJobsList,
  getSingleList,
  getJobsExecutionHistory,
};

export default jobControllers;
