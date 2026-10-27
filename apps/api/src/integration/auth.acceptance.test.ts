import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { inArray, eq } from "drizzle-orm";
import { app } from "../app.js";
import { query, pool } from "../db/index.js";
import { customers, users, products, orders } from "../db/schema.js";
import { hashPassword } from "../services/password.service.js";

type JsonObject = Record<string, unknown>;
type ApiResult = { status: number; body: JsonObject };
const password = "Long-Safe-Example-Passphrase-2026";
const ids = { customers: [] as string[], users: [] as string[], products: [] as string[], orders: [] as string[] };
const uniqueEmail = (label: string) => `acceptance-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID()}@example.com`;
let server: Server;
let baseUrl: string;
let customerA: { id: string; customerId: string; token: string; email: string };
let customerB: { id: string; customerId: string; token: string; email: string };
let adminToken = "";
let managerToken = "";
let productId = "";
let foreignOrderId = "";

async function api(method: string, path: string, body?: unknown, token?: string): Promise<ApiResult> {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json: unknown = await response.json();
  return { status: response.status, body: json as JsonObject };
}

async function register(label: string) {
  const email = uniqueEmail(label);
  const response = await api("POST", "/auth/register", { name: label, email, password });
  expect(response.status).toBe(201);
  const data = response.body.data as {
    user: { id: string; customerId: string; email: string };
    accessToken: string;
  };
  ids.users.push(data.user.id);
  ids.customers.push(data.user.customerId);
  return { id: data.user.id, customerId: data.user.customerId, email, token: data.accessToken };
}

async function makeStaff(role: "admin" | "manager"): Promise<string> {
  const email = uniqueEmail(role);
  const [account] = await query.insert(users).values({
    email, role, passwordHash: await hashPassword(password), customerId: null,
  }).returning({ id: users.id });
  if (!account) throw new Error("Could not seed staff account");
  ids.users.push(account.id);
  const login = await api("POST", "/auth/login", { email, password });
  expect(login.status).toBe(200);
  return (login.body.data as { accessToken: string }).accessToken;
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    if (server.listening) return resolve();
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;

  customerA = await register("Owner A");
  customerB = await register("Owner B");
  adminToken = await makeStaff("admin");
  managerToken = await makeStaff("manager");

  const [product] = await query.insert(products).values({
    name: "Acceptance Product", price: "20.00", stockQuantity: 30, isActive: true,
  }).returning({ id: products.id });
  if (!product) throw new Error("Could not seed product");
  productId = product.id;
  ids.products.push(productId);

  const [order] = await query.insert(orders).values({
    customerId: customerB.customerId, totalAmount: "0.00",
  }).returning({ id: orders.id });
  if (!order) throw new Error("Could not seed foreign order");
  foreignOrderId = order.id;
  ids.orders.push(foreignOrderId);
}, 60000);

afterAll(async () => {
  try {
    if (ids.orders.length) await query.delete(orders).where(inArray(orders.id, ids.orders));
    if (ids.users.length) await query.delete(users).where(inArray(users.id, ids.users));
    if (ids.customers.length) await query.delete(customers).where(inArray(customers.id, ids.customers));
    if (ids.products.length) await query.delete(products).where(inArray(products.id, ids.products));
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    await pool.end();
  }
}, 60000);

describe("Authentication acceptance tests (HTTP + PostgreSQL)", () => {
  it("1. registers a new customer -> 201", async () => {
    const result = await register("New Customer");
    expect(result.token).toEqual(expect.any(String));
    expect(result.customerId).toEqual(expect.any(String));
  });

  it("2. rejects a duplicate email -> 409", async () => {
    const response = await api("POST", "/auth/register", {
      name: "Duplicate", email: customerA.email, password,
    });
    expect(response.status).toBe(409);
  });

  it("3. logs in with correct credentials -> 200", async () => {
    const response = await api("POST", "/auth/login", { email: customerA.email, password });
    expect(response.status).toBe(200);
    expect((response.body.data as JsonObject).accessToken).toEqual(expect.any(String));
  });

  it("4. rejects wrong password -> 401", async () => {
    const response = await api("POST", "/auth/login", {
      email: customerA.email, password: "IncorrectPassphrase2026",
    });
    expect(response.status).toBe(401);
  });

  it("5. refuses GET /auth/me without token -> 401", async () => {
    const response = await api("GET", "/auth/me");
    expect(response.status).toBe(401);
  });

  it("6. permits GET /auth/me with valid token -> 200", async () => {
    const response = await api("GET", "/auth/me", undefined, customerA.token);
    expect(response.status).toBe(200);
    expect((response.body.data as JsonObject).userId).toBe(customerA.id);
  });

  it("7. rejects customer stock changes -> 403", async () => {
    const response = await api("PATCH", `/products/${productId}/stock`,
      { stockQuantity: 99 }, customerA.token);
    expect(response.status).toBe(403);
    const [row] = await query.select({ stockQuantity: products.stockQuantity })
      .from(products).where(eq(products.id, productId));
    expect(row?.stockQuantity).toBe(30);
  });

  it("8. hides another customer's order -> 404", async () => {
    const response = await api("GET", `/orders/${foreignOrderId}`, undefined, customerA.token);
    expect(response.status).toBe(404);
  });

  it("9. rejects order creation for another customer -> 403", async () => {
    const response = await api("POST", "/orders", {
      customerId: customerB.customerId, items: [{ productId, quantity: 1 }],
    }, customerA.token);
    expect(response.status).toBe(403);
  });

  it.each([
    ["admin", () => adminToken],
    ["manager", () => managerToken],
  ] as const)("10. %s can update products and order status -> 200", async (_role, tokenForRole) => {
    const token = tokenForRole();
    const product = await api("PATCH", `/products/${productId}`, {
      description: "Updated during staff authorization test",
    }, token);
    expect(product.status).toBe(200);
    const stock = await api("PATCH", `/products/${productId}/stock`, { stockQuantity: 30, expectedStockQuantity: 30 }, token);
    expect(stock.status).toBe(200);
    const status = await api("PATCH", `/orders/${foreignOrderId}/status`,
      { status: "confirmed" }, token);
    expect(status.status).toBe(200);
    expect((status.body.data as JsonObject).status).toBe("confirmed");
  });
});
