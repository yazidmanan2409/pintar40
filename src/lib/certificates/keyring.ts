import "server-only";

/**
 * The certificate signing keyring (INV-07).
 *
 * Keys live in versioned environment variables — `CERT_SECRET_KEY_V1`,
 * `CERT_SECRET_KEY_V2`, … — and never in the database. A secret the database
 * can read is a secret a database backup carries, which is why the canonical
 * payload is built in SQL and signed here rather than the other way round.
 *
 * Rotation is additive and one-directional: a new version becomes the SIGNING
 * key, and every earlier version stays loaded as a VERIFY-ONLY key. Nothing is
 * ever deleted, because a certificate issued under `_V1` must keep verifying
 * after `_V2` exists — that is the whole of INV-07, and deleting an old key
 * would silently invalidate every certificate signed with it.
 */

/**
 * The ONE module permitted to read `CERT_SECRET_KEY_V*` from the environment.
 *
 * FABLE-01 §1 put every server secret behind src/lib/env.ts, and F01-S03
 * enforces it. The certificate keys do not go there: env.ts is imported by
 * client components (it is where `publicSupabaseUrl()` lives), so it is not a
 * `server-only` module, and a secret class whose whole point is that it never
 * reaches a browser belongs behind the `server-only` guard instead. F01-S03
 * therefore names two readers, one per secret class, and forbids each from
 * reading the other's.
 */
const PREFIX = "CERT_SECRET_KEY_V";
const MIN_LENGTH = 32;

export class KeyringError extends Error {}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Every version present in the environment, ascending. */
export function availableKeyVersions(): number[] {
  const versions: number[] = [];
  for (const name of Object.keys(process.env)) {
    if (!name.startsWith(PREFIX)) continue;
    const n = Number(name.slice(PREFIX.length));
    if (Number.isInteger(n) && n >= 1 && (process.env[name] ?? "").length > 0) versions.push(n);
  }
  return versions.sort((a, b) => a - b);
}

/**
 * The key for one version. Throws rather than returning a weak or absent
 * secret: a certificate signed with a placeholder is worse than one that was
 * never issued.
 */
export function certificateKey(version: number): string {
  const value = process.env[`${PREFIX}${version}`];
  if (!value) throw new KeyringError(`${PREFIX}${version} is not set`);
  if (isProduction() && value.length < MIN_LENGTH) {
    throw new KeyringError(`${PREFIX}${version} must be at least ${MIN_LENGTH} characters in production`);
  }
  return value;
}

/** The version new certificates are signed with: the highest available. */
export function signingKeyVersion(): number {
  const versions = availableKeyVersions();
  if (versions.length === 0) throw new KeyringError(`no ${PREFIX}n is set; certificates cannot be issued`);
  return versions[versions.length - 1];
}

/**
 * Boot-time contract. Called from the certificate entry points rather than at
 * module load, so a deployment that never issues a certificate is not forced
 * to carry a key — but any deployment that does is checked before it signs.
 */
export function assertKeyringUsable(): void {
  const versions = availableKeyVersions();
  if (versions.length === 0) throw new KeyringError(`no ${PREFIX}n is set; certificates cannot be issued`);
  for (const v of versions) certificateKey(v);
}

// --------------------------------------------------------------------------
// The secret-bearing wrappers. Everything above resolves a version to a key;
// everything here is the only place a key and a payload meet.
// --------------------------------------------------------------------------
import { signWithKey, verifyWithKey, type CanonicalPayload } from "./sign";

export function signPayload(payload: CanonicalPayload, keyVersion: number): string {
  return signWithKey(payload, certificateKey(keyVersion));
}

export function verifySignature(
  payload: CanonicalPayload,
  keyVersion: number,
  signature: string,
): boolean {
  try {
    return verifyWithKey(payload, certificateKey(keyVersion), signature);
  } catch {
    return false;
  }
}
