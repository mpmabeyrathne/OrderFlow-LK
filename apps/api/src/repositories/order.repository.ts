import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { query } from "../db/index.js";
import { customers, products, orders, orderItems } from "../db/schema.js";
import type { CreateOrderInput } from "../validators/order.validator.js";
import { AppError } from "../utils/app-error.js";

class OrderRepository {
  async findCustomerById(customerId: string) {
    const [customer] = await query
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    return customer ?? null;
  }

  async findProductsByIds(productIds: string[]) {
    return query
      .select()
      .from(products)
      .where(inArray(products.id, productIds));
  }

  async createOrder(
    data: CreateOrderInput,
    totalAmount: string,
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: string;
    }[],
  ) {
    return query.transaction(async (tx) => {
      // 1. Deduct stock inside the transaction
      for (const item of items) {
        const [product] = await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.stockQuantity, item.quantity),
            ),
          )
          .returning({ id: products.id });

        if (!product) {
          throw new AppError(
            409,
            `Insufficient stock for ${item.productName}`,
          );
        }
      }

      // 2. Create the order
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: data.customerId,
          totalAmount,
        })
        .returning();

      if (!order) {
        throw new Error("Failed to create order");
      }

      // 3. Create order items
      const createdItems = await tx
        .insert(orderItems)
        .values(
          items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        )
        .returning();

      // 4. Return only after every operation succeeds
      return {
        ...order,
        items: createdItems,
      };
    });
  }

  async findAll() {
    return query.select().from(orders);
  }

  async findItemsByOrderId(orderId: string) {
    return query
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async findById(id: string) {
    const [order] = await query
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    return order ?? null;
  }

  async updateStatus(id: string, status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") {
    const [order] = await query
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return order ?? null;
  }

  
async cancelOrder(id: string) {
  return query.transaction(async (tx) => {
    
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)
      .for("update");

    if (!order) {
      return null;
    }

    if (order.status === "cancelled") {
      return order;
    }

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    for (const item of items) {
      const [product] = await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId))
        .returning({ id: products.id });

      if (!product) {
        throw new Error(
          `Failed to restore stock for product ${item.productId}`,
        );
      }
    }

    const [cancelledOrder] = await tx
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!cancelledOrder) {
      throw new Error("Failed to cancel order");
    }

    return cancelledOrder;
  });
}

}

export default new OrderRepository();