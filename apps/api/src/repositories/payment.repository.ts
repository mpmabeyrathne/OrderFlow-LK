import { eq } from "drizzle-orm";
import { query } from "../db/index.js";
import { orders, payments } from "../db/schema.js";
import { AppError } from "../utils/app-error.js";

export type PaymentOutcome = "success" | "failure";
class PaymentRepository {
  async simulate(orderId: string, customerId: string, outcome: PaymentOutcome) {
    return query.transaction(async tx => {
      // Serializing on the order row makes repeat requests deterministic.
      const [order] = await tx.select().from(orders)
        .where(eq(orders.id, orderId)).for("update").limit(1);
      if (!order || order.customerId !== customerId) throw new AppError(404, "Order not found");
      if (order.status === "cancelled") throw new AppError(409, "Cancelled orders cannot be paid");

      const [existing] = await tx.select().from(payments)
        .where(eq(payments.orderId, orderId)).limit(1);
      if (existing) {
        if (existing.status !== (outcome === "success" ? "succeeded" : "failed"))
          throw new AppError(409, "A different payment result already exists for this order");
        return { payment: existing, created: false };
      }
      const [payment] = await tx.insert(payments).values({
        orderId,
        amount: order.totalAmount,
        currency: order.currency,
        status: outcome === "success" ? "succeeded" : "failed",
      }).returning();
      if (!payment) throw new Error("Failed to record simulated payment");
      return { payment, created: true };
    });
  }

  async get(orderId: string, customerId: string) {
    const [order] = await query.select({ id: orders.id, customerId: orders.customerId })
      .from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.customerId !== customerId) throw new AppError(404, "Order not found");
    const [payment] = await query.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
    return payment ?? null;
  }
}
export default new PaymentRepository();
