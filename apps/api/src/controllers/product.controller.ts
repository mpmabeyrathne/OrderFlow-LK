
import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import productService from "../services/product.service.js";

class ProductController {
    createProduct = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const product = await productService.createProduct(req.body);

            logger.info({ productId: product.id }, "Product created");

            return res.status(201).json({
                success: true,
                data: product,
            });
        } catch (error) {
            return next(error);
        }
    };

    getProducts = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const products = await productService.getProducts();

            return res.status(200).json({
                success: true,
                data: products,
            });
        } catch (error) {
            return next(error);
        }
    };

    productFindById = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { id } = res.locals.validatedParams as { id: string };

            const product = await productService.getProductById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error) {
            return next(error);
        }
    };

    updateProduct = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { id } = res.locals.validatedParams as { id: string };

            const product = await productService.updateProduct(id, req.body);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            logger.info({ productId: product.id }, "Product updated");

            return res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error) {
            return next(error);
        }
    };
}

export default new ProductController();
