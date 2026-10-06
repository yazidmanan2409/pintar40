#!/usr/bin/env node
// #150 WP-B (D-106(b) B4 and B9, D-107; closure plan A1, A2, A5, A7): PINTAR'S INDEPENDENT BACKUP, FAIL CLOSED.
//
// One run makes one bundle of the database AND of every Storage file, from one moment, encrypts it to recovery keys
// whose private halves this job never holds, uploads it to the owner's own S3 bucket outside Supabase and Vercel, and
// writes its success record LAST. A run is successful only when all ten of the closure plan's A5 conditions hold:
//    1  one exported snapshot: the dumps, the facts, the expected Storage list and the additions read the same moment;
//    2  the database dump is complete: every dump exits 0; the data dump holds a COPY section for exactly the tables the
//       snapshot holds (no more, no fewer), each with the snapshot's row count, and a setval for every sequence;
//    3  PINTAR's additions are present: the auth.users triggers (as many as the snapshot holds), the exact rights of
//       every PINTAR object (acl.sql), the role settings (the PostgREST pre-request) and the facts (every table's rows
//       and content hash; each function's definition, owner and who may execute it; the rights, triggers and policies).
//       The readiness check is NOT run here: it calls PINTAR's functions, which pintar_backup may not execute (A7). It
//       is run where it decides something, on the restored copy (restore-bundle.mjs: 24/24 or the restore fails);
//    4  Storage is complete: exactly the snapshot's storage.objects rows, each downloaded, its size and MD5/ETag equal
//       to its metadata, its SHA-256 recorded (3 tries each, then the run fails);
//    5  the bundle's manifest lists every file with its SHA-256, and the tar, read back, equals it;
//    6  gpg encrypts it, and the ciphertext's recipients are exactly the expected keys (no decryption needed);
//    7  the upload carries x-amz-checksum-sha256, so S3 itself rejects any byte that differs;
//    8  the upload sets its own retention (Object Lock GOVERNANCE until the date D-107 D4 gives);
//    9  the success record (counts, sizes, hashes, snapshot, release; no value) is uploaded last: a bundle without one
//       is by definition incomplete;
//   10  whatever reads bundles back (the drill, a restore) takes only a bundle that has its success record.
// Anything else ends the run red with no success record.
//
// The database is read as `pintar_backup` (C2; migration 20261125100000): it reads everything and writes nothing. Its
// password arrives only as PGPASSWORD in this process's environment; it is never on a command line, in a URL, a file
// of the bundle or the log. A compromise of it could expose the complete database (A7).
//
//   node backup.mjs run                       the whole run (the workflow backup-offsite.yml)
//   node backup.mjs collect <dir>             conditions 1-5 into <dir>: the bundle's content, nothing uploaded
//   node backup.mjs seal <dir> <out.gpg>      conditions 5-6: tar, read back, encrypt, check the recipients
//   node backup.mjs dumps <dir>               the five dumps alone (selftest DR-S15 compares pintar_backup's with postgres's)
//
// Environment:
//   PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD [PGSSLMODE PGSSLROOTCERT]   the database, as pintar_backup
//   PINTAR_PG_BIN        a directory holding pg_dump and pg_dumpall of the server's major version (default: PATH)
//   PINTAR_SNAPSHOT      dump from this already-exported snapshot instead of exporting one (comparison runs only)
//   STORAGE_S3_ENDPOINT STORAGE_S3_REGION STORAGE_S3_KEY_ID STORAGE_S3_SECRET         C3, Supabase Storage's S3 API
//   BACKUP_TARGET        production | staging
//   BACKUP_RECIPIENTS    the recovery keys, e.g. "R1 R2" (production may never name R3; staging must name R3)
//   RECIPIENTS_DIR       where R1.asc, R2.asc, R3.asc are (default docs/recovery/keys)
//   BACKUP_S3_ENDPOINT BACKUP_S3_REGION BACKUP_S3_BUCKET BACKUP_S3_KEY_ID BACKUP_S3_SECRET [BACKUP_S3_PATH_STYLE]  C4
//   RELEASE_SHA GITHUB_RUN_ID BACKUP_NOW (an ISO time; tests only)
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";
import { s3Client } from "./s3.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ─── the Supabase CLI 2.117.0's own dump (supabase db dump --dry-run), without its --role "postgres" (A2)
export const RESERVED_ROLES = "anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin";
export const SCHEMA_EXCLUDE = "information_schema|pg_*|_analytics|_realtime|_supavisor|auth|etl|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault";
export const DATA_EXCLUDE = "information_schema|pg_*|graphql|graphql_public|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault|etl|extensions|pgbouncer|realtime|supabase_migrations|_analytics|_realtime|_supavisor";
export const DATA_EXCLUDE_TABLES = ["auth.schema_migrations", "storage.migrations", "supabase_functions.migrations", "storage.buckets_vectors", "storage.vector_indexes"];

/** pg_dump's name pattern (a | b | pg_*) as an anchored SQL regular expression. */
export function patternRegex(p) {
  return "^(" + p.split("|").map((x) => x.replace(/[.+?^${}()[\]\\]/g, "\\$&").replace(/\*/g, ".*")).join("|") + ")$";
}

const ROLE_SEDS = [
  [/^\\(un)?restrict .*$/, (m) => `-- ${m}`],
  [new RegExp(`^CREATE ROLE "(${RESERVED_ROLES})"`), (m) => `-- ${m}`],
  [new RegExp(`^ALTER ROLE "(${RESERVED_ROLES})"`), (m) => `-- ${m}`],
  [/ (NOSUPERUSER|NOREPLICATION)/g, () => ""],
  [/^-- (.* SET "(pgaudit.*|pgrst.*|session_replication_role|statement_timeout|track_io_timing)" .*)/, (_m, a) => a],
  [new RegExp(`GRANT ".*" TO "(${RESERVED_ROLES})"`), (m) => `-- ${m}`],
];
const internal = (x) => new RegExp(`^${x} (.+) ON (.+) "(${SCHEMA_EXCLUDE})"`);
const schemaSeds = (exclude) => [
  [/^\\(un)?restrict .*$/, (m) => `-- ${m}`],
  [/^CREATE SCHEMA "/, () => 'CREATE SCHEMA IF NOT EXISTS "'],
  [/^CREATE TABLE "/, () => 'CREATE TABLE IF NOT EXISTS "'],
  [/^CREATE SEQUENCE "/, () => 'CREATE SEQUENCE IF NOT EXISTS "'],
  [/^CREATE VIEW "/, () => 'CREATE OR REPLACE VIEW "'],
  [/^CREATE FUNCTION "/, () => 'CREATE OR REPLACE FUNCTION "'],
  [/^CREATE TRIGGER "/, () => 'CREATE OR REPLACE TRIGGER "'],
  [/^CREATE PUBLICATION "supabase_realtime/, (m) => `-- ${m}`],
  [/^CREATE EVENT TRIGGER /, (m) => `-- ${m}`],
  [/^ {9}WHEN TAG IN /, (m) => `-- ${m}`],
  [/^ {3}EXECUTE FUNCTION /, (m) => `-- ${m}`],
  [/^ALTER EVENT TRIGGER /, (m) => `-- ${m}`],
  [/^ALTER PUBLICATION "supabase_realtime_/, (m) => `-- ${m}`],
  [/^ALTER FOREIGN DATA WRAPPER (.+) OWNER TO /, (m) => `-- ${m}`],
  [/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/, (m) => `-- ${m}`],
  [/^GRANT ALL ON FOREIGN DATA WRAPPER (.+) TO "postgres" WITH GRANT OPTION/, (m) => `-- ${m}`],
  ...(exclude ? [[internal("GRANT"), (m) => `-- ${m}`], [internal("REVOKE"), (m) => `-- ${m}`]] : []),
  [/^(CREATE EXTENSION IF NOT EXISTS "pg_tle").+/, (_m, a) => `${a};`],
  [/^(CREATE EXTENSION IF NOT EXISTS "pgsodium").+/, (_m, a) => `${a};`],
  [/^(CREATE EXTENSION IF NOT EXISTS "pgmq").+/, (_m, a) => `${a};`],
  [/^COMMENT ON EXTENSION (.+)/, (m) => `-- ${m}`],
  [/^CREATE POLICY "cron_job_/, (m) => `-- ${m}`],
  [/^ALTER TABLE "cron"/, (m) => `-- ${m}`],
  [/^SET transaction_timeout = 0;/, (m) => `-- ${m}`],
];
const DATA_SEDS = [[/^\\(un)?restrict .*$/, (m) => `-- ${m}`]];

/** The five dumps: [file, tool, args, seds, drop comment lines, collapse repeats, head, tail, take the snapshot]. */
export function dumpPlan() {
  const ex = DATA_EXCLUDE_TABLES.flatMap((t) => ["--exclude-table", `"${t.split(".")[0]}"."${t.split(".")[1]}"`]);
  return [
    { file: "roles.sql", tool: "pg_dumpall", args: ["--roles-only", "--quote-all-identifier", "--no-role-passwords", "--no-comments"],
      seds: ROLE_SEDS, dropComments: true, uniq: true, tail: "RESET ALL;\n", snapshot: false },
    { file: "schema.sql", tool: "pg_dump", args: ["--schema-only", "--quote-all-identifier", "--exclude-schema", SCHEMA_EXCLUDE],
      seds: schemaSeds(true), dropComments: true, snapshot: true },
    { file: "data.sql", tool: "pg_dump", args: ["--data-only", "--quote-all-identifier", "--exclude-schema", DATA_EXCLUDE, ...ex.slice(0, 6), "--schema", "*", ...ex.slice(6)],
      seds: DATA_SEDS, head: "SET session_replication_role = replica;\n\n", tail: "RESET ALL;\n", snapshot: true },
    { file: "history-schema.sql", tool: "pg_dump", args: ["--schema-only", "--quote-all-identifier", "--schema=supabase_migrations"],
      seds: schemaSeds(false), dropComments: true, snapshot: true },
    { file: "history-data.sql", tool: "pg_dump", args: ["--data-only", "--quote-all-identifier", "--schema", "supabase_migrations"],
      seds: DATA_SEDS, head: "SET session_replication_role = replica;\n\n", tail: "RESET ALL;\n", snapshot: true },
  ];
}

function transform(line, seds) {
  for (const [re, f] of seds) line = line.replace(re, f);
  return line;
}

/** Run one dump, line by line through its filters, into <dir>/<file>. Never passes the password on a command line. */
async function runDump(plan, dir, snapshot) {
  const bin = process.env.PINTAR_PG_BIN ? join(process.env.PINTAR_PG_BIN, plan.tool) : plan.tool;
  const args = [...plan.args, ...(plan.snapshot && snapshot ? [`--snapshot=${snapshot}`] : [])];
  const p = spawn(bin, args, { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  const out = createWriteStream(join(dir, plan.file));
  let err = "";
  p.stderr.on("data", (b) => { err += b; });
  if (plan.head) out.write(plan.head);
  let previous = null;
  for await (const raw of createInterface({ input: p.stdout, crlfDelay: Infinity })) {
    const line = transform(raw, plan.seds);
    if (plan.dropComments && line.startsWith("--")) continue;
    if (plan.uniq && line === previous) continue;
    previous = line;
    out.write(line + "\n");
  }
  if (plan.tail) out.write(plan.tail);
  const code = await new Promise((ok) => p.on("close", ok));
  await new Promise((ok) => out.end(ok));
  // pg_dump's warnings about circular foreign keys are expected for a data-only dump; anything else is not
  const warnings = err.split("\n").filter((l) => l.trim() && !/circular foreign-key constraints|^pg_dump: (detail|hint): /.test(l));
  if (code !== 0) throw new Error(`${plan.file}: ${plan.tool} exited ${code}: ${warnings.slice(-2).join(" | ").slice(0, 300)}`);
  return { file: plan.file, warnings: warnings.length };
}

// ─── psql, with or without the snapshot
function psqlRun(sql, { snapshot, json = false } = {}) {
  const wrapped = snapshot
    ? `begin isolation level repeatable read read only;\nset transaction snapshot '${snapshot}';\n${sql}\ncommit;\n`
    : sql;
  const r = spawnSync("psql", ["-X", "-q", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-f", "-"], { input: wrapped, encoding: "utf8", maxBuffer: 1 << 30, env: process.env });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").slice(-2).join(" | ").slice(0, 300)}`);
  return json ? JSON.parse(r.stdout.trim() || "null") : r.stdout;
}

/** Holds one exported snapshot open in its own session (condition 1). */
export async function exportSnapshot() {
  const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1"], { env: process.env });
  let out = "";
  p.stdout.on("data", (b) => (out += b));
  p.stderr.on("data", (b) => (out += b));
  // this session's own limit: the dumps it serves may outlast the role's 15-minute default
  p.stdin.write("set idle_in_transaction_session_timeout = '6h';\nbegin isolation level repeatable read read only;\n" +
    "select 'SNAPSHOT ' || pg_export_snapshot() || ' ' || to_char(now() at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"');\n");
  const [, id, at] = await new Promise((ok, no) => {
    const t0 = Date.now();
    const look = () => {
      const m = /^SNAPSHOT (\S+) (\S+)$/m.exec(out);
      if (m) return ok(m);
      if (Date.now() - t0 > 30000 || p.exitCode !== null) return no(new Error(`no snapshot could be exported: ${out.trim().slice(0, 200)}`));
      setTimeout(look, 50);
    };
    look();
  });
  return { id, at, release: () => new Promise((ok) => { if (p.exitCode !== null) return ok(); p.on("close", () => ok()); p.stdin.end("commit;\n"); }) };
}

/** The tables, counts, sequences, Storage objects and catalog facts a complete bundle must hold, read in the snapshot. */
export function expectations(snapshot) {
  const dataSchemas = patternRegex(DATA_EXCLUDE);
  const pintar = patternRegex(SCHEMA_EXCLUDE);
  const excluded = DATA_EXCLUDE_TABLES.map((t) => `'${t}'`).join(", ");
  const list = psqlRun(`
    select coalesce(json_agg(json_build_object('s', n.nspname, 't', c.relname) order by n.nspname, c.relname), '[]')
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where c.relkind = 'r' and n.nspname !~ '${dataSchemas}' and (n.nspname || '.' || c.relname) not in (${excluded})
       and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e'
                       and not exists (select 1 from pg_extension e where e.oid = d.refobjid and c.oid = any(e.extconfig)));`, { snapshot, json: true });
  const tables = list.map((x) => ({ ...x, rows: 0 }));
  if (tables.length > 0) {
    const sql = tables.map((x, i) => `select ${i} as i, count(*) as n from ${quoteIdent(x.s)}.${quoteIdent(x.t)}`).join("\nunion all\n");
    for (const l of psqlRun(`${sql};`, { snapshot }).trim().split("\n").filter(Boolean)) {
      const [i, n] = l.split("|"); tables[Number(i)].rows = Number(n);
    }
  }
  const facts = psqlRun(`
    select json_build_object(
      'sequences', (select coalesce(json_agg(n.nspname || '.' || c.relname order by 1), '[]') from pg_class c join pg_namespace n on n.oid = c.relnamespace
                     where c.relkind = 'S' and n.nspname !~ '${dataSchemas}'
                       and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e')),
      'history_rows', (select count(*) from supabase_migrations.schema_migrations),
      'large_objects', (select count(*) from pg_largeobject_metadata),
      'auth_triggers', (select count(*) from pg_trigger where tgrelid = to_regclass('auth.users') and not tgisinternal),
      'pintar_schemas', (select coalesce(json_agg(nspname order by nspname), '[]') from pg_namespace where nspname !~ '${pintar}'),
      'pintar_objects', (select (select count(*) from pg_namespace where nspname !~ '${pintar}')
                              + (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                                  where n.nspname !~ '${pintar}' and c.relkind in ('r','p','v','m','S','f'))
                              + (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname !~ '${pintar}' and p.prokind in ('f','p','a','w')
                                    and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'))),
      'pre_request', (select count(*) from pg_roles r, unnest(r.rolconfig) x where r.rolname = 'authenticator' and x like 'pgrst.db_pre_request=%'),
      'objects', (select coalesce(json_agg(json_build_object('bucket', bucket_id, 'name', name, 'size', metadata->>'size', 'etag', metadata->>'eTag',
                                   'mimetype', metadata->>'mimetype') order by bucket_id, name), '[]') from storage.objects));`, { snapshot, json: true });
  return { tables, ...facts };
}

function quoteIdent(s) { return `"${s.replace(/"/g, '""')}"`; }

/** Condition 2: the data dump's COPY sections and setvals against the snapshot's tables, rows and sequences. */
export async function verifyData(file, tables, sequences, label = "data dump") {
  const seen = new Map();
  const setvals = new Set();
  let current = null, n = 0;
  for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
    if (current !== null) {
      if (line === "\\.") { seen.set(current, (seen.get(current) ?? 0) + n); current = null; } else n++;
      continue;
    }
    const m = /^COPY "((?:[^"]|"")+)"\."((?:[^"]|"")+)" .*FROM stdin;$/.exec(line);
    if (m) { current = `${m[1].replace(/""/g, '"')}.${m[2].replace(/""/g, '"')}`; n = 0; continue; }
    const s = /^SELECT pg_catalog\.setval\('"((?:[^"]|"")+)"\."((?:[^"]|"")+)"'/.exec(line);
    if (s) setvals.add(`${s[1]}.${s[2]}`);
  }
  const problems = [];
  if (current !== null) problems.push(`${label}: the COPY of ${current} never ends`);
  const want = new Map(tables.map((x) => [`${x.s}.${x.t}`, x.rows]));
  for (const [t, rows] of want) {
    if (!seen.has(t)) problems.push(`${label}: no COPY for ${t}`);
    else if (seen.get(t) !== rows) problems.push(`${label}: ${t} holds ${seen.get(t)} rows, the snapshot ${rows}`);
  }
  for (const t of seen.keys()) if (!want.has(t)) problems.push(`${label}: a COPY for ${t}, which the snapshot does not list`);
  for (const q of sequences ?? []) if (!setvals.has(q)) problems.push(`${label}: no setval for the sequence ${q}`);
  return { problems, tables: seen.size, rows: [...seen.values()].reduce((a, b) => a + b, 0), sequences: setvals.size };
}

/** PINTAR's additions (condition 3), read in the snapshot. */
function additions(dir, snapshot, exp) {
  const pintar = patternRegex(SCHEMA_EXCLUDE);
  const trig = psqlRun(`select regexp_replace(pg_get_triggerdef(t.oid), '^CREATE TRIGGER', 'CREATE OR REPLACE TRIGGER') || ';'
                          || case t.tgenabled when 'D' then E'\\nALTER TABLE auth.users DISABLE TRIGGER ' || quote_ident(t.tgname) || ';' else '' end
                          from pg_trigger t where t.tgrelid = to_regclass('auth.users') and not t.tgisinternal order by t.tgname;`, { snapshot });
  writeFileSync(join(dir, "auth-triggers.sql"), `-- the triggers PINTAR keeps on auth.users (a schema the dump leaves to the platform)\n${trig}`);
  const nTrig = (trig.match(/^CREATE OR REPLACE TRIGGER /gm) ?? []).length;
  const settings = psqlRun(`select format('ALTER ROLE %I SET %I TO %L;', r.rolname, split_part(x, '=', 1), substr(x, strpos(x, '=') + 1))
                              from pg_roles r, unnest(r.rolconfig) x
                             where r.rolname in ('anon', 'authenticated', 'authenticator', 'service_role')
                               and split_part(x, '=', 1) ~ '^(pgaudit\\..*|pgrst\\..*|session_replication_role|statement_timeout|track_io_timing)$'
                             order by 1;`, { snapshot });
  writeFileSync(join(dir, "role-settings.sql"), `-- the settings PINTAR keeps on Supabase's own roles (the PostgREST pre-request among them)\n${settings}`);
  const nPre = (settings.match(/SET "pgrst\.db_pre_request" TO /g) ?? []).length;
  const acl = psqlRun(`
    with o as (
      select 'SCHEMA' as kind, quote_ident(n.nspname) as ident, n.nspowner as owner, coalesce(n.nspacl, acldefault('n', n.nspowner)) as acl, null::text as col
        from pg_namespace n where n.nspname ~ '${pintar}' is false
      union all
      select case c.relkind when 'S' then 'SEQUENCE' else 'TABLE' end, c.oid::regclass::text, c.relowner,
             coalesce(c.relacl, acldefault((case c.relkind when 'S' then 's' else 'r' end)::"char", c.relowner)), null
        from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname ~ '${pintar}' is false and c.relkind in ('r','p','v','m','S','f')
      union all
      select 'ROUTINE', p.oid::regprocedure::text, p.proowner, coalesce(p.proacl, acldefault('f', p.proowner)), null
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname ~ '${pintar}' is false and p.prokind in ('f','p','a','w')
         and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
      union all
      select 'COLUMN', a.attrelid::regclass::text, c.relowner, a.attacl, quote_ident(a.attname)
        from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
       where n.nspname ~ '${pintar}' is false and a.attnum > 0 and not a.attisdropped and a.attacl is not null)
    select format('(%L, %L, %L, %L, %L::aclitem[]),', kind, ident, col, pg_get_userbyid(owner), acl::text) from o order by kind, ident, col;`, { snapshot });
  const rows = acl.trim().split("\n").filter(Boolean);
  writeFileSync(join(dir, "acl.sql"), aclScript(rows));
  const nAcl = rows.filter((r) => !/^\('COLUMN'/.test(r)).length;
  const facts = psqlRun(readFileSync(join(ROOT, "audit/restore/fakta.sql"), "utf8"), { snapshot });
  writeFileSync(join(dir, "facts.txt"), facts);
  const problems = [];
  if (nTrig !== exp.auth_triggers) problems.push(`auth-triggers.sql holds ${nTrig} trigger(s), the snapshot ${exp.auth_triggers}`);
  if (nPre !== exp.pre_request) problems.push(`role-settings.sql holds ${nPre} pre-request setting(s), the snapshot ${exp.pre_request}`);
  if (nAcl !== exp.pintar_objects) problems.push(`acl.sql covers ${nAcl} object(s), the snapshot holds ${exp.pintar_objects}`);
  if ((facts.match(/^T\|/gm) ?? []).length < 1) problems.push("facts.txt holds no table");
  return { problems, auth_triggers: nTrig, pre_request: nPre, acl_objects: nAcl };
}

/**
 * acl.sql: the exact rights of every PINTAR object, put back on a restored database whatever its default privileges
 * granted (the 5 Oct logical restore opened 137 tables and 490 functions to anon this way). For each object: every
 * right held by anyone but its owner is revoked, then exactly the recorded rights are granted. Columns too.
 */
export function aclScript(rows) {
  return `-- #150 WP-B: the exact rights of every PINTAR object at the backup's snapshot (scripts/recovery/backup.mjs).
-- Applied after the schema and data, as the objects' owner: every right not recorded here is revoked, every recorded
-- right is granted. Rights only; no value.
begin;
create temporary table pintar_acl (kind text, ident text, col text, owner name, acl aclitem[]) on commit drop;
${rows.length ? `insert into pintar_acl values\n${rows.join("\n").replace(/,$/, ";")}` : "-- no object"}
do $acl$
declare
  e record; g record; v_now aclitem[]; v_owner oid; v_kw text; v_on text; v_who text;
begin
  for e in select * from pintar_acl order by kind, ident, col loop
    v_kw := case e.kind when 'COLUMN' then 'TABLE' else e.kind end;
    if e.kind = 'SCHEMA' then
      select coalesce(nspacl, acldefault('n', nspowner)), nspowner into v_now, v_owner from pg_namespace where oid = e.ident::regnamespace;
    elsif e.kind in ('TABLE', 'SEQUENCE') then
      select coalesce(relacl, acldefault((case relkind when 'S' then 's' else 'r' end)::"char", relowner)), relowner into v_now, v_owner from pg_class where oid = e.ident::regclass;
    elsif e.kind = 'ROUTINE' then
      select coalesce(proacl, acldefault('f', proowner)), proowner into v_now, v_owner from pg_proc where oid = e.ident::regprocedure;
    else
      select a.attacl, c.relowner into v_now, v_owner from pg_attribute a join pg_class c on c.oid = a.attrelid
       where a.attrelid = e.ident::regclass and quote_ident(a.attname) = e.col;
    end if;
    v_on := case when e.kind = 'COLUMN' then format('(%s) ON TABLE %s', e.col, e.ident) else format('ON %s %s', v_kw, e.ident) end;
    for g in select distinct a.grantee from aclexplode(coalesce(v_now, '{}')) a where a.grantee <> v_owner loop
      v_who := case when g.grantee = 0 then 'PUBLIC' else quote_ident(pg_get_userbyid(g.grantee)) end;
      execute format('REVOKE ALL %s FROM %s', v_on, v_who);
    end loop;
    for g in select a.grantee, a.privilege_type, a.is_grantable from aclexplode(e.acl) a where a.grantee <> e.owner::regrole loop
      v_who := case when g.grantee = 0 then 'PUBLIC' else quote_ident(pg_get_userbyid(g.grantee)) end;
      execute format('GRANT %s %s TO %s%s', g.privilege_type,
                     case when e.kind = 'COLUMN' then format('(%s) ON TABLE %s', e.col, e.ident) else v_on end, v_who,
                     case when g.is_grantable then ' WITH GRANT OPTION' else '' end);
    end loop;
  end loop;
end $acl$;
-- a column right the backup did not hold is revoked as well
do $acl$
declare c record; g record;
begin
  for c in select a.attrelid::regclass::text as t, quote_ident(a.attname) as col, a.attacl, cl.relowner
             from pg_attribute a join pg_class cl on cl.oid = a.attrelid join pg_namespace n on n.oid = cl.relnamespace
            where n.nspname ~ '${patternRegex(SCHEMA_EXCLUDE)}' is false and a.attnum > 0 and not a.attisdropped and a.attacl is not null
              and not exists (select 1 from pintar_acl p where p.kind = 'COLUMN' and p.ident = a.attrelid::regclass::text and p.col = quote_ident(a.attname)) loop
    for g in select distinct x.grantee from aclexplode(c.attacl) x where x.grantee <> c.relowner loop
      execute format('REVOKE ALL (%s) ON TABLE %s FROM %s', c.col, c.t, case when g.grantee = 0 then 'PUBLIC' else quote_ident(pg_get_userbyid(g.grantee)) end);
    end loop;
  end loop;
end $acl$;
commit;
`;
}

// ─── Storage (condition 4)
const md5 = (b) => createHash("md5").update(b).digest("hex");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/**
 * Every object the snapshot lists, from its own bucket through C3: its size equal to its metadata, its MD5 equal to its
 * ETag where Storage gives a plain one, its SHA-256 recorded. A name is kept only in the manifest, inside the bundle.
 *   bucketClient  (bucket) => an s3Client for that bucket
 */
export async function collectStorage(dir, objects, bucketClient, { tries = 3, parallel = 8 } = {}) {
  mkdirSync(join(dir, "storage", "objects"), { recursive: true });
  const lines = new Array(objects.length);
  const problems = [];
  const clients = new Map();
  let bytes = 0;
  async function fetchOne(i) {
    const o = objects[i];
    if (!clients.has(o.bucket)) clients.set(o.bucket, bucketClient(o.bucket));
    const c = clients.get(o.bucket);
    const size = o.size === null || o.size === undefined ? NaN : Number(o.size);
    const etag = /^"?([0-9a-f]{32})"?$/i.exec(o.etag ?? "")?.[1]?.toLowerCase() ?? null;
    let last = "";
    for (let t = 1; t <= tries; t++) {
      try {
        if (!Number.isFinite(size)) { last = "its metadata holds no size"; break; }
        const r = await c.getBytes(o.name);
        if (r.status !== 200) { last = `HTTP ${r.status}`; continue; }
        if (r.bytes.length !== size) { last = `${r.bytes.length} bytes, its metadata ${size}`; continue; }
        if (etag && md5(r.bytes) !== etag) { last = "its MD5 differs from its ETag"; continue; }
        const file = `storage/objects/${String(i).padStart(7, "0")}`;
        writeFileSync(join(dir, file), r.bytes);
        lines[i] = JSON.stringify({ file, bucket: o.bucket, name: o.name, size, md5: md5(r.bytes), sha256: sha256(r.bytes), mimetype: o.mimetype ?? null });
        bytes += size;
        return;
      } catch (e) { last = e.message; }
    }
    problems.push(`Storage object #${i} in ${o.bucket}: ${last}${Number.isFinite(size) ? ` (after ${tries} tries)` : ""}`);
  }
  const queue = objects.map((_, i) => i);
  await Promise.all(Array.from({ length: Math.min(parallel, Math.max(1, objects.length)) }, async () => {
    while (queue.length) await fetchOne(queue.shift());
  }));
  const kept = lines.filter(Boolean);
  writeFileSync(join(dir, "storage", "manifest.jsonl"), kept.join("\n") + (kept.length ? "\n" : ""));
  if (kept.length !== objects.length) problems.push(`${kept.length} of the snapshot's ${objects.length} Storage objects are in the bundle`);
  return { problems, objects: kept.length, bytes };
}

// ─── the manifest and the tar (condition 5)
function filesUnder(dir) {
  const out = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f); else out.push(relative(dir, f));
    }
  })(dir);
  return out.sort();
}
async function fileSha256(f) {
  const h = createHash("sha256");
  await new Promise((ok, no) => createReadStream(f).on("data", (b) => h.update(b)).on("end", ok).on("error", no));
  return h.digest("hex");
}
export async function writeManifest(dir) {
  const files = filesUnder(dir).filter((f) => f !== "MANIFEST.sha256");
  const lines = [];
  for (const f of files) lines.push(`${await fileSha256(join(dir, f))}  ${f}`);
  writeFileSync(join(dir, "MANIFEST.sha256"), lines.join("\n") + "\n");
  return files.length;
}
/** Every file listed with its hash, and nothing unlisted: the check a restore makes before it trusts a bundle. */
export async function checkManifest(dir) {
  const problems = [];
  let listed = [];
  try { listed = readFileSync(join(dir, "MANIFEST.sha256"), "utf8").trim().split("\n").filter(Boolean).map((l) => [l.slice(0, 64), l.slice(66)]); }
  catch { return { problems: ["the bundle has no MANIFEST.sha256"], files: 0 }; }
  const want = new Map(listed.map(([h, f]) => [f, h]));
  const have = filesUnder(dir).filter((f) => f !== "MANIFEST.sha256");
  for (const f of have) {
    if (!want.has(f)) problems.push(`${f} is not in the manifest`);
    else if ((await fileSha256(join(dir, f))) !== want.get(f)) problems.push(`${f} differs from the manifest`);
  }
  for (const f of want.keys()) if (!have.includes(f)) problems.push(`${f} is in the manifest but missing`);
  return { problems, files: have.length };
}
function tool(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, ...opts });
  return { ok: r.status === 0, out: r.stdout ?? "", err: (r.stderr ?? "").trim() };
}

// ─── encryption (condition 6): public keys only; nothing here can decrypt
/** The recovery keys a target's bundles go to, checked against the rules A1 sets. */
export function recipientsFor(target, names) {
  const list = (names ?? "").split(/[\s,]+/).filter(Boolean);
  const problems = [];
  if (!["production", "staging"].includes(target)) problems.push(`BACKUP_TARGET is ${target || "unset"}, not production or staging`);
  if (new Set(list).size !== list.length) problems.push("a recovery key is named twice");
  for (const n of list) if (!/^R[123]$/.test(n)) problems.push(`${n} is not a recovery key (R1, R2, R3)`);
  if (!list.includes("R1")) problems.push("R1, custodian A's recovery key, is not among the recipients");
  if (target === "production" && list.includes("R3")) problems.push("R3, the staging drill key held in GitHub, may never open a production bundle");
  if (target === "staging" && !list.includes("R3")) problems.push("a staging bundle must also go to R3, or the monthly drill cannot open it");
  return { list, problems };
}
/** A key file's usable encryption subkeys (gpg --show-keys), refusing an expired, revoked or weak one. */
export function keyInfo(file, home) {
  const r = tool("gpg", ["--homedir", home, "--batch", "--with-colons", "--show-keys", file]);
  if (!r.ok) return { problems: [`${file}: gpg cannot read it (${r.err.split("\n")[0]})`], fpr: null, subkeys: [] };
  const recs = r.out.split("\n").map((l) => l.split(":"));
  const pub = recs.filter((x) => x[0] === "pub");
  const problems = [];
  if (pub.length !== 1) return { problems: [`${file} holds ${pub.length} public keys, not one`], fpr: null, subkeys: [] };
  const fpr = recs.find((x) => x[0] === "fpr")?.[9] ?? null;
  if (/[er]/.test(pub[0][1])) problems.push(`${file}: the key is ${pub[0][1] === "r" ? "revoked" : "expired"}`);
  const strong = (x) => (x[3] === "1" ? Number(x[2]) >= 3072 : ["18", "22"].includes(x[3]));
  if (!strong(pub[0])) problems.push(`${file}: the key's algorithm or size is too weak (algo ${pub[0][3]}, ${pub[0][2]} bits)`);
  const enc = [pub[0], ...recs.filter((x) => x[0] === "sub")].filter((x) => /e/.test(x[11]) && !/[er]/.test(x[1]) && strong(x)).map((x) => x[4]);
  if (enc.length === 0) problems.push(`${file}: no usable encryption key`);
  return { problems, fpr, subkeys: enc };
}
/** The key ids a ciphertext is encrypted to, read from its packets without decrypting (an empty keyring). */
export function ciphertextRecipients(file) {
  const home = mkdtempSync(join(tmpdir(), "gpg-empty-"));
  try {
    const r = tool("gpg", ["--homedir", home, "--batch", "--list-packets", "--list-only", file]);
    return [...`${r.out}\n${r.err}`.matchAll(/:pubkey enc packet: version \d+, algo \d+, keyid ([0-9A-F]{16})/g)].map((m) => m[1]);
  } finally { rmSync(home, { recursive: true, force: true }); }
}
/** Condition 6: encrypt to exactly the named recipients, then prove the ciphertext names exactly them. */
export function encrypt(input, output, keysDir, names) {
  const home = mkdtempSync(join(tmpdir(), "gpg-pub-"));
  try {
    const problems = [], fprs = [], expected = [];
    for (const n of names) {
      const f = join(keysDir, `${n}.asc`);
      if (!existsSync(f)) { problems.push(`${n}.asc is not in ${keysDir}`); continue; }
      const k = keyInfo(f, home);
      problems.push(...k.problems.map((x) => `${n}: ${x}`));
      if (k.fpr && k.subkeys.length) { fprs.push(k.fpr); expected.push(k.subkeys); }
      const imp = tool("gpg", ["--homedir", home, "--batch", "--import", f]);
      if (!imp.ok) problems.push(`${n}: gpg could not import it`);
    }
    if (problems.length) return { problems };
    const secret = tool("gpg", ["--homedir", home, "--batch", "--list-secret-keys", "--with-colons"]);
    if (/^sec/m.test(secret.out)) return { problems: ["a private key is present where only public keys may be"] };
    const r = tool("gpg", ["--homedir", home, "--batch", "--yes", "--trust-model", "always", "--compress-algo", "none",
      ...fprs.flatMap((f) => ["--recipient", f]), "--output", output, "--encrypt", input]);
    if (!r.ok) return { problems: [`gpg could not encrypt: ${r.err.split("\n").slice(-1)[0]}`] };
    return checkRecipients(output, expected, names);
  } finally { rmSync(home, { recursive: true, force: true }); }
}
/** Exactly one packet per expected recipient, each to one of that recipient's encryption keys, and no other. */
export function checkRecipients(file, expected, names = expected.map((_, i) => `#${i + 1}`)) {
  const got = ciphertextRecipients(file);
  const problems = [];
  const left = [...got];
  expected.forEach((subs, i) => {
    const at = left.findIndex((id) => subs.some((s) => s.toUpperCase() === id));
    if (at < 0) problems.push(`the ciphertext is not encrypted to ${names[i]}`); else left.splice(at, 1);
  });
  for (const id of left) problems.push(`the ciphertext is also encrypted to an unexpected key ${id}`);
  return { problems, recipients: got };
}

// ─── the steps
const need = (names) => { const miss = names.filter((n) => !process.env[n]); if (miss.length) throw new Error(`not set: ${miss.join(", ")}`); };

export async function dumps(dir, snapshot) {
  mkdirSync(dir, { recursive: true });
  const out = [];
  for (const plan of dumpPlan()) out.push(await runDump(plan, dir, snapshot));
  return out;
}

/** Conditions 1-5 into <dir>. Throws, naming every problem, unless the bundle's content is complete. */
export async function collect(dir) {
  need(["PGHOST", "PGUSER", "PGDATABASE", "PGPASSWORD", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_KEY_ID", "STORAGE_S3_SECRET"]);
  mkdirSync(dir, { recursive: true });
  if (readdirSync(dir).length) throw new Error(`${dir} is not empty`);
  const t0 = Date.now();
  const held = process.env.PINTAR_SNAPSHOT ? { id: process.env.PINTAR_SNAPSHOT, at: null, release: async () => {} } : await exportSnapshot();
  const problems = [];
  let exp, add, data, hist, dumped;
  try {
    exp = expectations(held.id);
    if (exp.large_objects > 0) problems.push(`the database holds ${exp.large_objects} large object(s), which this backup does not carry`);
    add = additions(dir, held.id, exp);
    problems.push(...add.problems);
    dumped = await dumps(dir, held.id);
  } finally { await held.release(); }
  data = await verifyData(join(dir, "data.sql"), exp.tables.filter((x) => x.s !== "supabase_migrations"), exp.sequences);
  hist = await verifyData(join(dir, "history-data.sql"), [{ s: "supabase_migrations", t: "schema_migrations", rows: exp.history_rows }], [], "history dump");
  problems.push(...data.problems, ...hist.problems.filter((p) => /schema_migrations/.test(p)));
  const bucketClient = (bucket) => s3Client({ endpoint: process.env.STORAGE_S3_ENDPOINT, region: process.env.STORAGE_S3_REGION,
    keyId: process.env.STORAGE_S3_KEY_ID, secret: process.env.STORAGE_S3_SECRET, bucket, pathStyle: true });
  const st = await collectStorage(dir, exp.objects, bucketClient);
  problems.push(...st.problems);
  const meta = {
    what: "#150 WP-B: a PINTAR backup bundle (scripts/recovery/backup.mjs). Counts, sizes and hashes only; no value.",
    snapshot: { id: held.id, at: held.at }, release_sha: process.env.RELEASE_SHA ?? null, run: process.env.GITHUB_RUN_ID ?? null,
    database: { tables: data.tables, rows: data.rows, sequences: data.sequences, history_rows: exp.history_rows, auth_triggers: add.auth_triggers,
      pre_request: add.pre_request, acl_objects: add.acl_objects, dumps: dumped.map((d) => d.file) },
    storage: { objects: st.objects, bytes: st.bytes }, seconds: Math.round((Date.now() - t0) / 1000),
  };
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  const files = await writeManifest(dir);
  if (problems.length) throw new Error(`the bundle is incomplete:\n  ${problems.join("\n  ")}`);
  return { ...meta, files };
}

/** Conditions 5-6: tar, read back against the manifest, encrypt, check the recipients. */
export async function seal(dir, out, keysDir, names) {
  const m = await checkManifest(dir);
  if (m.problems.length) throw new Error(`the bundle does not match its manifest: ${m.problems.slice(0, 5).join("; ")}`);
  const tar = `${out}.tar.gz`;
  const t = tool("tar", ["--sort=name", "--owner=0", "--group=0", "--numeric-owner", "-czf", tar, "-C", dir, "."]);
  if (!t.ok) throw new Error(`tar failed: ${t.err.slice(0, 200)}`);
  const back = mkdtempSync(join(tmpdir(), "bundle-readback-"));
  try {
    const x = tool("tar", ["-xzf", tar, "-C", back]);
    const r = x.ok ? await checkManifest(back) : { problems: [`the tar cannot be read back: ${x.err.slice(0, 200)}`] };
    if (r.problems.length) throw new Error(`the tar, read back, differs from the manifest: ${r.problems.slice(0, 5).join("; ")}`);
  } finally { rmSync(back, { recursive: true, force: true }); }
  const e = encrypt(tar, out, keysDir, names);
  rmSync(tar, { force: true });
  if (e.problems.length) { rmSync(out, { force: true }); throw new Error(`encryption: ${e.problems.join("; ")}`); }
  return { recipients: e.recipients, size: statSync(out).size, sha256: await fileSha256(out) };
}

/** Where a bundle and its success record go, and until when each is locked (D-107 D4: 35 days daily, 12 months monthly). */
export function placement(target, now) {
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const name = `pintar-${target}-${stamp}.tar.gz.gpg`;
  const until = (d) => new Date(now.getTime() + d * 86400000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const out = [{ key: `${target}/daily/${day}/${name}`, retainUntil: until(35) }];
  if (now.getUTCDate() === 1) out.push({ key: `${target}/monthly/${day.slice(0, 7)}/${name}`, retainUntil: until(366) });
  return out;
}

/** Conditions 7-9: each copy uploaded with its checksum and its lock, its success record last. */
export async function upload(file, record, target, now) {
  need(["BACKUP_S3_REGION", "BACKUP_S3_BUCKET", "BACKUP_S3_KEY_ID", "BACKUP_S3_SECRET"]);
  const region = process.env.BACKUP_S3_REGION;
  const client = s3Client({ endpoint: process.env.BACKUP_S3_ENDPOINT || `https://s3.${region}.amazonaws.com`, region,
    keyId: process.env.BACKUP_S3_KEY_ID, secret: process.env.BACKUP_S3_SECRET, bucket: process.env.BACKUP_S3_BUCKET,
    pathStyle: process.env.BACKUP_S3_PATH_STYLE === "1" });
  const done = [];
  for (const p of placement(target, now)) {
    const lock = { "x-amz-object-lock-mode": "GOVERNANCE", "x-amz-object-lock-retain-until-date": p.retainUntil };
    const r = await client.putFile(p.key, file, lock);
    if (!r.ok) throw new Error(`the bundle's upload to ${p.key} was refused: ${r.error}`);
    if (r.sha256 !== record.bundle.sha256) throw new Error(`the bundle changed on disk while it was uploaded to ${p.key}`);
    const rec = join(dirname(file), `${p.key.split("/").pop()}.success.json`);
    writeFileSync(rec, JSON.stringify({ ...record, key: p.key, retain_until: p.retainUntil }, null, 2) + "\n");
    const s = await client.putFile(`${p.key}.success.json`, rec, lock);
    if (!s.ok) throw new Error(`the success record's upload to ${p.key}.success.json was refused: ${s.error}`);
    done.push(p.key);
  }
  return done;
}

export async function run() {
  need(["BACKUP_TARGET"]);
  const target = process.env.BACKUP_TARGET;
  const rec = recipientsFor(target, process.env.BACKUP_RECIPIENTS);
  if (rec.problems.length) throw new Error(rec.problems.join("; "));
  const keysDir = process.env.RECIPIENTS_DIR || join(ROOT, "docs/recovery/keys");
  const now = process.env.BACKUP_NOW ? new Date(process.env.BACKUP_NOW) : new Date();
  const work = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), "pintar-backup-"));
  try {
    const dir = join(work, "bundle");
    const meta = await collect(dir);
    const out = join(work, "bundle.tar.gz.gpg");
    const sealed = await seal(dir, out, keysDir, rec.list);
    rmSync(dir, { recursive: true, force: true });
    const record = {
      what: "#150 WP-B: the success record of one PINTAR backup. A bundle without this record is incomplete (A5, condition 9).",
      target, at: now.toISOString(), conditions: "1-9 verified by scripts/recovery/backup.mjs",
      snapshot: meta.snapshot, release_sha: meta.release_sha, run: meta.run, database: meta.database, storage: meta.storage, files: meta.files,
      bundle: { sha256: sealed.sha256, bytes: sealed.size, recipients: rec.list, recipient_key_ids: sealed.recipients },
    };
    const keys = await upload(out, record, target, now);
    return { keys, record };
  } finally { rmSync(work, { recursive: true, force: true }); }
}

async function main(argv) {
  const [cmd, a, b] = argv;
  if (cmd === "run" && argv.length === 1) {
    const r = await run();
    console.log(`backed up: ${r.keys.join(", ")}; ${r.record.database.tables} tables, ${r.record.database.rows} rows, ` +
      `${r.record.storage.objects} Storage objects (${r.record.storage.bytes} bytes), ${r.record.bundle.bytes} bytes encrypted to ${r.record.bundle.recipients.join(" and ")}`);
    return 0;
  }
  if (cmd === "collect" && argv.length === 2) { const m = await collect(a); console.log(`collected: ${JSON.stringify(m.database)} storage ${JSON.stringify(m.storage)}`); return 0; }
  if (cmd === "seal" && argv.length === 3) {
    const names = recipientsFor(process.env.BACKUP_TARGET, process.env.BACKUP_RECIPIENTS);
    if (names.problems.length) throw new Error(names.problems.join("; "));
    const s = await seal(a, b, process.env.RECIPIENTS_DIR || join(ROOT, "docs/recovery/keys"), names.list);
    console.log(`sealed: ${s.size} bytes, recipients ${s.recipients.join(" ")}`); return 0;
  }
  if (cmd === "dumps" && argv.length === 2) {
    const held = process.env.PINTAR_SNAPSHOT ? { id: process.env.PINTAR_SNAPSHOT, release: async () => {} } : await exportSnapshot();
    try { const d = await dumps(a, held.id); console.log(`dumped: ${d.map((x) => x.file).join(", ")}`); } finally { await held.release(); }
    return 0;
  }
  console.error("usage: backup.mjs run | collect <dir> | seal <dir> <out.gpg> | dumps <dir>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => {
    console.log(`::error::the backup failed, and no success record was written: ${e.message}`);
    process.exit(1);
  });
}
