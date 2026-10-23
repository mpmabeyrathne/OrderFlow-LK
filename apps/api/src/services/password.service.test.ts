import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.service.js";
describe("password hashing", () => {
  it("never stores plaintext and validates correct password", async () => {
    const hash = await hashPassword("example-long-password-2026");
    expect(hash).not.toContain("example-long-password-2026");
    expect(await verifyPassword("example-long-password-2026", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
  it("uses a different random salt for each hash", async () => {
    const first = await hashPassword("example-long-password-2026");
    const second = await hashPassword("example-long-password-2026");
    expect(first).not.toEqual(second);
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("hello", "not-a-hash")).toBe(false);
  });
});
