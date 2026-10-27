import { describe, it, expect } from "vitest";
import { cartProductParamsSchema, setCartItemSchema, checkoutSchema } from "./cart.validator.js";

describe("cart request validation", () => {
  it("accepts valid positive quantities", () => {
    expect(setCartItemSchema.parse({ quantity: 2 })).toEqual({ quantity: 2 });
  });
  it.each([0, -1, 1.5, 101, "2", null])("rejects invalid quantity %s", (quantity) => {
    expect(setCartItemSchema.safeParse({ quantity }).success).toBe(false);
  });
  it("rejects unknown fields in cart mutation", () => {
    expect(setCartItemSchema.safeParse({ quantity: 1, userId: "someone-else" }).success).toBe(false);
  });
  it("rejects checkout body parameters attempting to select customer", () => {
    expect(checkoutSchema.safeParse({ customerId: "someone-else" }).success).toBe(false);
  });
  it("checks product UUID", () => {
    expect(cartProductParamsSchema.safeParse({ productId: "bad-id" }).success).toBe(false);
    expect(cartProductParamsSchema.safeParse({ productId: "4a8993b8-aa6c-4f78-b56b-a8da3034425d" }).success).toBe(true);
  });
});
