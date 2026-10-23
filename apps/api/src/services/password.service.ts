import { randomBytes, scrypt as callback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(callback);
const params = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString("hex");
  const derived = (await scrypt(password, Buffer.from(salt, "hex"), 64, params)) as Buffer;
  return "scrypt$" + salt + "$" + derived.toString("hex");
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, digest] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !digest || !/^[0-9a-f]{64}$/.test(salt) || !/^[0-9a-f]{128}$/.test(digest)) return false;
  const actual = (await scrypt(password, Buffer.from(salt, "hex"), 64, params)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(digest, "hex"));
}
