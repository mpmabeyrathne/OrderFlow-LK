import { z } from "zod";
export const registerSchema = z.strictObject({
  name: z.string().trim().min(1).max(150),
  email: z.email().trim().toLowerCase().max(255),
  password: z.string().min(12).max(128),
});
export const loginSchema = z.strictObject({
  email: z.email().trim().toLowerCase().max(255),
  password: z.string().min(1),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
