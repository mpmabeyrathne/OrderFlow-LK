import { z } from "zod";

export const cartProductParamsSchema = z.object({
  productId: z.uuid("Product ID must be a valid UUID"),
});
export const setCartItemSchema = z.strictObject({
  quantity: z.number().int().min(1).max(100, "Maximum 100 units per item"),
});
export const checkoutSchema = z.strictObject({});
