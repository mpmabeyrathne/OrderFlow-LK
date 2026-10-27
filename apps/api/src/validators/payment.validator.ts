import { z } from "zod";
export const paymentOrderParamsSchema = z.object({ orderId: z.uuid() });
export const simulatePaymentSchema = z.strictObject({
  outcome: z.enum(["success", "failure"]),
});
