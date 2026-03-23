import { register } from "../../infra/registry.js";
import logHandler, { type as logType, schema as logSchema } from "./log.js";
import httpHandler, { type as httpType, schema as httpSchema } from "./http.js";

export const registerAllHandlers = async () => {
  await register(logType, logHandler, logSchema);
  await register(httpType, httpHandler, httpSchema);
};
