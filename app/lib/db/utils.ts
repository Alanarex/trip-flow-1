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

/**
 * Demo-only password hashing — synchronous SHA-256 hex prefixed.
 * Note: for real apps use a proper password hashing algorithm (bcrypt/argon2)
 */
export function hash(pw: string) {
  return `h$${sha256(pw)}`;
}

/** Verify demo password */
export function verifyPassword(input: string, stored: string) {
  return stored === hash(input);
}