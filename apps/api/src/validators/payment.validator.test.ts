import { describe, it, expect } from "vitest";
import { simulatePaymentSchema, paymentOrderParamsSchema } from "./payment.validator.js";
describe("simulated payment validation", () => {
  it.each(["success","failure"])("accepts %s", outcome =>
    expect(simulatePaymentSchema.safeParse({ outcome }).success).toBe(true));
  it.each(["pending", "paid", null, 1])("rejects invalid outcome %s", outcome =>
    expect(simulatePaymentSchema.safeParse({ outcome }).success).toBe(false));
  it("rejects client-controlled amount and other unknown fields", () =>
    expect(simulatePaymentSchema.safeParse({ outcome: "success", amount: "0.01" }).success).toBe(false));
  it("requires UUID order id", () =>
    expect(paymentOrderParamsSchema.safeParse({ orderId: "not-uuid" }).success).toBe(false));
});
