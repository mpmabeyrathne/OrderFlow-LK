import cartRepository from "../repositories/cart.repository.js";
import type { AuthPrincipal } from "./token.service.js";
import { AppError } from "../utils/app-error.js";

function customer(principal: AuthPrincipal) {
  if (principal.role !== "customer" || !principal.customerId)
    throw new AppError(403, "Customer account required");
  return principal.customerId;
}
class CartService {
  async list(principal: AuthPrincipal) {
    customer(principal);
    return cartRepository.list(principal.userId);
  }
  async setItem(principal: AuthPrincipal, productId: string, quantity: number) {
    customer(principal);
    return cartRepository.setItem(principal.userId, productId, quantity);
  }
  async removeItem(principal: AuthPrincipal, productId: string) {
    customer(principal);
    return cartRepository.removeItem(principal.userId, productId);
  }
  async checkout(principal: AuthPrincipal) {
    const customerId = customer(principal);
    return cartRepository.checkout(principal.userId, customerId);
  }
}
export default new CartService();
