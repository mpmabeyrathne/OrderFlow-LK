import paymentRepository, { type PaymentOutcome } from "../repositories/payment.repository.js";
import type { AuthPrincipal } from "./token.service.js";
import { AppError } from "../utils/app-error.js";

function customerId(principal: AuthPrincipal): string {
  if (principal.role !== "customer" || !principal.customerId)
    throw new AppError(403, "Customer role required");
  return principal.customerId;
}
class PaymentService {
  simulate(principal: AuthPrincipal, orderId: string, outcome: PaymentOutcome) {
    return paymentRepository.simulate(orderId, customerId(principal), outcome);
  }
  get(principal: AuthPrincipal, orderId: string) {
    return paymentRepository.get(orderId, customerId(principal));
  }
}
export default new PaymentService();
