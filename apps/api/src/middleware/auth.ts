import type { RequestHandler } from "express";
import authRepository from "../repositories/auth.repository.js";
import { verifyAccessToken } from "../services/token.service.js";
import type { UserRole } from "../db/schema.js";
import { AppError } from "../utils/app-error.js";
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header("authorization");
    if (!header || !/^Bearer [^ ]+$/.test(header)) throw new AppError(401, "Bearer token required");
    const principal = verifyAccessToken(header.slice(7));
    const user = await authRepository.findById(principal.userId);
    if (!user || user.role !== principal.role || user.customerId !== principal.customerId)
      throw new AppError(401, "Account no longer valid");
    req.auth = principal;
    next();
  } catch (error) { next(error); }
};
export const authorize = (...roles: UserRole[]): RequestHandler => (req, _res, next) => {
  if (!req.auth) return next(new AppError(401, "Authentication required"));
  if (!roles.includes(req.auth.role)) return next(new AppError(403, "Forbidden"));
  next();
};
export const requireOwnCustomer: RequestHandler = (req, _res, next) => {
  if (!req.auth) return next(new AppError(401, "Authentication required"));
  if (req.auth.role === "customer" && req.params.id !== req.auth.customerId)
    return next(new AppError(403, "Forbidden"));
  next();
};
