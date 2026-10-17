
import { Router } from "express";
import customerController from "../controllers/customer.controller.js";
import { validateBody } from "../middleware/validate-body.js";
import { createCustomerSchema, getCustomerByIdSchema } from "../validators/customer.validator.js";
import { validateParams } from "../middleware/validate-params.js";

const router = Router();

router.post("/", validateBody(createCustomerSchema), customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", validateParams(getCustomerByIdSchema), customerController.getCustomerById);

export default router;
