/**
 * #150 WP-B (D-106(b), D-107): THE INDEPENDENT BACKUP, ITS CREDENTIAL AND ITS RESTORE.
 *
 *  DR-S15  migration 20261125100000 against CI's database: `pintar_backup` (C2) is LOGIN, BYPASSRLS, INHERIT, in
 *          pg_read_all_data alone, owns nothing, may execute no SECURITY DEFINER function and no PINTAR function, and
 *          nobody can become it; signed in as it, a fresh session is read-only by default with its timeouts; its facts
 *          (every table's rows and content hash, row security bypassed) equal postgres's; its five dumps, on one shared
 *          snapshot, are byte-identical to postgres's; with its read-only default switched OFF (the worst case: a
 *          stolen credential can do that) every INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM, sequence advance, CREATE,
 *          ALTER, DROP, COMMENT, policy, trigger, role grant, CREATE ROLE, ALTER ROLE and SET ROLE is refused, and a
 *          GRANT or REVOKE changes no right; a fourth connection is refused. What it can still do (a temporary table,
 *          a large object, its own password) touches no PINTAR object and is reported (A7)
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
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
          // an extension not yet installed, so IF NOT EXISTS cannot skip the check; and dropping one PINTAR relies on
          ["CREATE EXTENSION", "create extension pg_trgm"],
          ["DROP EXTENSION", "begin; drop extension pgcrypto cascade; rollback"],
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
        "one snapshot are byte-identical to postgres's; with read-only off every write, DDL, grant and role change is refused and no right moves; " +
        "a fourth connection is refused");
    },
  },
];
