
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { query, pool } from "../db/index.js";
import {
  customers,
  products,
  orders,
  orderItems,
} from "../db/schema.js";
import orderRepository from "./order.repository.js";

describe("OrderRepository.createOrder transaction", () => {
  let customerId: string | undefined;
  let productId: string | undefined;

  afterEach(async () => {
    // Clean up test records, even if an assertion fails.
    if (customerId) {
      await query
        .delete(orders)
        .where(eq(orders.customerId, customerId));
    }

    if (productId) {
      await query
        .delete(products)
        .where(eq(products.id, productId));
    }

    if (customerId) {
      await query
        .delete(customers)
        .where(eq(customers.id, customerId));
    }

    customerId = undefined;
    productId = undefined;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("rolls back stock and order when inserting order items fails", async () => {
    // Arrange: create isolated test data.
    const [customer] = await query
      .insert(customers)
      .values({
        name: "Transaction Test Customer",
        email: `transaction-${randomUUID()}@example.com`,
      })
      .returning();

    if (!customer) {
      throw new Error("Failed to create test customer");
    }

    customerId = customer.id;

    const [product] = await query
      .insert(products)
      .values({
        name: "Transaction Test Product",
        price: "100.00",
        stockQuantity: 10,
        isActive: true,
      })
      .returning();

    if (!product) {
      throw new Error("Failed to create test product");
    }

    productId = product.id;

    // Act: invalid numeric price makes the order-item insert fail.
    await expect(
      orderRepository.createOrder(
        {
          customerId: customer.id,
          items: [
            {
              productId: product.id,
              quantity: 2,
            },
          ],
        },
        "200.00",
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 2,
            unitPrice: "invalid-price",
          },
        ],
      ),
    ).rejects.toThrow();

    // Assert: stock deduction must have rolled back.
    const [stockAfterFailure] = await query
      .select({ stockQuantity: products.stockQuantity })
      .from(products)
      .where(eq(products.id, product.id));

    expect(stockAfterFailure?.stockQuantity).toBe(10);

    // Assert: the order must also have rolled back.
    const savedOrders = await query
      .select()
      .from(orders)
      .where(eq(orders.customerId, customer.id));

    expect(savedOrders).toHaveLength(0);

    // Assert: no order items should remain.
    const savedItems = await query
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, product.id));

    expect(savedItems).toHaveLength(0);
  });

  
it("creates an order and deducts stock successfully", async () => {
    const [customer] = await query.insert(customers).values({
      name: "Success Test Customer",
      email: `success-${randomUUID()}@example.com`,
    }).returning();
  
    if (!customer) throw new Error("Failed to create test customer");
    customerId = customer.id;
  
    const [product] = await query.insert(products).values({
      name: "Success Test Product",
      price: "100.00",
      stockQuantity: 10,
      isActive: true,
    }).returning();
  
    if (!product) throw new Error("Failed to create test product");
    productId = product.id;
  
    const result = await orderRepository.createOrder(
      {
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }],
      },
      "200.00",
      [{
        productId: product.id,
        productName: product.name,
        quantity: 2,
        unitPrice: "100.00",
      }],
    );
  
    expect(result).toBeDefined();
  
    const [stock] = await query.select({
      stockQuantity: products.stockQuantity,
    }).from(products).where(eq(products.id, product.id));
  
    expect(stock?.stockQuantity).toBe(8);
  
    const savedOrders = await query.select().from(orders)
      .where(eq(orders.customerId, customer.id));
  
    expect(savedOrders).toHaveLength(1);
  
    const savedItems = await query.select().from(orderItems)
      .where(eq(orderItems.productId, product.id));
  
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0]?.quantity).toBe(2);
  });
  
});
