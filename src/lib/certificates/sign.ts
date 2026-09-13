import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Canonicalisation and HMAC over the certificate payload (INV-05).
 *
 * THIS MODULE IS PURE, AND DELIBERATELY NOT `server-only`. It takes the key as
 * an argument and reads no environment variable, so it can be exercised
 * directly by the selftest — which is the point: the tamper matrix and the
 * timing-safe comparison are the two things most worth testing, and a module
 * that can only be loaded inside a React server condition is a module whose
 * crypto gets tested through three layers of indirection or not at all.
 *
 * The secret never reaches here by accident: `keyring.ts` is `server-only` and
 * is the only thing that resolves a version to a key, and F01-S03's bundle scan
 * asserts that no `CERT_SECRET_KEY` reference reaches the client bundle.
 *
 * THE PAYLOAD IS NOT REBUILT AT VERIFICATION TIME. The database stores the
 * exact payload it signed and verification recomputes over those stored bytes.
 * That is what makes "tamper with a protected field" a real test.
 */

export type CanonicalPayload = Record<string, unknown>;

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = canonicalise(src[key]);
    return out;
  }
  return value;
}

/** The exact bytes that are signed. Key order is normalised; values are not. */
export function canonicalBytes(payload: CanonicalPayload): string {
  return JSON.stringify(canonicalise(payload));
}

export function signWithKey(payload: CanonicalPayload, key: string): string {
  return createHmac("sha256", key).update(canonicalBytes(payload)).digest("hex");
}

/**
 * Timing-safe verification (INV-05). `===` on a hex digest leaks, through
 * response time, how many leading characters a forged signature got right.
 * `timingSafeEqual` compares in constant time — and it throws on a length
 * mismatch, so a wrong-length signature is compared against a same-length
 * value instead of short-circuiting, which would reintroduce the leak.
 */
export function verifyWithKey(payload: CanonicalPayload, key: string, signature: string): boolean {
  const a = Buffer.from(signWithKey(payload, key), "utf8");
  const b = Buffer.from(signature ?? "", "utf8");
  if (a.length !== b.length) return timingSafeEqual(a, a) && false;
  return timingSafeEqual(a, b);
}
