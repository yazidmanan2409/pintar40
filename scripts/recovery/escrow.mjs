#!/usr/bin/env node
// #150 WP-B (D-106(c) B5; closure plan A4; D-107 D8): PINTAR'S DURABLE SECRETS, ESCROWED OUTSIDE VERCEL.
//
// CARD_PEPPER derives every class card's sign-in secret; CERT_SECRET_KEY_V<n> seals every certificate of key version
// n. Both live only in Vercel; G5 stops a deploy from replacing them silently, and this keeps each one recoverable for
// as long as anything depends on it:
//   escrow        each secret production holds, ONLY when its fingerprint equals the recorded one
//                 (docs/recovery/durable-secrets.json), is encrypted to the recovery keys R1 and R2 (never R3, the drill
//                 key GitHub holds) and uploaded to production/escrow/<NAME>/<fingerprint>.json.gpg with its SHA-256
//                 checksum and an Object Lock LEGAL HOLD: no expiry, and no lifecycle rule covers the prefix (A4). Only
//                 the AWS root (C9) can lift the hold, by the retirement procedure.
//   mint <verdict-file>   the only place a durable secret is ever minted (G5's guard said MINT: an empty production):
//                 the value is made here, escrowed FIRST, and written to Vercel only once its escrow is uploaded.
//   recover <NAME>        the recorded fingerprint's escrow, decrypted with a custodian's private key imported for this
//                 run alone, its fingerprint checked, then written to Vercel only where Vercel holds no value for it.
// A value is never printed, logged or written to disk in the clear: it travels from Vercel or from openssl's
// equivalent to gpg's standard input, and back to Vercel's API, in this process's memory.
//
// Environment:
//   VERCEL_TOKEN PRODUCTION_VERCEL_PROJECT_NAME [VERCEL_API: tests only]
//   REGISTRY (default docs/recovery/durable-secrets.json); RECIPIENTS_DIR (default docs/recovery/keys)
//   ESCROW_RECIPIENTS (default "R1 R2")
//   ESCROW_S3_ENDPOINT ESCROW_S3_REGION ESCROW_S3_BUCKET ESCROW_S3_KEY_ID ESCROW_S3_SECRET [ESCROW_S3_PATH_STYLE]
//                (C4, the writer, for escrow and mint; C5, the reader, for recover)
//   RECOVERY_GNUPGHOME [RECOVERY_PASSPHRASE]    recover only: the custodian's key, imported for this run
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DURABLE, MIN_LENGTH, fingerprint, recordedFrom, vercelState } from "../release/durable-secrets.mjs";
import { encrypt, recipientsFor } from "./backup.mjs";
import { s3Client } from "./s3.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const escrowKey = (name, fpr) => `production/escrow/${name}/${fpr}.json.gpg`;

function need(names) { const miss = names.filter((n) => !process.env[n]); if (miss.length) throw new Error(`not set: ${miss.join(", ")}`); }
function bucket() {
  need(["ESCROW_S3_REGION", "ESCROW_S3_BUCKET", "ESCROW_S3_KEY_ID", "ESCROW_S3_SECRET"]);
  const region = process.env.ESCROW_S3_REGION;
  return s3Client({ endpoint: process.env.ESCROW_S3_ENDPOINT || `https://s3.${region}.amazonaws.com`, region, keyId: process.env.ESCROW_S3_KEY_ID,
    secret: process.env.ESCROW_S3_SECRET, bucket: process.env.ESCROW_S3_BUCKET, pathStyle: process.env.ESCROW_S3_PATH_STYLE === "1" });
}
function recorded() {
  return recordedFrom(JSON.parse(readFileSync(process.env.REGISTRY || join(ROOT, "docs/recovery/durable-secrets.json"), "utf8")));
}
function recipients() {
  const r = recipientsFor("production", process.env.ESCROW_RECIPIENTS || "R1 R2");
  if (r.problems.length) throw new Error(r.problems.join("; "));
  return r.list;
}

/** One secret into the escrow: encrypted from memory, uploaded with its checksum and a legal hold. */
async function put(client, name, value, source) {
  const fpr = fingerprint(name, value);
  const dir = mkdtempSync(join(tmpdir(), "escrow-"));
  try {
    const out = join(dir, "escrow.json.gpg");
    const payload = Buffer.from(JSON.stringify({ name, value, fingerprint: fpr, source, escrowed_at: new Date().toISOString() }));
    const e = encrypt(payload, out, process.env.RECIPIENTS_DIR || join(ROOT, "docs/recovery/keys"), recipients());
    payload.fill(0);
    if (e.problems.length) throw new Error(`${name}: ${e.problems.join("; ")}`);
    const r = await client.putFile(escrowKey(name, fpr), out, { "x-amz-object-lock-legal-hold": "ON" });
    if (!r.ok) throw new Error(`${name}: the escrow upload was refused: ${r.error}`);
    return { fpr, key: escrowKey(name, fpr) };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

async function vercelWrite(name, value) {
  const api = process.env.VERCEL_API || "https://api.vercel.com";
  const r = await fetch(`${api}/v10/projects/${encodeURIComponent(process.env.PRODUCTION_VERCEL_PROJECT_NAME)}/env`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json", "User-Agent": "pintar-escrow" },
    body: JSON.stringify({ key: name, value, type: "encrypted", target: ["production"] }) });
  if (r.status !== 200 && r.status !== 201) throw new Error(`${name}: Vercel refused the write (HTTP ${r.status})`);
}

export async function escrowAll() {
  need(["VERCEL_TOKEN", "PRODUCTION_VERCEL_PROJECT_NAME"]);
  const rec = recorded();
  const state = await vercelState(process.env.VERCEL_TOKEN, process.env.PRODUCTION_VERCEL_PROJECT_NAME);
  const problems = [];
  for (const n of DURABLE) {
    const s = state[n];
    if (!s?.present || !s.value) problems.push(`${n}: production holds no readable value; nothing to escrow (recover it instead)`);
    else if (!rec[n]) problems.push(`${n}: no fingerprint is recorded for it yet; record it (docs/recovery/durable-secrets.json) before escrowing`);
    else if (fingerprint(n, s.value) !== rec[n]) problems.push(`${n}: production's value does not match its recorded fingerprint; nothing is escrowed`);
  }
  if (problems.length) throw new Error(problems.join("; "));
  const client = bucket();
  const done = [];
  for (const n of DURABLE) done.push({ name: n, ...(await put(client, n, state[n].value, "vercel")) });
  return done;
}

export async function mint(verdictFile) {
  need(["VERCEL_TOKEN", "PRODUCTION_VERCEL_PROJECT_NAME"]);
  const verdicts = Object.fromEntries(readFileSync(verdictFile, "utf8").trim().split("\n").map((l) => l.split(" ")));
  const todo = DURABLE.filter((n) => verdicts[n] === "MINT");
  for (const n of DURABLE) if (!["MINT", "KEEP"].includes(verdicts[n])) throw new Error(`${n}: the guard gave no verdict; nothing is minted`);
  const client = bucket();
  const done = [];
  for (const n of todo) {
    const state = await vercelState(process.env.VERCEL_TOKEN, process.env.PRODUCTION_VERCEL_PROJECT_NAME);
    if (state[n]?.present) throw new Error(`${n} appeared in Vercel after the guard found it absent; nothing is minted`);
    const value = randomBytes(32).toString("hex");
    const e = await put(client, n, value, "minted");        // escrowed first
    await vercelWrite(n, value);                             // only then written
    done.push({ name: n, ...e });
  }
  return done;
}

export async function recover(name) {
  if (!DURABLE.includes(name)) throw new Error(`${name} is not a durable secret`);
  need(["VERCEL_TOKEN", "PRODUCTION_VERCEL_PROJECT_NAME", "RECOVERY_GNUPGHOME"]);
  const fpr = recorded()[name];
  if (!fpr) throw new Error(`${name}: no fingerprint is recorded, so no escrow can be told apart from a wrong one`);
  const state = await vercelState(process.env.VERCEL_TOKEN, process.env.PRODUCTION_VERCEL_PROJECT_NAME);
  if (state[name]?.present) {
    if (state[name].value && fingerprint(name, state[name].value) === fpr) return { name, fpr, written: false, why: "Vercel already holds the recorded value" };
    throw new Error(`${name}: Vercel holds a different value; nothing is overwritten (a ruling decides)`);
  }
  const got = await bucket().getBytes(escrowKey(name, fpr));
  if (got.status !== 200) throw new Error(`${name}: the escrow for fingerprint ${fpr} could not be read (HTTP ${got.status})`);
  const dir = mkdtempSync(join(tmpdir(), "recover-"));
  let value;
  try {
    writeFileSync(join(dir, "escrow.gpg"), got.bytes);
    const args = ["--homedir", process.env.RECOVERY_GNUPGHOME, "--batch", "--pinentry-mode", "loopback",
      ...(process.env.RECOVERY_PASSPHRASE !== undefined ? ["--passphrase-fd", "0"] : []), "--decrypt", join(dir, "escrow.gpg")];
    const r = spawnSync("gpg", args, { input: process.env.RECOVERY_PASSPHRASE ?? "", maxBuffer: 1 << 20 });
    if (r.status !== 0) throw new Error(`${name}: the escrow could not be decrypted with the custodian's key`);
    const p = JSON.parse(r.stdout.toString("utf8"));
    r.stdout.fill(0);
    value = p.value;
  } finally { rmSync(dir, { recursive: true, force: true }); }
  if (typeof value !== "string" || value.length < MIN_LENGTH || fingerprint(name, value) !== fpr) {
    throw new Error(`${name}: the escrow does not hold the recorded secret; nothing is written`);
  }
  await vercelWrite(name, value);
  return { name, fpr, written: true };
}

async function main(argv) {
  const [cmd, a] = argv;
  if (cmd === "escrow" && argv.length === 1) {
    for (const d of await escrowAll()) console.log(`escrowed ${d.name} (fingerprint ${d.fpr}) to ${d.key}, legal hold on`);
    return 0;
  }
  if (cmd === "mint" && argv.length === 2) {
    const d = await mint(a);
    for (const x of d) console.log(`minted ${x.name}, escrowed first to ${x.key} (fingerprint ${x.fpr}): record it in docs/recovery/durable-secrets.json`);
    if (d.length === 0) console.log("nothing to mint: the guard kept every durable secret");
    return 0;
  }
  if (cmd === "recover" && argv.length === 2) {
    const r = await recover(a);
    console.log(r.written ? `recovered ${r.name} (fingerprint ${r.fpr}) into Vercel's production environment` : `${r.name}: ${r.why}; nothing written`);
    return 0;
  }
  console.error("usage: escrow.mjs escrow | mint <verdict-file> | recover <NAME>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
