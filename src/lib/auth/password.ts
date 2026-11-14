import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const N = 16384, r = 8, p = 1, KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
  return `scrypt:${N}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, nStr, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt") return false;
  const hash = scryptSync(password, Buffer.from(saltHex, "hex"), KEYLEN, {
    N: Number(nStr),
    r,
    p,
  });
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
