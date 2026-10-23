import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authorize, requireOwnCustomer } from "./auth.js";

const customer = { userId: "u", role: "customer" as const, customerId: "c1" };
function invoke(middleware: ReturnType<typeof authorize>, auth: unknown, id = "c1") {
  const req = { auth, params: { id } } as unknown as Request;
  const next = vi.fn() as unknown as NextFunction;
  middleware(req, {} as Response, next);
  return next;
}
describe("role and owner authorization", () => {
  it("blocks unauthenticated requests", () => {
    const next = invoke(authorize("admin", "manager"), undefined);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
  it("blocks customers from staff actions", () => {
    const next = invoke(authorize("admin", "manager"), customer);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
  it("permits admin and manager roles", () => {
    const next = invoke(authorize("admin", "manager"), { ...customer, role: "manager" });
    expect(next).toHaveBeenCalledWith();
  });
  it("blocks accessing another customer's profile", () => {
    const next = invoke(requireOwnCustomer, customer, "c2");
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
  it("allows owning customer profile", () => {
    const next = invoke(requireOwnCustomer, customer, "c1");
    expect(next).toHaveBeenCalledWith();
  });
});
