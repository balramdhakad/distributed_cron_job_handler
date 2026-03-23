import env from "../../config/env.js";
import { logger } from "../../infra/logger.js";

export const errorHandler = (err, req, res, next) => {
  const isProduction = env.serverConfig.environment === "production";
  const isOperational = err.isOperational === true;

  const statusCode =
    err.statusCode && typeof err.statusCode === "number" && err.statusCode > 399
      ? err.statusCode
      : 500;

  const response = {
    success: false,
    message:
      isProduction && !isOperational
        ? "Something went wrong"
        : err.message || "Internal server error",
    code: err.code || "INTERNAL_SERVER_ERROR",
    timestamp: new Date().toISOString(),
  };

  if (err.details) response.details = err.details;

  let structuredLogData = {
    message: err.message,
    errorCode: err.errorCode || "UNEXPECTED_ERROR",
    statusCode,
    correlationId: req.correlationId || null,
    method: req.method,
    url: req.originalUrl,
  };

  if (!isProduction) {
    response.stack = err.stack;
    structuredLogData.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(structuredLogData);
  } else {
    logger.warn(structuredLogData);
  }

  res.status(statusCode).json(response);
};
