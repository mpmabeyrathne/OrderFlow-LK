
import { Router } from "express";
import customerController from "../controllers/customer.controller.js";
import { validateBody } from "../middleware/validate-body.js";
import { createCustomerSchema, getCustomerByIdSchema } from "../validators/customer.validator.js";
import { validateParams } from "../middleware/validate-params.js";

import { authenticate, authorize, requireOwnCustomer } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);

router.post("/", authorize("admin", "manager"), validateBody(createCustomerSchema), customerController.createCustomer);
router.get("/", authorize("admin", "manager"), customerController.getCustomers);
router.get("/:id", validateParams(getCustomerByIdSchema), requireOwnCustomer, customerController.getCustomerById);

export default router;
