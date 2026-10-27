import express, { type Express, type Request, type Response } from "express";
import loggerMiddleware from "./middleware/request-logger.js";
import errorHandler from "./middleware/error-handler.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";

export const app: Express = express();
app.use(express.json());
app.use(loggerMiddleware);
app.get("/health", (req: Request, res: Response) => {
  res.json({ message: "ok", requestId: req.requestId });
});
app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes);
app.use(errorHandler);
