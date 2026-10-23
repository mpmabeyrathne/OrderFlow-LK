import express, { type Express, Request, Response } from "express";
import env from "./config/env.js";
import logger from "./config/logger.js";
import loggerMiddleware from "./middleware/request-logger.js";
import errorHandler from "./middleware/error-handler.js";
import { db } from "./config/db.js";
import customerRoutes from "./routes/customer.routes.js";
import productsRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import authRoutes from "./routes/auth.routes.js";


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

//register routes
app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productsRoutes);
app.use("/orders", orderRoutes);

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


