import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// OWASP-recommended work factor for interactive logins (scrypt N=2^15).
// Parameters are stored in the hash string, so raising N for new hashes
// stays backwards compatible with existing ones.
const N = 32768, r = 8, p = 1, KEYLEN = 64;
const MAXMEM = 128 * 1024 * 1024;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p, maxmem: MAXMEM });
  return `scrypt:${N}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, nStr, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt") return false;
  try {
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), KEYLEN, {
      N: Number(nStr),
      r,
      p,
      maxmem: MAXMEM,
    });
    const expected = Buffer.from(hashHex, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}
