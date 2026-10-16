import express, { type Express, Request, Response } from "express";
import env from "./config/env.js";
import logger from "./config/logger.js";
import loggerMiddleware from "./middleware/request-logger.js";

const app: Express = express();

const PORT: Number = Number(env.PORT) || 3000;

app.use(loggerMiddleware);

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        message: 'ok'
    })
})

app.listen(PORT, () => {
    logger.info(
        { port: env.PORT, environment: env.NODE_ENV },
        "Server started successfully",
    );
})

