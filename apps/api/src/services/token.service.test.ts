import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./token.service.js";
const principal = { userId: "7b241615-0d27-4d58-92c9-8b720479419e", role: "customer" as const,
  customerId: "15d448e2-826d-4016-9a4f-18cfd0765d9a" };
describe("access tokens", () => {
  it("validates a signed token", () => expect(verifyAccessToken(signAccessToken(principal))).toEqual(principal));
  it("rejects tampered tokens", () => {
    const token = signAccessToken(principal);
    const [header, payload, mac] = token.split(".");
    const changed = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
    changed.role = "admin";
    const altered = [header, Buffer.from(JSON.stringify(changed)).toString("base64url"), mac].join(".");
    expect(() => verifyAccessToken(altered)).toThrow();
  });
});
