import authRepository from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { signAccessToken } from "./token.service.js";
import { AppError } from "../utils/app-error.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";
const DUMMY_HASH = "scrypt$" + "00".repeat(32) + "$" + "00".repeat(64);
class AuthService {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    if (await authRepository.findByEmail(email)) throw new AppError(409, "Email already registered");
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await authRepository.register({ name: input.name, email, passwordHash });
      return { user, accessToken: signAccessToken({ userId: user.id, role: user.role, customerId: user.customerId }) };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505")
        throw new AppError(409, "Email already registered");
      throw error;
    }
  }
  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email.toLowerCase());
    const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new AppError(401, "Invalid email or password");
    return { user: { id: user.id, email: user.email, role: user.role, customerId: user.customerId },
      accessToken: signAccessToken({ userId: user.id, role: user.role, customerId: user.customerId }) };
  }
}
export default new AuthService();
