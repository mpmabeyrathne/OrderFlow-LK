import { Router } from "express";
import cartController from "../controllers/cart.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import { cartProductParamsSchema, setCartItemSchema, checkoutSchema } from "../validators/cart.validator.js";

const router = Router();
router.use(authenticate, authorize("customer"));
router.get("/", cartController.list);
router.put("/items/:productId", validateParams(cartProductParamsSchema),
  validateBody(setCartItemSchema), cartController.setItem);
router.delete("/items/:productId", validateParams(cartProductParamsSchema), cartController.removeItem);
router.post("/checkout", validateBody(checkoutSchema), cartController.checkout);
export default router;
