/**
 * #150 WP-B (D-106(b), D-107): THE INDEPENDENT BACKUP, ITS CREDENTIAL AND ITS RESTORE.
 *
 *  DR-S15  migration 20261125100000 against CI's database: `pintar_backup` (C2) is LOGIN, BYPASSRLS, INHERIT, in
 *          pg_read_all_data alone, owns nothing, may execute no SECURITY DEFINER function and no PINTAR function, and
 *          nobody can become it; signed in as it, a fresh session is read-only by default with its timeouts; its facts
 *          (every table's rows and content hash, row security bypassed) equal postgres's; its five dumps, on one shared
 *          snapshot, are byte-identical to postgres's; with its read-only default switched OFF (the worst case: a
 *          stolen credential can do that: the read-only default is a safety default, not a security boundary) every
 *          INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM, sequence advance, CREATE, ALTER, DROP, COMMENT, policy, trigger,
 *          role grant, CREATE ROLE, ALTER ROLE and SET ROLE is refused, an extension off Supabase's allow-list is
 *          refused, and a GRANT or REVOKE changes no right; a fourth connection is refused. RESTATED FOR D-108: an
 *          allow-listed extension is created on its behalf by supautils as supabase_admin (shown, and rolled back): the
 *          documented Supabase platform residual, outside PINTAR's grant model, left to the extension baseline
 *          (DR-S14). What else it can do (a temporary table, a large object, its own password) touches no PINTAR object
 *          and is reported (A7)
 *
 *  DR-S09  encryption with public keys only (scripts/recovery/backup.mjs): a bundle sealed for production goes to R1 and
 *          R2 exactly (checked from its packets, without decrypting); each of their private keys opens it, R3's and the
 *          job's own public-only keyring do not; production may never name R3, staging must, R1 is always required; a
 *          key file holding a private key, a weak key and a ciphertext with a missing or an extra recipient are refused
 *  DR-S14  A5, fail closed, executed: `backup.mjs run` as pintar_backup against CI's database and Storage and a stand-in
 *          for AWS S3. Clean, it uploads each copy (daily, and monthly on the 1st) with its SHA-256 checksum and its
 *          Object Lock retention (35 days, 366 days), each success record after its bundle; the bundle opens with R3's
 *          private key, matches its manifest, holds every Storage object with its hash, and the password appears in no
 *          output and no file. Each planted failure is red with no success record uploaded: a table missing from the
 *          data dump; a Storage object that is not there; one whose size differs from its metadata; a staging bundle
 *          not going to R3; a production bundle going to R3; a checksum S3 rejects; an extension pintar_backup itself
 *          added through supautils (D-108); a production backup with no approved extension baseline
 *  DR-S10  escrow and recovery of the durable secrets (scripts/recovery/escrow.mjs) against stand-ins for Vercel and S3:
 *          escrow uploads each secret, encrypted to R1 and R2 only, with its checksum and a legal hold, only when its
 *          fingerprint equals the record (a mismatch or a missing record escrows nothing); mint escrows FIRST and writes to
 *          Vercel only after (a refused upload writes nothing); recover writes back only the recorded value, only where
 *          Vercel holds none (a different value in Vercel, or an escrow holding another value, writes nothing); no value
 *          is ever printed; the AWS template keeps Object Lock and versioning on, gives the escrow prefix no lifecycle
 *          rule, the writer only puts and the reader only reads
 *  DR-S08  exact rights: acl.sql (backup.mjs acl) executed on CI's database in a transaction rolled back, after the drift
 *          the 5 Oct logical restore produced (every table, sequence and function given to anon and authenticated, CREATE
 *          on public given to anon) and a right taken away: every PINTAR object's rights for anon, authenticated,
 *          service_role and PUBLIC are again exactly what they were, and the readiness rows read as before
 *  DR-D02  the secondary, logical path end to end: a bundle collected from CI's database and Storage by pintar_backup is
 *          restored by restore-bundle.mjs into a second, EMPTY Supabase stack (a new project's stand-in, its own default
 *          privileges included) with its Storage files: 0 differences in tables, functions, rights, triggers, the
 *          pre-request and policies, every Storage file read back with its hash, the extension baseline held, readiness
 *          as its source, SAFE TO REOPEN; an extension added on the copy afterwards makes its verification refuse to
 *          call it safe (D-108(c)(8)), and removing it makes it safe again
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";

const MIGRATION = "supabase/migrations/20261125100000_a_backup_reads_everything_and_writes_nothing.sql";
const FAKTA = "audit/restore/fakta.sql";

type Pg = { PGHOST: string; PGPORT: string; PGDATABASE: string; PGUSER: string; PGPASSWORD: string };

/** The connection to CI's database as `user`, from SUPABASE_DB_URL; never a URL with a password in it. */
export function pgAs(user: string, password: string): Pg {
  const u = new URL(process.env.SUPABASE_DB_URL!);
  return { PGHOST: u.hostname, PGPORT: u.port || "5432", PGDATABASE: u.pathname.replace(/^\//, "") || "postgres", PGUSER: user, PGPASSWORD: password };
}
export function postgres(): Pg {
  const u = new URL(process.env.SUPABASE_DB_URL!);
  return pgAs(decodeURIComponent(u.username), decodeURIComponent(u.password));
}

/** psql, one script, the result's rows and its errors. */
export function psql(pg: Pg, sql: string, opts: { stopOnError?: boolean; file?: string } = {}) {
  const args = ["-X", "-q", "-At", "-F", "|"];
  if (opts.stopOnError !== false) args.push("-v", "ON_ERROR_STOP=1");
  args.push(...(opts.file ? ["-f", opts.file] : ["-f", "-"]));
  const r = spawnSync("psql", args, { input: opts.file ? undefined : sql, encoding: "utf8", maxBuffer: 1 << 28,
    env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...pg } });
  return { ok: r.status === 0, out: r.stdout ?? "", err: (r.stderr ?? "").trim() };
}

/**
 * A directory holding pg_dump and pg_dumpall of the server's major version: the runner's own when they are new enough,
 * otherwise thin wrappers that run the database container's (the local Supabase stack's) with the same PG* settings.
 */
export function pgBin(pg: Pg): { dir: string; how: string } {
  const server = Number(psql(pg, "show server_version_num").out.trim()) / 10000 | 0;
  const v = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  const local = Number(/(\d+)(?:\.\d+)?/.exec(v.stdout ?? "")?.[1] ?? 0);
  if (v.status === 0 && local >= server) return { dir: "", how: `the runner's pg_dump ${local}` };
  const ps = spawnSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" });
  const box = (ps.stdout ?? "").split("\n").find((n) => /^supabase_db_/.test(n.trim()))?.trim();
  if (!box) throw new Error(`no pg_dump ${server} on the runner (it has ${local || "none"}) and no local Supabase database container`);
  const dir = mkdtempSync(join(tmpdir(), "pgbin-"));
  for (const tool of ["pg_dump", "pg_dumpall"]) {
    writeFileSync(join(dir, tool), `#!/bin/sh\nexec docker exec -i -e PGPASSWORD -e PGUSER -e PGDATABASE -e PGOPTIONS -e PGAPPNAME ` +
      `-e PGHOST=127.0.0.1 -e PGPORT=5432 ${box} ${tool} "$@"\n`, { mode: 0o755 });
  }
  return { dir, how: `${box}'s pg_dump ${server}` };
}

/** Holds one exported snapshot open in its own session until released. */
export async function holdSnapshot(pg: Pg): Promise<{ id: string; release: () => Promise<void> }> {
  const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1"], { env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...pg } });
  let out = "";
  p.stdout.on("data", (b) => (out += b));
  p.stderr.on("data", (b) => (out += b));
  p.stdin.write("set idle_in_transaction_session_timeout = 0;\nbegin isolation level repeatable read read only;\nselect pg_export_snapshot();\n");
  const id = await new Promise<string>((ok, no) => {
    const t0 = Date.now();
    const look = () => {
      const m = /^([0-9A-F]+-[0-9A-F]+-\d+)$/m.exec(out);
      if (m) return ok(m[1]);
      if (Date.now() - t0 > 15000 || p.exitCode !== null) return no(new Error(`no snapshot exported: ${out.trim()}`));
      setTimeout(look, 50);
    };
    look();
  });
  return { id, release: () => new Promise<void>((ok) => { p.on("close", () => ok()); p.stdin.end("commit;\n"); }) };
}

const BACKUP = "scripts/recovery/backup.mjs";
type Masalah = { problems: string[] };
type BackupModul = {
  recipientsFor: (target: string, names: string) => Masalah & { list: string[] };
  seal: (dir: string, out: string, keysDir: string, names: string[]) => Promise<{ recipients: string[]; size: number; sha256: string }>;
  checkRecipients: (file: string, expected: string[][], names?: string[]) => Masalah & { recipients: string[] };
  checkManifest: (dir: string) => Promise<Masalah & { files: number }>;
  writeManifest: (dir: string) => Promise<number>;
  keyInfo: (file: string, home: string) => Masalah & { fpr: string | null; subkeys: string[] };
};
async function backupModul(repoRoot: string): Promise<BackupModul | null> {
  try { return (await import(pathToFileURL(join(repoRoot, BACKUP)).href)) as BackupModul; } catch { return null; }
}

/** Throwaway OpenPGP keys: each name's private key in its own home, every public key in <dir>/pub/<name>.asc. */
export function makeKeys(dir: string, names: string[], opts: { algo?: string } = {}) {
  const pub = join(dir, "pub"); mkdirSync(pub, { recursive: true });
  const homes: Record<string, string> = {};
  for (const n of names) {
    const home = join(dir, `home-${n}`); mkdirSync(home, { mode: 0o700 });
    const g = (...a: string[]) => spawnSync("gpg", ["--homedir", home, "--batch", "--pinentry-mode", "loopback", "--passphrase", "", ...a], { encoding: "utf8" });
    if (opts.algo) g("--quick-gen-key", `${n} test <${n.toLowerCase()}@dr150.invalid>`, opts.algo, "default", "never");
    else g("--quick-gen-key", `${n} test <${n.toLowerCase()}@dr150.invalid>`, "ed25519", "cert,sign", "never");
    const fpr = /^fpr:+([0-9A-F]{40}):/m.exec(g("--with-colons", "--list-keys").stdout)?.[1] ?? "";
    if (!opts.algo) g("--quick-add-key", fpr, "cv25519", "encr", "never");
    writeFileSync(join(pub, `${n}.asc`), g("--armor", "--export", fpr).stdout);
    homes[n] = home;
  }
  return { pub, homes };
}
export function decrypt(home: string, file: string, out: string) {
  const r = spawnSync("gpg", ["--homedir", home, "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase", "", "--output", out, "--decrypt", file], { encoding: "utf8" });
  return { ok: r.status === 0, err: (r.stderr ?? "").trim() };
}

/** A stand-in for AWS S3: it checks every upload's SHA-256 checksum as S3 does, records its headers, can refuse uploads. */
export async function standInS3(opts: { keyId: string; refuse?: RegExp; preload?: Map<string, { body: Buffer; headers: Record<string, string> }>; events?: string[] }) {
  const objects = new Map<string, { body: Buffer; headers: Record<string, string> }>(opts.preload ?? []);
  const order: string[] = [];
  const methods: string[] = [];
  const srv = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (b) => chunks.push(b));
    req.on("end", () => {
      const u = new URL(req.url ?? "/", "http://x");
      const parts = u.pathname.split("/").slice(1).map(decodeURIComponent);
      const key = parts.slice(1).join("/");
      methods.push(req.method ?? "");
      const fail = (code: number, c: string) => { res.writeHead(code, { "content-type": "application/xml" }); res.end(`<Error><Code>${c}</Code></Error>`); };
      if (!String(req.headers.authorization ?? "").includes(`Credential=${opts.keyId}/`)) return fail(403, "InvalidAccessKeyId");
      const body = Buffer.concat(chunks);
      if (req.method === "PUT") {
        const want = String(req.headers["x-amz-checksum-sha256"] ?? "");
        if (!want || createHash("sha256").update(body).digest("base64") !== want) return fail(400, "BadDigest");
        if (opts.refuse?.test(key)) return fail(400, "BadDigest");
        const h: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) if (/^(x-amz-|content-md5)/.test(k)) h[k] = String(v);
        objects.set(key, { body, headers: h }); order.push(key); opts.events?.push(`S3 PUT ${key}`);
        res.writeHead(200); return res.end();
      }
      if (req.method === "GET" && u.searchParams.get("list-type") === "2") {
        const pre = u.searchParams.get("prefix") ?? "";
        const items = [...objects.keys()].filter((k) => k.startsWith(pre)).sort()
          .map((k) => `<Contents><Key>${k.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Key><Size>${objects.get(k)!.body.length}</Size></Contents>`).join("");
        res.writeHead(200, { "content-type": "application/xml" }); return res.end(`<ListBucketResult><IsTruncated>false</IsTruncated>${items}</ListBucketResult>`);
      }
      const o = objects.get(key);
      if (!o) return fail(404, "NoSuchKey");
      res.writeHead(200, { "x-amz-checksum-sha256": o.headers["x-amz-checksum-sha256"] ?? "", "x-amz-object-lock-mode": o.headers["x-amz-object-lock-mode"] ?? "",
        "x-amz-object-lock-retain-until-date": o.headers["x-amz-object-lock-retain-until-date"] ?? "", "x-amz-object-lock-legal-hold": o.headers["x-amz-object-lock-legal-hold"] ?? "",
        "content-length": String(o.body.length) });
      res.end(req.method === "HEAD" ? undefined : o.body);
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, objects, order, methods, close: () => new Promise<void>((ok) => srv.close(() => ok())) };
}

/** The local stack's Storage: its S3 API (C3's stand-in) and its REST API with the service key, for planting objects. */
export function localStorage(repoRoot: string) {
  const st = spawnSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { cwd: repoRoot, encoding: "utf8" });
  const val = (k: string) => new RegExp(`^${k}="?([^"\n]*)"?$`, "m").exec(st.stdout ?? "")?.[1] ?? "";
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL || val("API_URL") || "http://127.0.0.1:54321";
  return {
    api, service: process.env.SUPABASE_SERVICE_ROLE_KEY || val("SERVICE_ROLE_KEY"),
    s3: { STORAGE_S3_ENDPOINT: `${api}/storage/v1/s3`, STORAGE_S3_REGION: val("S3_PROTOCOL_REGION") || "local",
      STORAGE_S3_KEY_ID: val("S3_PROTOCOL_ACCESS_KEY_ID") || "625729a08b95bf1b7ff351a663f3a23c",
      STORAGE_S3_SECRET: val("S3_PROTOCOL_ACCESS_KEY_SECRET") || "850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907" },
  };
}
async function storageRest(st: { api: string; service: string }, method: string, path: string, body?: Buffer | string, type = "application/json") {
  const r = await fetch(`${st.api}/storage/v1/${path}`, { method, headers: { authorization: `Bearer ${st.service}`, apikey: st.service, "content-type": type },
    body: typeof body === "string" || body === undefined ? body : new Uint8Array(body) });
  return { status: r.status, text: await r.text() };
}

/** A stand-in for Vercel's env API: the listing, one value, and writes (recorded by key; values kept in memory). */
async function standInVercel(initial: Record<string, string>, events?: string[]) {
  const env = new Map(Object.entries(initial));
  const writes: string[] = [];
  const srv = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (b) => chunks.push(b));
    req.on("end", () => {
      const u = new URL(req.url ?? "/", "http://x");
      const json = (code: number, o: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
      if (req.headers.authorization !== "Bearer vercel-standin-token") return json(403, { error: "forbidden" });
      if (req.method === "GET" && /^\/v9\/projects\/[^/]+\/env$/.test(u.pathname)) {
        return json(200, { envs: [...env.keys()].map((k) => ({ id: `id-${k}`, key: k, target: ["production"], type: "encrypted" })) });
      }
      const one = /^\/v1\/projects\/[^/]+\/env\/id-(.+)$/.exec(u.pathname);
      if (req.method === "GET" && one) return env.has(one[1]) ? json(200, { value: env.get(one[1]) }) : json(404, {});
      if (req.method === "POST" && /^\/v10\/projects\/[^/]+\/env$/.test(u.pathname)) {
        const b = JSON.parse(Buffer.concat(chunks).toString());
        env.set(b.key, b.value); writes.push(b.key); events?.push(`VERCEL POST ${b.key}`);
        return json(201, { created: { key: b.key } });
      }
      json(404, {});
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, env, writes, close: () => new Promise<void>((ok) => srv.close(() => ok())) };
}

type Pola = { patternRegex: (p: string) => string; SCHEMA_EXCLUDE: string };
/** The rights of every PINTAR object for anon, authenticated, service_role and PUBLIC, one digest (grantor-independent). */
function hakDigest(skemaRegex: string) {
  const peran = "unnest(array['anon', 'authenticated', 'service_role', 'public']) r";
  return `select md5(string_agg(x, '|' order by x)) from (
    select 'R ' || c.oid::regclass || ' ' || r || ' ' || concat_ws(',',
             has_table_privilege(r, c.oid, 'SELECT'), has_table_privilege(r, c.oid, 'INSERT'), has_table_privilege(r, c.oid, 'UPDATE'),
             has_table_privilege(r, c.oid, 'DELETE'), has_table_privilege(r, c.oid, 'TRUNCATE'), has_table_privilege(r, c.oid, 'REFERENCES'),
             has_table_privilege(r, c.oid, 'TRIGGER'), has_any_column_privilege(r, c.oid, 'SELECT'), has_any_column_privilege(r, c.oid, 'INSERT'),
             has_any_column_privilege(r, c.oid, 'UPDATE'), has_any_column_privilege(r, c.oid, 'REFERENCES')) as x
      from pg_class c join pg_namespace n on n.oid = c.relnamespace, ${peran}
     where n.nspname !~ '${skemaRegex}' and c.relkind in ('r','p','v','m','f')
    union all
    select 'S ' || c.oid::regclass || ' ' || r || ' ' || concat_ws(',', has_sequence_privilege(r, c.oid, 'USAGE'), has_sequence_privilege(r, c.oid, 'SELECT'),
             has_sequence_privilege(r, c.oid, 'UPDATE'))
      from pg_class c join pg_namespace n on n.oid = c.relnamespace, ${peran} where n.nspname !~ '${skemaRegex}' and c.relkind = 'S'
    union all
    select 'F ' || p.oid::regprocedure || ' ' || r || ' ' || has_function_privilege(r, p.oid, 'EXECUTE')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace, ${peran} where n.nspname !~ '${skemaRegex}'
    union all
    select 'N ' || n.nspname || ' ' || r || ' ' || has_schema_privilege(r, n.oid, 'USAGE') || ',' || has_schema_privilege(r, n.oid, 'CREATE')
      from pg_namespace n, ${peran} where n.nspname !~ '${skemaRegex}') d`;
}

/** A second, EMPTY local Supabase stack on its own ports: a new project's stand-in. */
async function emptyStack(repoRoot: string, dir: string) {
  const cli = (...a: string[]) => spawnSync("npx", ["--no-install", "supabase", "--workdir", dir, ...a], { cwd: repoRoot, encoding: "utf8", input: "n\nn\n", maxBuffer: 1 << 24 });
  cli("init", "--force");
  const cfgFile = join(dir, "supabase", "config.toml");
  let cfg = readFileSync(cfgFile, "utf8");
  cfg = cfg.replace(/^project_id = .*$/m, 'project_id = "pintar40drd02"').replace(/= 543(\d\d)\b/g, "= 553$1").replace(/= 8083\b/g, "= 8183")
    .replace(/^major_version = .*$/m, "major_version = 17");
  writeFileSync(cfgFile, cfg);
  const st = cli("start", "-x", "studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit");
  const env = cli("status", "-o", "env").stdout ?? "";
  const val = (k: string) => new RegExp(`^${k}="?([^"\n]*)"?$`, "m").exec(env)?.[1] ?? "";
  return { ok: st.status === 0 && !!val("DB_URL"), err: `${st.stdout ?? ""}${st.stderr ?? ""}`.trim().split("\n").slice(-3).join(" | "),
    db: val("DB_URL"), s3: { TARGET_STORAGE_S3_ENDPOINT: val("STORAGE_S3_URL"), TARGET_STORAGE_S3_REGION: val("S3_PROTOCOL_REGION") || "local",
      TARGET_STORAGE_S3_KEY_ID: val("S3_PROTOCOL_ACCESS_KEY_ID"), TARGET_STORAGE_S3_SECRET: val("S3_PROTOCOL_ACCESS_KEY_SECRET") },
    stop: () => cli("stop", "--no-backup") };
}
function pgFromUrl(url: string): Pg {
  const u = new URL(url);
  return { PGHOST: u.hostname, PGPORT: u.port || "5432", PGDATABASE: u.pathname.replace(/^\//, "") || "postgres", PGUSER: decodeURIComponent(u.username), PGPASSWORD: decodeURIComponent(u.password) };
}

export const dr150bTests: SelfTest[] = [
  {
    id: "DR-S15",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let mig = "";
      try { mig = readFileSync(join(repoRoot, MIGRATION), "utf8"); } catch { /* the check below says so */ }
      if (!c.expect(mig, `${MIGRATION} is missing: no dedicated backup credential exists`)) return c.verdict("");
      const pg = postgres();
      const ada = psql(pg, "select count(*) from pg_roles where rolname = 'pintar_backup'");
      if (!c.expect(ada.ok && ada.out.trim() === "1", `CI's database has no role pintar_backup (${ada.err || ada.out.trim()})`)) return c.verdict("");

      // 1. the role, from the catalog
      const kat = psql(pg, `select concat_ws(' ', rolcanlogin, rolbypassrls, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolconnlimit)
          from pg_roles where rolname = 'pintar_backup';
        select coalesce(string_agg(g.rolname || ':' || a.admin_option, ',' order by g.rolname), '-') from pg_auth_members a join pg_roles g on g.oid = a.roleid
         where a.member = 'pintar_backup'::regrole;
        select count(*) from pg_auth_members a where a.roleid = 'pintar_backup'::regrole and (a.inherit_option or a.set_option);
        select (select count(*) from pg_class where relowner = 'pintar_backup'::regrole) + (select count(*) from pg_proc where proowner = 'pintar_backup'::regrole)
             + (select count(*) from pg_namespace where nspowner = 'pintar_backup'::regrole) + (select count(*) from pg_type where typowner = 'pintar_backup'::regrole);
        select coalesce(string_agg(nspname, ','), '-') from pg_namespace where has_schema_privilege('pintar_backup', oid, 'CREATE');
        select has_database_privilege('pintar_backup', current_database(), 'CREATE');
        select coalesce(string_agg(c.oid::regclass::text, ','), '-') from pg_class c where c.relkind in ('r','p','v','m','f') and c.oid <> 'pg_catalog.pg_settings'::regclass
           and (has_table_privilege('pintar_backup', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES'));
        select count(*) from pg_class c where case when c.relkind = 'S' then has_sequence_privilege('pintar_backup', c.oid, 'USAGE,UPDATE') else false end;
        -- (the selftest schema is CI's own harness, made by the test runner and never deployed: its fixtures are PUBLIC's)
        select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where p.prosecdef and n.nspname <> 'selftest' and has_function_privilege('pintar_backup', p.oid, 'EXECUTE');
        select count(*) filter (where has_function_privilege('pintar_backup', p.oid, 'EXECUTE')) || '/' || count(*)
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'pintar_permintaan', 'telemetry');
        select count(*) filter (where not has_table_privilege('pintar_backup', c.oid, 'SELECT')) || '/' || count(*)
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where c.relkind in ('r','p') and n.nspname in ('public','auth','storage','telemetry','supabase_migrations','pintar_permintaan');
        select string_agg(x, ',' order by x) from pg_db_role_setting s, unnest(s.setconfig) x where s.setrole = 'pintar_backup'::regrole and s.setdatabase = 0;`);
      if (!c.expect(kat.ok, `the catalog could not be read: ${kat.err}`)) return c.verdict("");
      const [atr, anggota, jadi, milik, skema, db, tulis, urutan, secdef, fungsi, baca, setel] = kat.out.trim().split("\n");
      c.expect(atr === "t t t f f f f 3", `pintar_backup's attributes (login bypassrls inherit super createdb createrole replication connlimit) are ${atr}`);
      c.expect(anggota === "pg_read_all_data:false", `pintar_backup belongs to ${anggota}, not to pg_read_all_data alone without admin`);
      c.expect(jadi === "0", `${jadi} role(s) can become pintar_backup or inherit its rights`);
      c.expect(milik === "0", `pintar_backup owns ${milik} object(s)`);
      c.expect(skema === "-" && db === "f", `pintar_backup may create in schema(s) ${skema}, or in the database (${db})`);
      c.expect(tulis === "-", `pintar_backup holds a write privilege on ${tulis}`);
      c.expect(urutan === "0", `pintar_backup may advance ${urutan} sequence(s)`);
      c.expect(secdef === "0", `pintar_backup may execute ${secdef} SECURITY DEFINER function(s)`);
      c.expect(/^0\/\d{3,}$/.test(fungsi ?? ""), `pintar_backup may execute PINTAR functions: ${fungsi}`);
      c.expect(/^0\/\d{2,}$/.test(baca ?? ""), `pintar_backup cannot read some of the tables a backup reads: ${baca}`);
      c.expect(setel === "default_transaction_read_only=on,idle_in_transaction_session_timeout=15min,idle_session_timeout=15min,lock_timeout=30s,statement_timeout=15min",
        `pintar_backup's defaults are ${setel}`);

      // 2. signed in as it (a password for this test only, removed afterwards: no password survives the test)
      const kata = randomBytes(24).toString("base64url");
      // a role that is not one of Supabase's reserved ones, so a refusal is pintar_backup's own and not supautils' guard
      const setPw = psql(pg, `alter role pintar_backup password '${kata}'; drop role if exists dr_s15_role; create role dr_s15_role nologin;`);
      if (!c.expect(setPw.ok, `a test password could not be set: ${setPw.err}`)) return c.verdict("");
      const pb = pgAs("pintar_backup", kata);
      const dir = mkdtempSync(join(tmpdir(), "dr-s15-"));
      try {
        const sesi = psql(pb, "select current_user; show default_transaction_read_only; show statement_timeout; show lock_timeout; " +
          "show idle_in_transaction_session_timeout; show idle_session_timeout;");
        c.expect(sesi.ok && sesi.out.trim() === "pintar_backup\non\n15min\n30s\n15min\n15min",
          `a fresh session as pintar_backup: ${sesi.out.trim().replace(/\n/g, " ")} ${sesi.err}`);
        const ro = psql(pb, "create temporary table dr_s15 (i int);");
        c.expect(!ro.ok && /read-only transaction/.test(ro.err), `by default it is not read-only: ${ro.err || "the temporary table was created"}`);

        // 3. it reads everything, past row security: its facts equal postgres's
        const fPb = psql(pb, "", { file: join(repoRoot, FAKTA) });
        const fPg = psql(pg, "", { file: join(repoRoot, FAKTA) });
        const t = (s: string) => s.split("\n").filter((l) => /^[TFPG]\|/.test(l));
        const beda = t(fPg.out).filter((l, i) => t(fPb.out)[i] !== l);
        c.expect(fPb.ok && fPg.ok && t(fPg.out).length > 100 && t(fPb.out).length === t(fPg.out).length && beda.length === 0,
          `its facts differ from postgres's: ${fPb.err || ""} ${beda.slice(0, 3).join(" ; ").slice(0, 300)} (${t(fPb.out).length} vs ${t(fPg.out).length} lines)`);
        const rls = psql(pb, "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relrowsecurity");
        c.expect(rls.ok && Number(rls.out) > 50, `public's row-protected tables, read past row security: ${rls.out.trim()} ${rls.err}`);

        // 4. its dumps equal postgres's, on one shared snapshot (the backup's dump commands; pg_dump of the server's version)
        const bin = pgBin(pg);
        const snap = await holdSnapshot(pg);
        const dumps = (who: Pg, sub: string) => {
          const out: Record<string, string> = {};
          const r = spawnSync("node", [join(repoRoot, "scripts/recovery/backup.mjs"), "dumps", join(dir, sub)], { encoding: "utf8", maxBuffer: 1 << 26,
            env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...who, PINTAR_PG_BIN: bin.dir, PINTAR_SNAPSHOT: snap.id } });
          for (const f of ["roles.sql", "schema.sql", "data.sql", "history-schema.sql", "history-data.sql"]) {
            try { out[f] = readFileSync(join(dir, sub, f), "utf8").split("\n").filter((l) => !/^(-- )?\\(un)?restrict /.test(l)).join("\n"); } catch { out[f] = ""; }
          }
          return { ok: r.status === 0, err: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-3).join(" | "), out };
        };
        let a, b;
        try { a = dumps(pb, "pb"); b = dumps(pg, "pg"); } finally { await snap.release(); }
        c.expect(a.ok && b.ok, `the dumps did not run (${bin.how}): pintar_backup: ${a.err}; postgres: ${b.err}`);
        for (const f of Object.keys(a.out)) {
          c.expect(a.out[f].length > 0 && a.out[f] === b.out[f], `${f} made by pintar_backup (${a.out[f].length} bytes) differs from postgres's (${b.out[f].length} bytes)`);
        }
        c.expect((a.out["data.sql"].match(/^COPY /gm) ?? []).length > 100, "the data dump holds too few tables to be complete");

        // 5. with read-only switched off, nothing in PINTAR can be changed
        const seq = psql(pg, "select c.oid::regclass from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'S' and n.nspname = 'public' order by 1 limit 1").out.trim();
        const fn = psql(pg, "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1 limit 1").out.trim();
        const tolak: [string, string][] = [
          ["INSERT", "insert into public.persons default values"],
          ["UPDATE", "update public.persons set id = id"],
          ["DELETE", "delete from public.audit_log"],
          ["TRUNCATE", "truncate public.audit_log"],
          ["COPY FROM", "copy public.persons from stdin"],
          ["INSERT auth.users", "insert into auth.users (id) values (gen_random_uuid())"],
          ["DELETE storage.objects", "delete from storage.objects"],
          ["UPDATE supabase_migrations", "update supabase_migrations.schema_migrations set name = name"],
          ...(seq ? [["nextval", `select nextval('${seq}')`], ["setval", `select setval('${seq}', 1)`]] as [string, string][] : []),
          ["CREATE TABLE", "create table public.dr_s15 (i int)"],
          ["CREATE VIEW", "create view public.dr_s15 as select 1"],
          ["CREATE FUNCTION", "create function public.dr_s15() returns int language sql as 'select 1'"],
          ["CREATE SCHEMA", "create schema dr_s15"],
          // RESTATED FOR D-108: an extension OFF Supabase's allow-list is refused; the allow-listed ones are the platform
          // residual, shown below and caught by the extension baseline (DR-S14)
          ["CREATE EXTENSION (not allow-listed)", "create extension pageinspect"],
          ["ALTER TABLE", "alter table public.persons add column dr_s15 int"],
          ["DROP TABLE", "drop table public.audit_log"],
          ["CREATE POLICY", "create policy dr_s15 on public.persons using (true)"],
          ["ALTER POLICY", "alter table public.persons disable row level security"],
          ["CREATE TRIGGER", "create trigger dr_s15 before insert on public.persons for each row execute function suppress_redundant_updates_trigger()"],
          ["COMMENT", "comment on table public.persons is 'dr_s15'"],
          ["ALTER FUNCTION", `alter function ${fn} owner to pintar_backup`],
          ["DROP FUNCTION", `drop function ${fn}`],
          ["GRANT role", "grant pg_read_all_data to dr_s15_role"],
          ["GRANT itself", "grant pintar_backup to dr_s15_role"],
          ["REVOKE role", "revoke pg_read_all_data from pintar_backup"],
          ["CREATE ROLE", "create role dr_s15"],
          ["ALTER ROLE other", "alter role dr_s15_role login"],
          ["ALTER ROLE own attribute", "alter role pintar_backup createrole"],
          ["ALTER DEFAULT PRIVILEGES", "alter default privileges for role postgres grant all on tables to anon"],
          ...["postgres", "authenticated", "service_role", "anon", "supabase_admin"].map((r) => [`SET ROLE ${r}`, `set role ${r}`] as [string, string]),
        ];
        const lolos: string[] = [];
        for (const [nama, sql] of tolak) {
          const r = psql(pb, `set default_transaction_read_only = off; ${sql};`);
          if (r.ok || /read-only transaction/.test(r.err) || !/(permission denied|must be owner|must have admin option|must be able to SET ROLE|only roles with)/i.test(r.err)) {
            lolos.push(`${nama}: ${r.ok ? "ALLOWED" : r.err.split("\n")[0]}`);
          }
        }
        c.expect(lolos.length === 0, `with read-only off, pintar_backup was not refused: ${lolos.join("; ")}`);
        // a GRANT or REVOKE by a role that may read but holds no grant option warns and changes nothing: the rights must not move
        const hak = () => psql(pg, "select md5(string_agg(c.oid::regclass::text || '=' || coalesce(c.relacl::text, '-'), '|' order by c.oid)) " +
          "from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'auth', 'storage')").out.trim();
        const sebelum = hak();
        psql(pb, "set default_transaction_read_only = off; grant select on public.persons to anon; grant all on public.audit_log to authenticated; " +
          "revoke all on public.persons from authenticated; revoke select on auth.users from supabase_auth_admin;", { stopOnError: false });
        c.expect(sebelum.length === 32 && hak() === sebelum, "a GRANT or REVOKE by pintar_backup changed a right");

        // the D-108 residual, exactly: an allow-listed extension is made by supautils as supabase_admin, not by a right of
        // pintar_backup's (rolled back, so nothing is left)
        const res = psql(pb, "set default_transaction_read_only = off; begin; create extension pg_trgm; " +
          "select pg_get_userbyid(extowner) from pg_extension where extname = 'pg_trgm'; rollback;", { stopOnError: false });
        c.expect(res.ok && res.out.trim() === "supabase_admin", `the extension residual is not the platform's (owner ${res.out.trim() || "-"}): ${res.err}`);
        c.note("D-108 platform residual, shown and rolled back: Supabase's supautils created the allow-listed extension pg_trgm for pintar_backup, " +
          "owned by supabase_admin; any database login can do this, and a DROP ... CASCADE may affect dependent PINTAR objects. The backup " +
          "fails closed on any extension change (DR-S14) and a restore checks the baseline (DR-D02)");
        const nol = psql(pg, "select count(*) from pg_extension where extname = 'pg_trgm'").out.trim();
        c.expect(nol === "0", `pg_trgm was left installed (${nol})`);

        // 6. the connection limit, enforced by the server
        const tidur = [1, 2, 3].map(() => spawn("psql", ["-X", "-q", "-c", "select pg_sleep(4)"], { env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...pb } }));
        await new Promise((ok) => setTimeout(ok, 1500));
        const keempat = psql(pb, "select 1");
        await Promise.all(tidur.map((p) => new Promise((ok) => p.on("close", ok))));
        c.expect(!keempat.ok && /too many connections for role "pintar_backup"/.test(keempat.err), `a fourth connection: ${keempat.ok ? "accepted" : keempat.err}`);

        // 7. what remains possible touches no PINTAR object (A7, reported)
        const sisa = psql(pb, "set default_transaction_read_only = off; begin; create temporary table dr_s15 (i int); " +
          "select lo_unlink(lo_from_bytea(0, 'x')); rollback;", { stopOnError: false });
        c.note(`still possible for pintar_backup, touching no PINTAR object: a temporary table and a large object (${sisa.ok ? "both, rolled back" : sisa.err.split("\n")[0]}), and changing its own password; the backup fails closed on any large object`);
      } finally {
        psql(pg, "alter role pintar_backup password null; select pg_terminate_backend(pid) from pg_stat_activity where usename = 'pintar_backup'; " +
          "drop role if exists dr_s15_role; drop extension if exists pg_trgm;", { stopOnError: false });
      }
      return c.verdict("pintar_backup is LOGIN, BYPASSRLS, in pg_read_all_data alone, owns nothing, executes no SECURITY DEFINER or PINTAR function and " +
        "nobody can become it; a fresh session is read-only with its timeouts; its facts equal postgres's past row security and its five dumps on " +
        "one snapshot are byte-identical to postgres's; with read-only off every ordinary write, DDL, grant and role change and an extension off " +
        "the allow-list are refused and no right moves; the allow-listed extension residual is supautils' (supabase_admin), as D-108 records; " +
        "a fourth connection is refused");
    },
  },
  {
    id: "DR-S09",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const m = await backupModul(repoRoot);
      if (!c.expect(m && typeof m.seal === "function", `${BACKUP} is missing: nothing encrypts a backup`)) return c.verdict("");
      const b = m!;
      const dir = mkdtempSync(join(tmpdir(), "dr-s09-"));
      const k = makeKeys(dir, ["R1", "R2", "R3"]);
      const isi = join(dir, "bundle"); mkdirSync(isi);
      writeFileSync(join(isi, "data.sql"), "COPY t FROM stdin;\n\\.\n");
      await b.writeManifest(isi);
      // production: R1 and R2, exactly
      const out = join(dir, "prod.gpg");
      const s = await b.seal(isi, out, k.pub, ["R1", "R2"]);
      const sub = (n: string) => b.keyInfo(join(k.pub, `${n}.asc`), join(dir, `chk-${n}`)).subkeys;
      for (const n of ["R1", "R2", "R3"]) mkdirSync(join(dir, `chk-${n}`), { mode: 0o700 });
      c.expect(s.recipients.length === 2 && b.checkRecipients(out, [sub("R1"), sub("R2")], ["R1", "R2"]).problems.length === 0,
        `the production ciphertext's recipients are ${s.recipients.join(" ")}`);
      c.expect(decrypt(k.homes.R1, out, join(dir, "o1")).ok && decrypt(k.homes.R2, out, join(dir, "o2")).ok, "R1's or R2's private key cannot open a production bundle");
      const r3 = decrypt(k.homes.R3, out, join(dir, "o3"));
      c.expect(!r3.ok && /no secret key|decryption failed/i.test(r3.err), `R3's private key opens a production bundle: ${r3.err.split("\n").slice(-1)}`);
      const job = join(dir, "job"); mkdirSync(job, { mode: 0o700 });
      for (const n of ["R1", "R2", "R3"]) spawnSync("gpg", ["--homedir", job, "--batch", "--import", join(k.pub, `${n}.asc`)]);
      const j = decrypt(job, out, join(dir, "oj"));
      c.expect(!j.ok && /no secret key|decryption failed/i.test(j.err), `the job's own public keyring opens a bundle: ${j.err.split("\n").slice(-1)}`);
      // the rules
      const rf = (t: string, n: string) => b.recipientsFor(t, n).problems.join("; ");
      c.expect(/may never open a production bundle/.test(rf("production", "R1 R2 R3")), "a production bundle may go to R3");
      c.expect(/must also go to R3/.test(rf("staging", "R1 R2")), "a staging bundle may leave out R3, the drill's key");
      c.expect(/R1, custodian A's recovery key, is not among/.test(rf("production", "R2")), "a bundle may leave out R1");
      c.expect(rf("production", "R1 R2") === "" && rf("staging", "R1 R2 R3") === "" && rf("production", "R1") === "", "a permitted recipient set is refused");
      // a missing and an extra recipient
      c.expect(/not encrypted to R3/.test(b.checkRecipients(out, [sub("R1"), sub("R2"), sub("R3")], ["R1", "R2", "R3"]).problems.join(" ")), "a missing recipient is not noticed");
      c.expect(/unexpected key/.test(b.checkRecipients(out, [sub("R1")], ["R1"]).problems.join(" ")), "an extra recipient is not noticed");
      // a private key where a public key belongs, and a weak key
      const priv = join(dir, "priv"); mkdirSync(priv);
      writeFileSync(join(priv, "R1.asc"), spawnSync("gpg", ["--homedir", k.homes.R1, "--batch", "--pinentry-mode", "loopback", "--passphrase", "", "--armor", "--export-secret-keys"], { encoding: "utf8" }).stdout);
      writeFileSync(join(priv, "R2.asc"), readFileSync(join(k.pub, "R2.asc")));
      let e1 = ""; try { await b.seal(isi, join(dir, "x.gpg"), priv, ["R1", "R2"]); } catch (e) { e1 = (e as Error).message; }
      c.expect(/R1: .*(public keys, not one|private key)/.test(e1) && !existsSync(join(dir, "x.gpg")), `a private key file was accepted as a recipient: ${e1 || "sealed"}`);
      const weak = makeKeys(join(dir, "weak"), ["R1"], { algo: "rsa2048" });
      writeFileSync(join(weak.pub, "R2.asc"), readFileSync(join(k.pub, "R2.asc")));
      let e2 = ""; try { await b.seal(isi, join(dir, "w.gpg"), weak.pub, ["R1", "R2"]); } catch (e) { e2 = (e as Error).message; }
      c.expect(/too weak/.test(e2), `a 2048-bit RSA key was accepted: ${e2 || "sealed"}`);
      return c.verdict("a production bundle goes to R1 and R2 exactly, read from its packets; their private keys open it, R3's and the job's " +
        "public-only keyring do not; production never names R3, staging always does, R1 is required; a private key file, a weak key and a " +
        "missing or extra recipient are refused");
    },
  },
  {
    id: "DR-S14",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      if (!c.expect(await backupModul(repoRoot), `${BACKUP} is missing: there is no independent backup`)) return c.verdict("");
      const pg = postgres();
      const dir = mkdtempSync(join(tmpdir(), "dr-s14-"));
      const k = makeKeys(dir, ["R1", "R2", "R3"]);
      const st = localStorage(repoRoot);
      const BUCKET = "dr150-backup-test";
      const kata = randomBytes(24).toString("base64url");
      const ext = psql(pg, "select json_object_agg(extname, extversion) from pg_extension").out.trim();
      const baseline = join(dir, "baseline.json");
      writeFileSync(baseline, JSON.stringify({ staging: JSON.parse(ext), production: null }));
      const files: Record<string, Buffer> = { "a.txt": Buffer.from("PINTAR backup test\n"), "nested/b.bin": randomBytes(70000), "c d.json": Buffer.from('{"x":1}') };
      const outputs: string[] = [];
      try {
        const setPw = psql(pg, `alter role pintar_backup password '${kata}'`);
        if (!c.expect(setPw.ok, `a test password could not be set: ${setPw.err}`)) return c.verdict("");
        await storageRest(st, "POST", "bucket", JSON.stringify({ id: BUCKET, name: BUCKET, public: false }));
        for (const [n, b] of Object.entries(files)) {
          const r = await storageRest(st, "POST", `object/${BUCKET}/${n.split("/").map(encodeURIComponent).join("/")}`, b, "application/octet-stream");
          c.expect(r.status === 200, `a test object could not be stored in Storage: ${r.status} ${r.text.slice(0, 120)}`);
        }
        const bin = pgBin(pg);
        const env = (s3url: string, extra: Record<string, string> = {}): NodeJS.ProcessEnv => ({ PATH: process.env.PATH ?? "", NODE_ENV: "production" as const,
          ...pgAs("pintar_backup", kata), PINTAR_PG_BIN: bin.dir, ...st.s3, BACKUP_TARGET: "staging", BACKUP_RECIPIENTS: "R1 R2 R3",
          RECIPIENTS_DIR: k.pub, EXTENSION_BASELINE: baseline, BACKUP_S3_ENDPOINT: s3url, BACKUP_S3_REGION: "ap-southeast-1",
          BACKUP_S3_BUCKET: "pintar-backup-test", BACKUP_S3_KEY_ID: "AKIASTANDINWRITER", BACKUP_S3_SECRET: "standin-secret",
          BACKUP_S3_PATH_STYLE: "1", BACKUP_NOW: "2026-11-01T20:00:00Z", RELEASE_SHA: "dr-s14", RUNNER_TEMP: dir, ...extra });
        const run = async (extra: Record<string, string> = {}, refuse?: RegExp) => {
          const s3 = await standInS3({ keyId: "AKIASTANDINWRITER", refuse });
          try {
            // asynchronous: the stand-in S3 answers from this very process, so a synchronous spawn would never be answered
            const r = await new Promise<{ code: number | null; text: string }>((ok) => {
              const p = spawn("node", [join(repoRoot, BACKUP), "run"], { env: env(s3.url, extra) });
              let text = ""; p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b));
              p.on("close", (code) => ok({ code, text }));
            });
            outputs.push(r.text);
            return { code: r.code, text: r.text, order: [...s3.order], objects: new Map(s3.objects), methods: [...s3.methods] };
          } finally { await s3.close(); }
        };
        const sukses = (x: { order: string[] }) => x.order.filter((o) => o.endsWith(".success.json"));

        // 1. clean
        const a = await run();
        const daily = a.order.find((o) => /^staging\/daily\/2026-11-01\/pintar-staging-20261101T200000Z\.tar\.gz\.gpg$/.test(o)) ?? "";
        const monthly = a.order.find((o) => /^staging\/monthly\/2026-11\/pintar-staging-20261101T200000Z\.tar\.gz\.gpg$/.test(o)) ?? "";
        c.expect(a.code === 0 && daily && monthly && a.order.length === 4 && a.order[1] === `${daily}.success.json` && a.order[3] === `${monthly}.success.json`
          && a.methods.every((x) => x === "PUT"),
          `the clean run: exit ${a.code}; uploaded ${a.order.join(", ")}; ${a.text.trim().split("\n").slice(-2).join(" | ").slice(0, 400)}`);
        const h = (key: string) => a.objects.get(key)?.headers ?? {};
        c.expect(h(daily)["x-amz-object-lock-mode"] === "GOVERNANCE" && h(daily)["x-amz-object-lock-retain-until-date"] === "2026-12-06T20:00:00Z"
          && h(monthly)["x-amz-object-lock-retain-until-date"] === "2027-11-02T20:00:00Z" && h(`${daily}.success.json`)["x-amz-object-lock-mode"] === "GOVERNANCE",
          `the retention set by the uploads: ${JSON.stringify([h(daily), h(monthly)])}`);
        const rec = a.objects.get(`${daily}.success.json`) ? JSON.parse(a.objects.get(`${daily}.success.json`)!.body.toString()) : null;
        c.expect(rec?.target === "staging" && rec?.bundle?.recipients?.join(" ") === "R1 R2 R3" && rec?.database?.tables > 100 && rec?.storage?.objects >= 3
          && /^[0-9a-f]{64}$/.test(rec?.database?.extensions?.fingerprint ?? "") && rec?.bundle?.sha256 === createHash("sha256").update(a.objects.get(daily)?.body ?? "").digest("hex"),
          `the success record: ${JSON.stringify(rec).slice(0, 400)}`);
        // the bundle opens with the drill's key, matches its manifest and holds every planted object with its hash
        if (daily) {
          writeFileSync(join(dir, "daily.gpg"), a.objects.get(daily)!.body);
          const d = decrypt(k.homes.R3, join(dir, "daily.gpg"), join(dir, "daily.tar.gz"));
          const x = join(dir, "x"); mkdirSync(x);
          const t = spawnSync("tar", ["-xzf", join(dir, "daily.tar.gz"), "-C", x]);
          const b = (await backupModul(repoRoot))!;
          const mf = d.ok && t.status === 0 ? await b.checkManifest(x) : { problems: [`cannot open: ${d.err}`], files: 0 };
          c.expect(mf.problems.length === 0 && mf.files > 10, `the decrypted bundle against its manifest: ${mf.problems.slice(0, 3).join("; ")}`);
          const man = existsSync(join(x, "storage/manifest.jsonl")) ? readFileSync(join(x, "storage/manifest.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
          for (const [n, body] of Object.entries(files)) {
            const e = man.find((o: { bucket: string; name: string }) => o.bucket === BUCKET && o.name === n);
            c.expect(e && e.sha256 === createHash("sha256").update(body).digest("hex") && readFileSync(join(x, e.file)).equals(body), `Storage object ${n} is not in the bundle as stored`);
          }
          const semua = readdirSync(x, { recursive: true }) as string[];
          const bocor = semua.filter((f) => { try { return readFileSync(join(x, f)).includes(kata); } catch { return false; } });
          c.expect(bocor.length === 0, `the password is in the bundle: ${bocor.join(", ")}`);
          c.expect(existsSync(join(x, "extensions.json")) && !existsSync(join(x, "readiness.txt")), "the bundle lacks extensions.json, or carries readiness.txt (D-108(d))");
        }

        // 2. planted failures: each red, no success record uploaded
        const merah = async (nama: string, kata2: RegExp, extra: Record<string, string> = {}, refuse?: RegExp) => {
          const r = await run(extra, refuse);
          c.expect(r.code !== 0 && sukses(r).length === 0 && kata2.test(r.text), `${nama}: exit ${r.code}, success records ${sukses(r).length}; ${r.text.trim().split("\n").slice(-1)[0]?.slice(0, 300)}`);
          return r;
        };
        // a table missing from the data dump: pg_dump's output with one COPY section cut out
        const potong = join(dir, "potong"); mkdirSync(potong);
        writeFileSync(join(potong, "pg_dump"), `#!/bin/sh\ncase "$*" in *"--schema supabase_migrations"*) exec "${bin.dir ? join(bin.dir, "pg_dump") : "pg_dump"}" "$@";; ` +
          `*--data-only*) "${bin.dir ? join(bin.dir, "pg_dump") : "pg_dump"}" "$@" | awk '/^COPY "public"."persons" /{skip=1} !skip{print} skip && /^\\\\\\.$/{skip=0}'; exit 0;; ` +
          `*) exec "${bin.dir ? join(bin.dir, "pg_dump") : "pg_dump"}" "$@";; esac\n`, { mode: 0o755 });
        writeFileSync(join(potong, "pg_dumpall"), `#!/bin/sh\nexec "${bin.dir ? join(bin.dir, "pg_dumpall") : "pg_dumpall"}" "$@"\n`, { mode: 0o755 });
        const m1 = await merah("a table missing from the data dump", /no COPY for public\.persons/, { PINTAR_PG_BIN: potong });
        c.expect(m1.order.length === 0, "a bundle missing a table was uploaded");
        // a Storage object that is not there, and one whose size differs from its metadata
        const pgSu = (sql: string) => psql(pgAs("supabase_admin", decodeURIComponent(new URL(process.env.SUPABASE_DB_URL!).password)), sql);
        pgSu(`insert into storage.objects (bucket_id, name, metadata) values ('${BUCKET}', 'ghost.bin', '{"size": 5, "eTag": "\\"0123456789abcdef0123456789abcdef\\""}')`);
        // (Storage answers a row whose file is missing with an error status; any answer but 200 is "not there")
        await merah("a Storage object that is not there", /Storage object #\d+ in dr150-backup-test: HTTP \d{3} \(after 3 tries\)/);
        // (Storage refuses a direct delete unless its own session switch is set: test clean-up only)
        pgSu(`set storage.allow_delete_query = 'true'; delete from storage.objects where bucket_id = '${BUCKET}' and name = 'ghost.bin'`);
        pgSu(`update storage.objects set metadata = jsonb_set(metadata, '{size}', '999') where bucket_id = '${BUCKET}' and name = 'a.txt'`);
        await merah("a Storage object whose size differs", /bytes, its metadata 999/);
        pgSu(`update storage.objects set metadata = jsonb_set(metadata, '{size}', '${files["a.txt"].length}') where bucket_id = '${BUCKET}' and name = 'a.txt'`);
        // recipients
        await merah("a staging bundle not going to R3", /must also go to R3/, { BACKUP_RECIPIENTS: "R1 R2" });
        await merah("a production bundle going to R3", /may never open a production bundle/, { BACKUP_TARGET: "production", BACKUP_RECIPIENTS: "R1 R2 R3" });
        // a checksum S3 rejects
        const m6 = await merah("a checksum S3 rejects", /was refused: BadDigest/, {}, /\.gpg$/);
        c.expect(m6.order.length === 0, "something was uploaded around a rejected checksum");
        // D-108: an extension added by pintar_backup itself, through supautils
        const tambah = psql(pgAs("pintar_backup", kata), "set default_transaction_read_only = off; create extension pg_trgm;", { stopOnError: false });
        c.expect(tambah.ok, `pintar_backup could not add an extension through supautils this time: ${tambah.err}`);
        await merah("an extension pintar_backup added", /extension pg_trgm .* not in the approved baseline/);
        psql(pg, "drop extension if exists pg_trgm", { stopOnError: false });
        // a production backup with no approved baseline
        await merah("a production backup with no approved extension baseline", /no approved extension baseline is recorded for production/,
          { BACKUP_TARGET: "production", BACKUP_RECIPIENTS: "R1 R2" });
        c.expect(!outputs.join("\n").includes(kata), "the password appears in the backup's output");
      } finally {
        psql(pg, "alter role pintar_backup password null; select pg_terminate_backend(pid) from pg_stat_activity where usename = 'pintar_backup'; " +
          "drop extension if exists pg_trgm;", { stopOnError: false });
        await storageRest(st, "DELETE", `object/${BUCKET}`, JSON.stringify({ prefixes: Object.keys(files) }));
        psql(pgAs("supabase_admin", decodeURIComponent(new URL(process.env.SUPABASE_DB_URL!).password)),
          `set storage.allow_delete_query = 'true'; delete from storage.objects where bucket_id = '${BUCKET}'`, { stopOnError: false });
        await storageRest(st, "DELETE", `bucket/${BUCKET}`);
      }
      return c.verdict("a clean run uploads the daily and monthly copies with their checksums and locks, each success record after its bundle; " +
        "the bundle opens with the drill's key, matches its manifest and holds every Storage object as stored, and never the password; a missing " +
        "table, a missing or changed Storage object, wrong recipients, a rejected checksum, an extension added through supautils and a production " +
        "backup without a baseline are each red with no success record");
    },
  },
  {
    id: "DR-S08",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const m = (await backupModul(repoRoot)) as unknown as Pola | null;
      if (!c.expect(m && typeof m.patternRegex === "function", `${BACKUP} is missing: nothing puts PINTAR's exact rights back after a restore`)) return c.verdict("");
      const pg = postgres();
      const dir = mkdtempSync(join(tmpdir(), "dr-s08-"));
      const f = join(dir, "acl.sql");
      const g = spawnSync("node", [join(repoRoot, BACKUP), "acl", f], { encoding: "utf8", env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...pg } });
      if (!c.expect(g.status === 0 && existsSync(f), `acl.sql could not be generated: ${(g.stdout ?? "") + (g.stderr ?? "")}`)) return c.verdict("");
      const body = readFileSync(f, "utf8").split("\n").filter((l) => l !== "begin;" && l !== "commit;").join("\n");
      const D = hakDigest(m!.patternRegex(m!.SCHEMA_EXCLUDE));
      const ready = (rows: string) => rows.split("\n").filter((l) => /^(PASS|FAIL)\|/.test(l)).map((l) => l.split("|").slice(0, 2).join("|"));
      const bersih = psql(pg, `begin;\nselect 'D|' || (${D});\n\\i ${join(repoRoot, "docs/audit/launch-readiness.sql")}\nrollback;\n`);
      const r = psql(pg, `begin;
select 'D|' || (${D});
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;
grant all on schema public to anon;
do $x$ declare t regclass; begin
  select c.oid into t from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('authenticated', c.oid, 'SELECT') order by 1 limit 1;
  execute format('revoke all on %s from authenticated', t);
end $x$;
select 'D|' || (${D});
${body}
select 'D|' || (${D});
\\i ${join(repoRoot, "docs/audit/launch-readiness.sql")}
rollback;
`);
      const d = r.out.split("\n").filter((l) => l.startsWith("D|"));
      c.expect(r.ok && d.length === 3, `the drift, the rights script and the digests did not run: ${r.err.split("\n").slice(-2).join(" | ")}`);
      const d0 = bersih.out.split("\n").find((l) => l.startsWith("D|"));
      c.expect(d[0] === d0 && d[1] !== d[0], `the drift did not move the rights (${d[0]} -> ${d[1]})`);
      c.expect(d[2] === d[0], `acl.sql did not put every right back: before ${d[0]}, after ${d[2]}`);
      const rb = ready(bersih.out), ra = ready(r.out);
      c.expect(rb.length === 24 && JSON.stringify(ra) === JSON.stringify(rb), `readiness after acl.sql differs from before: ${ra.filter((x) => !rb.includes(x)).join("; ")}`);
      return c.verdict("after every table, sequence and function was given to anon and authenticated, CREATE on public to anon, and a right taken " +
        "away, acl.sql put each PINTAR object's rights for anon, authenticated, service_role and PUBLIC back exactly; readiness reads as before");
    },
  },
  {
    id: "DR-D02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      if (!c.expect(existsSync(join(repoRoot, "scripts/recovery/restore-bundle.mjs")) && (await backupModul(repoRoot)),
        "scripts/recovery/restore-bundle.mjs or backup.mjs is missing: there is no logical restore path")) return c.verdict("");
      const pg = postgres();
      const dir = mkdtempSync(join(tmpdir(), "dr-d02-"));
      const st = localStorage(repoRoot);
      const BUCKET = "dr150-restore-test";
      const files: Record<string, Buffer> = { "x/one.bin": randomBytes(4096), "two.txt": Buffer.from("restored as stored\n") };
      const kata = randomBytes(24).toString("base64url");
      const ext = psql(pg, "select json_object_agg(extname, extversion) from pg_extension").out.trim();
      writeFileSync(join(dir, "baseline.json"), JSON.stringify({ rehearsal: JSON.parse(ext) }));
      let stack: Awaited<ReturnType<typeof emptyStack>> | null = null;
      try {
        psql(pg, `alter role pintar_backup password '${kata}'`);
        await storageRest(st, "POST", "bucket", JSON.stringify({ id: BUCKET, name: BUCKET, public: false }));
        for (const [n, b] of Object.entries(files)) await storageRest(st, "POST", `object/${BUCKET}/${n}`, b, "application/octet-stream");
        // 1. the bundle, from CI's database and Storage, as pintar_backup
        const bundle = join(dir, "bundle");
        const bin = pgBin(pg);
        const col = spawnSync("node", [join(repoRoot, BACKUP), "collect", bundle], { encoding: "utf8", maxBuffer: 1 << 26,
          env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", ...pgAs("pintar_backup", kata), PINTAR_PG_BIN: bin.dir, ...st.s3,
            BACKUP_TARGET: "rehearsal", EXTENSION_BASELINE: join(dir, "baseline.json") } });
        if (!c.expect(col.status === 0, `the bundle could not be collected: ${((col.stdout ?? "") + (col.stderr ?? "")).trim().split("\n").slice(-3).join(" | ")}`)) return c.verdict("");
        // the source's readiness, row by row (CI's database need not read 24/24: other suites write content into it)
        const srcReady = psql(pg, "", { file: join(repoRoot, "docs/audit/launch-readiness.sql") }).out.split("\n")
          .filter((l) => /^(PASS|FAIL)\|/.test(l)).map((l) => l.split("|").slice(0, 2).join("|"));
        writeFileSync(join(dir, "ready.txt"), srcReady.join("\n") + "\n");
        // 2. an empty Supabase stack
        stack = await emptyStack(repoRoot, join(dir, "stack"));
        if (!c.expect(stack.ok, `the empty stack did not start: ${stack.err}`)) return c.verdict("");
        const target = pgFromUrl(stack.db);
        const kosong = psql(target, "select count(*) from information_schema.tables where table_schema = 'public'").out.trim();
        c.expect(kosong === "0", `the target is not empty: ${kosong} public tables`);
        const tEnv = (extra: Record<string, string> = {}): NodeJS.ProcessEnv => ({ PATH: process.env.PATH ?? "", NODE_ENV: "production" as const, ...target, ...stack!.s3,
          RESTORE_TARGET: "rehearsal", EXTENSION_BASELINE: join(dir, "baseline.json"), RESTORE_READINESS_EXPECTED: join(dir, "ready.txt"), ...extra });
        const restore = (...a: string[]) => {
          const r = spawnSync("node", [join(repoRoot, "scripts/recovery/restore-bundle.mjs"), bundle, ...a], { encoding: "utf8", maxBuffer: 1 << 26, env: tEnv() });
          return { code: r.status, text: `${r.stdout ?? ""}${r.stderr ?? ""}` };
        };
        // 3. the restore, Storage files included
        const t0 = Date.now();
        const a = restore("--storage");
        c.expect(a.code === 0 && /SAFE TO REOPEN/.test(a.text) && /facts: \d+ compared, 0 difference/.test(a.text) && /Storage: 2 object|Storage: \d+ object/.test(a.text),
          `the restore into the empty stack: exit ${a.code}; ${a.text.trim().split("\n").slice(-6).join(" | ").slice(0, 900)}`);
        c.note(`logical path on CI: restored and verified in ${Math.round((Date.now() - t0) / 1000)} s`);
        // the new project's default privileges did not open anything: anon's reach equals the source's
        const anon = (p: Pg) => psql(p, "select count(*) filter (where has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v','m','p')").out.trim();
        c.expect(anon(target) === anon(pg), `anon reaches ${anon(target)} public relation(s) on the copy, ${anon(pg)} on its source`);
        // 4. D-108(c)(8): an extension added on the copy: the verification refuses to call it safe, and again once removed
        psql(target, "create extension if not exists pg_trgm");
        const b = restore("--verify-only", "--storage");
        c.expect(b.code !== 0 && !/SAFE TO REOPEN/.test(b.text) && /pg_trgm .*not in the approved baseline/.test(b.text),
          `an extension added on the copy: exit ${b.code}; ${b.text.trim().split("\n").slice(-2).join(" | ").slice(0, 400)}`);
        psql(target, "drop extension pg_trgm");
        const d = restore("--verify-only", "--storage");
        c.expect(d.code === 0 && /SAFE TO REOPEN/.test(d.text), `the copy once the extension is removed: exit ${d.code}; ${d.text.trim().split("\n").slice(-3).join(" | ").slice(0, 400)}`);
      } finally {
        stack?.stop();
        psql(pg, "alter role pintar_backup password null; select pg_terminate_backend(pid) from pg_stat_activity where usename = 'pintar_backup';", { stopOnError: false });
        await storageRest(st, "DELETE", `object/${BUCKET}`, JSON.stringify({ prefixes: Object.keys(files) }));
        await storageRest(st, "DELETE", `bucket/${BUCKET}`);
      }
      return c.verdict("a bundle collected by pintar_backup from CI's database and Storage restores into an empty Supabase stack with 0 differences, " +
        "every Storage file read back with its hash, anon's reach as its source's, the extension baseline held and readiness as its source: SAFE TO " +
        "REOPEN; an extension added on the copy makes its verification refuse, and removing it makes it safe again");
    },
  },
  {
    id: "DR-S10",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const ESCROW = join(repoRoot, "scripts/recovery/escrow.mjs");
      if (!c.expect(existsSync(ESCROW), "scripts/recovery/escrow.mjs is missing: the durable secrets have no escrow")) return c.verdict("");
      const ds = (await import(pathToFileURL(join(repoRoot, "scripts/release/durable-secrets.mjs")).href)) as { fingerprint: (n: string, v: string) => string };
      const dir = mkdtempSync(join(tmpdir(), "dr-s10-"));
      const k = makeKeys(dir, ["R1", "R2", "R3"]);
      const A = randomBytes(32).toString("hex"), B = randomBytes(32).toString("hex");
      const reg = (pa: string | null, pb: string | null) => {
        const f = join(dir, `reg-${randomBytes(4).toString("hex")}.json`);
        writeFileSync(f, JSON.stringify({ production: { CARD_PEPPER: { fingerprint: pa }, CERT_SECRET_KEY_V1: { fingerprint: pb } } }));
        return f;
      };
      const fa = ds.fingerprint("CARD_PEPPER", A), fb = ds.fingerprint("CERT_SECRET_KEY_V1", B);
      const outputs: string[] = [];
      const jalan = async (args: string[], o: { vercel: Record<string, string>; registry: string; refuse?: RegExp; preload?: Map<string, { body: Buffer; headers: Record<string, string> }>; extra?: Record<string, string> }) => {
        const events: string[] = [];
        const v = await standInVercel(o.vercel, events);
        const s3 = await standInS3({ keyId: "AKIASTANDINESCROW", refuse: o.refuse, preload: o.preload, events });
        try {
          const r = await new Promise<{ code: number | null; text: string }>((ok) => {
            const p = spawn("node", [ESCROW, ...args], { env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", VERCEL_TOKEN: "vercel-standin-token",
              PRODUCTION_VERCEL_PROJECT_NAME: "pintar-standin", VERCEL_API: v.url, REGISTRY: o.registry, RECIPIENTS_DIR: k.pub,
              ESCROW_S3_ENDPOINT: s3.url, ESCROW_S3_REGION: "ap-southeast-1", ESCROW_S3_BUCKET: "pintar-backup-test", ESCROW_S3_KEY_ID: "AKIASTANDINESCROW",
              ESCROW_S3_SECRET: "standin", ESCROW_S3_PATH_STYLE: "1", ...(o.extra ?? {}) } });
            let text = ""; p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b));
            p.on("close", (code) => ok({ code, text }));
          });
          outputs.push(r.text);
          return { ...r, events, objects: new Map(s3.objects), env: new Map(v.env), writes: [...v.writes] };
        } finally { await v.close(); await s3.close(); }
      };
      const buka = (home: string, body: Buffer | undefined) => {
        writeFileSync(join(dir, "e.gpg"), body ?? Buffer.alloc(0));
        const r = spawnSync("gpg", ["--homedir", home, "--batch", "--pinentry-mode", "loopback", "--passphrase", "", "--decrypt", join(dir, "e.gpg")], { encoding: "utf8" });
        try { return r.status === 0 ? JSON.parse(r.stdout) as { value: string; fingerprint: string } : null; } catch { return null; }
      };
      const kA = `production/escrow/CARD_PEPPER/${fa}.json.gpg`, kB = `production/escrow/CERT_SECRET_KEY_V1/${fb}.json.gpg`;
      // 1. escrow
      const e = await jalan(["escrow"], { vercel: { CARD_PEPPER: A, CERT_SECRET_KEY_V1: B }, registry: reg(fa, fb) });
      c.expect(e.code === 0 && e.objects.has(kA) && e.objects.has(kB) && [kA, kB].every((x) => e.objects.get(x)?.headers["x-amz-object-lock-legal-hold"] === "ON")
        && e.writes.length === 0, `escrow: exit ${e.code}; uploaded ${[...e.objects.keys()].join(", ")}; ${e.text.trim().split("\n").slice(-1)}`);
      c.expect(buka(k.homes.R1, e.objects.get(kA)?.body)?.value === A && buka(k.homes.R2, e.objects.get(kB)?.body)?.value === B,
        "the escrow does not open with R1's or R2's private key to the secret's value");
      c.expect(buka(k.homes.R3, e.objects.get(kA)?.body) === null, "R3, the drill key GitHub holds, opens the escrow");
      // 2-3. a mismatch, and no record
      const m = await jalan(["escrow"], { vercel: { CARD_PEPPER: A, CERT_SECRET_KEY_V1: B }, registry: reg(ds.fingerprint("CARD_PEPPER", B), fb) });
      c.expect(m.code !== 0 && m.objects.size === 0 && /does not match its recorded fingerprint/.test(m.text), `escrow of a mismatching value: exit ${m.code}, ${m.objects.size} uploaded`);
      const n = await jalan(["escrow"], { vercel: { CARD_PEPPER: A, CERT_SECRET_KEY_V1: B }, registry: reg(null, fb) });
      c.expect(n.code !== 0 && n.objects.size === 0 && /no fingerprint is recorded/.test(n.text), `escrow without a record: exit ${n.code}, ${n.objects.size} uploaded`);
      // 4-5. mint: escrow first, Vercel after; a refused escrow writes nothing
      const verdict = join(dir, "verdict"); writeFileSync(verdict, "CARD_PEPPER MINT\nCERT_SECRET_KEY_V1 MINT\n");
      const t = await jalan(["mint", verdict], { vercel: {}, registry: reg(null, null) });
      const urut = (name: string) => t.events.findIndex((x) => x.startsWith(`S3 PUT production/escrow/${name}/`)) < t.events.indexOf(`VERCEL POST ${name}`)
        && t.events.indexOf(`VERCEL POST ${name}`) >= 0;
      c.expect(t.code === 0 && urut("CARD_PEPPER") && urut("CERT_SECRET_KEY_V1"), `mint: exit ${t.code}; ${t.events.join(", ")}`);
      for (const nm of ["CARD_PEPPER", "CERT_SECRET_KEY_V1"]) {
        const key = [...t.objects.keys()].find((x) => x.startsWith(`production/escrow/${nm}/`));
        c.expect(key && buka(k.homes.R1, t.objects.get(key)?.body)?.value === t.env.get(nm), `the minted ${nm} in Vercel is not the escrowed one`);
      }
      const t2 = await jalan(["mint", verdict], { vercel: {}, registry: reg(null, null), refuse: /escrow/ });
      c.expect(t2.code !== 0 && t2.writes.length === 0, `a mint whose escrow is refused wrote to Vercel: ${t2.writes.join(", ")}`);
      // 6-8. recover
      const pre = new Map([[kA, e.objects.get(kA)!], [kB, e.objects.get(kB)!]]);
      const r = await jalan(["recover", "CARD_PEPPER"], { vercel: { CERT_SECRET_KEY_V1: B }, registry: reg(fa, fb), preload: pre, extra: { RECOVERY_GNUPGHOME: k.homes.R1 } });
      c.expect(r.code === 0 && r.writes.join() === "CARD_PEPPER" && r.env.get("CARD_PEPPER") === A, `recover: exit ${r.code}; wrote ${r.writes.join(", ")}; ${r.text.trim().split("\n").slice(-1)}`);
      const r2 = await jalan(["recover", "CARD_PEPPER"], { vercel: { CARD_PEPPER: B, CERT_SECRET_KEY_V1: B }, registry: reg(fa, fb), preload: pre, extra: { RECOVERY_GNUPGHOME: k.homes.R1 } });
      c.expect(r2.code !== 0 && r2.writes.length === 0 && /holds a different value/.test(r2.text), `recover over a different value: exit ${r2.code}; wrote ${r2.writes.join(", ")}`);
      const salah = new Map([[kA, e.objects.get(kB)!]]);
      const r3 = await jalan(["recover", "CARD_PEPPER"], { vercel: {}, registry: reg(fa, fb), preload: salah, extra: { RECOVERY_GNUPGHOME: k.homes.R1 } });
      c.expect(r3.code !== 0 && r3.writes.length === 0 && /does not hold the recorded secret/.test(r3.text), `recover from an escrow of another value: exit ${r3.code}; wrote ${r3.writes.join(", ")}`);
      c.expect(!outputs.join("\n").includes(A) && !outputs.join("\n").includes(B), "a secret's value was printed");
      // 9. the AWS template
      const tpl = JSON.parse(readFileSync(join(repoRoot, "infra/aws/pintar-backup.json"), "utf8"));
      const bk = tpl.Resources?.BackupBucket?.Properties ?? {};
      const rules: { Prefix?: string; ExpirationInDays?: number }[] = bk.LifecycleConfiguration?.Rules ?? [];
      c.expect(bk.ObjectLockEnabled === true && bk.VersioningConfiguration?.Status === "Enabled" && Object.values(bk.PublicAccessBlockConfiguration ?? {}).every((x) => x === true),
        "the bucket lacks Object Lock, versioning or the public-access block");
      c.expect(rules.filter((x) => x.Prefix).every((x) => /^(production|staging)\/(daily|monthly)\/$/.test(x.Prefix!)) && !JSON.stringify(rules).includes("escrow")
        && rules.some((x) => x.Prefix === "production/daily/" && x.ExpirationInDays === 36) && rules.some((x) => x.Prefix === "production/monthly/" && x.ExpirationInDays === 367),
        `a lifecycle rule reaches the escrow, or the retention is not D-107's: ${JSON.stringify(rules)}`);
      const acts = (u: string) => (tpl.Resources?.[u]?.Properties?.Policies ?? []).flatMap((p: { PolicyDocument: { Statement: { Action: string[] }[] } }) => p.PolicyDocument.Statement.flatMap((x) => x.Action)).sort();
      c.expect(JSON.stringify(acts("WriterUser")) === JSON.stringify(["s3:PutObject", "s3:PutObjectLegalHold", "s3:PutObjectRetention"]), `the writer may ${acts("WriterUser").join(", ")}`);
      c.expect(acts("ReaderUser").length > 0 && acts("ReaderUser").every((a: string) => /^s3:(Get|List)/.test(a)), `the reader may ${acts("ReaderUser").join(", ")}`);
      c.expect(JSON.stringify(tpl.Resources?.BackupBucketPolicy ?? {}).includes('"aws:SecureTransport":"false"'), "the bucket is not TLS-only");
      return c.verdict("escrow puts each secret, to R1 and R2 only, with its checksum and a legal hold, only on a fingerprint match; mint escrows " +
        "first and writes to Vercel after, and writes nothing when the escrow is refused; recover writes back only the recorded value where Vercel " +
        "holds none; no value is printed; the template keeps Object Lock and versioning, no lifecycle rule on the escrow, a put-only writer and a " +
        "read-only reader");
    },
  },
];
