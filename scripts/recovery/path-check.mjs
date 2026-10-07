#!/usr/bin/env node
// #150 WP-B (D-109(a)): THE STAGING BACKUP'S CONNECTION PATH, CHECKED READ ONLY BEFORE ANY BACKUP CREDENTIAL EXISTS.
//
// What the backup (backup-offsite.yml) takes for granted about hosted staging, each shown here, through the same path:
//   pooler    the session pooler's endpoint, from an authoritative source: Supabase's own configuration (the
//             Management API's pooler settings for the project), or, where Supabase refuses that to the token, the
//             owner's value read from the dashboard (Connect -> Session pooler: host, port, user; the dispatch's inputs).
//             Where both exist they must agree, and the connection staging's apply already uses must name the same
//             session pooler (port 5432); the workflow's STAGING_POOLER_HOST is checked against it. Never guessed.
//   tls       the pooler's certificate chains to the committed Supabase Root 2021 CA and names the host (verify-full);
//             psql, with PGSSLMODE=verify-full and that CA alone, connects.
//   snapshot  backup.mjs's own exportSnapshot() through the pooler: a second session imports it and sees exactly the
//             exporter's view (xmin:xmax:in-progress equal), and pg_dump --snapshot dumps the schema from it. The schema
//             dump is hashed and deleted; no row of data is read out.
//   profile   pintar_backup's security profile (backup-profile.sql) equals the proven local one
//             (docs/recovery/pintar-backup-profile.expected) line for line; the installed extensions equal staging's
//             approved baseline; the test harness's schema, the profile's one exclusion, is absent.
// Every statement runs in a read-only transaction as the administrative user staging's apply already uses (the
// pintar_backup password, C2, does not exist yet: O6). Nothing is written, granted or configured. No password, token
// or connection string is ever printed.
//
//   node path-check.mjs pooler | tls | snapshot | profile
//
// Environment: ADMIN_DB_URL (staging's, as staging.yml holds it); SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF (pooler);
//              OWNER_POOLER_HOST OWNER_POOLER_PORT OWNER_POOLER_USER (pooler: the owner's dashboard value, if given);
//              POOLER_HOST (tls, snapshot, profile: the endpoint `pooler` resolved); EXPECTED_POOLER_HOST (pooler: the
//              workflow's); PGSSLROOTCERT (default docs/recovery/supabase-root-2021-ca.crt); PINTAR_PG_BIN; MGMT_API (tests)
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { baselineFor, dumpPlan, exportSnapshot, extensionCheck, psqlRun, runDump } from "./backup.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CA = () => process.env.PGSSLROOTCERT || join(ROOT, "docs/recovery/supabase-root-2021-ca.crt");

/** The administrative connection, parsed from its URL (never printed), aimed at `host`: verify-full against the
 *  committed CA always, except on this machine's own loopback (CI's and the local database, where the tests run it). */
export function adminEnv(host) {
  const u = new URL(process.env.ADMIN_DB_URL);
  const h = host ?? u.hostname;
  const loopback = h === "127.0.0.1" || h === "localhost";
  // a hosted check always goes to the session pooler's port, whatever port the apply's URL names
  return { PATH: process.env.PATH, PGHOST: h, PGPORT: loopback ? u.port || "5432" : "5432", PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password), PGDATABASE: u.pathname.replace(/^\//, "") || "postgres",
    PGSSLMODE: loopback ? "disable" : "verify-full", PGSSLROOTCERT: CA(), PGAPPNAME: "pintar-path-check", PGOPTIONS: "" };
}

/** A pooler entry Supabase reports for the project, reduced to what may be printed. */
const shown = (p) => ({ host: p.db_host, port: p.db_port, user: p.db_user, mode: p.pool_mode, type: p.database_type ?? p.identifier ?? "" });

/** The session pooler both sources agree on, or why there is none (D-109(a): never guessed). Supabase may report the
 *  pooler in its transaction mode (port 6543); the session mode is the same host's port 5432, which staging's apply
 *  must already be using for the two to agree. */
export function choosePooler(api, urlHost, urlPort, urlUser, ref, expected) {
  const problems = [];
  const primary = api.filter((p) => /\.pooler\.supabase\.com$/.test(p.db_host ?? "") && (p.database_type ?? "PRIMARY") === "PRIMARY");
  const hosts = [...new Set(primary.map((p) => p.db_host))];
  if (hosts.length !== 1) problems.push(`Supabase reports ${hosts.length} pooler host(s) for the primary database: ${JSON.stringify(api.map(shown))}`);
  const host = hosts[0];
  if (host && urlHost !== host) problems.push(`staging's apply connects to ${urlHost}, Supabase's configuration says ${host}`);
  if (host && String(urlPort) !== "5432") problems.push(`staging's apply connects on port ${urlPort}, not the session pooler's 5432`);
  if (urlUser !== `postgres.${ref}`) problems.push(`staging's apply connects as ${urlUser.replace(/^(postgres)\..*/, "$1.<another project>")}, not postgres.${ref}`);
  // the backup workflow's value is checked against the resolved one, never the other way round
  const workflow = host && expected !== host ? [`the backup workflow names ${expected || "nothing"} as staging's pooler; Supabase and staging's apply say ${host}`] : [];
  return { host: problems.length ? undefined : host, problems, workflow };
}

/** The owner's dashboard value as one more pooler entry, or why it cannot be one. */
export function ownerEntry(host, port, user, ref) {
  if (!host) return { entry: null, problems: [] };
  const problems = [];
  if (!/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(host)) problems.push(`the owner's value "${host.slice(0, 80)}" is not a Supabase pooler host (<name>.pooler.supabase.com)`);
  if (String(port || "5432") !== "5432") problems.push(`the owner's port ${String(port).slice(0, 10)} is not the session pooler's 5432`);
  if ((user || `postgres.${ref}`) !== `postgres.${ref}`) problems.push(`the owner's user is not postgres.${ref}`);
  return { entry: problems.length ? null : { db_host: host, db_port: 5432, db_user: `postgres.${ref}`, pool_mode: "session", database_type: "PRIMARY", source: "owner" }, problems };
}

export async function pooler() {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const api = process.env.MGMT_API || "https://api.supabase.com";
  const owner = ownerEntry(process.env.OWNER_POOLER_HOST, process.env.OWNER_POOLER_PORT, process.env.OWNER_POOLER_USER, ref);
  const r = await fetch(`${api}/v1/projects/${ref}/config/database/pooler`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "User-Agent": "pintar-path-check" } });
  let list = [];
  let source;
  if (r.status === 200) {
    const body = await r.json();
    list = Array.isArray(body) ? body : [body];
    source = owner.entry ? "Supabase's configuration and the owner's dashboard value" : "Supabase's configuration";
  } else if (process.env.OWNER_POOLER_HOST) {
    source = `the owner's dashboard value (Supabase refused the configuration to this token: HTTP ${r.status})`;
  } else {
    throw new Error(`Supabase's pooler configuration could not be read (HTTP ${r.status}): the endpoint is not resolved; ` +
      "the owner gives the dashboard's value (Connect -> Session pooler) and nothing is guessed (D-109(a))");
  }
  const all = owner.entry ? [...list, owner.entry] : list;
  const u = new URL(process.env.ADMIN_DB_URL);
  const c = choosePooler(all, u.hostname, u.port || "5432", decodeURIComponent(u.username), ref, process.env.EXPECTED_POOLER_HOST);
  const problems = [...owner.problems, ...c.problems];
  return { reported: list.map(shown), owner: owner.entry ? shown(owner.entry) : null, source, urlHost: u.hostname, host: problems.length ? undefined : c.host, problems, workflow: c.workflow };
}

export function tls(host) {
  const s = spawnSync("openssl", ["s_client", "-starttls", "postgres", "-connect", `${host}:5432`, "-servername", host, "-CAfile", CA(),
    "-verify_return_error", "-verify_hostname", host, "-showcerts"], { input: "", encoding: "utf8", timeout: 30000 });
  const out = `${s.stdout ?? ""}${s.stderr ?? ""}`;
  const chain = [...out.matchAll(/^\s*\d+ s:(.*)\n\s+i:(.*)$/gm)].map((m) => `${m[1].trim()} <- ${m[2].trim()}`);
  const verify = /Verify return code: (\d+ \([^)]*\))/.exec(out)?.[1] ?? "none";
  const problems = [];
  if (!/^0 \(ok\)$/.test(verify)) problems.push(`the pooler's certificate does not verify against Supabase Root 2021 CA for ${host}: ${verify}`);
  const p = spawnSync("psql", ["-X", "-At", "-c", "\\conninfo", "-c", "begin read only; select current_user, current_setting('server_version_num'); commit;"],
    { env: adminEnv(host), encoding: "utf8", timeout: 30000 });
  const info = `${p.stdout ?? ""}`;
  if (p.status !== 0) problems.push(`psql with verify-full and that CA alone could not connect: ${(p.stderr ?? "").split("\n").filter((l) => /error|FATAL/i.test(l)).join(" | ").slice(0, 200)}`);
  const ssl = /SSL connection \(([^)]*)\)/.exec(info)?.[1] ?? "";
  if (p.status === 0 && !ssl) problems.push("psql connected, but not over TLS");
  return { chain, verify, ssl, server: info.trim().split("\n").pop(), problems };
}

export async function snapshot(host) {
  const saved = { ...process.env };
  Object.assign(process.env, adminEnv(host));
  const dir = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), "path-check-"));
  const problems = [];
  let held;
  try {
    held = await exportSnapshot();   // the backup's own function, its own session
    const seen = psqlRun("select pg_current_snapshot()::text, count(*) from supabase_migrations.schema_migrations;", { snapshot: held.id }).trim();
    const [view, migrations] = seen.split("|");
    if (view !== held.xids) problems.push(`the importing session sees ${view}, the exporting one ${held.xids}: not one snapshot`);
    const plan = dumpPlan().filter((x) => x.file === "schema.sql" || x.file === "history-schema.sql");
    const files = [];
    for (const x of plan) {
      await runDump(x, dir, held.id);
      const b = readFileSync(join(dir, x.file));
      files.push({ file: x.file, bytes: statSync(join(dir, x.file)).size, sha256: createHash("sha256").update(b).digest("hex") });
    }
    return { id: held.id.replace(/^(.{4}).*$/, "$1..."), at: held.at, view: held.xids, migrations: Number(migrations), files, problems };
  } finally {
    if (held) await held.release();
    rmSync(dir, { recursive: true, force: true });
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
  }
}

export function profileDiff(actual, expected) {
  const a = actual.trim().split("\n"), e = expected.trim().split("\n").filter((l) => l && !l.startsWith("#"));
  const diff = [];
  for (let i = 0; i < Math.max(a.length, e.length); i++) if (a[i] !== e[i]) diff.push({ expected: e[i] ?? "(no line)", actual: a[i] ?? "(no line)" });
  return diff;
}

export function profile(host) {
  const env = adminEnv(host);
  const run = (sql) => {
    const r = spawnSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-f", "-"], { input: `begin read only;\n${sql}\ncommit;\n`, env, encoding: "utf8", timeout: 60000 });
    if (r.status !== 0) throw new Error(`psql: ${(r.stderr ?? "").trim().split("\n").slice(-1)[0]?.slice(0, 200)}`);
    return r.stdout;
  };
  const actual = run(readFileSync(join(ROOT, "scripts/recovery/backup-profile.sql"), "utf8"));
  const diff = profileDiff(actual, readFileSync(join(ROOT, "docs/recovery/pintar-backup-profile.expected"), "utf8"));
  const harness = run("select count(*) from pg_namespace where nspname = 'selftest';").trim();
  const installed = JSON.parse(run("select coalesce(json_object_agg(extname, extversion), '{}') from pg_extension;").trim());
  const ext = extensionCheck(installed, baselineFor("staging"), "staging");
  const problems = [...diff.map((d) => `profile: expected "${d.expected}", this database has "${d.actual}"`), ...ext];
  if (harness !== "0") problems.push("the test harness's schema exists here, so the profile's one exclusion hides something");
  return { lines: actual.trim().split("\n"), diff, extensions: Object.keys(installed).length, extensionProblems: ext, harness: harness !== "0", problems };
}

async function main(argv) {
  const [cmd] = argv;
  const host = process.env.POOLER_HOST;
  const out = (k, v) => { if (process.env.GITHUB_OUTPUT) spawnSync("sh", ["-c", `printf '%s=%s\\n' "$1" "$2" >> "$GITHUB_OUTPUT"`, "sh", k, v]); };
  const fail = (problems) => { for (const p of problems) console.log(`::error::${p}`); return problems.length ? 1 : 0; };
  if (cmd === "pooler") {
    const p = await pooler();
    console.log(`Supabase's pooler configuration for ${process.env.SUPABASE_PROJECT_REF}: ${p.reported.length ? JSON.stringify(p.reported) : "not readable with this token"}`);
    if (p.owner) console.log(`the owner's dashboard value: ${JSON.stringify(p.owner)}`);
    console.log(`staging's apply connects to: ${p.urlHost}`);
    if (p.host) { console.log(`RESOLVED: the session pooler is ${p.host}:5432, from ${p.source}, and staging's apply connects to it`); out("host", p.host); }
    if (p.host && !p.workflow.length) console.log("backup-offsite.yml's STAGING_POOLER_HOST is that host");
    return fail([...p.problems, ...p.workflow]);
  }
  if (!host) { console.log("::error::POOLER_HOST is not set: the pooler step resolves it first"); return 1; }
  if (cmd === "tls") {
    const t = tls(host);
    console.log(`certificate chain: ${t.chain.join(" | ")}`);
    console.log(`verification against Supabase Root 2021 CA (verify-full, ${host}): ${t.verify}`);
    console.log(`psql, verify-full: ${t.ssl ? `TLS (${t.ssl})` : "no TLS"}; ${t.server}`);
    return fail(t.problems);
  }
  if (cmd === "snapshot") {
    const s = await snapshot(host);
    console.log(`exported through ${host}:${adminEnv(host).PGPORT} at ${s.at}; the exporter's view ${s.view}; ${s.migrations} migrations seen in it`);
    for (const f of s.files) console.log(`pg_dump --snapshot through the pooler: ${f.file}, ${f.bytes} bytes, SHA-256 ${f.sha256} (deleted)`);
    if (!s.problems.length) console.log("SHARED: another session imported the exported snapshot (PostgreSQL refuses an identifier it does not hold) and saw the exporter's view, and pg_dump --snapshot dumped from it");
    return fail(s.problems);
  }
  if (cmd === "profile") {
    const p = profile(host);
    for (const l of p.lines) console.log(`  ${l}`);
    console.log(`${p.extensions} extensions installed`);
    if (!p.problems.length) console.log("EQUAL: pintar_backup's profile on staging is the proven local one, and the extensions are staging's approved baseline");
    return fail(p.problems);
  }
  console.error("usage: path-check.mjs pooler | tls | snapshot | profile");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
