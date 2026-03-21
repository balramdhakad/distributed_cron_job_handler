import winston, { createLogger, format } from "winston";
import env from "../config/env.js";

const { combine, timestamp, json, colorize, printf, errors } = format;

const isProduction = env.serverConfig.environment === "production";

const removableFields = [
  "password",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "creditcard",
  "cvv",
  "secret",
  "apikey",
];

const removeSensitiveInfo = (data) => {
  if (Array.isArray(data)) {
    return data.map(removeSensitiveInfo);
  }

  if (data && typeof data === "object") {
    const copyData = { ...data };

    for (const key in copyData) {
      if (removableFields.includes(key.toLowerCase())) {
        copyData[key] = "[HIDEN]";
      } else {
        copyData[key] = removeSensitiveInfo(copyData[key]);
      }
    }

    return copyData;
  }

  return data;
};

const redactFormat = format((info) => removeSensitiveInfo(info));

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return `${timestamp} ${level}: ${stack || message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ""
  }`;
});

const transports = [];

// Dev Console
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY:MM:DD HH:mm:ss" }),
        devFormat,
      ),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: json(),
    }),
  );
}


export const logger = createLogger({
  level: isProduction ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    redactFormat(),
    json(),
  ),
  transports,
  exitOnError: false,
});
