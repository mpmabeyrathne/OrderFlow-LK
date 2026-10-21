import { z } from "zod";

export const createOrderSchema = z.object({
    customerId: z.uuid("Customer ID must be a valid UUID"),

    items: z
        .array(
            z.object({
                productId: z.uuid("Product ID must be a valid UUID"),
                quantity: z
                    .number()
                    .int("Quantity must be an integer")
                    .positive("Quantity must be greater than zero"),
            })
        )
        .min(1, "At least one order item is required"),
}).refine(
    (data) =>
        new Set(data.items.map((item) => item.productId)).size ===
        data.items.length,
    "Duplicate products are not allowed",
);

export const getOrderByIdSchema = z.object({
    id: z.uuid("Order ID must be a valid UUID"),
});


export type CreateOrderInput = z.infer<typeof createOrderSchema>;

