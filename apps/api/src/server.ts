import express, { type Express, Request, Response } from "express";
import env from "./config/env.js";
import logger from "./config/logger.js";
import loggerMiddleware from "./middleware/request-logger.js";
import errorHandler from "./middleware/error-handler.js";
import { db } from "./config/db.js";
import customerRoutes from "./routes/customer.routes.js";

const app: Express = express();
const PORT: Number = Number(env.PORT);

app.use(express.json());

//middlewares
app.use(loggerMiddleware);


app.get('/health', (req: Request, res: Response) => {
    res.json({
        message: 'ok',
        requestId: req.requestId,
    })
})

app.get("/test-error", (_req, _res, next) => {
    next(new Error("Test error"));
});

//register routes
app.use("/customers", customerRoutes);

// error handler should define after routes
app.use(errorHandler);

async function serverStart() {
    try {
        await db`SELECT version()`;

        logger.info(
            "Database connected successfully",
        );

        app.listen(PORT, () => {
            logger.info(
                { port: env.PORT, environment: env.NODE_ENV },
                "Server started successfully",
            );
        })
    } catch (error) {
        logger.fatal({ err: error }, "Failed to start server");
        process.exit(1);
    }

}

serverStart();


