import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { app } from "../app.js";
import { query, pool } from "../db/index.js";
import { cartItems, customers, orderItems, orders, payments, products, users } from "../db/schema.js";
import { hashPassword } from "../services/password.service.js";
import { signAccessToken } from "../services/token.service.js";

type Json = Record<string, unknown>;
let server: Server | undefined;
let url = "";
const ids = { users: [] as string[], customers: [] as string[], products: [] as string[], orders: [] as string[] };
let owner: { token: string; id: string; customerId: string };
let outsider: { token: string; id: string; customerId: string };
let productId = "";
let orderId = "";

async function api(method: string, path: string, token?: string, body?: unknown) {
  const response = await fetch(url + path, {
    method,
    headers: {
      ...(token ? { authorization: "Bearer " + token } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, json: await response.json() as Json };
}

async function seedCustomer() {
  const email = `release-check-${randomUUID()}@example.com`;
  const [customer] = await query.insert(customers).values({ name: "Release Test", email })
    .returning({ id: customers.id });
  if (!customer) throw new Error("Failed to seed customer");
  ids.customers.push(customer.id);
  const [user] = await query.insert(users).values({
    email, role: "customer", customerId: customer.id,
    passwordHash: await hashPassword("Release-integration-tests-2026"),
  }).returning({ id: users.id });
  if (!user) throw new Error("Failed to seed user");
  ids.users.push(user.id);
  return {
    id: user.id, customerId: customer.id,
    token: signAccessToken({ userId: user.id, customerId: customer.id, role: "customer" }),
  };
}
beforeAll(async () => {
  owner = await seedCustomer();
  outsider = await seedCustomer();
  const [product] = await query.insert(products).values({
    name: "Release Checkout Product", price: "12.50", stockQuantity: 6, isActive: true,
  }).returning({ id: products.id });
  if (!product) throw new Error("Failed to seed product");
  productId = product.id;
  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    if (server!.listening) return resolve();
    server!.once("listening", resolve);
    server!.once("error", reject);
  });
  url = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
}, 60000);

afterAll(async () => {
  try {
    if (ids.orders.length) {
      await query.delete(payments).where(inArray(payments.orderId, ids.orders));
      await query.delete(orderItems).where(inArray(orderItems.orderId, ids.orders));
      await query.delete(orders).where(inArray(orders.id, ids.orders));
    }
    if (ids.users.length) {
      await query.delete(cartItems).where(inArray(cartItems.userId, ids.users));
      await query.delete(users).where(inArray(users.id, ids.users));
    }
    if (ids.customers.length) await query.delete(customers).where(inArray(customers.id, ids.customers));
    if (ids.products.length) await query.delete(products).where(inArray(products.id, ids.products));
  } finally {
    if (server) await new Promise<void>((resolve, reject) =>
      server!.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
}, 60000);

describe("Cart checkout & simulated payments (real PostgreSQL)", () => {
  it("persists a cart, checks out once, reduces stock and creates order items", async () => {
    expect((await api("PUT", `/cart/items/${productId}`, owner.token, { quantity: 2 })).status).toBe(200);
    expect((await api("GET", "/cart", outsider.token)).json.data).toEqual([]);

    const checkout = await api("POST", "/cart/checkout", owner.token, {});
    expect(checkout.status).toBe(201);
    const order = checkout.json.data as { id: string; totalAmount: string; customerId: string };
    orderId = order.id;
    ids.orders.push(orderId);
    expect(order.customerId).toBe(owner.customerId);
    expect(order.totalAmount).toBe("25.00");
    const [dbProduct] = await query.select().from(products).where(eq(products.id, productId));
    expect(dbProduct?.stockQuantity).toBe(4);
    const savedItems = await query.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0]?.quantity).toBe(2);
    expect((await api("GET", "/cart", owner.token)).json.data).toEqual([]);
    expect((await api("POST", "/cart/checkout", owner.token, {})).status).toBe(400);
    const ownOrders = await api("GET", "/orders?page=1&limit=10", owner.token);
    expect(ownOrders.status).toBe(200);
    expect((ownOrders.json.pagination as { total: number }).total).toBeGreaterThanOrEqual(1);
    const foreignOrders = await api("GET", "/orders", outsider.token);
    expect(foreignOrders.status).toBe(200);
    expect((foreignOrders.json.data as Array<{ id: string }>).some(o => o.id === orderId)).toBe(false);
  });

  it("prevents another customer from reading or simulating a payment", async () => {
    expect((await api("GET", `/payments/orders/${orderId}`, outsider.token)).status).toBe(404);
    expect((await api("POST", `/payments/orders/${orderId}/simulate`,
      outsider.token, { outcome: "success" })).status).toBe(404);
  });

  it("persists one payment, replays matching outcomes and rejects conflicting outcomes", async () => {
    const first = await api("POST", `/payments/orders/${orderId}/simulate`,
      owner.token, { outcome: "success" });
    expect(first.status).toBe(201);
    expect((first.json.data as { status: string; amount: string }).status).toBe("succeeded");
    expect((first.json.data as { amount: string }).amount).toBe("25.00");

    const replay = await api("POST", `/payments/orders/${orderId}/simulate`,
      owner.token, { outcome: "success" });
    expect(replay.status).toBe(200);
    expect(replay.json.replayed).toBe(true);
    expect((await api("POST", `/payments/orders/${orderId}/simulate`,
      owner.token, { outcome: "failure" })).status).toBe(409);

    const stored = await query.select().from(payments).where(eq(payments.orderId, orderId));
    expect(stored).toHaveLength(1);
    const fetched = await api("GET", `/payments/orders/${orderId}`, owner.token);
    expect(fetched.status).toBe(200);
  });

  it("prevents stock restoration by cancelling a successfully paid order", async () => {
    const result = await api("PATCH", `/orders/${orderId}/status`,
      undefined, { status: "cancelled" });
    // Only staff may update fulfillment status.
    expect(result.status).toBe(401);
    const [current] = await query.select().from(orders).where(eq(orders.id, orderId));
    expect(current?.status).not.toBe("cancelled");
  });

  it("rolls back failed checkout without removing cart items", async () => {
    expect((await api("PUT", `/cart/items/${productId}`, owner.token, { quantity: 4 })).status).toBe(200);
    await query.update(products).set({ stockQuantity: 1 }).where(eq(products.id, productId));
    const failed = await api("POST", "/cart/checkout", owner.token, {});
    expect(failed.status).toBe(409);
    const [stock] = await query.select().from(products).where(eq(products.id, productId));
    expect(stock?.stockQuantity).toBe(1);
    const cart = await api("GET", "/cart", owner.token);
    expect(cart.status).toBe(200);
    expect((cart.json.data as Array<{ quantity: number }>)[0]?.quantity).toBe(4);
    const savedOrders = await query.select().from(orders).where(eq(orders.customerId, owner.customerId));
    expect(savedOrders).toHaveLength(1);
  });
});
