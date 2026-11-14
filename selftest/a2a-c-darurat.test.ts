/**
 * A2A-C701 — A LEARNER MOVED OR TRANSFERRED DURING A STOP KEEPS THE STOPPED TIME, EVEN WHEN MARKING IS LATE (Sharon's
 * C7-1, A2A-C-DRAFTS-6-8-c3cbe3c4.md; the owner's review of it, through the Chief Architect, 14 Nov).
 *
 * The exact ordering: the stop takes effect (T_stop) → the learner is moved to another class, or transferred out →
 * the marking batch runs, late → the stop is lifted → the release. The learner's deadline moves by exactly the stop's
 * length. Marking and a sitting's protection are judged as of the window's T_stop (the placement valid then), never
 * "affects now". Its plant restores marking judged now: the moved learner is never marked and loses the time.
 *
 * The procedures commit, so each statement runs on its own (psql's stdin, autocommit), and the fixtures are committed
 * with the replica role and removed after.
 *
 * A2A-C702 — FIRST-TOUCH RELEASE (Sharon's C7-2). Every writer of a sitting takes pengerjaan_pagar before its first
 * write, which releases a sitting still marked from a lifted stop; enforced over the catalogue. And Sharon's test: lift
 * a stop, run no release batch, end the learner's enrolment: it succeeds, released with the right shift first.
 */
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { psqlBaris } from "./a2a-f01.test";

function psqlStdin(db: string, sql: string): string {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 400));
  return r.stdout.trim();
}

const SESI = "a2a1c701-0000-4000-8000-000000000001";
const JENDELA = "a2a1c701-0000-4000-8000-0000000000a1";
const LAMA_MENIT = 45;

type Fiksur = { enr: string; person: string; mem: string; node: string; inst: string; lain: string; st: string; er: string };
/** A live learner in a class of a school with a second class; read once, so the clean-up never depends on a session. */
function fiksur(db: string): Fiksur {
  const b = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.id || '|' || m.node_id || '|' || e.institution_id || '|' || q.lain || '|' || e.status || '|' || coalesce(e.end_reason::text, '')
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  cross join lateral (select n2.id as lain from public.org_nodes n2 where n2.kind = 'CLASS' and n2.institution_id = e.institution_id and n2.id <> m.node_id order by n2.id limit 1) q
  where e.status = 'ACTIVE' order by e.id limit 1;`);
  const [enr, person, mem, node, inst, lain, st, er] = b.split("|");
  if (!lain) throw new Error("no live learner in a school with two classes: the seed changed");
  return { enr, person, mem, node, inst, lain, st, er };
}
/** Puts the learner, the sitting and the window back as they were; run whatever the run did. */
function bersihkan(db: string, f: Fiksur): void {
  psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_sessions where id = '${SESI}';
delete from public.memberships where enrollment_id = '${f.enr}' and id <> '${f.mem}' and valid_from > now() - interval '1 hour' and node_id = '${f.lain}';
update public.memberships set valid_to = null, close_reason = null where id = '${f.mem}';
update public.enrollments set valid_to = null, status = '${f.st}', end_reason = ${f.er ? `'${f.er}'` : "null"} where id = '${f.enr}';
delete from public.maintenance_windows where id = '${JENDELA}';
commit;`);
}

/** One run of the ordering; `cara` is MOVED (another class of the school) or TRANSFERRED (the enrolment ends, the
 *  learner leaves the school). Returns the deadline's move in seconds, and whether the sitting was marked and released. */
function satuKali(db: string, cara: "MOVED" | "TRANSFERRED"): { geser: number; ditandai: boolean; dilepas: boolean } {
  const f = fiksur(db);
  const pindah = cara === "MOVED"
    ? `update public.memberships set valid_to = clock_timestamp(), close_reason = 'MOVED' where id = '${f.mem}';
       insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
       select '${f.enr}', '${f.lain}', m.academic_period_id, clock_timestamp() from public.memberships m where m.id = '${f.mem}';`
    : `update public.memberships set valid_to = clock_timestamp(), close_reason = 'ENROLLMENT_ENDED' where id = '${f.mem}';
       update public.enrollments set valid_to = clock_timestamp(), status = 'ENDED', end_reason = 'TRANSFERRED_OUT' where id = '${f.enr}';`;
  try {
    const out = psqlStdin(db, `
begin; set local session_replication_role = replica;
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS', 'person_id', '${f.person}',
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '5 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', null, 'darurat_jendela_id', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
-- 1. the stop takes effect (T_stop)
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now(), clock_timestamp(), 'A2A-C701',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
commit;
select pg_sleep(0.2);
-- 2. the learner is moved or transferred, before marking has run
begin; set local session_replication_role = replica;
${pindah}
commit;
create temp table a2a_c701_b as select authoritative_deadline as d from public.assessment_sessions where id = '${SESI}';
-- 3. marking runs, late
call public.pengerjaan_tandai_darurat(50);
select 'DITANDAI|' || (darurat_jendela_id is not null)::text from public.assessment_sessions where id = '${SESI}';
-- 4. the lift, ${LAMA_MENIT} minutes after T_stop, and the release
begin; set local session_replication_role = replica;
update public.maintenance_windows set ended_at = t_stop + interval '${LAMA_MENIT} minutes', t_lift = t_stop + interval '${LAMA_MENIT} minutes' where id = '${JENDELA}';
commit;
call public.pengerjaan_lepas_darurat_semua(50);
select 'HASIL|' || extract(epoch from (s.authoritative_deadline - b.d))::int || '|' || (s.darurat_sejak is null)::text
  from public.assessment_sessions s, a2a_c701_b b where s.id = '${SESI}';`);
    const baris = out.split("\n");
    const d = baris.find((l) => l.startsWith("DITANDAI|"))?.split("|")[1] === "true";
    const h = baris.find((l) => l.startsWith("HASIL|"))?.split("|") ?? [];
    return { geser: Number(h[1] ?? -1), ditandai: d, dilepas: h[2] === "true" };
  } finally {
    bersihkan(db, f);
  }
}

// the plant: marking judged by the placement now, as draft 7 had it
const TANDAI_SEKARANG_DARI = `                               and s.created_at <= w.t_stop
                               and public.maintenance_affects_pada(w, s.person_id, w.t_stop)`;
const TANDAI_SEKARANG_KE = `                               and public.maintenance_affects(w, s.person_id)`;

export const a2aDaruratTests: SelfTest[] = [
  {
    id: "A2A-C701",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const harus = LAMA_MENIT * 60;
      for (const cara of ["MOVED", "TRANSFERRED"] as const) {
        const r = satuKali(db, cara);
        c.expect(r.ditandai, `${cara}: the sitting was not marked after the learner left the class (marking judged now, not as of T_stop)`);
        c.expect(r.dilepas && r.geser === harus, `${cara}: the deadline moved by ${r.geser} s, not the stop's ${harus} s (released: ${r.dilepas})`);
      }
      const balik = gantiFungsi("public.pengerjaan_tandai_darurat(integer)", TANDAI_SEKARANG_DARI, TANDAI_SEKARANG_KE);
      let tanam: ReturnType<typeof satuKali>;
      try { tanam = satuKali(db, "MOVED"); } finally { balik(); }
      c.expect(!tanam.ditandai && tanam.geser === 0, `with the plant (marking judged now) the moved learner still kept the time: ${JSON.stringify(tanam)}`);
      return c.verdict(`stop → moved or transferred → late marking → lift: each learner's deadline moved by exactly ${LAMA_MENIT} min; with the plant (marking judged now) the moved learner lost it`);
    },
  },
];

// ═══════════════════════════════════════════════════════════ A2A-C702 · first-touch release (Sharon's C7-2)

/** Writers of a sitting that need not take the helper first, each with its reason. `menunggu`: not yet built, named so
 *  the enumeration is never green by omission; each is removed when its act is built. */
export const PENULIS_DIKECUALIKAN: Record<string, { alasan: string; menunggu?: true }> = {
  pengerjaan_lepas_darurat: { alasan: "the release itself" },
  pengerjaan_tandai_darurat: { alasan: "the marking: writes only the held state of a sitting protected at its window's T_stop (D6.2's declared list)" },
  percobaan_tandai: { alasan: "writes only attempt_request_id, at a new sitting's start (start_learning_session): neither status, deadline nor held state" },
  akhiri_penugasan: { alasan: "D6.2's assignment-level acts, after Sharon's ruling on their order (draft 9)", menunggu: true },
};

const UPDATE_SESI = /\bupdate\s+(?:public\.)?assessment_sessions\b/i;
const PANGGIL_PAGAR = /\bpengerjaan_pagar\s*\(/;
/** Every function that updates a sitting, and whether the helper (directly, or through a function that calls it) comes
 *  before its first update. `tanam` is DDL run first, inside a rolled-back transaction. */
export function penulisSesi(db: string, tanam = ""): { fn: string; lewat: boolean }[] {
  const q = "select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'";
  const src = new Map<string, string>();
  for (const [fn, s] of psqlBaris(db, tanam ? `begin; ${tanam}; ${q}; rollback;` : q))
    src.set(fn, (src.get(fn) ?? "") + "\n" + (s ?? "").replace(/--[^\n]*/g, " "));
  const melalui = [...src].filter(([, s]) => PANGGIL_PAGAR.test(s)).map(([fn]) => fn).filter((fn) => fn !== "pengerjaan_pagar");
  const out: { fn: string; lewat: boolean }[] = [];
  for (const [fn, s] of src) {
    const m = UPDATE_SESI.exec(s);
    if (!m) continue;
    const depan = s.slice(0, m.index);
    out.push({ fn, lewat: PANGGIL_PAGAR.test(depan) || melalui.some((x) => x !== fn && new RegExp(`\\b${x}\\s*\\(`).test(depan)) });
  }
  return out.sort((a, b) => a.fn.localeCompare(b.fn));
}
/** What is wrong: a writer that neither takes the helper first nor is declared; a declaration that is stale. */
export function periksaPenulis(daftar: { fn: string; lewat: boolean }[]): string[] {
  const salah: string[] = [];
  for (const w of daftar) if (!w.lewat && !(w.fn in PENULIS_DIKECUALIKAN)) salah.push(`${w.fn} writes a sitting without first taking pengerjaan_pagar (the first-touch release, C7-2)`);
  for (const fn of Object.keys(PENULIS_DIKECUALIKAN)) {
    const w = daftar.find((x) => x.fn === fn);
    if (!w) salah.push(`${fn} is declared but no longer writes a sitting`);
    else if (w.lewat) salah.push(`${fn} is declared but now takes the helper first: remove its declaration`);
  }
  return salah;
}
const TANAM_PENULIS = `create function public._a2a_c702_tanam(p uuid) returns void language plpgsql as $t$
begin update public.assessment_sessions set status = 'TERMINATED' where id = p; end $t$`;

/** Sharon's test: a class stop holds the learner's sitting; the stop is lifted; no release batch runs; the school's
 *  admin ends the learner's enrolment. All in one transaction, rolled back. */
function lepasLaluKeluar(db: string): { ok: boolean; err: string; status: string; sebab: string; geser: number; dilepas: boolean; hasil: number } {
  const b = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.node_id || '|' || e.institution_id || '|' || a.auth_user_id
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = e.institution_id
   and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until and r.person_id <> e.person_id
  join public.accounts a on a.person_id = r.person_id
  where e.status = 'ACTIVE' and e.valid_to is null order by e.id limit 1;`);
  const [enr, person, node, inst, admin] = b.split("|");
  if (!admin) throw new Error("no live learner in a class with a school admin: the seed changed");
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
set local session_replication_role = replica;
-- the sitting: open since an hour ago, its own deadline 20 minutes after T_stop (so, unshifted, 30 minutes ago)
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS', 'person_id', '${person}',
  'enrollment_id', '${enr}', 'institution_id', '${inst}',
  'authoritative_deadline', now() - interval '30 minutes', 'created_at', now() - interval '60 minutes', 'finalized_at', null,
  'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'darurat_sejak', now() - interval '50 minutes', 'darurat_jendela_id', '${JENDELA}'))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by (s.institution_id = '${inst}') desc, s.id limit 1;
-- the stop: T_stop 50 minutes ago, lifted 45 minutes after it (5 minutes ago); the sitting marked by it; no release ran
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, ended_at, t_lift, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${node}'::uuid], now() - interval '50 minutes', now() - interval '50 minutes',
       now() - interval '5 minutes', now() - interval '5 minutes', 'A2A-C702',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '50 minutes';
delete from public.assessment_results where session_id = '${SESI}';
set local session_replication_role = origin;
create temp table a2a_c702_d as select authoritative_deadline as d from public.assessment_sessions where id = '${SESI}';
select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select public.akhiri_pendaftaran('${enr}', 'WITHDRAWN', null, null) is not null;
select 'HASIL|' || s.status || '|' || coalesce(s.termination_cause::text, '') || '|' || extract(epoch from (s.authoritative_deadline - d.d))::int
       || '|' || (s.darurat_sejak is null)::text || '|' || (select count(*) from public.assessment_results x where x.session_id = s.id)
  from public.assessment_sessions s, a2a_c702_d d where s.id = '${SESI}';
rollback;` });
  const h = (r.stdout ?? "").split("\n").find((l) => l.startsWith("HASIL|"))?.split("|") ?? [];
  return { ok: r.status === 0, err: (r.stderr ?? "").trim().split("\n")[0] ?? "", status: h[1] ?? "", sebab: h[2] ?? "", geser: Number(h[3] ?? -1),
    dilepas: h[4] === "true", hasil: Number(h[5] ?? -1) };
}
const RILIS_PAGAR = "    perform public.pengerjaan_lepas_darurat(p_session);\n";

a2aDaruratTests.push({
  id: "A2A-C702",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    // the enumeration, its plant first
    c.expect(periksaPenulis(penulisSesi(db, TANAM_PENULIS)).some((s) => s.startsWith("_a2a_c702_tanam ")), "the planted writer of a sitting without the helper was not reported");
    const daftar = penulisSesi(db);
    const salah = periksaPenulis(daftar);
    c.expect(salah.length === 0, `the writers of a sitting (C7-2):\n  ${salah.join("\n  ")}`);
    // Sharon's test
    const r = lepasLaluKeluar(db);
    c.expect(r.ok, `ending the enrolment after the lift, with no release batch, failed: ${r.err}`);
    c.expect(r.dilepas && r.geser === 45 * 60, `the sitting was not released with the stop's shift first: moved ${r.geser} s (released: ${r.dilepas})`);
    c.expect(r.status === "TERMINATED" && r.sebab === "INSTITUTIONAL_REVOCATION" && r.hasil === 0,
      `the departure did not end the sitting unscored on its shifted deadline: ${r.status} ${r.sebab}, ${r.hasil} result(s)`);
    // the plant: the helper without its release
    const balik = gantiFungsi("public.pengerjaan_pagar(uuid)", RILIS_PAGAR, "    null;\n");
    let tanam: ReturnType<typeof lepasLaluKeluar>;
    try { tanam = lepasLaluKeluar(db); } finally { balik(); }
    c.expect(!(tanam.ok && tanam.dilepas && tanam.geser === 45 * 60 && tanam.status === "TERMINATED"), `with the plant (no release in the helper) the departure still came out right: ${JSON.stringify(tanam)}`);
    const tunggu = Object.entries(PENULIS_DIKECUALIKAN).filter(([, v]) => v.menunggu).map(([k]) => k);
    return c.verdict(`${daftar.length} writers of a sitting, each taking the helper (and so the first-touch release) before its first write or declared (${Object.keys(PENULIS_DIKECUALIKAN).length}, of which ${tunggu.length} not yet built: ${tunggu.join(", ")}); a stop lifted with no release batch, then the learner's enrolment ended: it succeeds, the sitting released with exactly 45 min first and ended unscored; with the plant (no release) ${tanam.ok ? tanam.status + ", moved " + tanam.geser + " s" : "refused: " + tanam.err}`);
  },
});
