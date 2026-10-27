import type { Request, Response, NextFunction } from "express";
import orderService from "../services/order.service.js";
import { orderListSchema, parseListQuery } from "../validators/list-query.validator.js";

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
      const filters = parseListQuery(orderListSchema, req.query);
      const visible = await orderService.getOrders(filters, req.auth!.role === "customer" ? req.auth!.customerId! : undefined);
  
      res.status(200).json({
        data: visible.data,
        pagination: visible.pagination,
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
      const order = await orderService.getOrderById(id, req.auth!.role === "customer" ? req.auth!.customerId! : undefined);
  
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