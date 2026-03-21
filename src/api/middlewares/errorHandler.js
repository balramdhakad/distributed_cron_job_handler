import env from "../../config/env.js";

export const errorHandler = (err, req, res, next) => {

  const isProduction = env.serverConfig.environment === "production";
  const isOperational = err.isOperational === true;

  let statusCode =
    err.statusCode && typeof err.statusCode === "number" && err.statusCode > 399
      ? err.statusCode
      : 500;

  let response = {
    success: false,
    message:
      isProduction && !isOperational
        ? "Something went wrong"
        : err.message || "internal server error",
    code: err.code || "INTERNAL_SERVER_ERROR",
    timestamp: new Date().toISOString(),
  };

  if (err.details) {
    response.details = err.details;
  }

  if (!isProduction) {
    response.stack = err.stack;
  }


  res.status(statusCode).json(response);
};
