
import { z } from "zod";

export const createProductSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Product name is required")
        .max(200, "Product name must be at most 200 characters"),

    description: z.string().trim().optional(),

    price: z
        .string()
        .trim()
        .regex(
            /^\d+(\.\d{1,2})?$/,
            "Price must be a valid monetary amount",
        ),

    stockQuantity: z
        .number()
        .int("Stock quantity must be an integer")
        .min(0, "Stock quantity cannot be negative")
        .default(0),

    isActive: z.boolean().default(true),
});

export const getProductByIdSchema = z.object({
    id: z.uuid("Product ID must be a valid UUID"),
});

export const updateProductSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Product name cannot be empty")
            .max(200, "Product name must be at most 200 characters")
            .optional(),

        description: z.string().trim().optional(),

        price: z
            .string()
            .trim()
            .regex(
                /^\d+(\.\d{1,2})?$/,
                "Price must be a valid monetary amount",
            )
            .optional(),

        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be provided",
    );

export const updateStockSchema = z.object({
    stockQuantity: z
        .number()
        .int("Stock quantity must be an integer")
        .min(0, "Stock quantity cannot be negative"),
});

export type GetProductByIdInput = z.infer<
    typeof getProductByIdSchema
>;

export type UpdateProductInput = z.infer<
    typeof updateProductSchema
>;

export type CreateProductInput = z.infer<
    typeof createProductSchema
>;
