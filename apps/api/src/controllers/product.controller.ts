
import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import productService from "../services/product.service.js";
import { productListSchema, parseListQuery } from "../validators/list-query.validator.js";

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
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const filters = parseListQuery(productListSchema, req.query);
            const result = await productService.getProducts(filters);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
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

    updateStock = async (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        try {
          const { id } = res.locals.validatedParams as { id: string };
          const { stockQuantity, expectedStockQuantity } = req.body;
      
          const product = await productService.updateStock(id, stockQuantity, expectedStockQuantity);
      
          res.status(200).json({
            message: "Product stock updated successfully",
            data: product,
          });
        } catch (error: unknown) {
          next(error);
        }
      };
}

export default new ProductController();
