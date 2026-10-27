import type { Request, Response } from "express";
import paymentService from "../services/payment.service.js";

class PaymentController {
  simulate = async (req: Request, res: Response) => {
    const { orderId } = res.locals.validatedParams as { orderId: string };
    const result = await paymentService.simulate(req.auth!, orderId, req.body.outcome);
    return res.status(result.created ? 201 : 200)
      .json({ success: true, data: result.payment, replayed: !result.created });
  };
  get = async (req: Request, res: Response) => {
    const { orderId } = res.locals.validatedParams as { orderId: string };
    const payment = await paymentService.get(req.auth!, orderId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    return res.json({ success: true, data: payment });
  };
}
export default new PaymentController();
