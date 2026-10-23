import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.validator.js";
describe("auth request validation", () => {
  it("accepts valid registration", () => expect(registerSchema.safeParse({
    name: "Jane", email: "JANE@example.com", password: "long-and-strong-passphrase",
  }).success).toBe(true));
  it("rejects weak passwords", () => expect(registerSchema.safeParse({
    name: "Jane", email: "jane@example.com", password: "weak",
  }).success).toBe(false));
  it("rejects role escalation during signup", () => expect(registerSchema.safeParse({
    name: "Jane", email: "jane@example.com", password: "long-and-strong-passphrase", role: "admin",
  }).success).toBe(false));
  it("rejects invalid login email", () => expect(loginSchema.safeParse({
    email: "not-email", password: "anything",
  }).success).toBe(false));
});
