import app from "./api/index.js";
import env from "./config/env.js";
import { dbConnectionLog } from "./infra/postgres/index.js";

const PORT = env.serverConfig.PORT;
const startServer = async () => {
  await dbConnectionLog();
  app.listen(PORT, () => {
    console.log(`server is running on PORT : ${PORT}`);
  });
};

startServer();
