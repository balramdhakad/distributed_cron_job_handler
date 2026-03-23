import app from "./api/index.js";
import env from "./config/env.js";
import { closeDb, dbConnectionLog } from "./infra/postgres/index.js";
import { redis } from "./infra/redis/index.js";
import { registerAllHandlers } from "./jobs/handlers/index.js";
import { logger } from "./infra/logger.js";

const PORT = env.serverConfig.PORT;

const startServer = async () => {
  try {
    await dbConnectionLog();
    await registerAllHandlers();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received shutting down`);

      server.close(async () => {
        try {
          await closeDb();
          await redis.quit();
          logger.info("Shutdown complete");
          process.exit(0);
        } catch (err) {
          logger.error(`Error during shutdown: ${err.message}`);
          process.exit(1);
        }
      });
      setTimeout(() => {
        logger.error("Shutdown timed out — forcing exit");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled Rejection: ${reason instanceof Error ? reason.message : reason}`,
  );
  process.exit(1);
});

startServer();
