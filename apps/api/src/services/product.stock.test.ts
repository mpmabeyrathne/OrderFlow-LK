import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/app-error.js";

const fake = vi.hoisted(() => {
  let stock: number | null = 10;
  return {
    get stock() { return stock; },
    set stock(next: number | null) { stock = next; },
    updateStock: vi.fn(async (_id: string, desired: number, expected: number) => {
      // Simulates PostgreSQL's conditional UPDATE (compare and swap).
      await Promise.resolve();
      if (stock === null || stock !== expected) return null;
      stock = desired;
      return { id: "product", stockQuantity: desired };
    }),
    findById: vi.fn(async () => stock === null ? null : { id: "product", stockQuantity: stock }),
  };
});

vi.mock("../repositories/product.repository.js", () => ({
  default: {
    updateStock: fake.updateStock,
    findById: fake.findById,
  },
}));

import productService from "./product.service.js";

describe("inventory compare-and-swap service", () => {
  beforeEach(() => {
    fake.stock = 10;
    vi.clearAllMocks();
  });

  it("accepts a matching expected quantity", async () => {
    const result = await productService.updateStock("product", 6, 10);
    expect(result.stockQuantity).toBe(6);
    expect(fake.stock).toBe(6);
  });

  it("rejects a stale update and keeps the actual quantity", async () => {
    await expect(productService.updateStock("product", 99, 8))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(fake.stock).toBe(10);
  });

  it("returns 404 if a product no longer exists", async () => {
    fake.stock = null;
    await expect(productService.updateStock("product", 4, 10))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects one of two simultaneous competing updates", async () => {
    const results = await Promise.allSettled([
      productService.updateStock("product", 7, 10),
      productService.updateStock("product", 3, 10),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const rejection = results.find(result => result.status === "rejected");
    expect(rejection?.status).toBe("rejected");
    if (rejection?.status === "rejected") {
      expect(rejection.reason).toMatchObject({ statusCode: 409 });
    }
    expect([7, 3]).toContain(fake.stock);
  });
});
