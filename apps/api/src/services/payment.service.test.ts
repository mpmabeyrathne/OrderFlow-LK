import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
const mock = vi.hoisted(() => ({
  simulate: vi.fn(async (id: string, customerId: string, outcome: "success" | "failure") =>
    ({ payment: { orderId: id, customerId, status: outcome }, created: true })),
  get: vi.fn(async (id: string) => ({ orderId: id, status: "succeeded" })),
}));
vi.mock("../repositories/payment.repository.js", () => ({ default: mock }));
import paymentService from "./payment.service.js";
const customerId = randomUUID(), userId = randomUUID(), orderId = randomUUID();
const customer = { role: "customer" as const, customerId, userId };
describe("payment ownership and service", () => {
  it("uses JWT owner, never a request-provided customer ID", async () => {
    const result = await paymentService.simulate(customer, orderId, "success");
    expect(result.created).toBe(true);
    expect(mock.simulate).toHaveBeenCalledWith(orderId, customerId, "success");
  });
  it("reads payments scoped to JWT owner", async () => {
    await paymentService.get(customer, orderId);
    expect(mock.get).toHaveBeenCalledWith(orderId, customerId);
  });
  it("rejects staff callers", async () => {
    await expect(paymentService.simulate({ role: "admin", userId: randomUUID(), customerId: null }, orderId, "success"))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});
