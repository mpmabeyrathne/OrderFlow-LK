
import { Router } from "express";
import customerController from "../controllers/customer.controller.js";

const router = Router();

router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);

export default router;
