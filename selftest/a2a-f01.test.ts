/**
 * A2A-F01 — THE FENCE IS TAKEN ONLY INSIDE THE DATABASE (A2a's page §2; Sharon's ruling, Part 2 row 5; her note, early
 * read §6). DRAFT, with the fence (migration 20270119100000), for Sharon's early read.
 *
 * 1. From the catalogue: exactly two functions take an advisory lock on the fence key, pagar_darurat_eksklusif and
 *    pagar_darurat_bersama, each with its SET lock_timeout clause; every function or procedure that calls one is an RPC
 *    (EXECUTE granted to authenticated, never to anon), a procedure (the closer), or a trigger function; none is
 *    granted to anon.
 * 2. From the repository: nothing under src/ (or supabase/functions/, if it is ever added) imports a database driver,
 *    names a pooler address or port, or calls pg_advisory; no migration names the fence key outside the fence's own.
 * 3. Plants: a second function taking the fence key, and an advisory-lock call under src/, each turn it red.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const KUNCI_PAGAR = "7201190000000001";
const PAGAR = { pagar_darurat_eksklusif: "lock_timeout=1500ms", pagar_darurat_bersama: "lock_timeout=2s" } as const;
const MIGRASI_PAGAR = "20270119100000_the_emergency_fence_is_taken_only_inside_the_database.sql";

function psqlBaris(db: string, sql: string): string[][] {
  const r = spawnSync("psql", [db, "-XqAt", "-F", "\x1f", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 300));
  return r.stdout.split("\n").filter(Boolean).map((l) => l.split("\x1f"));
}

/** The catalogue's half; `tanam` is DDL run first, inside a rolled-back transaction. Returns what is wrong. */
export function periksaKatalogPagar(db: string, tanam = ""): string[] {
  const salah: string[] = [];
  const q = (sql: string) => psqlBaris(db, tanam ? `begin; ${tanam}; ${sql}; rollback;` : sql);
  const pengambil = q(`select p.proname, coalesce(array_to_string(p.proconfig, ','), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc ~ 'pg_advisory' and p.prosrc ~ '${KUNCI_PAGAR}' order by 1`);
  const nama = pengambil.map((r) => r[0]);
  if (nama.join() !== Object.keys(PAGAR).sort().join()) salah.push(`the fence key is taken by: ${nama.join(", ") || "nothing"} (expected exactly ${Object.keys(PAGAR).join(", ")})`);
  for (const [fn, setelan] of pengambil) {
    const mau = (PAGAR as Record<string, string>)[fn];
    if (mau && !setelan.split(",").includes(mau)) salah.push(`${fn} does not carry its SET clause ${mau}`);
  }
  const pemanggil = q(`select p.proname, p.prokind, (p.prorettype = 'trigger'::regtype)::text,
      has_function_privilege('authenticated', p.oid, 'execute')::text, has_function_privilege('anon', p.oid, 'execute')::text
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc ~ 'pagar_darurat_(eksklusif|bersama)\\s*\\(' and p.proname !~ '^pagar_darurat_' order by 1`);
  for (const [fn, jenis, pemicu, auth, anon] of pemanggil) {
    if (anon === "true") salah.push(`${fn} calls the fence and is granted to anon`);
    if (!(jenis === "p" || pemicu === "true" || auth === "true")) salah.push(`${fn} calls the fence but is neither an RPC, the closer procedure, nor a trigger function`);
  }
  for (const fn of Object.keys(PAGAR)) {
    const g = q(`select has_function_privilege('anon', 'public.${fn}()', 'execute')::text`);
    if (g[0]?.[0] === "true") salah.push(`${fn} is granted to anon`);
  }
  return salah;
}

const LARANG_SRC: [RegExp, string][] = [
  [/from\s+["'](?:pg|postgres|pg-pool)["']|require\(\s*["'](?:pg|postgres|pg-pool)["']\s*\)/, "imports a database driver"],
  [/:6543\b|pooler\.supabase\.com/, "names the transaction pooler"],
  [/pg_advisory/, "calls pg_advisory"],
];
/** The repository's half: the deployed code paths, and the migrations. `tambahan` adds planted files. */
export function periksaRepoPagar(root: string, tambahan: { path: string; text: string }[] = []): string[] {
  const salah: string[] = [];
  const berkas: { path: string; text: string }[] = [];
  const jalan = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) { if (n !== "node_modules") jalan(p); }
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(n)) berkas.push({ path: p.slice(root.length + 1), text: readFileSync(p, "utf8") });
    }
  };
  jalan(join(root, "src")); jalan(join(root, "supabase", "functions"));
  for (const f of [...berkas, ...tambahan]) for (const [re, apa] of LARANG_SRC) if (re.test(f.text)) salah.push(`${f.path} ${apa}`);
  const mig = join(root, "supabase", "migrations");
  for (const n of readdirSync(mig)) {
    if (n === MIGRASI_PAGAR) continue;
    if (readFileSync(join(mig, n), "utf8").includes(KUNCI_PAGAR)) salah.push(`migration ${n} names the fence key outside the fence's own`);
  }
  return salah;
}

const TANAM_FN = `create function public._a2a_f01_tanam() returns void language plpgsql as $t$
begin perform pg_advisory_xact_lock(${KUNCI_PAGAR}); end $t$`;
const TANAM_SRC = { path: "src/_a2a_f01_tanam.ts", text: "await sql`select pg_advisory_xact_lock(1)`;" };

export const a2aF01Tests: SelfTest[] = [
  {
    id: "A2A-F01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      c.expect(periksaKatalogPagar(db, TANAM_FN).some((s) => /_a2a_f01_tanam/.test(s)), "the planted second taker of the fence key was not reported");
      c.expect(periksaRepoPagar(repoRoot, [TANAM_SRC]).some((s) => s.startsWith(TANAM_SRC.path)), "the planted advisory-lock call under src/ was not reported");
      const k = periksaKatalogPagar(db);
      c.expect(k.length === 0, `the fence, from the catalogue:\n  ${k.join("\n  ")}`);
      const r = periksaRepoPagar(repoRoot);
      c.expect(r.length === 0, `the fence, from the repository:\n  ${r.join("\n  ")}`);
      return c.verdict("the fence key is taken only by pagar_darurat_eksklusif (1500ms) and pagar_darurat_bersama (2s); every caller is an RPC, the closer or a trigger, none granted to anon; no driver, pooler or advisory lock in the deployed code; both plants reported");
    },
  },
];
