
import { Router } from "express";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import {
    createProductSchema,
    getProductByIdSchema,
    updateProductSchema,
    updateStockSchema,
} from "../validators/product.validator.js";
import productController from "../controllers/product.controller.js";

import { authenticate, authorize } from "../middleware/auth.js";
const router = Router();

router.post(
    "/",
    authenticate,
    authorize("admin", "manager"),
    validateBody(createProductSchema),
    productController.createProduct,
);

router.get("/", productController.getProducts);

router.get(
    "/:id",
    validateParams(getProductByIdSchema),
    productController.productFindById,
);

router.patch(
    "/:id",
    authenticate,
    authorize("admin", "manager"),
    validateParams(getProductByIdSchema),
    validateBody(updateProductSchema),
    productController.updateProduct,
);

router.patch(
    "/:id/stock",
    authenticate,
    authorize("admin", "manager"),
    validateParams(getProductByIdSchema),
    validateBody(updateStockSchema),
    productController.updateStock,
  );

export default router;
