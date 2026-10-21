import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import { validateBody } from "../middleware/validate-body.js";
import { createOrderSchema, getOrderByIdSchema, updateOrderStatusBodySchema, updateOrderStatusParamsSchema } from "../validators/order.validator.js";
import { validateParams } from "../middleware/validate-params.js";

const router = Router();

router.post(
  "/",
  validateBody(createOrderSchema),
  orderController.createOrder,
);

router.get("/", orderController.getOrders);

router.get(
  "/:id",
  validateParams(getOrderByIdSchema),
  orderController.getOrderById,
);

router.patch(
  "/:id/status",
  validateParams(updateOrderStatusParamsSchema),
  validateBody(updateOrderStatusBodySchema),
  orderController.updateStatus,
);

export default router;