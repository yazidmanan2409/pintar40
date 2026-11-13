/**
 * A2A-L01 — THE ACCOUNT LIFECYCLE TAKES ITS ROWS IN ONE ORDER (A2a's page §6; the owner's decision after the 4.0
 * look-back; Sharon's catalogue test, with her early read of 7b3b3d31: the order, R1 to R3, and B1's rule).
 *
 * 4.0 declared no lock order for a person's rows. L1-F2 and L1-F4 each found a cycle by review. This test makes the
 * order permanent, from the catalogue: every function and procedure in `public`, and every trigger on the ranked
 * tables, is read; nothing is a list of names, so a function A2a or A3 adds falls under it the day it lands.
 *
 * For each function, the ordered list of the row locks it takes, each with its strength:
 *   * directly: SELECT/PERFORM … FOR UPDATE | NO KEY UPDATE | SHARE | KEY SHARE; UPDATE; DELETE; INSERT … ON CONFLICT
 *     DO UPDATE and MERGE (as updates); a call to a fence function;
 *   * R1, foreign keys (from pg_constraint): an insert, and an update of a foreign-key column, take FOR KEY SHARE on
 *     the table referred to; a delete takes a lock on every table that refers to it with ON DELETE CASCADE or SET NULL,
 *     after the deleted row, and fires that table's triggers;
 *   * transitively, through every function it calls (by name, cycle-safe) and the row triggers its writes fire;
 *   * R2: a trigger function read on its own starts with its table's rank held for UPDATE and DELETE, nothing for INSERT;
 *   * Auth's own update and insert of auth.users (GoTrue) are read as writers: Auth holds the row while our triggers run.
 * It fails when:
 *   * a later lock has a lower rank than an earlier one (the order);
 *   * a weaker lock on a table is followed by a stronger one (an upgrade: two such transactions on one row deadlock);
 *   * B1: a function that takes the fence has locked a row of any table other than ranks 1 to 6 before it;
 *   * R3: the per-function report differs from the committed selftest/a2a-l01-laporan.txt (regenerate it with
 *     `npx tsx scripts/dev/a2a-l01-laporan.ts`, and read the difference).
 * An insert of a new row is not a lock on that row (no one else can see it); its foreign keys and triggers are read.
 *
 * WHAT IT DOES NOT ESTABLISH (the page §6): branches are read together in text order (it over-reports; an over-report
 * is a declared exception, with its reason); the order between rows of one table is the race tests' job.
 *
 * Plants, each inside this test's own rolled-back transaction (DDL is transactional), must all be reported before the
 * reading of the real code is trusted: P1 accounts then persons; P1b FOR SHARE then UPDATE on persons; P2 akun_kunci
 * locking accounts before auth.users; P3 a fenced function locking accounts after the fence; P5 a fenced function
 * locking learning_assignments before the fence (B1's rule).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

// ── THE ORDER, AS DATA (Sharon, early read of 7b3b3d31, ruling 1)
export const URUTAN: Record<string, number> = {
  persons: 1,
  account_requests: 2,
  person_suspensions: 3,
  "auth.users": 4,
  accounts: 5,
  password_write_permits: 6,
  FENCE: 7,
  maintenance_windows: 8,
  assessment_sessions: 9,
};
/** B1: the fence is the first lock after ranks 1 to 6, for every table. */
const SIKLUS_HIDUP = 6;
/** R1 (Sharon's ruling 2): foreign keys count. */
export const KUNCI_FK = true;
/** The fence functions (A2a §2); a call to one is the fence's lock. */
const PAGAR = /^pagar_darurat(?:_eksklusif|_bersama)?$/;

export type Katalog = {
  fns: Map<string, string[]>;
  pemicu: Map<string, string[]>;
  /** referring table -> [the table it refers to, its foreign-key columns] */
  fkKeluar: Map<string, { ke: string; kolom: string[] }[]>;
  /** referred table -> [the referring table, the delete action: c cascade, n set null, d set default] */
  fkMasuk: Map<string, { dari: string; aksi: string }[]>;
};
/** Reports read and found safe: the writer, the path it reaches, why, and (where the safety is in code) the condition
 *  the catalogue must still show, so the exception lapses the moment that code does. */
const JAGA_TANPA_ORANG = "if public.current_person_id() is null or public.current_person_id() = p_person then return null;";
/** The recovery path (change A, commit 2): safe only while recovery_assist_school answers null, for no person and for
 *  oneself, before it can reach sekolah_memegang (migration 20270118100000). A2A-L02 shows it on two connections. */
const syaratJaga = (kat: Katalog) => {
  const srcs = kat.fns.get("recovery_assist_school") ?? [];
  return srcs.length > 0 && srcs.every((src) => {
    const b = bersih(src), jaga = b.indexOf(JAGA_TANPA_ORANG);
    return jaga >= 0 && jaga < b.indexOf("sekolah_memegang");
  });
};
const ALASAN_JAGA = "Auth's password write runs with no PINTAR person, and recovery_assist_school answers null without one (and for "
  + "oneself) before it can reach sekolah_memegang: migration 20270118100000, shown on two connections by A2A-L02";
export const PENGECUALIAN: { penulis: string; lewat: string; alasan: string; syarat?: (kat: Katalog) => boolean }[] = [
  ...["(GoTrue U auth.users)", "auth_password_write_guard", "auth_password_write_guard [auth.users U]"].map((penulis) => ({
    penulis, lewat: "recovery_assist_school > sekolah_memegang", alasan: ALASAN_JAGA, syarat: syaratJaga,
  })),
];
/** Functions that build SQL with `execute` naming a ranked table, each read by hand. */
export const SQL_DINAMIS: Record<string, string> = {
  assemble_session: "builds the sitting's item query; it locks no ranked row (its dynamic SQL reads items)",
};

// auth.* first, kept whole (found by the first run: the generic name read "from auth.users" as a table "auth")
const TBL = /auth\.[a-z_][a-z0-9_]*|(?:public\.)?[a-z_][a-z0-9_]*/;
const namaTabel = (s: string) => (/^auth\./.test(s) ? s.match(/^auth\.[a-z_][a-z0-9_]*/)![0] : s.replace(/^public\./, ""));
export const bersih = (src: string) =>
  src.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/'(?:[^']|'')*'/g, "''").toLowerCase();

/** The catalogue, read in one psql session; `tanam` is DDL run first, inside a transaction that is rolled back. */
export function bacaKatalog(db: string, tanam = ""): Katalog {
  const sql = `begin;
${tanam}
select 'F' || chr(31) || p.proname || chr(31) || p.prosrc || chr(30) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang where n.nspname = 'public' and l.lanname in ('plpgsql', 'sql');
select 'T' || chr(31) || case when n.nspname = 'auth' then 'auth.users' else c.relname end || chr(31) || t.tgtype || chr(31) || p.proname || chr(30)
  from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace join pg_proc p on p.oid = t.tgfoid
 where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'));
select 'K' || chr(31) || case when sn.nspname = 'auth' then 'auth.' || s.relname else s.relname end || chr(31)
       || case when tn.nspname = 'auth' then 'auth.' || t.relname else t.relname end || chr(31) || k.confdeltype::text || chr(31)
       || (select string_agg(a.attname, ',') from pg_attribute a where a.attrelid = k.conrelid and a.attnum = any (k.conkey)) || chr(30)
  from pg_constraint k join pg_class s on s.oid = k.conrelid join pg_namespace sn on sn.oid = s.relnamespace
  join pg_class t on t.oid = k.confrelid join pg_namespace tn on tn.oid = t.relnamespace
 where k.contype = 'f' and sn.nspname in ('public', 'auth') and tn.nspname in ('public', 'auth');
rollback;`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`the catalogue read failed: ${r.stderr.slice(0, 300)}`);
  const kat: Katalog = { fns: new Map(), pemicu: new Map(), fkKeluar: new Map(), fkMasuk: new Map() };
  const tambah = <T>(m: Map<string, T[]>, k: string, v: T) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const baris of r.stdout.split("\x1e")) {
    const b = baris.replace(/^\n+/, "");
    if (!b) continue;
    const [jenis, ...f] = b.split("\x1f");
    if (jenis === "F") tambah(kat.fns, f[0], f.slice(1).join("\x1f"));
    else if (jenis === "T") {
      const tt = Number(f[1]);
      const saat = tt & 2 ? "B" : "A";
      for (const [bit, ev] of [[4, "I"], [8, "D"], [16, "U"]] as const) if (tt & bit) tambah(kat.pemicu, `${f[0]}|${ev}|${saat}`, f[2]);
    } else if (jenis === "K") {
      tambah(kat.fkKeluar, f[0], { ke: f[1], kolom: (f[3] ?? "").split(",") });
      tambah(kat.fkMasuk, f[1], { dari: f[0], aksi: f[2] });
    }
  }
  return kat;
}

type Peristiwa = { k: "KUNCI"; t: string; kuat: number } | { k: "PANGGIL"; f: string } | { k: "PICU"; t: string; ev: string; saat: "B" | "A" };

/** One statement's events, in order: the calls inside it first, then its own locks, then what its writes fire. */
function peristiwa(stmt: string, kat: Katalog): Peristiwa[] {
  const ev: Peristiwa[] = [];
  // the calls, in the order they run: a call's arguments run before it, so each call is placed at its closing
  // parenthesis (found by the first run: "perform audit_write(…, recovery_assist_school(p))" read audit_write first)
  const panggilan: { di: number; e: Peristiwa }[] = [];
  for (const m of stmt.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/g)) {
    let d = 0, tutup = stmt.length;
    for (let i = m.index! + m[0].length - 1; i < stmt.length; i++) {
      if (stmt[i] === "(") d++;
      else if (stmt[i] === ")" && --d === 0) { tutup = i; break; }
    }
    if (PAGAR.test(m[1])) panggilan.push({ di: tutup, e: { k: "KUNCI", t: "FENCE", kuat: 3 } });
    else if (kat.fns.has(m[1])) panggilan.push({ di: tutup, e: { k: "PANGGIL", f: m[1] } });
  }
  for (const p of panggilan.sort((a, b) => a.di - b.di)) ev.push(p.e);
  const fkKe = (t: string, kolom?: string[]) => {
    if (!KUNCI_FK) return;
    for (const fk of kat.fkKeluar.get(t) ?? []) if (!kolom || fk.kolom.some((c) => kolom.includes(c))) ev.push({ k: "KUNCI", t: fk.ke, kuat: 0 });
  };
  // the order Postgres runs a write in: BEFORE row triggers, the row, the foreign-key checks (RI triggers, which fire
  // AFTER and, being named RI_…, before user AFTER triggers), then AFTER triggers. Found by the first run: reading the
  // foreign keys before the BEFORE triggers invented an upgrade at every insert into a person-attached table.
  const hapus = (t: string) => {
    ev.push({ k: "PICU", t, ev: "D", saat: "B" }, { k: "KUNCI", t, kuat: 3 });
    for (const fk of kat.fkMasuk.get(t) ?? []) {
      if (fk.aksi === "c") ev.push({ k: "PICU", t: fk.dari, ev: "D", saat: "B" }, { k: "KUNCI", t: fk.dari, kuat: 3 }, { k: "PICU", t: fk.dari, ev: "D", saat: "A" });
      else if (fk.aksi === "n" || fk.aksi === "d") ev.push({ k: "PICU", t: fk.dari, ev: "U", saat: "B" }, { k: "KUNCI", t: fk.dari, kuat: 2 }, { k: "PICU", t: fk.dari, ev: "U", saat: "A" });
    }
    ev.push({ k: "PICU", t, ev: "D", saat: "A" });
  };
  const up = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?update\\s+(?:only\\s+)?(${TBL.source})`));
  if (up) {
    const t = namaTabel(up[1]);
    const set = stmt.match(/\bset\b([\s\S]*?)(?:\bwhere\b|\bfrom\b|\breturning\b|$)/);
    const kolom = set ? [...set[1].matchAll(/(?:^|,)\s*\(?([a-z_][a-z0-9_]*)\s*(?:,|=|\))/g)].map((m) => m[1]) : [];
    ev.push({ k: "KUNCI", t, kuat: 2 }, { k: "PICU", t, ev: "U", saat: "B" });
    fkKe(t, kolom);
    ev.push({ k: "PICU", t, ev: "U", saat: "A" });
  }
  const del = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?delete\\s+from\\s+(?:only\\s+)?(${TBL.source})`));
  if (del) hapus(namaTabel(del[1]));
  const ins = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?insert\\s+into\\s+(${TBL.source})`));
  if (ins) {
    const t = namaTabel(ins[1]);
    ev.push({ k: "PICU", t, ev: "I", saat: "B" });
    fkKe(t);
    ev.push({ k: "PICU", t, ev: "I", saat: "A" });
    if (/\bon\s+conflict\b[\s\S]*\bdo\s+update\b/.test(stmt)) ev.push({ k: "KUNCI", t, kuat: 2 }, { k: "PICU", t, ev: "U", saat: "B" }, { k: "PICU", t, ev: "U", saat: "A" });
  }
  const merge = stmt.match(new RegExp(`^\\s*merge\\s+into\\s+(${TBL.source})`));
  if (merge) {
    const t = namaTabel(merge[1]);
    ev.push({ k: "PICU", t, ev: "I", saat: "B" }, { k: "PICU", t, ev: "U", saat: "B" }, { k: "KUNCI", t, kuat: 2 });
    fkKe(t);
    ev.push({ k: "PICU", t, ev: "I", saat: "A" }, { k: "PICU", t, ev: "U", saat: "A" });
  }
  const lk = stmt.match(/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b(?:\s+of\s+([a-z0-9_.,\s]+?))?(?:\s+(?:nowait|skip\s+locked))?\s*(?:$|\bloop\b|\binto\b|\blimit\b)/);
  if (lk && /\b(select|perform)\b/.test(stmt)) {
    const kuat = lk[1] === "update" ? 3 : lk[1] === "share" ? 1 : lk[1].includes("no") ? 2 : 0;
    const alias = new Map<string, string>();
    const dari: string[] = [];
    const BUKAN = ["where", "on", "join", "for", "order", "limit", "left", "inner", "using", "set", "cross", "lateral", "natural", "group", "having", "union", "into", "unnest"];
    for (const fm of stmt.matchAll(new RegExp(`\\b(?:from|join)\\s+(${TBL.source})(?:\\s+(?:as\\s+)?([a-z_][a-z0-9_]*))?`, "g"))) {
      const t = namaTabel(fm[1]);
      if (BUKAN.includes(t)) continue;
      dari.push(t); alias.set(t.replace(/^auth\./, ""), t); alias.set(t, t);
      const a = fm[fm.length - 1];
      if (a && !BUKAN.includes(a)) alias.set(a, t);
    }
    const ts = lk[2] ? lk[2].split(/[,\s]+/).filter(Boolean).map((a) => alias.get(a)).filter((x): x is string => !!x) : dari;
    for (const t of ts) ev.push({ k: "KUNCI", t, kuat });
  }
  return ev;
}

export type Kunci = { t: string; kuat: number; lewat: string };

/** Every writer's ordered locks: each function, each trigger function in its R2 starting state, and Auth's writes. */
export function semuaKunci(kat: Katalog): Map<string, Kunci[]> {
  const memo = new Map<string, Kunci[]>();
  const tumpukan = new Set<string>();
  const picu = (t: string, ev: string, dari: string, saat?: "B" | "A"): Kunci[] => (saat ? [saat] : ["B", "A"])
    .flatMap((w) => kat.pemicu.get(`${t}|${ev}|${w}`) ?? [])
    .flatMap((tf) => daftar(tf).map((x) => ({ ...x, lewat: `${dari} > [${t} ${ev}] ${x.lewat}` })));
  const daftar = (fn: string): Kunci[] => {
    const ada = memo.get(fn);
    if (ada) return ada;
    if (tumpukan.has(fn)) return [];
    tumpukan.add(fn);
    const out: Kunci[] = [];
    for (const src of kat.fns.get(fn) ?? []) {
      for (const stmt of bersih(src).split(";")) {
        for (const e of peristiwa(stmt, kat)) {
          if (e.k === "KUNCI") out.push({ t: e.t, kuat: e.kuat, lewat: fn });
          else if (e.k === "PANGGIL" && e.f !== fn) out.push(...daftar(e.f).map((x) => ({ ...x, lewat: `${fn} > ${x.lewat}` })));
          else if (e.k === "PICU") out.push(...picu(e.t, e.ev, fn, e.saat));
        }
      }
    }
    tumpukan.delete(fn);
    memo.set(fn, out);
    return out;
  };
  const semua = new Map<string, Kunci[]>();
  for (const fn of [...kat.fns.keys()].sort()) { const l = daftar(fn); if (l.some((x) => x.t in URUTAN)) semua.set(fn, l); }
  // R2: a trigger function read on its own starts with its table's rank held (UPDATE, DELETE), or nothing (INSERT)
  for (const [kunci, tfs] of [...kat.pemicu].sort(([a], [b]) => a.localeCompare(b))) {
    const [t, ev] = kunci.split("|");   // (the timing, the third part, does not change R2's starting state)
    if (ev === "I" || !(t in URUTAN)) continue;
    for (const tf of tfs) {
      const l: Kunci[] = [{ t, kuat: 2, lewat: `[${t} ${ev}]` }, ...daftar(tf).map((x) => ({ ...x, lewat: `[${t} ${ev}] ${x.lewat}` }))];
      if (l.length > 1) semua.set(`${tf} [${t} ${ev}]`, l);
    }
  }
  // Auth's own writes: it holds auth.users while our triggers on it run
  semua.set("(GoTrue U auth.users)", [{ t: "auth.users", kuat: 2, lewat: "GoTrue" }, ...picu("auth.users", "U", "GoTrue")]);
  const i = picu("auth.users", "I", "GoTrue");
  if (i.length) semua.set("(GoTrue I auth.users)", i);
  return semua;
}

/** The first breach of a list: a row taken before the fence, out of order, or an upgrade. */
export function pelanggaran(l: Kunci[]): string | null {
  const pagar = l.findIndex((x) => x.t === "FENCE");
  if (pagar > 0) {
    const sebelum = l.slice(0, pagar).find((x) => !(x.t in URUTAN) || URUTAN[x.t] > SIKLUS_HIDUP);
    if (sebelum) return `${sebelum.t} locked before the fence (B1: the fence is the first lock after ranks 1 to 6) — via ${sebelum.lewat}`;
  }
  let puncak = 0, di: Kunci | null = null;
  const kuat = new Map<string, Kunci>();
  for (const x of l) {
    if (!(x.t in URUTAN)) continue;
    const r = URUTAN[x.t];
    if (r < puncak) return `${x.t} (rank ${r}) after ${di!.t} (rank ${puncak}) — via ${x.lewat}; earlier via ${di!.lewat}`;
    if (r > puncak) { puncak = r; di = x; }
    const s = kuat.get(x.t);
    if (s && x.kuat > s.kuat && s.kuat < 2) return `an upgrade on ${x.t}: strength ${s.kuat} via ${s.lewat}, then ${x.kuat} via ${x.lewat}`;
    if (!s || x.kuat > s.kuat) kuat.set(x.t, x);
  }
  return null;
}
const dikecualikan = (kat: Katalog, fn: string, v: string) =>
  PENGECUALIAN.some((p) => fn === p.penulis && v.includes(p.lewat) && (!p.syarat || p.syarat(kat)));

/** R3: the per-function report, one line per writer, of the ranked tables it locks in order (strength in brackets). */
export function laporan(semua: Map<string, Kunci[]>): string {
  return [...semua].map(([fn, l]) => `${fn}: ${l.filter((x) => x.t in URUTAN).map((x) => `${x.t}(${x.kuat})`).join(" ")}`).join("\n") + "\n";
}

export function bacaUrutan(db: string, tanam = "") {
  const kat = bacaKatalog(db, tanam);
  const semua = semuaKunci(kat);
  const salah: string[] = [];
  for (const [fn, l] of semua) { const v = pelanggaran(l); if (v && !dikecualikan(kat, fn, v)) salah.push(`${fn}: ${v}`); }
  const disebut = (b: string) => Object.keys(URUTAN).some((t) => t !== "FENCE" && new RegExp(`\\b${t.replace(".", "\\.")}\\b`).test(b));
  const dinamis = [...kat.fns].filter(([, bs]) => bs.some((b) => /\bexecute\b/.test(bersih(b)) && disebut(bersih(b)))).map(([f]) => f);
  return { fungsi: [...kat.fns.values()].reduce((n, b) => n + b.length, 0), menyentuh: semua.size, salah, dinamis, semua, kat };
}

const TANAM = {
  P1: `create function public._a2a_l01_p1(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.accounts a where a.person_id = p for update; perform 1 from public.persons where id = p for update; end $t$;`,
  P1b: `create function public._a2a_l01_p1b(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.persons where id = p for share; update public.persons set updated_at = now() where id = p; end $t$;`,
  P2: `do $t$ declare f oid := 'public.akun_kunci(uuid,boolean)'::regprocedure; begin
  execute format('create or replace function public.akun_kunci(%s) returns %s language plpgsql as %L', pg_get_function_arguments(f),
    pg_get_function_result(f), 'begin perform 1 from public.accounts a where a.person_id = $1 for update; '
    || 'update auth.users set banned_until = null where false; return 0; end');
end $t$;`,
  P3: `create function public._a2a_l01_p3(p uuid) returns void language plpgsql as $t$
begin perform public.pagar_darurat_bersama(); perform 1 from public.accounts a where a.person_id = p for update; end $t$;`,
  P5: `create function public._a2a_l01_p5(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.learning_assignments la where la.id = p for update; perform public.pagar_darurat_bersama(); end $t$;`,
};

// ── A2A-L02: the recovery path on two real connections (Sharon's ruling 3)
const PLANT_TANPA_JAGA = `create or replace function public.recovery_assist_school(p_person uuid) returns uuid language plpgsql stable
  security definer set search_path = public, pg_temp as $t$
begin if public.sekolah_memegang(p_person, gen_random_uuid()) then return null; end if; return null; end $t$`;   // a non-null school: sekolah_memegang returns before its lock on a null one
function psql1(db: string, sql: string) {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 300));
  return r.stdout.trim();
}
/** A holds the person FOR UPDATE; B, with no PINTAR person, makes Auth's level-3 email-recovery password write with a 1 s
 *  lock timeout and rolls it back. The permit, the grant and the ladder are committed before, and removed after. */
async function balapanPemulihan(db: string, u: string, p: string, pid: string) {
  const { balapan } = await import("./balapan");
  const { randomBytes } = await import("node:crypto");
  const hash = randomBytes(32).toString("hex");   // the grant's token_hash is a 64-character hex digest
  psql1(db, `insert into public.password_write_permits (auth_user_id, purpose, expires_at) values ('${u}', 'RECOVERY', now() + interval '10 min');
    insert into public.password_recovery_grants (token_hash, auth_user_id, via, expires_at) values ('${hash}', '${u}', 'EMAIL', now() + interval '10 min');
    insert into public.recovery_ladder (typed_id, level, suspended_at) values ('${pid}', 3, now())
      on conflict (typed_id) do update set level = 3, suspended_at = now();`);
  try {
    return await balapan(`select 1 from public.persons where id = '${p}' for update`,
      `begin; set local lock_timeout = '1s'; update auth.users set encrypted_password = extensions.crypt('a2a-l02', extensions.gen_salt('bf')) where id = '${u}'; rollback;`);
  } finally {
    psql1(db, `delete from public.password_write_permits where auth_user_id = '${u}' and purpose = 'RECOVERY';
      delete from public.password_recovery_grants where token_hash = '${hash}';
      delete from public.recovery_ladder where typed_id = '${pid}';`);
  }
}

// ── A2A-L03: finalize_session against the hold, on two real connections (Sharon, A2A-L01-FINDING-f09da528.md)
const SESI_L03 = "a2a10300-0000-4000-8000-000000000001";
/** The fixture: a copy of a finalized sitting, IN_PROGRESS and a day past its deadline, committed (replica role: no
 *  trigger; the copy is the only row the test makes, and it is removed after). Returns its learner. */
function sesiL03(db: string): string {
  return psql1(db, `begin; set local session_replication_role = replica;
    insert into public.assessment_sessions
    select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI_L03}', 'status', 'IN_PROGRESS',
      'authoritative_deadline', now() - interval '1 day', 'finalized_at', null, 'submitted_at', null,
      'closure_kind', null, 'closure_at', null, 'frozen_at', null, 'unfrozen_at', null))).*
      from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
    commit;
    select person_id from public.assessment_sessions where id = '${SESI_L03}';`).split("\n").pop()!;
}
/** A: the hold's own order (tangguhkan_akun → pengerjaan_tahan_orang): the learner FOR UPDATE, then, 1.5 s later, the
 *  learner's sittings in the statuses the hold takes, by pengerjaan_tahan_orang's own query; rolled back. B, 0.5 s after
 *  A began: the real finalize_session of the fixture, rolled back. */
async function balapanTahan(db: string, orang: string) {
  const { psqlLain, tidur } = await import("./balapan");
  const a = psqlLain(`begin; select 1 from public.persons where id = '${orang}' for update; select pg_sleep(1.5);
    select count(*) from (select a.id from public.assessment_sessions a where a.person_id = '${orang}'
      and a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (a.frozen_at is not null and a.unfrozen_at is null)
      order by a.id for update) z; select pg_sleep(0.3); rollback;`);
  await tidur(500);
  const b = psqlLain(`begin; select public.finalize_session('${SESI_L03}'); rollback;`);
  const [satu, dua] = await Promise.all([a, b]);
  return { satu, dua };
}
// the plant: both of the learner's first locks finalize_session reaches removed (its own, and pengerjaan_putus_tenggat's,
// which it calls first) — the code as it was on 245
const KUNCI_FINAL = "  perform 1 from public.persons where id = v_s.person_id for key share;\n";
const KUNCI_TENGGAT = "  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n";

export const a2aL01Tests: SelfTest[] = [
  {
    id: "A2A-L01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      // the plants first: the engine must report each before its reading of the real code is trusted
      const t = bacaUrutan(db, [TANAM.P1, TANAM.P1b, TANAM.P3, TANAM.P5].join("\n"));
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p1:") && /persons \(rank 1\) after accounts/.test(s)), "plant P1 (accounts, then persons) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p1b:") && /an upgrade on persons/.test(s)), "plant P1b (FOR SHARE, then UPDATE, on persons) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p3:") && /accounts \(rank 5\) after FENCE/.test(s)), "plant P3 (accounts after the fence) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p5:") && /learning_assignments locked before the fence/.test(s)), "plant P5 (a row before the fence, B1) was not reported");
      const p2 = bacaUrutan(db, TANAM.P2);
      c.expect(p2.salah.some((s) => s.startsWith("tangguhkan_akun:") && /auth\.users \(rank 4\) after accounts/.test(s)), "plant P2 (akun_kunci locking accounts before auth.users) was not reported at tangguhkan_akun");
      // the real code
      const r = bacaUrutan(db);
      c.expect(r.menyentuh >= 40, `only ${r.menyentuh} writer(s) were found touching the ranked tables: the engine reads too little`);
      for (const fn of ["tangguhkan_akun", "aktifkan_kembali_akun", "akun_kunci", "hapus_data_pribadi", "(GoTrue U auth.users)"])
        c.expect(r.semua.has(fn), `${fn} was not read as a locker: the engine reads too little`);
      c.expect(r.salah.length === 0, `out of the order, upgraded, or a row before the fence (${r.salah.length}):\n  ${r.salah.join("\n  ")}`);
      const baru = r.dinamis.filter((f) => !(f in SQL_DINAMIS));
      c.expect(baru.length === 0, `dynamic SQL naming a ranked table, not declared: ${baru.join(", ")}`);
      // R3: the committed report is the one the code gives
      const tersimpan = readFileSync(join(repoRoot, "selftest", "a2a-l01-laporan.txt"), "utf8");
      const kini = laporan(r.semua);
      if (tersimpan !== kini) {
        const a = new Set(tersimpan.split("\n")), b = new Set(kini.split("\n"));
        const beda = [...[...b].filter((x) => !a.has(x)).map((x) => `+ ${x}`), ...[...a].filter((x) => !b.has(x)).map((x) => `- ${x}`)].slice(0, 12);
        c.expect(false, `the lock report differs from selftest/a2a-l01-laporan.txt (regenerate with npx tsx scripts/dev/a2a-l01-laporan.ts and read the difference):\n  ${beda.join("\n  ")}`);
      }
      return c.verdict(`${r.menyentuh} writers of ${r.fungsi} functions lock the ranked tables in order, no upgrade, no row before the fence; five plants reported; the report as committed`);
    },
  },
  {
    // A2A-L02 — Auth's recovery password write never waits on a person a lifecycle act holds (Sharon's ruling 3):
    // the declared exception's evidence. Red with its plant: recovery_assist_school reaching sekolah_memegang.
    id: "A2A-L02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const [u, p, pid] = psql1(db, `select u.id || '|' || a.person_id || '|' || ps.pintar_id from auth.users u
        join public.accounts a on a.auth_user_id = u.id and a.kind = 'EMAIL' join public.persons ps on ps.id = a.person_id
        where ps.anonymized_at is null and ps.pintar_id is not null order by u.id limit 1`).split("|");
      c.expect(!!u && !!p && !!pid, "no synthetic person with an email account to test with");
      const r = await balapanPemulihan(db, u, p, pid);
      c.expect(r.satu.ok, `connection A did not hold the person: ${r.satu.err}`);
      c.expect(r.dua.ok, `Auth's recovery password write waited on the person A held: ${r.dua.err || "(failed)"}`);
      c.expect(r.dua.ms < 2000, `Auth's recovery password write took ${r.dua.ms} ms while A held the person: it waited`);
      // the plant: the guard removed, so the path reaches sekolah_memegang; the same race must now fail
      const asli = psql1(db, `select pg_get_functiondef('public.recovery_assist_school(uuid)'::regprocedure)`);
      psql1(db, PLANT_TANPA_JAGA);
      let tanam: Awaited<ReturnType<typeof balapanPemulihan>>;
      try { tanam = await balapanPemulihan(db, u, p, pid); } finally { psql1(db, asli); }
      c.expect(!tanam.dua.ok && /lock timeout|canceling statement due to lock/i.test(tanam.dua.err),
        `with the plant (sekolah_memegang reached), the write did not wait on A's lock: ${tanam.dua.ok ? "it succeeded" : tanam.dua.err}`);
      c.expect(psql1(db, `select count(*) from public.password_write_permits where auth_user_id = '${u}' and purpose = 'RECOVERY'`) === "0",
        "the test left a permit behind");
      return c.verdict(`Auth's recovery password write went through in ${r.dua.ms} ms while A held the person; with the plant it waited and timed out`);
    },
  },
  {
    // A2A-L03 — a sitting is written after its learner (Sharon, A2A-L01-FINDING-f09da528.md; migration 20270118110000):
    // finalize_session of a sitting past its deadline, while the hold holds the learner and wants that sitting, waits
    // for the hold and then finishes; no deadlock. Red with its plant (the learner's first locks removed: 245's code).
    id: "A2A-L03",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const orang = sesiL03(db);
      c.expect(/^[0-9a-f-]{36}$/.test(orang), "no finalized sitting to copy for the fixture");
      try {
        const r = await balapanTahan(db, orang);
        c.expect(r.satu.ok, `the hold (A) failed: ${r.satu.err}`);
        c.expect(r.dua.ok, `finalize_session (B) failed while the hold held its learner: ${r.dua.err}`);
        c.expect(r.dua.ms >= 1100, `finalize_session took ${r.dua.ms} ms: it did not wait for the hold, so the race did not overlap`);
        // the plant: 245's order (the sitting first) must deadlock
        const balik1 = gantiFungsi("public.finalize_session(uuid)", KUNCI_FINAL, "");
        let tanam: Awaited<ReturnType<typeof balapanTahan>>;
        try {
          const balik2 = gantiFungsi("public.pengerjaan_putus_tenggat(uuid,boolean)", KUNCI_TENGGAT, "");
          try { tanam = await balapanTahan(db, orang); } finally { balik2(); }
        } finally { balik1(); }
        const mati = [tanam.satu, tanam.dua].filter((x) => !x.ok && /deadlock detected/.test(x.err));
        c.expect(mati.length === 1, `with the plant (the sitting before its learner) there was no deadlock: A ${tanam.satu.ok ? "ok" : tanam.satu.err}; B ${tanam.dua.ok ? "ok" : tanam.dua.err}`);
        return c.verdict(`finalize_session waited ${r.dua.ms} ms for the hold, then finished; with the plant (245's order) "deadlock detected"`);
      } finally {
        psql1(db, `begin; set local session_replication_role = replica; delete from public.assessment_sessions where id = '${SESI_L03}'; commit;`);
      }
    },
  },
];
