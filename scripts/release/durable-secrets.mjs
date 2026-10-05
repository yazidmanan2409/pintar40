#!/usr/bin/env node
// #150 G5 (owner, 6 Oct): CARD_PEPPER and CERT_SECRET_KEY_V1 ARE NEVER REPLACED SILENTLY.
//
// Every classroom card's sign-in secret is derived from CARD_PEPPER, and every issued certificate is sealed with
// CERT_SECRET_KEY_V1. Both live only in Vercel. A rebuilt or emptied Vercel project used to look exactly like a first
// deployment, and the deploy minted fresh values: every card stopped signing in and every certificate stopped verifying,
// with nothing to say why (#150 hazard H1).
//
// This module decides, per secret, before anything is written:
//   KEEP    Vercel holds it, it is readable and long enough, it matches the recorded fingerprint (when one is recorded)
//           and, for the certificate key, it opens an issued certificate's seal (when one exists).
//   MINT    Vercel does not hold it, no fingerprint was ever recorded for it, and production holds nothing made with it
//           and no real data (no classroom card, no sealed certificate, no school, nobody beyond the first administrator).
//   REFUSE  anything else, including anything it could not establish. Nothing is minted; the deploy stops and says
//           which secret, why, and that it must be RECOVERED (docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md, G5).
//
// The fingerprint is HMAC-SHA256(secret, "pintar durable secret fingerprint|<name>"), first 16 hex characters: it tells
// two values apart and says nothing usable about a 256-bit random secret. Fingerprints are recorded in
// docs/recovery/durable-secrets.json; no value is ever printed, logged or written anywhere but Vercel.
//
//   node durable-secrets.mjs guard <registry.json> <verdict-file>     (the deploy; reads the environment below)
//   node durable-secrets.mjs fingerprint <NAME>                        (value on stdin; prints the fingerprint only)
//
// guard reads: VERCEL_TOKEN, PRODUCTION_VERCEL_PROJECT_NAME, SUPABASE_URL, SERVICE_ROLE_KEY_FILE (and VERCEL_API, only
// so the selftest can stand a local server in for Vercel; the deploy never sets it).
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DURABLE = ["CARD_PEPPER", "CERT_SECRET_KEY_V1"];
export const MIN_LENGTH = 32;

export function fingerprint(name, value) {
  return createHmac("sha256", value).update(`pintar durable secret fingerprint|${name}`).digest("hex").slice(0, 16);
}

// The certificate seal, exactly as src/lib/certificates/sign.ts makes it (DS-S01 holds the two to the same bytes).
function canonicalise(value) {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalise(value[key]);
    return out;
  }
  return value;
}
export function canonicalBytes(payload) {
  return JSON.stringify(canonicalise(payload));
}
export function seal(payload, key) {
  return createHmac("sha256", key).update(canonicalBytes(payload)).digest("hex");
}
export function opensSeal(payload, key, signature) {
  const a = Buffer.from(seal(payload, key), "utf8");
  const b = Buffer.from(String(signature ?? ""), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * What production holds that depends on the secrets. Each count is a number, or null when it could not be read
 * (which is never taken to mean zero).
 *   cards        classroom-card accounts (public.accounts, kind CLASSROOM_CARD): derived from CARD_PEPPER
 *   sealed       certificates carrying a signature: sealed with CERT_SECRET_KEY_V<n>
 *   schools      public.institutions
 *   persons      public.persons (the first administrator is one)
 */
export function dependents(name, facts) {
  const why = [];
  const unknown = [];
  const own = name === "CARD_PEPPER" ? ["cards", "classroom cards"] : ["sealed", "sealed certificates"];
  for (const [k, label, limit] of [[own[0], own[1], 0], ["schools", "schools", 0], ["persons", "people beyond the first administrator", 1]]) {
    const n = facts?.[k];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) unknown.push(label);
    else if (n > limit) why.push(`${n - limit} ${label}`);
  }
  return { why, unknown };
}

/**
 * The decision for one secret.
 *   s.present      Vercel production lists it
 *   s.value        its value when Vercel returned it, else null
 *   s.recorded     the fingerprint recorded for it, else null
 *   s.sealCheck    CERT_SECRET_KEY_V1 only: "opens" | "does-not-open" | "none" (no sealed certificate) | "unknown"
 *   facts          see dependents()
 */
export function decide(name, s, facts) {
  if (!DURABLE.includes(name)) return { verdict: "REFUSE", reasons: [`${name} is not a durable secret this guard knows`] };
  const recorded = typeof s.recorded === "string" && /^[0-9a-f]{16}$/.test(s.recorded) ? s.recorded : null;
  if (s.recorded != null && recorded === null) {
    return { verdict: "REFUSE", reasons: [`the fingerprint recorded for ${name} is malformed; the record must be repaired, not ignored`] };
  }
  if (s.present) {
    if (typeof s.value !== "string") {
      return { verdict: "REFUSE", reasons: [`Vercel lists ${name} but did not return its value, so it cannot be verified`] };
    }
    if (s.value.length < MIN_LENGTH) {
      return { verdict: "REFUSE", reasons: [`${name} in Vercel is shorter than ${MIN_LENGTH} characters`] };
    }
    const fp = fingerprint(name, s.value);
    if (recorded && fp !== recorded) {
      return { verdict: "REFUSE", fingerprint: fp, reasons: [`${name} in Vercel (fingerprint ${fp}) is not the recorded one (${recorded}): ` +
        `whatever was made with the recorded value would stop working`] };
    }
    if (name === "CERT_SECRET_KEY_V1") {
      if (s.sealCheck === "does-not-open") {
        return { verdict: "REFUSE", fingerprint: fp, reasons: [`${name} in Vercel does not open an issued certificate's seal: it is not the key the certificates were sealed with`] };
      }
      if (s.sealCheck !== "opens" && s.sealCheck !== "none") {
        return { verdict: "REFUSE", fingerprint: fp, reasons: [`whether ${name} opens the issued certificates could not be established`] };
      }
    }
    const reasons = [recorded ? `matches the recorded fingerprint ${recorded}` : `no fingerprint recorded yet: record ${fp}`];
    if (name === "CERT_SECRET_KEY_V1") reasons.push(s.sealCheck === "opens" ? "opens an issued certificate's seal" : "no certificate is sealed yet");
    return { verdict: "KEEP", fingerprint: fp, record: recorded ? null : fp, reasons };
  }
  if (recorded) {
    return { verdict: "REFUSE", reasons: [`${name} is missing from Vercel, but a value was recorded (fingerprint ${recorded}): ` +
      `it must be recovered, never replaced`] };
  }
  const d = dependents(name, facts);
  if (d.unknown.length) {
    return { verdict: "REFUSE", reasons: [`${name} is missing from Vercel and it could not be established whether production holds ` +
      `${d.unknown.join(", ")}`] };
  }
  if (d.why.length) {
    return { verdict: "REFUSE", reasons: [`${name} is missing from Vercel and production holds ${d.why.join(", ")}: ` +
      `a new value would break them; it must be recovered, never replaced`] };
  }
  return { verdict: "MINT", reasons: ["absent, never recorded, and production holds nothing made with it and no real data"] };
}

/** The recorded fingerprints for production, from docs/recovery/durable-secrets.json. */
export function recordedFrom(registry) {
  const p = registry?.production;
  if (!p || typeof p !== "object") throw new Error("the registry has no production section");
  return Object.fromEntries(DURABLE.map((n) => [n, p[n]?.fingerprint ?? null]));
}

// ─────────────────────────────────────────────────────────────── the deploy's side: reads only, then the verdict
async function http(url, headers) {
  const r = await fetch(url, { headers: { "User-Agent": "pintar-durable-secrets", ...headers } });
  return r;
}

async function vercelState(token, project) {
  const api = process.env.VERCEL_API || "https://api.vercel.com";
  const auth = { Authorization: `Bearer ${token}` };
  const r = await http(`${api}/v9/projects/${encodeURIComponent(project)}/env?decrypt=false`, auth);
  if (r.status !== 200) throw new Error(`Vercel refused the environment listing: HTTP ${r.status}`);
  const envs = ((await r.json()).envs ?? []).filter((e) => (e.target ?? []).includes("production"));
  const out = {};
  for (const name of DURABLE) {
    const hits = envs.filter((e) => e.key === name);
    if (hits.length > 1) throw new Error(`Vercel lists ${hits.length} production entries for ${name}`);
    if (hits.length === 0) { out[name] = { present: false, value: null }; continue; }
    const one = await http(`${api}/v1/projects/${encodeURIComponent(project)}/env/${hits[0].id}`, auth);
    const v = one.status === 200 ? (await one.json()).value : null;
    out[name] = { present: true, value: typeof v === "string" && v.length > 0 ? v : null, type: hits[0].type };
  }
  return out;
}

async function count(base, key, path) {
  const r = await http(`${base}/rest/v1/${path}`, { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" });
  if (r.status !== 200 && r.status !== 206) return null;
  const m = /\/(\d+)$/.exec(r.headers.get("content-range") ?? "");
  return m ? Number(m[1]) : null;
}

async function productionFacts(base, key) {
  return {
    cards: await count(base, key, "accounts?select=id&kind=eq.CLASSROOM_CARD"),
    sealed: await count(base, key, "certificates?select=id&signature=not.is.null"),
    schools: await count(base, key, "institutions?select=id"),
    persons: await count(base, key, "persons?select=id"),
  };
}

async function sealCheck(base, key, certKey) {
  if (typeof certKey !== "string") return "unknown";
  const r = await http(`${base}/rest/v1/certificates?select=canonical_payload,signature&key_version=eq.1&signature=not.is.null&limit=1`,
    { apikey: key, Authorization: `Bearer ${key}` });
  if (r.status !== 200) return "unknown";
  const rows = await r.json();
  if (!Array.isArray(rows)) return "unknown";
  if (rows.length === 0) return "none";
  return opensSeal(rows[0].canonical_payload, certKey, rows[0].signature) ? "opens" : "does-not-open";
}

async function guard(registryPath, verdictPath) {
  const need = ["VERCEL_TOKEN", "PRODUCTION_VERCEL_PROJECT_NAME", "SUPABASE_URL", "SERVICE_ROLE_KEY_FILE"];
  const missing = need.filter((n) => !process.env[n]);
  if (missing.length) { console.log(`::error::the durable-secret guard is missing ${missing.join(", ")}; nothing is minted`); return 1; }
  let recorded, vercel, facts, check;
  try {
    recorded = recordedFrom(JSON.parse(readFileSync(registryPath, "utf8")));
    vercel = await vercelState(process.env.VERCEL_TOKEN, process.env.PRODUCTION_VERCEL_PROJECT_NAME);
    const key = readFileSync(process.env.SERVICE_ROLE_KEY_FILE, "utf8").trim();
    facts = await productionFacts(process.env.SUPABASE_URL, key);
    check = await sealCheck(process.env.SUPABASE_URL, key, vercel.CERT_SECRET_KEY_V1.value);
  } catch (e) {
    console.log(`::error::the durable-secret guard could not establish the facts (${e.message}); nothing is minted`);
    return 1;
  }
  const show = (n) => (n === null ? "unknown" : String(n));
  console.log(`production holds: classroom cards ${show(facts.cards)}, sealed certificates ${show(facts.sealed)}, ` +
    `schools ${show(facts.schools)}, people ${show(facts.persons)}`);
  const lines = [];
  let refused = false;
  for (const name of DURABLE) {
    const v = decide(name, { ...vercel[name], recorded: recorded[name], sealCheck: name === "CERT_SECRET_KEY_V1" ? check : undefined }, facts);
    console.log(`${name}: ${v.verdict}${v.fingerprint ? ` (fingerprint ${v.fingerprint})` : ""}: ${v.reasons.join("; ")}`);
    if (v.verdict === "REFUSE") { refused = true; console.log(`::error::${name}: ${v.reasons.join("; ")}`); }
    if (v.record) console.log(`::warning::${name}'s fingerprint is not recorded yet: add ${v.record} to docs/recovery/durable-secrets.json`);
    lines.push(`${name} ${v.verdict}`);
  }
  if (refused) {
    console.log("::error::nothing was minted and nothing was deployed. Recover the secret named above (the #150 review, G5); " +
      "never delete a fingerprint record to get past this.");
    return 1;
  }
  writeFileSync(verdictPath, lines.join("\n") + "\n", { mode: 0o600 });
  return 0;
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === "guard" && rest.length === 2) return guard(rest[0], rest[1]);
  if (cmd === "fingerprint" && rest.length === 1 && DURABLE.includes(rest[0])) {
    const value = readFileSync(0, "utf8").replace(/\n$/, "");
    if (value.length < MIN_LENGTH) { console.error("refused: the value is shorter than the minimum"); return 1; }
    console.log(fingerprint(rest[0], value));
    return 0;
  }
  console.error("usage: durable-secrets.mjs guard <registry.json> <verdict-file> | fingerprint <NAME> (value on stdin)");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
