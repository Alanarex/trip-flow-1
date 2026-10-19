import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import 'react-native-get-random-values';
import RNUUID from 'react-native-uuid';

/** RFC4122 v4 UUID using react-native-uuid */
export function uuid(): string {
  // RNUUID.v4() returns a value that may be a Buffer-like or string depending on platform,
  // so ensure we return a string
  return String(RNUUID.v4());
}

/** Base64-encode a UTF-8 string using js-base64 */
export function base64Encode(str: string): string {
  return Base64.encode(str);
}

const ITERATIONS = 5000;

function randomSaltHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr); // polyfilled by react-native-get-random-values
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function derive(pw: string, salt: string, iterations: number): string {
  let digest = sha256(`${salt}:${pw}`);
  for (let i = 1; i < iterations; i++) digest = sha256(`${salt}:${digest}`);
  return digest;
}

/**
 * Password hashing: random salt + iterated SHA-256, stored as `v2$<iterations>$<salt>$<hash>`.
 * Stronger than the legacy unsalted `h$<sha256>`, but not a memory-hard KDF (bcrypt/argon2 would be).
 */
export function hash(pw: string) {
  const salt = randomSaltHex();
  return `v2$${ITERATIONS}$${salt}$${derive(pw, salt, ITERATIONS)}`;
}

/** True when the stored hash uses the legacy unsalted format and should be upgraded after login. */
export function needsRehash(stored: string) {
  return !stored.startsWith("v2$");
}

/** Verify a password against a v2 hash, or the legacy unsalted `h$` hash. */
export function verifyPassword(input: string, stored: string) {
  if (stored.startsWith("v2$")) {
    const [, iterations, salt, expected] = stored.split("$");
    const count = Number(iterations);
    if (!salt || !expected || !Number.isInteger(count) || count < 1) return false;
    return derive(input, salt, count) === expected;
  }
  return stored === `h$${sha256(input)}`;
}
