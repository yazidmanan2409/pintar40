/**
 * A2A-L01 — THE ACCOUNT LIFECYCLE TAKES ITS ROWS IN ONE ORDER (A2a's page §6; the owner's decision after the 4.0
 * look-back; Sharon's catalogue test).
 *
 * 4.0 declared no lock order for a person's rows. L1-F2 and L1-F4 each found a cycle by review. This test makes the
 * order permanent, from the catalogue: every function and procedure in `public`, and every trigger on the ranked
 * tables, is read; nothing is a list of names, so a function A2a or A3 adds falls under it the day it lands.
 *
 * For each function, the ordered list of the row locks it takes (directly; through every function it calls, found by
 * name; through the row triggers its writes fire), with each lock's strength. It fails when:
 *   * a later lock has a lower rank than an earlier one (the order);
 *   * a weaker lock on a table is followed by a stronger one (an upgrade: two such transactions on one row deadlock).
 * An insert of a new row is not a lock on an existing row (no one else can see it); the triggers it fires are read.
 * Auth's own update of auth.users (GoTrue) is read as a writer too: it holds the row while our triggers run.
 *
 * WHAT IT DOES NOT ESTABLISH (A2a's page §6): branches are read together in text order (an over-report is a declared
 * exception, with its reason); locks a foreign key takes by itself are counted only if KUNCI_FK says so (Sharon's
 * ruling); the order between rows of one table is the race tests' job (selftest/balapan.ts).
 *
 * Its plants: P1 (accounts, then persons) and P1b (a weaker, then a stronger lock on persons), each created inside
 * this test's own rolled-back transaction, must both be reported before the real reading is trusted. P2 is in
 * scripts/dev/plants.mjs (akun_kunci with its two locks swapped).
 */
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

// ── THE ORDER, AS DATA (Sharon rules on ranks 2, 5 and 6, and on the foreign-key question)
export const URUTAN: Record<string, number> = {
  persons: 1,
  person_suspensions: 2,
  "auth.users": 3,
  accounts: 4,
  FENCE: 5,
  assessment_sessions: 6,
};
/** Whether an insert into a table that refers to a person counts as FOR KEY SHARE on that person (Sharon's ruling). */
export const KUNCI_FK = false;
/** The fence function (A2a §2); a call to it is the fence's lock. */
const PAGAR = "pagar_darurat";

/** Reports read and found safe: the writer, the path it reaches, why, and (where the safety is in code) the
 *  condition the catalogue must still show, so the exception lapses the moment that code does. */
export const PENGECUALIAN: { penulis: string; lewat: string; alasan: string; syarat?: (kat: Katalog) => boolean }[] = [
  {
    penulis: "hapus_data_pribadi",
    lewat: "auth_password_write_guard",
    alasan: "the deletion rewrites auth.users' address and metadata, never its password, so the password guard returns at its first line",
  },
  {
    penulis: "(GoTrue U auth.users)",
    lewat: "recovery_assist_school > sekolah_memegang",
    alasan: "Auth's own connection carries no PINTAR person, and recovery_assist_school answers null without one before it can reach "
      + "sekolah_memegang (migration 20270118100000). A PINTAR function on this path, with a person, is not excepted",
    syarat: (kat) => (kat.fns.get("recovery_assist_school") ?? []).every((src) => {
      const b = bersih(src);
      const jaga = b.indexOf("if public.current_person_id() is null then return null;");
      return jaga >= 0 && jaga < b.indexOf("sekolah_memegang");
    }),
  },
];
/** Functions that build SQL with `execute` naming a ranked table, each read by hand. */
export const SQL_DINAMIS: Record<string, string> = {
  assemble_session: "builds the sitting's item query; it locks no ranked row (its dynamic SQL reads items)",
};

type Kunci = { t: string; kuat: number; lewat: string };
type Katalog = { fns: Map<string, string[]>; pemicu: Map<string, string[]>; fk: Set<string> };

const TBL = /(?:public\.)?(persons|person_suspensions|accounts|assessment_sessions)\b|auth\.users\b/;
const nama = (m: RegExpMatchArray | null) => (m ? (m[1] ?? "auth.users") : null);
const bersih = (src: string) =>
  src.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/'(?:[^']|'')*'/g, "''").toLowerCase();

/** The catalogue, read in one psql session; `tanam` is DDL run first, inside a transaction that is rolled back. */
export function bacaKatalog(db: string, tanam = ""): Katalog {
  const sql = `begin;
${tanam}
select 'F' || chr(31) || p.proname || chr(31) || p.prosrc || chr(30) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang where n.nspname = 'public' and l.lanname in ('plpgsql', 'sql');
select 'T' || chr(31) || case when n.nspname = 'auth' then 'auth.users' else c.relname end || chr(31) || t.tgtype || chr(31) || p.proname || chr(30)
  from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace join pg_proc p on p.oid = t.tgfoid
 where not t.tgisinternal and ((n.nspname = 'public' and c.relname in ('persons', 'person_suspensions', 'accounts', 'assessment_sessions'))
    or (n.nspname = 'auth' and c.relname = 'users'));
select 'K' || chr(31) || c.relname || chr(30) from pg_constraint k join pg_class c on c.oid = k.conrelid
  join pg_namespace n on n.oid = c.relnamespace where k.contype = 'f' and k.confrelid = 'public.persons'::regclass and n.nspname = 'public';
rollback;`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`the catalogue read failed: ${r.stderr.slice(0, 300)}`);
  const kat: Katalog = { fns: new Map(), pemicu: new Map(), fk: new Set() };
  for (const baris of r.stdout.split("\x1e")) {
    const b = baris.replace(/^\n+/, "");
    if (!b) continue;
    const [jenis, ...f] = b.split("\x1f");
    if (jenis === "F") kat.fns.set(f[0], [...(kat.fns.get(f[0]) ?? []), f.slice(1).join("\x1f")]);
    else if (jenis === "T") {
      const tt = Number(f[1]);
      for (const [bit, ev] of [[4, "I"], [8, "D"], [16, "U"]] as const)
        if (tt & bit) kat.pemicu.set(`${f[0]}|${ev}`, [...(kat.pemicu.get(`${f[0]}|${ev}`) ?? []), f[2]]);
    } else if (jenis === "K") kat.fk.add(f[0]);
  }
  return kat;
}

type Peristiwa = { k: "KUNCI"; t: string; kuat: number } | { k: "PANGGIL"; f: string } | { k: "PICU"; t: string; ev: string };

/** One statement's events, in order: the calls inside it first, then its own locks, then what its writes fire. */
function peristiwa(stmt: string, kat: Katalog): Peristiwa[] {
  const ev: Peristiwa[] = [];
  for (const m of stmt.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/g)) {
    if (m[1] === PAGAR) ev.push({ k: "KUNCI", t: "FENCE", kuat: 3 });
    else if (kat.fns.has(m[1])) ev.push({ k: "PANGGIL", f: m[1] });
  }
  const tabel = (s: string) => nama(s.match(TBL));
  const up = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?update\\s+(?:only\\s+)?(${TBL.source})`));
  if (up) { const t = tabel(up[1])!; ev.push({ k: "KUNCI", t, kuat: 2 }, { k: "PICU", t, ev: "U" }); }
  const del = stmt.match(new RegExp(`^\\s*delete\\s+from\\s+(?:only\\s+)?(${TBL.source})`));
  if (del) { const t = tabel(del[1])!; ev.push({ k: "KUNCI", t, kuat: 3 }, { k: "PICU", t, ev: "D" }); }
  const ins = stmt.match(/^\s*insert\s+into\s+(?:public\.)?([a-z_][a-z0-9_]*|auth\.users)\b/);
  if (ins) {
    const t = ins[1] === "auth.users" ? "auth.users" : ins[1];
    if (KUNCI_FK && kat.fk.has(t)) ev.push({ k: "KUNCI", t: "persons", kuat: 0 });
    if (t in URUTAN) ev.push({ k: "PICU", t, ev: "I" });
  }
  const lk = stmt.match(/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b(?:\s+of\s+([a-z0-9_.,\s]+?))?(?:\s+(?:nowait|skip\s+locked))?\s*(?:$|\bloop\b|\binto\b|\blimit\b)/);
  if (lk && /\b(select|perform)\b/.test(stmt)) {
    const kuat = lk[1] === "update" ? 3 : lk[1] === "share" ? 1 : lk[1].includes("no") ? 2 : 0;
    const alias = new Map<string, string>();
    const dari: string[] = [];
    for (const fm of stmt.matchAll(new RegExp(`\\b(?:from|join)\\s+(${TBL.source})(?:\\s+(?:as\\s+)?([a-z_][a-z0-9_]*))?`, "g"))) {
      const t = tabel(fm[1])!;
      dari.push(t); alias.set(t.replace(/^auth\./, ""), t); alias.set(t, t);
      const a = fm[fm.length - 1];
      if (a && !["where", "on", "join", "for", "order", "limit", "left", "inner", "using", "set", "cross"].includes(a)) alias.set(a, t);
    }
    const ts = lk[2] ? lk[2].split(/[,\s]+/).filter(Boolean).map((a) => alias.get(a)).filter((x): x is string => !!x) : dari;
    for (const t of ts) ev.push({ k: "KUNCI", t, kuat });
  }
  return ev;
}

/** Every function's ordered locks, transitively (cycle-safe). */
export function semuaKunci(kat: Katalog): Map<string, Kunci[]> {
  const memo = new Map<string, Kunci[]>();
  const tumpukan = new Set<string>();
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
          else if (e.k === "PICU")
            for (const tf of kat.pemicu.get(`${e.t}|${e.ev}`) ?? [])
              out.push(...daftar(tf).map((x) => ({ ...x, lewat: `${fn} > [${e.t} ${e.ev}] ${x.lewat}` })));
        }
      }
    }
    tumpukan.delete(fn);
    memo.set(fn, out);
    return out;
  };
  const semua = new Map<string, Kunci[]>();
  for (const fn of [...kat.fns.keys()].sort()) { const l = daftar(fn); if (l.length) semua.set(fn, l); }
  // GoTrue's own writes: it holds auth.users while our triggers on it run
  for (const ev of ["U", "I"]) {
    const l: Kunci[] = ev === "U" ? [{ t: "auth.users", kuat: 2, lewat: "GoTrue" }] : [];
    for (const tf of kat.pemicu.get(`auth.users|${ev}`) ?? []) l.push(...daftar(tf).map((x) => ({ ...x, lewat: `GoTrue [auth.users ${ev}] ${x.lewat}` })));
    if (l.length) semua.set(`(GoTrue ${ev} auth.users)`, l);
  }
  return semua;
}

/** The first breach of a list: out of order, or an upgrade. */
export function pelanggaran(l: Kunci[]): string | null {
  let puncak = 0, di: Kunci | null = null;
  const kuat = new Map<string, Kunci>();
  for (const x of l) {
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

export function bacaUrutan(db: string, tanam = "") {
  const kat = bacaKatalog(db, tanam);
  const semua = semuaKunci(kat);
  const salah: string[] = [];
  for (const [fn, l] of semua) { const v = pelanggaran(l); if (v && !dikecualikan(kat, fn, v)) salah.push(`${fn}: ${v}`); }
  const dinamis = [...kat.fns].filter(([, bs]) => bs.some((b) => /\bexecute\b/.test(bersih(b)) && TBL.test(bersih(b)))).map(([f]) => f);
  return { fungsi: [...kat.fns.values()].reduce((n, b) => n + b.length, 0), menyentuh: semua.size, salah, dinamis, semua };
}

const TANAM_URUTAN = `create function public._a2a_l01_tanam_urutan(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.accounts a where a.person_id = p for update; perform 1 from public.persons where id = p for update; end $t$;`;
const TANAM_NAIK = `create function public._a2a_l01_tanam_naik(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.persons where id = p for share; update public.persons set updated_at = now() where id = p; end $t$;`;

// P2: akun_kunci replaced, in the rolled-back transaction, by one that locks accounts before auth.users; every caller
// (tangguhkan_akun, the reinstatement, the closure) must then be reported
const TANAM_AKUN_KUNCI = `do $t$ declare f oid := 'public.akun_kunci(uuid,boolean)'::regprocedure; begin
  execute format('create or replace function public.akun_kunci(%s) returns %s language plpgsql as %L', pg_get_function_arguments(f),
    pg_get_function_result(f), 'begin perform 1 from public.accounts a where a.person_id = $1 for update; '
    || 'update auth.users set banned_until = null where false; return 0; end');
end $t$;`;
// P4: recovery_assist_school without its guard (migration 20270118100000 undone): Auth's password write must be reported
const TANAM_TANPA_JAGA = `create or replace function public.recovery_assist_school(p_person uuid) returns uuid language plpgsql stable
  security definer set search_path = public, pg_temp as $t$
begin if public.sekolah_memegang(p_person, null) then return null; end if; return null; end $t$;`;

export const a2aL01Tests: SelfTest[] = [
  {
    id: "A2A-L01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      // the plants first: the engine must see both before its reading of the real code is trusted
      const t = bacaUrutan(db, `${TANAM_URUTAN}\n${TANAM_NAIK}`);
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_tanam_urutan:") && /persons \(rank 1\) after accounts/.test(s)),
        "plant P1 (accounts, then persons) was not reported: the engine cannot be trusted");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_tanam_naik:") && /an upgrade on persons/.test(s)),
        "plant P1b (FOR SHARE, then UPDATE, on persons) was not reported: the engine cannot be trusted");
      const p2 = bacaUrutan(db, TANAM_AKUN_KUNCI);
      c.expect(p2.salah.some((s) => s.startsWith("tangguhkan_akun:") && /auth\.users \(rank 3\) after accounts/.test(s)),
        "plant P2 (akun_kunci locking accounts before auth.users) was not reported at tangguhkan_akun");
      const p4 = bacaUrutan(db, TANAM_TANPA_JAGA);
      c.expect(p4.salah.some((s) => s.startsWith("(GoTrue U auth.users):") && /persons \(rank 1\) after auth\.users/.test(s)),
        "plant P4 (recovery_assist_school without its guard) was not reported for Auth's password write");
      // the real code
      const r = bacaUrutan(db);
      c.expect(r.menyentuh >= 40, `only ${r.menyentuh} function(s) were found touching the ranked tables: the engine reads too little`);
      for (const fn of ["tangguhkan_akun", "aktifkan_kembali_akun", "akun_kunci", "hapus_data_pribadi"])
        c.expect(r.semua.has(fn), `${fn} was not read as a locker: the engine reads too little`);
      c.expect(r.salah.length === 0, `out of the order persons → person_suspensions → auth.users → accounts → fence → sittings, or upgraded:\n  ${r.salah.join("\n  ")}`);
      const baru = r.dinamis.filter((f) => !(f in SQL_DINAMIS));
      c.expect(baru.length === 0, `dynamic SQL naming a ranked table, not declared: ${baru.join(", ")}`);
      return c.verdict(`${r.menyentuh} of ${r.fungsi} functions lock the ranked tables, all in order, no upgrade; four plants reported`);
    },
  },
];
