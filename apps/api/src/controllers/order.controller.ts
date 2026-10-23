import type { Request, Response, NextFunction } from "express";
import orderService from "../services/order.service.js";

class OrderController {
  createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (req.auth!.role === "customer" && req.body.customerId !== req.auth!.customerId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const order = await orderService.createOrder(req.body);

      res.status(201).json({
        message: "Order created successfully",
        data: order,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orders = await orderService.getOrders();
      const visible = req.auth!.role === "customer"
        ? orders.filter(order => order.customerId === req.auth!.customerId)
        : orders;
  
      res.status(200).json({
        data: visible,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
  
  getOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.validatedParams as { id: string };
      const order = await orderService.getOrderById(id);
      if (req.auth!.role === "customer" && order.customerId !== req.auth!.customerId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
  
      res.status(200).json({
        data: order,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.validatedParams as { id: string };
      const { status } = req.body;
  
      const order = await orderService.updateStatus(id, status);
  
      res.status(200).json({
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
  
}

export default new OrderController();