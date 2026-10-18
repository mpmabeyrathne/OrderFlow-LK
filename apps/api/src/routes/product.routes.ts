
import { Router } from "express";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import {
    createProductSchema,
    getProductByIdSchema,
    updateProductSchema,
} from "../validators/product.validator.js";
import productController from "../controllers/product.controller.js";

const router = Router();

router.post(
    "/",
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
    validateParams(getProductByIdSchema),
    validateBody(updateProductSchema),
    productController.updateProduct,
);

export default router;
