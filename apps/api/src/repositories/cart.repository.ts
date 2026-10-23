import { and, eq, gte, sql } from "drizzle-orm";
import { query } from "../db/index.js";
import { cartItems, orders, orderItems, products, users } from "../db/schema.js";
import { AppError } from "../utils/app-error.js";

const MAX_ITEMS = 50;

function cents(price: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price);
  if (!match) throw new Error("Invalid stored product price");
  return BigInt(match[1]!) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
}
function decimal(total: bigint): string {
  return (total / 100n).toString() + "." + (total % 100n).toString().padStart(2, "0");
}

class CartRepository {
  async list(userId: string) {
    return query.select({
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      name: products.name,
      price: products.price,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
    }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId)).orderBy(cartItems.productId);
  }

  // Cart writers and checkout serialize on the same user row. A failed transaction
  // rolls back the stock deductions, new order, and cart clearance together.
  private async lockUser(tx: Parameters<Parameters<typeof query.transaction>[0]>[0], userId: string) {
    const [user] = await tx.select({ id: users.id }).from(users)
      .where(and(eq(users.id, userId), eq(users.role, "customer")))
      .for("update").limit(1);
    if (!user) throw new AppError(403, "Customer account required");
  }

  async setItem(userId: string, productId: string, quantity: number) {
    return query.transaction(async tx => {
      await this.lockUser(tx, userId);
      const [product] = await tx.select().from(products)
        .where(eq(products.id, productId)).limit(1);
      if (!product || !product.isActive) throw new AppError(404, "Product not available");
      if (product.stockQuantity < quantity) throw new AppError(409, "Insufficient stock");

      const rows = await tx.select({ productId: cartItems.productId })
        .from(cartItems).where(eq(cartItems.userId, userId));
      if (rows.length >= MAX_ITEMS && !rows.some(row => row.productId === productId))
        throw new AppError(400, "Cart contains too many different products");

      const [saved] = await tx.insert(cartItems).values({ userId, productId, quantity })
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.productId],
          set: { quantity, updatedAt: new Date() },
        }).returning();
      return saved;
    });
  }

  async removeItem(userId: string, productId: string) {
    return query.transaction(async tx => {
      await this.lockUser(tx, userId);
      const [deleted] = await tx.delete(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
        .returning({ productId: cartItems.productId });
      return deleted ?? null;
    });
  }

  async checkout(userId: string, customerId: string) {
    return query.transaction(async tx => {
      await this.lockUser(tx, userId);
      const items = await tx.select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
      }).from(cartItems).where(eq(cartItems.userId, userId)).orderBy(cartItems.productId);
      if (items.length === 0) throw new AppError(400, "Cart is empty");

      let total = 0n;
      const snapshots: Array<{ productId: string; productName: string; quantity: number; unitPrice: string }> = [];
      for (const item of items) {
        const [p] = await tx.update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, item.productId),
            eq(products.isActive, true),
            gte(products.stockQuantity, item.quantity)))
          .returning({ id: products.id, name: products.name, price: products.price });
        if (!p) throw new AppError(409, "Product unavailable or insufficient stock; refresh cart");
        total += cents(p.price) * BigInt(item.quantity);
        snapshots.push({ productId: p.id, productName: p.name, quantity: item.quantity, unitPrice: p.price });
      }
      const [order] = await tx.insert(orders)
        .values({ customerId, totalAmount: decimal(total) })
        .returning();
      if (!order) throw new Error("Order insert failed");
      const createdItems = await tx.insert(orderItems).values(snapshots.map(item => ({
        orderId: order.id, ...item,
      }))).returning();
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));
      return { ...order, items: createdItems };
    });
  }
}
export default new CartRepository();
