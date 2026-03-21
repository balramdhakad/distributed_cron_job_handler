import app from "./api/index.js";
import env from "./config/env.js";
import { dbConnectionLog } from "./infra/postgres/index.js";
import logHandler, {
  type as logType,
  schema as logSchema,
} from "./jobs/handlers/log.js";
import httpHandler, {
  type as httpType,
  schema as httpSchema,
} from "./jobs/handlers/http.js";
import { register } from "./jobs/registry.js";
import { startScheduler } from "./sechdular/index.js";
import { startWorker } from "./jobs/worker.js";

const PORT = env.serverConfig.PORT;

const startServer = async () => {
  await dbConnectionLog();

  await register(logType, logHandler, logSchema);
  await register(httpType, httpHandler, httpSchema);
  app.listen(PORT, () => {
    console.log(`server is running on PORT : ${PORT}`);
  });
};

startServer();
