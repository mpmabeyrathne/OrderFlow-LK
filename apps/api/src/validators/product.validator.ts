import { z } from "zod";

export const createProductSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Product name is required")
        .max(200, "Product name must be at most 200 characters"),

    description: z
        .string()
        .trim()
        .optional(),

    price: z
        .string()
        .trim()
        .min(1, "Price is required")
        .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid monetary amount")
        .refine((value) => Number(value) >= 0, "Price must be non-negative"),

    stockQuantity: z
        .number()
        .int("Stock quantity must be an integer")
        .min(0, "Stock quantity cannot be negative")
        .default(0),

    isActive: z.boolean().default(true),
});

export const getProductByIdSchema = z.object({
    id: z
    .string()
    .pipe(z.uuid("Customer ID must be a valid UUID")),
})

export const updateProductSchema = z.object({
    name: z
        .string()
        .trim()
        .max(200, "Product name must be at most 200 characters")
        .optional(),

    description: z
        .string()
        .trim()
        .optional(),

    price: z
        .string()
        .trim()
        .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid monetary amount")
        .refine((value) => Number(value) >= 0, "Price must be non-negative")
        .optional(),

    isActive: z.boolean().default(true).optional(),
});

export type GetProductByIdSchema = z.infer<
    typeof getProductByIdSchema
>;

export type UpdateProductSchema = z.infer<
    typeof updateProductSchema
>;

export type CreateProductInput = z.infer<
    typeof createProductSchema
>;