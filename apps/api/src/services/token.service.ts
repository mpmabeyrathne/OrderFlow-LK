import { createHmac, timingSafeEqual } from "node:crypto";
import env from "../config/env.js";
import type { UserRole } from "../db/schema.js";
import { AppError } from "../utils/app-error.js";

export type AuthPrincipal = { userId: string; role: UserRole; customerId: string | null };
const issuer = "orderflow-lk", audience = "orderflow-api", lifetime = 900;
function encode(value: unknown): string { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function signature(input: string): Buffer { return createHmac("sha256", env.JWT_SECRET).update(input).digest(); }
export function signAccessToken(principal: AuthPrincipal): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: principal.userId, role: principal.role, customerId: principal.customerId,
    iss: issuer, aud: audience, iat: now, exp: now + lifetime });
  const input = header + "." + payload;
  return input + "." + signature(input).toString("base64url");
}
export function verifyAccessToken(token: string): AuthPrincipal {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(p => !p)) throw new AppError(401, "Invalid access token");
  try {
    const [h, p, mac] = parts as [string, string, string];
    const header = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    const claim = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    const expected = signature(h + "." + p), received = Buffer.from(mac, "base64url");
    if (header.alg !== "HS256" || header.typ !== "JWT" || received.length !== expected.length ||
        !timingSafeEqual(expected, received)) throw new Error("Bad signature");
    const now = Math.floor(Date.now() / 1000);
    if (claim.iss !== issuer || claim.aud !== audience || !Number.isInteger(claim.iat) || claim.iat > now ||
        !Number.isInteger(claim.exp) || claim.exp <= now || claim.exp - claim.iat > lifetime ||
        typeof claim.sub !== "string" || !/^[0-9a-f-]{36}$/i.test(claim.sub) ||
        !["customer", "admin", "manager"].includes(claim.role) ||
        !(claim.customerId === null || (typeof claim.customerId === "string" && /^[0-9a-f-]{36}$/i.test(claim.customerId))) ||
        (claim.role === "customer" && !claim.customerId)) throw new Error("Invalid claims");
    return { userId: claim.sub, role: claim.role as UserRole, customerId: claim.customerId };
  } catch { throw new AppError(401, "Invalid or expired access token"); }
}
