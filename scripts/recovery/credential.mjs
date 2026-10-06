#!/usr/bin/env node
// #150 WP-B (D-107(c), D-108(c)(3); closure plan A7): C2, pintar_backup's password: SET and REVOKE, nothing else.
//
//   set     the owner's new password (BACKUP_PASSWORD, from the `backup` environment) becomes pintar_backup's, with LOGIN.
//           The database receives only its salted SCRAM-SHA-256 verifier, computed here, never the password; then a
//           sign-in with the password proves it and that the session is read-only by default.
//   revoke  immediate: NOLOGIN, then every open session of pintar_backup terminated; then a sign-in is shown refused.
//           Backups fail closed (and the watch says so) until `set` gives it a new password.
// The administrative connection (ADMIN_PG*: the database's postgres, from the secrets the apply already uses) is used
// for these two statements only. Neither the password nor its verifier is ever printed, logged or put on a command line.
//
//   node credential.mjs set | revoke
//
// Environment: ADMIN_PGHOST ADMIN_PGPORT ADMIN_PGUSER ADMIN_PGDATABASE ADMIN_PGPASSWORD [ADMIN_PGSSLMODE ADMIN_PGSSLROOTCERT],
//              or ADMIN_DB_URL (a postgresql:// URL, as staging's secret is kept; parsed here, never printed);
//              BACKUP_PASSWORD (set; for revoke, only to show the sign-in refused)
//              [BACKUP_PGUSER: default the admin user with postgres -> pintar_backup, so postgres.<ref> gives the
//              pooler's pintar_backup.<ref>]
import { spawnSync } from "node:child_process";
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

export const ITERATIONS = 4096;

/** PostgreSQL's SCRAM-SHA-256 verifier for a password (printable ASCII only, so no SASLprep normalisation applies). */
export function scramVerifier(password, salt = randomBytes(16), iterations = ITERATIONS) {
  if (typeof password !== "string" || password.length < 32 || !/^[\x21-\x7e]+$/.test(password)) {
    throw new Error("the password must be at least 32 printable ASCII characters, without spaces");
  }
  const salted = pbkdf2Sync(Buffer.from(password, "utf8"), salt, iterations, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const storedKey = createHash("sha256").update(clientKey).digest();
  const serverKey = createHmac("sha256", salted).update("Server Key").digest();
  return `SCRAM-SHA-256$${iterations}:${salt.toString("base64")}$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;
}

export function admin() {
  const e = Object.fromEntries(["PGHOST", "PGPORT", "PGUSER", "PGDATABASE", "PGPASSWORD", "PGSSLMODE", "PGSSLROOTCERT"]
    .filter((k) => process.env[`ADMIN_${k}`]).map((k) => [k, process.env[`ADMIN_${k}`]]));
  if (process.env.ADMIN_DB_URL) {
    const u = new URL(process.env.ADMIN_DB_URL);
    Object.assign(e, { PGHOST: u.hostname, PGPORT: u.port || "5432", PGUSER: decodeURIComponent(u.username), PGPASSWORD: decodeURIComponent(u.password),
      PGDATABASE: u.pathname.replace(/^\//, "") || "postgres", ...(u.searchParams.get("sslmode") && !e.PGSSLMODE ? { PGSSLMODE: u.searchParams.get("sslmode") } : {}) });
  }
  return e;
}
const asBackup = (password) => {
  const a = admin();
  return { ...a, PGUSER: process.env.BACKUP_PGUSER || String(a.PGUSER ?? "postgres").replace(/^postgres(?=\.|$)/, "pintar_backup"), PGPASSWORD: password };
};

function psql(env, sql) {
  const r = spawnSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-f", "-"], { input: sql, encoding: "utf8", env: { PATH: process.env.PATH, ...env } });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").split("\n").filter((l) => /ERROR|FATAL/.test(l)).join(" | ").slice(0, 200) };
}

export function set() {
  const pw = process.env.BACKUP_PASSWORD;
  const verifier = scramVerifier(pw);
  const exists = psql(admin(), "select count(*) from pg_roles where rolname = 'pintar_backup';");
  if (!exists.ok || exists.out !== "1") throw new Error(`pintar_backup does not exist here (migration 20261125100000 not applied?): ${exists.err}`);
  const r = psql(admin(), `alter role pintar_backup with login password '${verifier}';\n`);
  if (!r.ok) throw new Error(`the verifier could not be set: ${r.err}`);
  const back = psql(asBackup(pw), "select current_user; show default_transaction_read_only;");
  if (!back.ok || back.out !== "pintar_backup\non") throw new Error(`pintar_backup cannot sign in with the new password, or is not read-only by default: ${back.err}`);
  return "pintar_backup signs in with the new password, read-only by default; only its SCRAM-SHA-256 verifier reached the database";
}

export function revoke() {
  const r = psql(admin(), "alter role pintar_backup nologin;\nselect count(*) from (select pg_terminate_backend(pid) from pg_stat_activity where usename = 'pintar_backup') t;\n");
  if (!r.ok) throw new Error(`pintar_backup could not be revoked: ${r.err}`);
  const back = psql(asBackup(process.env.BACKUP_PASSWORD || "no-password"), "select 1;");
  if (back.ok) throw new Error("pintar_backup can still sign in after the revocation");
  return `pintar_backup can no longer sign in (NOLOGIN); ${r.out.split("\n").pop()} open session(s) ended`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  try {
    if (cmd === "set") console.log(set());
    else if (cmd === "revoke") console.log(revoke());
    else { console.error("usage: credential.mjs set | revoke"); process.exit(2); }
  } catch (e) { console.log(`::error::${e.message}`); process.exit(1); }
}
