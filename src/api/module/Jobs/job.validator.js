import z from "zod/v4";
import { isValidCron } from "../../../utils/cronJob.js";
import { hasHandler, listHandlers, getSchema } from "../../../jobs/registry.js";

export const validateHandlerConfig = async (handlerType, config) => {
  const schema = getSchema(handlerType);

  if (!schema) return config;

  const result = await schema.safeParse(config);

  if (!result.success) {
    // const message = result.error.errors.map((e) => e.message).join("; ");
    throw new ValidationError(message || "validation");
  }

  return result.data;
};

const cronSchema = z
  .string()
  .min(1, "cronExpression is required")
  .refine(isValidCron, {
    message: "cronExpression is not a valid cron expression",
  });

const handlerTypeSchema = z
  .string()
  .min(1, "handlerType is required")
  .superRefine(async (val, ctx) => {
    const exists = await hasHandler(val);
    if (!exists) {
      const available = await listHandlers();
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${val} handleType is not available. Available Handlers: ${available.join(", ")}`,
      });
    }
  });
const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: "not a valid IANA timezone" },
);

//create Job
export const createJobSchema = z.object({
  name: z
    .string()
    .min(1, "name is required")
    .max(255)
    .refine((v) => v.trim().length > 0, { message: "name cannot be blank" }),

  cronExpression: cronSchema,

  timezone: timezoneSchema.default("UTC"),

  handlerType: handlerTypeSchema,

  handlerConfig: z.record(z.string(), z.unknown()).default({}),

  maxRetry: z
    .int()
    .min(0, "max_retries must be a non-negative integer")
    .default(3),

  maxRuns: z
    .int()
    .positive("max_runs must be a positive integer or null")
    .nullable()
    .default(null),
});

export const updateJobSchema = z
  .object({
    id: z.uuid("Invalid job id"),

    name: z
      .string()
      .min(1)
      .max(255)
      .refine((v) => v.trim().length >= 2, {
        message: "name must be of atleast 2 char",
      })
      .optional(),

    cronExpression: cronSchema.optional(),

    timezone: timezoneSchema.optional(),

    handlerType: handlerTypeSchema.optional(),

    handlerConfig: z.record(z.string(), z.unknown()).optional(),

    isActive: z.boolean().optional(),

    maxRetry: z
      .int()
      .min(0, "maxRetry must be a non-negative integer")
      .optional(),

    maxRuns: z
      .int()
      .positive("maxRuns must be a positive integer")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).filter((k) => k !== "id").length > 0,
    { message: "At least one field must be provided to update" },
  );

//get all jobs by pagination
export const getAllJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  search: z.string().min(1).max(100).optional(),
});

//Valid JobId
export const jobIdSchema = z.object({
  id: z.uuid("Invalid job id"),
});

//get Execution History Schema
export const getExecutionHistoryQuerySchema = z.object({
  id: z.uuid("Invalid job id"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["running", "retrying", "success", "failed", "timeout"]).optional(),
});

const jobSchemaValidation = {
  createJobSchema,
  updateJobSchema,
  getAllJobsQuerySchema,
  getExecutionHistoryQuerySchema,
};

export default jobSchemaValidation;
