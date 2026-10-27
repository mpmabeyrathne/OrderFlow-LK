import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import { paymentOrderParamsSchema, simulatePaymentSchema } from "../validators/payment.validator.js";
import controller from "../controllers/payment.controller.js";

const router = Router();
router.use(authenticate, authorize("customer"));
router.get("/orders/:orderId", validateParams(paymentOrderParamsSchema), controller.get);
router.post("/orders/:orderId/simulate",
  validateParams(paymentOrderParamsSchema), validateBody(simulatePaymentSchema),
  controller.simulate);
export default router;
