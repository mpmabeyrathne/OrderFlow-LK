import orderRepository from "../repositories/order.repository.js";
import type { CreateOrderInput } from "../validators/order.validator.js";
import { AppError } from "../utils/app-error.js";

class OrderService {
  async createOrder(data: CreateOrderInput) {
    const customer = await orderRepository.findCustomerById(
      data.customerId,
    );

    if (!customer) {
      throw new AppError(404, "Customer not found",);
    }

    const productIds = data.items.map((item) => item.productId);

    const products = await orderRepository.findProductsByIds(productIds);

    if (products.length !== productIds.length) {
      throw new AppError(404, "One or more products were not found");
    }

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    let totalAmount = 0;

    const items = data.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product || !product.isActive) {
        throw new AppError(
          400,
          "One or more products are unavailable",
        );
      }

      if (product.stockQuantity < item.quantity) {
        throw new AppError(
          409,
          `Insufficient stock for ${product.name}`,
        );
      }

      const unitPrice = Number(product.price);
      totalAmount += unitPrice * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    return orderRepository.createOrder(
      data,
      totalAmount.toFixed(2),
      items,
    );
  }

  async getOrders() {
    return orderRepository.findAll();
  }

  async getOrderById(id: string) {
    const order = await orderRepository.findById(id);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    return order;
  }

  async updateStatus(
    id: string,
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
  ) {
    const order = await orderRepository.updateStatus(id, status);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    return order;
  }
}

export default new OrderService();