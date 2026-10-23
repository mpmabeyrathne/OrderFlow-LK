import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const state = vi.hoisted(() => ({
  items: new Map<string, Map<string, number>>(),
  orders: [] as { id: string; customerId: string; totalAmount: string }[],
  stock: 10,
  price: "12.50",
  productId: "4a8993b8-aa6c-4f78-b56b-a8da3034425d",
  userId: "cab13953-678f-4e75-94bf-8f54ae5d8771",
  customerId: "85d080e2-697a-412e-bfca-ed9fbecda457",
  staffId: "b6e52c9c-75c1-482b-93f1-bc6002a004cf",
}));
vi.mock("../repositories/auth.repository.js", () => ({
  default: {
    findById: vi.fn(async (id: string) => {
      if (id === state.userId) return { id, role: "customer", customerId: state.customerId };
      if (id === state.staffId) return { id, role: "manager", customerId: null };
      return null;
    }),
  },
}));
vi.mock("../repositories/cart.repository.js", () => ({
  default: {
    list: vi.fn(async (userId: string) =>
      [...(state.items.get(userId) ?? new Map<string, number>()).entries()]
        .map(([productId, quantity]) => ({ productId, quantity, name: "Product",
          price: state.price, stockQuantity: state.stock, isActive: true }))),
    setItem: vi.fn(async (userId: string, productId: string, quantity: number) => {
      if (productId !== state.productId) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(404, "Product not available");
      }
      if (state.stock < quantity) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(409, "Insufficient stock");
      }
      const current = state.items.get(userId) ?? new Map<string, number>();
      current.set(productId, quantity);
      state.items.set(userId, current);
      return { userId, productId, quantity };
    }),
    removeItem: vi.fn(async (userId: string, productId: string) => {
      const removed = state.items.get(userId)?.delete(productId) ?? false;
      return removed ? { productId } : null;
    }),
    checkout: vi.fn(async (userId: string, customerId: string) => {
      const entries = [...(state.items.get(userId) ?? new Map()).entries()];
      if (!entries.length) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(400, "Cart is empty");
      }
      const totalQty = entries.reduce((sum, [, qty]) => sum + qty, 0);
      if (totalQty > state.stock) {
        const { AppError } = await import("../utils/app-error.js");
        throw new AppError(409, "Insufficient stock");
      }
      state.stock -= totalQty;
      state.items.set(userId, new Map());
      const order = { id: randomUUID(), customerId,
        totalAmount: (totalQty * 12.5).toFixed(2),
        items: entries.map(([productId, quantity]) => ({ productId, quantity, unitPrice: state.price })) };
      state.orders.push(order);
      return order;
    }),
  },
}));
import { app } from "../app.js";
import { signAccessToken } from "../services/token.service.js";

let server: Server;
let url: string;
const customerToken = signAccessToken({ userId: state.userId, role: "customer", customerId: state.customerId });
const staffToken = signAccessToken({ userId: state.staffId, role: "manager", customerId: null });

async function api(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(url + path, {
    method,
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: "Bearer " + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, json: await response.json() as Record<string, unknown> };
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

describe("Cart HTTP acceptance (mocked database)", () => {
  it("requires authentication", async () => {
    expect((await api("GET", "/cart")).status).toBe(401);
  });
  it("blocks staff accounts", async () => {
    expect((await api("GET", "/cart", undefined, staffToken)).status).toBe(403);
  });
  it("starts with an empty cart", async () => {
    const res = await api("GET", "/cart", undefined, customerToken);
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual([]);
  });
  it("rejects invalid quantity", async () => {
    expect((await api("PUT", "/cart/items/" + state.productId,
      { quantity: -1 }, customerToken)).status).toBe(400);
  });
  it("adds and lists a cart item", async () => {
    expect((await api("PUT", "/cart/items/" + state.productId,
      { quantity: 2 }, customerToken)).status).toBe(200);
    const res = await api("GET", "/cart", undefined, customerToken);
    expect((res.json.data as unknown[])).toHaveLength(1);
  });
  it("changes an existing item quantity", async () => {
    const res = await api("PUT", "/cart/items/" + state.productId,
      { quantity: 3 }, customerToken);
    expect(res.status).toBe(200);
    expect((res.json.data as { quantity: number }).quantity).toBe(3);
  });
  it("rejects requests exceeding currently available stock", async () => {
    const res = await api("PUT", "/cart/items/" + state.productId,
      { quantity: 11 }, customerToken);
    expect(res.status).toBe(409);
  });
  it("removes an item and allows adding it again", async () => {
    expect((await api("DELETE", "/cart/items/" + state.productId,
      undefined, customerToken)).status).toBe(200);
    expect((await api("GET", "/cart", undefined, customerToken)).json.data).toEqual([]);
    expect((await api("PUT", "/cart/items/" + state.productId,
      { quantity: 2 }, customerToken)).status).toBe(200);
  });
  it("rejects checkout customerId injection", async () => {
    expect((await api("POST", "/cart/checkout",
      { customerId: randomUUID() }, customerToken)).status).toBe(400);
  });
  it("creates order for current user and clears cart", async () => {
    const result = await api("POST", "/cart/checkout", {}, customerToken);
    expect(result.status).toBe(201);
    expect((result.json.data as { customerId: string }).customerId).toBe(state.customerId);
    expect(state.stock).toBe(8);
    expect((await api("GET", "/cart", undefined, customerToken)).json.data).toEqual([]);
  });
  it("refuses repeat checkout of empty cart", async () => {
    expect((await api("POST", "/cart/checkout", {}, customerToken)).status).toBe(400);
    expect(state.orders).toHaveLength(1);
  });
});
