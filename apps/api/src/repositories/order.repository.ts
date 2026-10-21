import { eq, inArray } from "drizzle-orm";
import { query } from "../db/index.js";
import { customers, products, orders, orderItems } from "../db/schema.js";
import type { CreateOrderInput } from "../validators/order.validator.js";

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
    const [order] = await query
      .insert(orders)
      .values({
        customerId: data.customerId,
        totalAmount,
      })
      .returning();

    if (!order) {
      throw new Error("Failed to create order");
    }

    const createdItems = await query
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

    return {
      ...order,
      items: createdItems,
    };
  }

  async findAll() {
    return query.select().from(orders);
  }
  
  async findById(id: string) {
    const [order] = await query
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
  
    return order ?? null;
  }
}

export default new OrderRepository();