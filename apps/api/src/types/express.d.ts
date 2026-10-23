export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: import("../services/token.service.js").AuthPrincipal;
    }
  }
}