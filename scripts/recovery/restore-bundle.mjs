#!/usr/bin/env node
// #150 WP-B (D-106(b), (g), (j); D-108(c)(8), (d)): THE SECONDARY, LOGICAL RESTORE OF A PINTAR BUNDLE, VERIFIED.
//
// Native Supabase restore is the primary database recovery path (D-106(j)); this is the secondary one, independent of
// Supabase's own backups, and never presented as equivalent. It restores a decrypted bundle made by backup.mjs into an
// empty Supabase database (a new project, or a rehearsal's empty stack) as that database's `postgres`, with exact rights,
// and refuses to call the result safe until it is proven:
//   1  the bundle matches its manifest (every file, every hash, nothing more);
//   2  roles (platform roles and their parameter grants left to the platform: the 5 Oct restore stopped on one),
//      schema, data with triggers held off, the migration history: each in its own transaction, stopping at the
//      first error;
//   3  PINTAR's additions: the auth.users triggers, the exact rights of every PINTAR object (acl.sql: whatever the new
//      database's default privileges granted is revoked; the 5 Oct restore opened 137 tables and 490 functions to anon),
//      and the settings on Supabase's own roles (the PostgREST pre-request);
//   4  with --storage, every Storage file put back through the target's Storage S3 API, then read back and its SHA-256
//      compared with the bundle's;
//   5  verified: every table's rows and content hash, every function's definition, owner and execute rights, every
//      table's rights, the triggers, the pre-request and the policies equal the bundle's facts (0 differences; with
//      --storage the storage.objects rows are compared by bucket, name and size, the upload having rewritten their
//      ids and times); the extensions equal the bundle's and the approved baseline (D-108(c)(8)); and the readiness
//      check reads 24 of 24 PASS on the restored copy (D-108(d)).
// Only then does it print SAFE TO REOPEN; otherwise it names every difference and exits non-zero.
//
//   node restore-bundle.mjs <bundle-dir> [--storage]                 restore, then verify
//   node restore-bundle.mjs <bundle-dir> --verify-only [--storage]   verify an already restored copy, change nothing
//   node restore-bundle.mjs <bundle-dir> --files-only                #150 WP-C (B9 after a NATIVE restore, the primary
//        path): the database came back natively, with every storage.objects row but no file. Each file whose row the
//        database holds is put back from the bundle and read back by its SHA-256; nothing in the database is changed.
//        Rows the bundle has no file for, and bundle files the database has no row for, are named, never invented: the
//        native backup and the bundle are taken at different moments (RUNBOOK-NATIVE-RESTORE.md, step 5).
//
// Environment:
//   PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD [PGSSLMODE]    the target database, as its postgres
//   RESTORE_TARGET           production | staging (whose approved extension baseline applies)
//   EXTENSION_BASELINE       default docs/recovery/extension-baseline.json
//   TARGET_STORAGE_S3_ENDPOINT TARGET_STORAGE_S3_REGION TARGET_STORAGE_S3_KEY_ID TARGET_STORAGE_S3_SECRET   with --storage
//   RESTORE_READINESS_EXPECTED  a rehearsal only: a file of "VERDICT|row" lines the copy must equal, row by row, when
//                            its source did not itself read 24/24 (CI's test database); a recovery never sets it
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DATA_EXCLUDE_TABLES, RESERVED_ROLES, baselineFor, checkManifest, extensionCheck } from "./backup.mjs";
import { s3Client } from "./s3.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function psql(args, input) {
  const r = spawnSync("psql", ["-X", "-q", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", ...args], { input, encoding: "utf8", maxBuffer: 1 << 30, env: process.env });
  // psql's own error lines only, never a DETAIL line (it can quote a value)
  const err = (r.stderr ?? "").split("\n").filter((l) => /(ERROR|FATAL)/.test(l)).map((l) => l.replace(/DETAIL.*$/, "").slice(0, 240));
  return { ok: r.status === 0, out: r.stdout ?? "", err };
}

/** roles.sql as a new project accepts it: a role that exists already is kept; platform-role grants are the platform's. */
export function rolesForRestore(text) {
  const reserved = new RegExp(`"(${RESERVED_ROLES})"`);
  return text.split("\n").map((l) => {
    const create = /^CREATE ROLE ("(?:[^"]|"")+");$/.exec(l);
    if (create) return `DO $r$ BEGIN CREATE ROLE ${create[1]}; EXCEPTION WHEN duplicate_object THEN NULL; END $r$;`;
    if (/^GRANT .* ON PARAMETER /.test(l) && reserved.test(l)) return `-- left to the platform: ${l}`;
    return l;
  }).join("\n");
}

/** The facts compared line by line: T (tables), F (facts), P (functions), G (table rights). */
export function compareFacts(bundleFacts, restoredFacts, { storageRewritten = false } = {}) {
  const rows = (t) => new Map(t.split("\n").filter((l) => /^[TFPG]\|/.test(l)).map((l) => { const i = l.indexOf("|", 2); return [l.slice(0, i), l.slice(i + 1)]; }));
  const a = rows(bundleFacts), b = rows(restoredFacts);
  // the platform's own migration ledgers are not in a bundle (the CLI's exclusions): the new project keeps its own
  const platform = new Set(DATA_EXCLUDE_TABLES.map((t) => `T|${t}`));
  const skip = (k) => platform.has(k) || (storageRewritten && (k === "T|storage.objects" || k === "F|storage objects (metadata rows, bytes)"));
  const diffs = [];
  for (const [k, v] of a) {
    if (skip(k)) continue;
    if (!b.has(k)) diffs.push(`missing on the copy: ${k}`);
    else if (b.get(k) !== v) diffs.push(`differs: ${k}`);
  }
  for (const k of b.keys()) if (!a.has(k) && !skip(k)) diffs.push(`only on the copy: ${k}`);
  return { compared: a.size, diffs };
}

/** A1: the one job the application schedules (20270114110000), and how a restored copy is asked about it. */
export const SCHEDULED_JOB = "pintar-pengerjaan-tutup-terjadwal";
export function scheduledJobCheck() {
  return `select case
    when to_regprocedure('public.pengerjaan_jadwal_pasang()') is null then 'none'
    when to_regclass('cron.job') is null then 'pg_cron is not installed'
    else (select count(*) || '|' || count(*) filter (where schedule = '*/5 * * * *' and command = 'select public.pengerjaan_tutup_terjadwal()' and active and database = current_database())
            from cron.job where jobname = '${SCHEDULED_JOB}') end`;
}

/** The readiness rows, VERDICT|name. */
function readiness() {
  const r = psql(["-f", join(ROOT, "docs/audit/launch-readiness.sql")]);
  if (!r.ok) return { ok: false, rows: [], err: r.err.join(" | ") };
  return { ok: true, rows: r.out.split("\n").filter((l) => /^(PASS|FAIL)\|/.test(l)).map((l) => l.split("|").slice(0, 2).join("|")) };
}

async function restoreStorage(dir, { put = true } = {}) {
  const problems = [];
  const lines = readFileSync(join(dir, "storage/manifest.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const clients = new Map();
  const c = (bucket) => {
    if (!clients.has(bucket)) clients.set(bucket, s3Client({ endpoint: process.env.TARGET_STORAGE_S3_ENDPOINT, region: process.env.TARGET_STORAGE_S3_REGION,
      keyId: process.env.TARGET_STORAGE_S3_KEY_ID, secret: process.env.TARGET_STORAGE_S3_SECRET, bucket, pathStyle: true }));
    return clients.get(bucket);
  };
  let n = 0;
  for (const o of lines) {
    if (put) {
      const r = await c(o.bucket).putFile(o.name, join(dir, o.file), o.mimetype ? { "content-type": o.mimetype } : {});
      if (!r.ok) { problems.push(`Storage object #${n} in ${o.bucket} could not be put back: ${r.error}`); n++; continue; }
    }
    const back = await c(o.bucket).getBytes(o.name);
    if (back.status !== 200 || createHash("sha256").update(back.bytes).digest("hex") !== o.sha256) problems.push(`Storage object #${n} in ${o.bucket} does not read back as stored`);
    n++;
  }
  // and the copy's metadata rows are exactly the bundle's objects, by bucket, name and size
  const want = new Set(lines.map((o) => JSON.stringify([o.bucket, o.name, Number(o.size)])));
  const r = psql(["-c", "select coalesce(json_agg(json_build_array(bucket_id, name, (metadata->>'size')::bigint)), '[]') from storage.objects"]);
  const have = r.ok ? new Set(JSON.parse(r.out.trim()).map((x) => JSON.stringify(x))) : new Set();
  if (!r.ok) problems.push(`storage.objects could not be read: ${r.err.join(" | ")}`);
  for (const k of want) if (!have.has(k)) problems.push("a bundle object has no matching storage.objects row on the copy");
  for (const k of have) if (!want.has(k)) problems.push("the copy holds a storage.objects row the bundle does not");
  return { problems, objects: lines.length };
}

/** B9 after a native restore: put back the file of every row the database already holds; change no row. */
export async function putBackFiles(dir) {
  const m = await checkManifest(dir);
  if (m.problems.length) throw new Error(`the bundle does not match its manifest, nothing put back: ${m.problems.slice(0, 5).join("; ")}`);
  const miss = ["TARGET_STORAGE_S3_ENDPOINT", "TARGET_STORAGE_S3_REGION", "TARGET_STORAGE_S3_KEY_ID", "TARGET_STORAGE_S3_SECRET"].filter((k) => !process.env[k]);
  if (miss.length) throw new Error(`--files-only needs ${miss.join(", ")}`);
  const lines = readFileSync(join(dir, "storage/manifest.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const r = psql(["-c", "select coalesce(json_agg(json_build_array(bucket_id, name, (metadata->>'size')::bigint)), '[]') from storage.objects"]);
  if (!r.ok) throw new Error(`storage.objects could not be read: ${r.err.join(" | ")}`);
  const rows = new Map(JSON.parse(r.out.trim()).map(([b, n, size]) => [JSON.stringify([b, n]), size]));
  const inBundle = new Set(lines.map((o) => JSON.stringify([o.bucket, o.name])));
  const clients = new Map();
  const c = (bucket) => {
    if (!clients.has(bucket)) clients.set(bucket, s3Client({ endpoint: process.env.TARGET_STORAGE_S3_ENDPOINT, region: process.env.TARGET_STORAGE_S3_REGION,
      keyId: process.env.TARGET_STORAGE_S3_KEY_ID, secret: process.env.TARGET_STORAGE_S3_SECRET, bucket, pathStyle: true }));
    return clients.get(bucket);
  };
  const problems = [];
  const report = { put: 0, noRow: 0, noFile: 0, sizeDiffers: 0 };
  let n = 0;
  for (const o of lines) {
    const k = JSON.stringify([o.bucket, o.name]);
    n++;
    if (!rows.has(k)) { report.noRow++; continue; }   // gone, or never there, at the native backup's moment: not invented
    if (Number(rows.get(k)) !== Number(o.size)) { report.sizeDiffers++; problems.push(`Storage object #${n} in ${o.bucket}: the database's row says ${rows.get(k)} bytes, the bundle's file has ${o.size}; not put back`); continue; }
    const put = await c(o.bucket).putFile(o.name, join(dir, o.file), o.mimetype ? { "content-type": o.mimetype } : {});
    if (!put.ok) { problems.push(`Storage object #${n} in ${o.bucket} could not be put back: ${put.error}`); continue; }
    const back = await c(o.bucket).getBytes(o.name);
    if (back.status !== 200 || createHash("sha256").update(back.bytes).digest("hex") !== o.sha256) { problems.push(`Storage object #${n} in ${o.bucket} does not read back as stored`); continue; }
    report.put++;
  }
  for (const k of rows.keys()) if (!inBundle.has(k)) { report.noFile++; problems.push(`a storage.objects row in ${JSON.parse(k)[0]} has no file in the bundle (made after it was taken?)`); }
  return { problems, report, objects: lines.length };
}

export async function restore(dir, { storage = false, verifyOnly = false } = {}) {
  const t0 = Date.now();
  const say = (s) => console.log(s);
  const m = await checkManifest(dir);
  if (m.problems.length) throw new Error(`the bundle does not match its manifest, nothing restored: ${m.problems.slice(0, 5).join("; ")}`);
  say(`bundle: ${m.files} files, every hash as its manifest says`);
  const step = (name, args, input) => {
    const r = psql(args, input);
    if (!r.ok) throw new Error(`${name} stopped: ${r.err.slice(0, 3).join(" | ") || "psql failed"}`);
    say(`${name}: done`);
  };
  const tmp = mkdtempSync(join(tmpdir(), "restore-"));
  if (!verifyOnly) try {
    writeFileSync(join(tmp, "roles.sql"), rolesForRestore(readFileSync(join(dir, "roles.sql"), "utf8")));
    step("roles", ["--single-transaction", "-f", join(tmp, "roles.sql")]);
    step("schema and data", ["--single-transaction", "-f", join(dir, "schema.sql"), "-c", "SET session_replication_role = replica", "-f", join(dir, "data.sql")]);
    step("migration history", ["--single-transaction", "-f", join(dir, "history-schema.sql"), "-f", join(dir, "history-data.sql")]);
    step("auth.users triggers", ["--single-transaction", "-f", join(dir, "auth-triggers.sql")]);
    step("exact rights", ["-f", join(dir, "acl.sql")]);
    step("role settings", ["--single-transaction", "-f", join(dir, "role-settings.sql")]);
    // A1 (owner, Option A): pg_cron's own tables are not in the bundle (backup.mjs, PG_CRON_TABLES), so the restored
    // database has the function and no job. The idempotent installer puts the one job back (a bundle taken before A1
    // has no installer and needs none).
    step("scheduled job", ["-c", "do $$ begin if to_regprocedure('public.pengerjaan_jadwal_pasang()') is not null then perform public.pengerjaan_jadwal_pasang(); end if; end $$"]);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  else rmSync(tmp, { recursive: true, force: true });

  const problems = [];
  let st = null;
  if (storage) {
    const miss = ["TARGET_STORAGE_S3_ENDPOINT", "TARGET_STORAGE_S3_REGION", "TARGET_STORAGE_S3_KEY_ID", "TARGET_STORAGE_S3_SECRET"].filter((k) => !process.env[k]);
    if (miss.length) throw new Error(`--storage needs ${miss.join(", ")}`);
    st = await restoreStorage(dir, { put: !verifyOnly });
    problems.push(...st.problems);
    say(`Storage: ${st.objects} object(s) ${verifyOnly ? "" : "put back and "}read back`);
  }
  // 5. verified
  const facts = psql(["-f", join(ROOT, "audit/restore/fakta.sql")]);
  if (!facts.ok) problems.push(`the copy's facts could not be read: ${facts.err.join(" | ")}`);
  const cmp = compareFacts(readFileSync(join(dir, "facts.txt"), "utf8"), facts.out, { storageRewritten: storage });
  problems.push(...cmp.diffs.slice(0, 20), ...(cmp.diffs.length > 20 ? [`and ${cmp.diffs.length - 20} more differences`] : []));
  say(`facts: ${cmp.compared} compared, ${cmp.diffs.length} difference(s)`);
  const ext = psql(["-c", "select json_object_agg(extname, extversion) from pg_extension"]);
  const have = ext.ok ? JSON.parse(ext.out.trim()) : null;
  const bundled = JSON.parse(readFileSync(join(dir, "extensions.json"), "utf8")).extensions;
  problems.push(...extensionCheck(have, bundled, "the bundle").map((p) => `against the bundle: ${p}`));
  problems.push(...extensionCheck(have, baselineFor(process.env.RESTORE_TARGET), process.env.RESTORE_TARGET || "an unnamed target").map((p) => `against the approved baseline: ${p}`));
  say(`extensions: ${Object.keys(have ?? {}).length}, checked against the bundle and the approved baseline`);
  // A1: the abandoned-sitting job exists exactly once, as the five-minute call of the entry point, in this database
  const job = psql(["-c", scheduledJobCheck()]);
  const jobSays = job.ok ? job.out.trim() : `could not be read: ${job.err.join(" | ")}`;
  if (jobSays !== "none" && jobSays !== "1|1") problems.push(`the scheduled job ${SCHEDULED_JOB} is not installed exactly once as the five-minute call of the entry point (jobs of that name|as it should be: ${jobSays}); run select public.pengerjaan_jadwal_pasang() as postgres`);
  say(`scheduled job: ${jobSays === "none" ? "none in this bundle's schema" : jobSays === "1|1" ? "installed once" : jobSays}`);
  const ready = readiness();
  if (!ready.ok) problems.push(`the readiness check could not run: ${ready.err}`);
  else if (process.env.RESTORE_READINESS_EXPECTED) {
    const want = readFileSync(process.env.RESTORE_READINESS_EXPECTED, "utf8").trim().split("\n");
    const differ = want.filter((l) => !ready.rows.includes(l));
    if (differ.length || want.length !== ready.rows.length) problems.push(`readiness differs from its source on: ${differ.join("; ") || `${ready.rows.length} rows, not ${want.length}`}`);
    say(`readiness: ${ready.rows.filter((l) => l.startsWith("PASS")).length} PASS, as its source (a rehearsal)`);
  } else {
    const pass = ready.rows.filter((l) => l.startsWith("PASS")).length;
    if (pass !== 24 || ready.rows.length !== 24) problems.push(`readiness reads ${pass} of ${ready.rows.length} PASS, not 24 of 24: ${ready.rows.filter((l) => l.startsWith("FAIL")).join("; ")}`);
    say(`readiness: ${pass} of ${ready.rows.length} PASS`);
  }
  const seconds = Math.round((Date.now() - t0) / 1000);
  if (problems.length) throw new Error(`the restored copy is NOT safe to reopen:\n  ${problems.join("\n  ")}`);
  return { seconds, facts: cmp.compared, storage: st?.objects ?? null };
}

async function main(argv) {
  const dir = argv.find((a) => !a.startsWith("--"));
  if (!dir || !existsSync(dir)) { console.error("usage: restore-bundle.mjs <bundle-dir> [--storage | --verify-only [--storage] | --files-only]"); return 2; }
  if (argv.includes("--files-only")) {
    const f = await putBackFiles(dir);
    console.log(`files: ${f.report.put} put back and read back by hash; ${f.report.noRow} bundle file(s) with no row in the database ` +
      `(not invented); ${f.report.noFile} row(s) with no file in the bundle; ${f.report.sizeDiffers} of another size`);
    if (f.problems.length) { for (const p of f.problems) console.log(`::error::${p}`); return 1; }
    console.log("FILES PUT BACK: every row the database holds has its file, as the bundle stored it");
    return 0;
  }
  const r = await restore(dir, { storage: argv.includes("--storage"), verifyOnly: argv.includes("--verify-only") });
  console.log(`SAFE TO REOPEN: the copy equals the bundle (${r.facts} facts${r.storage === null ? "" : `, ${r.storage} Storage objects`}), ` +
    `its extensions equal the approved baseline and readiness passes; restored and verified in ${r.seconds} s`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
