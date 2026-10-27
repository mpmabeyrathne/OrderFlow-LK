import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProducts: vi.fn(async (filters: Record<string, unknown>) => ({
    data: [{ id: "product-one", name: "Sample" }],
    pagination: { page: filters.page, limit: filters.limit, total: 1, totalPages: 1 },
  })),
  getOrders: vi.fn(async (filters: Record<string, unknown>, owner?: string) => ({
    data: [{ id: "order-one", customerId: owner ?? "staff-visible" }],
    pagination: { page: filters.page, limit: filters.limit, total: 1, totalPages: 1 },
  })),
}));
const ids = vi.hoisted(() => ({ userId: "01fb35a8-e158-4f90-aa2f-5fcb22b1c61b", customerId: "25ea2dc5-72cc-4798-998c-e05249a1fd3c", managerId: "31bc9181-8fc5-4492-a4a7-f52be1e3ed98" }));
const { userId, customerId, managerId } = ids;
vi.mock("../repositories/auth.repository.js", () => ({
  default: {
    findById: vi.fn(async (id: string) =>
      id === ids.userId ? { id, role: "customer", customerId: ids.customerId } :
      id === ids.managerId ? { id, role: "manager", customerId: null } : null),
  },
}));
vi.mock("../services/product.service.js", () => ({
  default: { getProducts: mocks.getProducts },
}));
vi.mock("../services/order.service.js", () => ({
  default: { getOrders: mocks.getOrders },
}));
import { app } from "../app.js";
import { signAccessToken } from "../services/token.service.js";

let server: Server;
let url = "";
const customerToken = signAccessToken({ userId, customerId, role: "customer" });
const managerToken = signAccessToken({ userId: managerId, customerId: null, role: "manager" });
async function get(path: string, token?: string) {
  const response = await fetch(url + path, {
    headers: token ? { authorization: "Bearer " + token } : {},
  });
  return { status: response.status, body: await response.json() as Record<string, unknown> };
}
beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    if (server.listening) return resolve();
    server.once("listening", resolve);
    server.once("error", reject);
  });
  url = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
});
afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve()));
});
describe("paginated list HTTP contract (DB mocked)", () => {
  it("uses product defaults and returns pagination metadata", async () => {
    const result = await get("/products");
    expect(result.status).toBe(200);
    expect(mocks.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc",
    }));
    expect(result.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });
  it("passes validated product search and filters to service", async () => {
    const result = await get("/products?page=2&limit=10&search=desk&isActive=true&sortBy=price&sortOrder=asc&minPrice=5&maxPrice=100");
    expect(result.status).toBe(200);
    expect(mocks.getProducts).toHaveBeenCalledWith(expect.objectContaining({
      page: 2, limit: 10, search: "desk", isActive: "true", sortBy: "price",
      sortOrder: "asc", minPrice: 5, maxPrice: 100,
    }));
  });
  it("rejects invalid/unknown product list params", async () => {
    const res = await get("/products?limit=500");
    expect(res.status).toBe(400);
    expect((await get("/products?sortBy=unexpected")).status).toBe(400);
  });
  it("requires authentication for orders", async () => {
    expect((await get("/orders")).status).toBe(401);
  });
  it("scopes customer orders even with filters", async () => {
    const res = await get("/orders?page=2&limit=3&status=confirmed", customerToken);
    expect(res.status).toBe(200);
    expect(mocks.getOrders).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 3, status: "confirmed" }),
      customerId,
    );
  });
  it("allows manager to view order list without customer scoping", async () => {
    const res = await get("/orders?sortOrder=asc", managerToken);
    expect(res.status).toBe(200);
    expect(mocks.getOrders).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: "asc" }),
      undefined,
    );
  });
  it("rejects invalid order status", async () => {
    expect((await get("/orders?status=deleted", customerToken)).status).toBe(400);
  });
});
