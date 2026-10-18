import { Request, Response } from "express";
import logger from "../config/logger.js";
import productService from "../services/product.service.js";

class productController {
    createProduct = async (req: Request, res: Response) => {
        const { name, description, price, stockQuantity, isActive } = req.body ?? {};

        const product = await productService.createProduct({
            name: name.trim(),
            description,
            price,
            stockQuantity,
            isActive
        })

        logger.info({ customerId: product.id }, "Product created");

        return res.status(201).json({
            success: true,
            data: product,
        });
    }

    getProducts = async (_req: Request, res: Response) => {
        const products = await productService.getProducts();

        return res.status(200).json({
            success: true,
            data: products,
        });
    }

    productFindById = async (_req: Request, res: Response) => {
        const { id } = res.locals.validatedParams;

        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

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

    }

    updateProduct = async (req: Request, res: Response) => {
        const data = req.body;
        const { id } = res.locals.validatedParams;

        const prodcut = await productService.updateProduct(id, data);

        logger.info({ prodcutId: prodcut.id }, "Product Updated");

        return res.status(200).json({
            success: true,
            data: prodcut,
        });
    }
}

export default new productController();