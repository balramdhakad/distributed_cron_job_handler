import { asyncHandler } from "../../middlewares/asyncHandler.js";

const createJob = asyncHandler(async (req, res) => {
    const {name,cronExpression,timezone,handlerType,handlerConfig} = req.body
});

const updateJob = asyncHandler(async (req, res) => {});

const deleteJob = asyncHandler(async (req, res) => {});

const getAllJobsList = asyncHandler(async (req, res) => {});

const getSingleList = asyncHandler(async (req, res) => {});

const getJobsExecutionHistory = asyncHandler(async (req, res) => {});


const jobControllers = {
    createJob,
    updateJob,
    deleteJob,
    getAllJobsList,
    getSingleList,
    getJobsExecutionHistory
}

export default jobControllers