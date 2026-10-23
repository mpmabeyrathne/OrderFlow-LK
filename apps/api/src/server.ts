import env from "./config/env.js";
import logger from "./config/logger.js";
import { db } from "./config/db.js";
import { app } from "./app.js";

async function serverStart() {
  try {
    await db`SELECT version()`;
    logger.info("Database connected successfully");
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, environment: env.NODE_ENV }, "Server started successfully");
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exitCode = 1;
  }
}
void serverStart();
