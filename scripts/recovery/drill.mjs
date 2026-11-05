#!/usr/bin/env node
// #150 WP-B (D-107 D3, D5; closure plan A1, A5 condition 10): WHAT THE DRILL TAKES, AND WHAT IT CHECKS WITHOUT DECRYPTING.
//
//   fetch <target> <out-dir>      the newest bundle of <target> that HAS its success record (condition 10: a bundle
//                                 without one is incomplete and is never taken), downloaded with C5, its SHA-256 equal to
//                                 the record's and to the checksum S3 stored; prints the record's facts
//   check-production              production's newest complete bundle: its checksum as above, its retention lock, and its
//                                 recipients exactly DRILL_PRODUCTION_RECIPIENTS (R1 and R2, never one alone: D-109(c)),
//                                 read from the ciphertext's packets. Never decrypted (D5)
//   possession <R1|R2> <out-dir>  the quarterly key-possession check: a random 20-letter phrase encrypted to one recovery
//                                 key (armored, to give the custodian) and the phrase's SHA-256 (to compare the answer);
//                                 the phrase itself is never printed
//
// Environment: DRILL_S3_ENDPOINT DRILL_S3_REGION DRILL_S3_BUCKET DRILL_S3_KEY_ID DRILL_S3_SECRET [DRILL_S3_PATH_STYLE] (C5)
//              RECIPIENTS_DIR (default docs/recovery/keys)
import { createHash, randomInt } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkRecipients, encrypt, keyInfo, recipientsFor } from "./backup.mjs";
import { s3Client } from "./s3.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const keysDir = () => process.env.RECIPIENTS_DIR || join(ROOT, "docs/recovery/keys");

/** Condition 10: the newest bundle whose success record exists; a bundle without one is never chosen. */
export function latestComplete(keys, target) {
  const all = new Set(keys.map((k) => (typeof k === "string" ? k : k.key)));
  const bundles = [...all].filter((k) => new RegExp(`^${target}/(daily|monthly)/[^/]+/pintar-${target}-\\d{8}T\\d{6}Z\\.tar\\.gz\\.gpg$`).test(k));
  const complete = bundles.filter((k) => all.has(`${k}.success.json`));
  complete.sort((a, b) => (a.split("/").pop() < b.split("/").pop() ? 1 : -1));
  return { chosen: complete[0] ?? null, incomplete: bundles.filter((k) => !all.has(`${k}.success.json`)) };
}

function client() {
  const region = process.env.DRILL_S3_REGION;
  return s3Client({ endpoint: process.env.DRILL_S3_ENDPOINT || `https://s3.${region}.amazonaws.com`, region, keyId: process.env.DRILL_S3_KEY_ID,
    secret: process.env.DRILL_S3_SECRET, bucket: process.env.DRILL_S3_BUCKET, pathStyle: process.env.DRILL_S3_PATH_STYLE === "1" });
}

export async function fetchLatest(target, out) {
  const c = client();
  const l = latestComplete(await c.list(`${target}/`), target);
  if (!l.chosen) throw new Error(`no complete ${target} bundle (one with its success record) exists`);
  const rec = await c.getBytes(`${l.chosen}.success.json`);
  if (rec.status !== 200) throw new Error(`the success record of ${l.chosen} could not be read (HTTP ${rec.status})`);
  const record = JSON.parse(rec.bytes.toString("utf8"));
  const head = await c.head(l.chosen);
  const b = await c.getBytes(l.chosen);
  if (b.status !== 200) throw new Error(`${l.chosen} could not be read (HTTP ${b.status})`);
  const sha = createHash("sha256").update(b.bytes).digest();
  if (sha.toString("hex") !== record.bundle?.sha256) throw new Error(`${l.chosen} does not match its success record's SHA-256`);
  if (head.checksum && head.checksum !== sha.toString("base64")) throw new Error(`${l.chosen} does not match the checksum S3 stored`);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "bundle.tar.gz.gpg"), b.bytes);
  writeFileSync(join(out, "success.json"), JSON.stringify(record, null, 2));
  return { key: l.chosen, record, head, skipped: l.incomplete.length };
}

export async function checkProduction() {
  const dir = mkdtempSync(join(tmpdir(), "drill-prod-"));
  try {
    const f = await fetchLatest("production", dir);
    const problems = [];
    if (f.head.lockMode !== "GOVERNANCE" || !f.head.retainUntil) problems.push(`${f.key} carries no GOVERNANCE retention`);
    const home = mkdtempSync(join(tmpdir(), "drill-keys-"));
    try {
      // exactly the recipients production's backups are made for (R1 and R2; D-109(c))
      const r = recipientsFor("production", process.env.DRILL_PRODUCTION_RECIPIENTS || "R1 R2");
      if (r.problems.length) throw new Error(r.problems.join("; "));
      const expected = r.list.map((n) => keyInfo(join(keysDir(), `${n}.asc`), home).subkeys);
      problems.push(...checkRecipients(join(dir, "bundle.tar.gz.gpg"), expected, r.list).problems);
    } finally { rmSync(home, { recursive: true, force: true }); }
    if (problems.length) throw new Error(problems.join("; "));
    return f;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, read aloud without doubt
export function possession(name, out) {
  if (!["R1", "R2"].includes(name)) throw new Error("the possession check is for R1 or R2");
  const phrase = Array.from({ length: 20 }, () => LETTERS[randomInt(LETTERS.length)]).join("").replace(/(.{4})(?!$)/g, "$1-");
  mkdirSync(out, { recursive: true });
  const e = encrypt(Buffer.from(`${phrase}\n`), join(out, `${name}-possession.asc`), keysDir(), [name], { armor: true });
  if (e.problems.length) throw new Error(e.problems.join("; "));
  return { sha256: createHash("sha256").update(phrase).digest("hex"), file: join(out, `${name}-possession.asc`) };
}

async function main(argv) {
  const [cmd, a, b] = argv;
  if (cmd === "fetch" && argv.length === 3) {
    const f = await fetchLatest(a, b);
    console.log(`fetched ${f.key} (${f.record.bundle.bytes} bytes, its SHA-256 as its record and S3 say; ${f.skipped} incomplete bundle(s) never taken): ` +
      `${f.record.database.tables} tables, ${f.record.database.rows} rows, ${f.record.storage.objects} Storage objects`);
    return 0;
  }
  if (cmd === "check-production" && argv.length === 1) {
    const f = await checkProduction();
    console.log(`production's newest complete bundle ${f.key}: checksum as recorded, locked until ${f.head.retainUntil}, encrypted to exactly its recipients; never decrypted`);
    return 0;
  }
  if (cmd === "possession" && argv.length === 3) {
    const p = possession(a, b);
    console.log(`possession check for ${a}: give the custodian ${p.file}; the answer's SHA-256 must be ${p.sha256}`);
    return 0;
  }
  console.error("usage: drill.mjs fetch <target> <out-dir> | check-production | possession <R1|R2> <out-dir>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
