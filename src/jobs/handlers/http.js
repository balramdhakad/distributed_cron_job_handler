import { z } from "zod/v4";
import axios from "axios";
import { NonRetryableError } from "../../utils/errors.js";

export const type = "http";

export const schema = z.object({
  url: z.string().url("url must be a valid URL"),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z
    .int()
    .positive("timeout must be a positive integer ms")
    .default(30_000),
  body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
});

const httpHandler = async (config) => {
  if (!config?.url) {
    throw new NonRetryableError("http handler requires config.url");
  }

  const { url, method = "GET", headers = {}, body, timeout = 30000 } = config;

  try {
    const response = await axios({
      url,
      method: method.toUpperCase(),
      headers,
      data: body,
      timeout,
    });
    return { status: response.status, data: response.data };
  } catch (err) {
    throw err;
  }
};

export default httpHandler;
