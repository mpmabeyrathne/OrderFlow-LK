import type { Request, Response } from "express";
import cartService from "../services/cart.service.js";

class CartController {
  list = async (req: Request, res: Response) => {
    const items = await cartService.list(req.auth!);
    return res.json({ success: true, data: items });
  };
  setItem = async (req: Request, res: Response) => {
    const { productId } = res.locals.validatedParams as { productId: string };
    const item = await cartService.setItem(req.auth!, productId, req.body.quantity);
    return res.json({ success: true, data: item });
  };
  removeItem = async (req: Request, res: Response) => {
    const { productId } = res.locals.validatedParams as { productId: string };
    const deleted = await cartService.removeItem(req.auth!, productId);
    return res.json({ success: true, removed: deleted !== null });
  };
  checkout = async (req: Request, res: Response) => {
    const order = await cartService.checkout(req.auth!);
    return res.status(201).json({ success: true, data: order });
  };
}
export default new CartController();
