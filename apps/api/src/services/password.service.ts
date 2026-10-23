import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const params = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, params, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32);
  const derived = await deriveKey(password, salt);
  return "scrypt$" + salt.toString("hex") + "$" + derived.toString("hex");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, digest] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !digest ||
      !/^[0-9a-f]{64}$/.test(salt) || !/^[0-9a-f]{128}$/.test(digest)) return false;
  const actual = await deriveKey(password, Buffer.from(salt, "hex"));
  return timingSafeEqual(actual, Buffer.from(digest, "hex"));
}
