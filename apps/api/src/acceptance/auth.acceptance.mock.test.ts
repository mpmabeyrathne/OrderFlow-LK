import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Keep the real HTTP routes, controllers, middleware, token signing and password hashing.
// Replace persistence with in-memory fake repositories/services: no PostgreSQL or TEST_DB_URL.
const state = vi.hoisted(() => {
  type Account = { id: string; email: string; passwordHash: string;
    role: "customer" | "admin" | "manager"; customerId: string | null };
  type Order = { id: string; customerId: string; status: string };
  return {
    byEmail: new Map<string, Account>(),
    byId: new Map<string, Account>(),
    orders: new Map<string, Order>(),
    stock: 30,
  };
});

vi.mock("../repositories/auth.repository.js", () => ({
  default: {
    findByEmail: vi.fn(async (email: string) => state.byEmail.get(email) ?? null),
    findById: vi.fn(async (id: string) => state.byId.get(id) ?? null),
    register: vi.fn(async ({ email, passwordHash }: { name: string; email: string; passwordHash: string }) => {
      if (state.byEmail.has(email)) {
        const conflict = Object.assign(new Error("Duplicate email"), { code: "23505" });
        throw conflict;
      }
      const account = { id: randomUUID(), email, passwordHash,
        role: "customer" as const, customerId: randomUUID() };
      state.byEmail.set(email, account);
      state.byId.set(account.id, account);
      return { id: account.id, email, role: account.role, customerId: account.customerId };
    }),
  },
}));

vi.mock("../services/product.service.js", () => ({
  default: {
    createProduct: vi.fn(async () => ({ id: randomUUID() })),
    getProducts: vi.fn(async () => []),
    getProductById: vi.fn(async () => ({ id: productId })),
    updateProduct: vi.fn(async (id: string, data: object) => ({ id, ...data })),
    updateStock: vi.fn(async (id: string, stockQuantity: number, expectedStockQuantity: number) => {
      if (state.stock !== expectedStockQuantity) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(409, "Stock has changed");
      }
      state.stock = stockQuantity;
      return { id, stockQuantity };
    }),
  },
}));

vi.mock("../services/order.service.js", () => ({
  default: {
    createOrder: vi.fn(async ({ customerId }: { customerId: string }) => {
      const order = { id: randomUUID(), customerId, status: "pending" };
      state.orders.set(order.id, order);
      return order;
    }),
    getOrders: vi.fn(async (customerId?: string) =>
      [...state.orders.values()].filter(o => !customerId || o.customerId === customerId)),
    getOrderById: vi.fn(async (id: string, customerId?: string) => {
      const order = state.orders.get(id);
      if (!order || (customerId && customerId !== order.customerId)) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(404, "Order not found");
      }
      return order;
    }),
    updateStatus: vi.fn(async (id: string, status: string) => {
      const order = state.orders.get(id);
      if (!order) return null;
      order.status = status;
      return order;
    }),
  },
}));

import { app } from "../app.js";
import { hashPassword } from "../services/password.service.js";

type Json = Record<string, unknown>;
type Result = { status: number; data: Json };
type Customer = { id: string; customerId: string; email: string; token: string };
const password = "Long-Safe-Example-Passphrase-2026";
const productId = "4a8993b8-aa6c-4f78-b56b-a8da3034425d";
let server: Server;
let baseUrl = "";
let owner: Customer;
let another: Customer;
let foreignOrderId = "";
let adminToken = "";
let managerToken = "";

async function request(method: string, path: string, body?: unknown, token?: string): Promise<Result> {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() as Json };
}

async function signup(label: string): Promise<Customer> {
  const email = `acceptance-${randomUUID()}@example.com`;
  const response = await request("POST", "/auth/register", { name: label, email, password });
  expect(response.status).toBe(201);
  const data = response.data.data as { user: { id: string; customerId: string }; accessToken: string };
  return { id: data.user.id, customerId: data.user.customerId, token: data.accessToken, email };
}

async function staff(role: "admin" | "manager"): Promise<string> {
  const account = {
    id: randomUUID(), email: `${role}-${randomUUID()}@example.com`,
    passwordHash: await hashPassword(password), role, customerId: null,
  };
  state.byEmail.set(account.email, account);
  state.byId.set(account.id, account);
  const result = await request("POST", "/auth/login", { email: account.email, password });
  expect(result.status).toBe(200);
  return (result.data.data as { accessToken: string }).accessToken;
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    if (server.listening) return resolve();
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  owner = await signup("Owner A");
  another = await signup("Owner B");
  adminToken = await staff("admin");
  managerToken = await staff("manager");
  foreignOrderId = randomUUID();
  state.orders.set(foreignOrderId, { id: foreignOrderId, customerId: another.customerId, status: "pending" });
}, 30000);

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve()));
  state.byEmail.clear();
  state.byId.clear();
  state.orders.clear();
}, 30000);

describe("Auth acceptance (HTTP with in-memory persistence)", () => {
  it("1. new customer registration -> 201", async () => {
    const user = await signup("New Customer");
    expect(user.token).toEqual(expect.any(String));
  });

  it("2. duplicate email -> 409", async () => {
    const res = await request("POST", "/auth/register",
      { name: "Duplicate", email: owner.email, password });
    expect(res.status).toBe(409);
  });

  it("3. login with correct credentials -> 200", async () => {
    const res = await request("POST", "/auth/login", { email: owner.email, password });
    expect(res.status).toBe(200);
    expect((res.data.data as Json).accessToken).toEqual(expect.any(String));
  });

  it("4. incorrect password -> 401", async () => {
    const res = await request("POST", "/auth/login",
      { email: owner.email, password: "DefinitelyWrongPassword" });
    expect(res.status).toBe(401);
  });

  it("5. GET /auth/me without token -> 401", async () => {
    expect((await request("GET", "/auth/me")).status).toBe(401);
  });

  it("6. GET /auth/me with valid token -> 200", async () => {
    const res = await request("GET", "/auth/me", undefined, owner.token);
    expect(res.status).toBe(200);
    expect((res.data.data as Json).userId).toBe(owner.id);
  });

  it("7. customer cannot update stock -> 403", async () => {
    const res = await request("PATCH", `/products/${productId}/stock`,
      { stockQuantity: 99, expectedStockQuantity: 30 }, owner.token);
    expect(res.status).toBe(403);
    expect(state.stock).toBe(30);
  });

  it("8. customer cannot see another customer's order -> 404", async () => {
    const res = await request("GET", `/orders/${foreignOrderId}`, undefined, owner.token);
    expect(res.status).toBe(404);
  });

  it("9. customer cannot create order for another customer -> 403", async () => {
    const res = await request("POST", "/orders", {
      customerId: another.customerId, items: [{ productId, quantity: 1 }],
    }, owner.token);
    expect(res.status).toBe(403);
  });

  it.each([
    ["admin", () => adminToken],
    ["manager", () => managerToken],
  ] as const)("10. %s can update product, stock and order status -> 200", async (_role, getToken) => {
    const token = getToken();
    expect((await request("PATCH", `/products/${productId}`, {
      description: "Staff update",
    }, token)).status).toBe(200);
    expect((await request("PATCH", `/products/${productId}/stock`, {
      stockQuantity: 30,
    }, token)).status).toBe(200);
    const res = await request("PATCH", `/orders/${foreignOrderId}/status`,
      { status: "confirmed" }, token);
    expect(res.status).toBe(200);
    expect((res.data.data as Json).status).toBe("confirmed");
  });
});
