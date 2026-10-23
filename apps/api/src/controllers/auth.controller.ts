import type { Request, Response } from "express";
import authService from "../services/auth.service.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";
class AuthController {
  register = async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    return res.status(201).json({ success: true, data: result, tokenType: "Bearer", expiresIn: 900 });
  };
  login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    return res.json({ success: true, data: result, tokenType: "Bearer", expiresIn: 900 });
  };
  me = async (req: Request, res: Response) => res.json({ success: true, data: req.auth });
}
export default new AuthController();
