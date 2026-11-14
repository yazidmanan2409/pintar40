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
import { PEMBACA_DB } from "./a2a-c-pembaca.test";

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

type Cara = "MOVED" | "TRANSFERRED" | "TEACHER" | "JOINED";
/** A teacher (EDUCATOR) whose role is scoped at a class, for the role-ending case. */
function fiksurGuru(db: string): { person: string; ra: string; node: string; inst: string; sampai: string } {
  const b = psqlStdin(db, `select ra.person_id || '|' || ra.id || '|' || ra.scope_node_id || '|' || n.institution_id || '|' || ra.valid_until
  from public.role_assignments ra join public.org_nodes n on n.id = ra.scope_node_id and n.kind = 'CLASS'
  where ra.role = 'EDUCATOR' and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until order by ra.id limit 1;`);
  const [person, ra, node, inst, sampai] = b.split("|");
  if (!sampai) throw new Error("no teacher with a role scoped at a class: the seed changed");
  return { person, ra, node, inst, sampai };
}

/** One run of the ordering (Sharon's A2A-K01): a class stop takes effect (T_stop) → the change → marking runs, late → the
 *  stop is lifted 45 minutes after T_stop → the release. `cara`: MOVED (the learner to another class of the school),
 *  TRANSFERRED (the enrolment ends), TEACHER (a teacher of the class, whose role ends), JOINED (a learner moved INTO the
 *  stopped class after T_stop: Sharon's addendum, neither stopped nor held). Returns the deadline's move in seconds,
 *  whether the sitting was marked and released, and whether the person was stopped right after the change. */
function satuKali(db: string, cara: Cara): { geser: number; ditandai: boolean; dilepas: boolean; dihentikan: boolean } {
  const f = fiksur(db);
  const g = cara === "TEACHER" ? fiksurGuru(db) : null;
  const orang = g ? g.person : f.person;
  const kelasHenti = g ? g.node : cara === "JOINED" ? f.lain : f.node;
  const sekolah = g ? g.inst : f.inst;
  const pindah = cara === "MOVED" || cara === "JOINED"
    ? `update public.memberships set valid_to = clock_timestamp(), close_reason = 'MOVED' where id = '${f.mem}';
       insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
       select '${f.enr}', '${f.lain}', m.academic_period_id, clock_timestamp() from public.memberships m where m.id = '${f.mem}';`
    : cara === "TRANSFERRED"
      ? `update public.memberships set valid_to = clock_timestamp(), close_reason = 'ENROLLMENT_ENDED' where id = '${f.mem}';
         update public.enrollments set valid_to = clock_timestamp(), status = 'ENDED', end_reason = 'TRANSFERRED_OUT' where id = '${f.enr}';`
      : `update public.role_assignments set valid_until = clock_timestamp() where id = '${g!.ra}';`;
  try {
    const out = psqlStdin(db, `
begin; set local session_replication_role = replica;
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS', 'person_id', '${orang}',
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '5 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', null, 'darurat_jendela_id', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
-- 1. the stop takes effect (T_stop)
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${sekolah}'::uuid], array['${kelasHenti}'::uuid], now(), clock_timestamp(), 'A2A-K01',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
commit;
select pg_sleep(0.2);
-- 2. the change, before marking has run
begin; set local session_replication_role = replica;
${pindah}
commit;
select 'DIHENTIKAN|' || public.orang_dilindungi('${orang}')::text;
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
    const ambil = (k: string) => baris.find((l) => l.startsWith(k + "|"))?.split("|") ?? [];
    const h = ambil("HASIL");
    return { geser: Number(h[1] ?? -1), ditandai: ambil("DITANDAI")[1] === "true", dilepas: h[2] === "true", dihentikan: ambil("DIHENTIKAN")[1] === "true" };
  } finally {
    bersihkan(db, f);
    if (g) psqlStdin(db, `begin; set local session_replication_role = replica; update public.role_assignments set valid_until = '${g.sampai}' where id = '${g.ra}'; commit;`);
  }
}

/** Sharon's A2A-K01, marking interrupted half-way: two learners of a class hold sittings; a class stop takes effect; a
 *  second connection holds the second sitting while the marking batch runs, so the batch marks the first and skips the
 *  second (SKIP LOCKED: a batch stopped half-way); then the real lift (change_maintenance AKHIRI, as Admin PINTAR) and
 *  the release. Both must move by exactly T_lift − T_stop. */
async function terputus(db: string): Promise<{ separuh: string; tepat: string; err: string }> {
  const { psqlLain, tidur } = await import("./balapan");
  const b = psqlStdin(db, `select e1.person_id || '|' || e2.person_id || '|' || m1.node_id || '|' || e1.institution_id || '|' || a.auth_user_id
  from public.enrollments e1 join public.memberships m1 on m1.enrollment_id = e1.id and m1.valid_to is null
  join public.org_nodes n on n.id = m1.node_id and n.kind = 'CLASS'
  join public.memberships m2 on m2.node_id = m1.node_id and m2.valid_to is null and m2.enrollment_id <> e1.id
  join public.enrollments e2 on e2.id = m2.enrollment_id and e2.status = 'ACTIVE' and e2.person_id <> e1.person_id
  cross join lateral (select ac.auth_user_id from public.role_assignments r join public.accounts ac on ac.person_id = r.person_id
                       where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
                       order by r.id limit 1) a
  where e1.status = 'ACTIVE' order by e1.id, e2.id limit 1;`);
  const [p1, p2, kelas, inst, admin] = b.split("|");
  if (!admin) throw new Error("no class with two learners and an Admin PINTAR: the seed changed");
  const S1 = "a2a1c701-0000-4000-8000-000000000011", S2 = "a2a1c701-0000-4000-8000-000000000012";
  const sesi = (id: string, orang: string) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'person_id', '${orang}',
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '5 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', null, 'darurat_jendela_id', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
${sesi(S1, p1)}
${sesi(S2, p2)}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${kelas}'::uuid], now(), clock_timestamp(), 'A2A-K01 interrupted',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
commit;`);
    const pegang = psqlLain(`begin; select 1 from public.assessment_sessions where id = '${S2}' for update; select pg_sleep(2); commit;`);
    await tidur(400);
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(50);");
    const separuh = psqlStdin(db, `select string_agg((darurat_sejak is not null)::text, ',' order by id) from public.assessment_sessions where id in ('${S1}', '${S2}');`);
    await pegang;
    const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
create temp table a2a_k01_d as select id, authoritative_deadline as d from public.assessment_sessions where id in ('${S1}', '${S2}');
begin;
select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select public.change_maintenance('${JENDELA}', 'AKHIRI', 'A2A-K01: the lift') is not null;
commit;
call public.pengerjaan_lepas_darurat_semua(50);
select 'TEPAT|' || string_agg(((s.authoritative_deadline - d.d) = (w.t_lift - w.t_stop) and s.darurat_sejak is null)::text, ',' order by s.id)
  from public.assessment_sessions s join a2a_k01_d d on d.id = s.id, public.maintenance_windows w where w.id = '${JENDELA}';` });
    const tepat = (r.stdout ?? "").split("\n").find((l) => l.startsWith("TEPAT|"))?.slice(6) ?? "";
    return { separuh, tepat, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_sessions where id in ('${S1}', '${S2}');
delete from public.maintenance_windows where id = '${JENDELA}';
commit;`);
  }
}
const ANGKAT_TANDAI = "    if v_lift is not null then v_tandai := public.pengerjaan_tandai_saat_angkat(w.id); end if;\n";

// the plant: marking judged by the placement now, as draft 7 had it
const TANDAI_SEKARANG_DARI = `                               and s.created_at <= w.t_stop
                               and public.maintenance_affects_pada(w, s.person_id, w.t_stop)`;
const TANDAI_SEKARANG_KE = `                               and public.maintenance_affects_kini(w, s.person_id)`;

export const a2aDaruratTests: SelfTest[] = [
  {
    // Sharon's A2A-K01 (A2A-C-BEFORE-FREEZE-8bc74097.md, C10-1); was A2A-C701 at commit 11
    id: "A2A-K01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const harus = LAMA_MENIT * 60;
      for (const cara of ["MOVED", "TRANSFERRED", "TEACHER"] as const) {
        const r = satuKali(db, cara);
        c.expect(r.dihentikan, `${cara}: after the change the person is no longer stopped (the hook must judge at T_stop)`);
        c.expect(r.ditandai, `${cara}: the sitting was not marked after the change (marking judged now, not as of T_stop)`);
        c.expect(r.dilepas && r.geser === harus, `${cara}: the deadline moved by ${r.geser} s, not T_lift − T_stop = ${harus} s (released: ${r.dilepas})`);
      }
      const j = satuKali(db, "JOINED");
      c.expect(!j.dihentikan && !j.ditandai && j.geser === 0, `a learner who joined the class after T_stop was stopped (${j.dihentikan}), held (${j.ditandai}) or re-timed (${j.geser} s)`);
      // marking interrupted half-way, then the real lift: the lift completes the marking under the exclusive fence
      const tp = await terputus(db);
      c.expect(!tp.err, `the interrupted run failed: ${tp.err}`);
      c.expect(tp.separuh === "true,false", `the marking batch was not interrupted half-way (marked: ${tp.separuh})`);
      c.expect(tp.tepat === "true,true", `after the lift and the release, the two sittings did not each move by exactly T_lift − T_stop: ${tp.tepat}`);
      const balikA = gantiFungsi("public.change_maintenance(uuid,text,text)", ANGKAT_TANDAI, "    v_tandai := 0;\n");
      let tpTanam: Awaited<ReturnType<typeof terputus>>;
      try { tpTanam = await terputus(db); } finally { balikA(); }
      c.expect(tpTanam.tepat !== "true,true", `with the plant (the lift not completing the marking) both sittings still moved: ${JSON.stringify(tpTanam)}`);
      const balik = gantiFungsi("public.pengerjaan_tandai_darurat(integer)", TANDAI_SEKARANG_DARI, TANDAI_SEKARANG_KE);
      let tanam: ReturnType<typeof satuKali>;
      try { tanam = satuKali(db, "MOVED"); } finally { balik(); }
      c.expect(!tanam.ditandai && tanam.geser === 0, `with the plant (marking judged now) the moved learner still kept the time: ${JSON.stringify(tanam)}`);
      return c.verdict(`stop → moved, transferred, or a teacher's role ended → late marking → lift: each still stopped after the change, marked, and moved by exactly T_lift − T_stop (${LAMA_MENIT} min); a learner who joined the stopped class after T_stop is neither stopped nor held, deadline unchanged; marking interrupted half-way, then the real lift: both sittings moved by exactly T_lift − T_stop (with the plant, the lift not completing the marking, the unmarked one did not: ${tpTanam.tepat}); with the plant (marking judged now) the moved learner lost the time`);
    },
  },
];

// ═══════════════════════════════════════════════════════════ A2A-C702 · first-touch release (Sharon's C7-2)

/** Writers of a sitting that need not take the helper first, each with its reason. `menunggu`: not yet built, named so
 *  the enumeration is never green by omission; each is removed when its act is built. */
export const PENULIS_DIKECUALIKAN: Record<string, { alasan: string; menunggu?: true }> = {
  pengerjaan_lepas_darurat: { alasan: "the release itself" },
  pengerjaan_tandai_darurat: { alasan: "the marking: writes only the held state of a sitting protected at its window's T_stop (D6.2's declared list)" },
  pengerjaan_tandai_saat_angkat: { alasan: "the lift's completion of the marking, under the exclusive fence: the marking's own write (D6.7)" },
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

// ═══════════════════════════════════════════════════════════ A2A-C703 · every reader adds the shift (Sharon's C7-3)

/** A2A-T01's HARUS readers in the database that read the assignment's closes_at as a sitting's closing time without
 *  the stop's shift. A sitting with its own deadline is shifted in place at release, so authoritative_deadline needs
 *  nothing; closes_at carries no shift of its own. */
export function pembacaTanpaGeser(db: string): string[] {
  const src = new Map<string, string>();
  for (const [fn, s] of psqlBaris(db, "select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'"))
    src.set(fn, (src.get(fn) ?? "") + "\n" + (s ?? "").replace(/--[^\n]*/g, " "));
  return Object.entries(PEMBACA_DB).filter(([, k]) => k.kelas === "HARUS").map(([fn]) => fn)
    .filter((fn) => /\bcloses_at\b/.test(src.get(fn) ?? "") && !/\bdarurat_geser_detik\b/.test(src.get(fn) ?? "")).sort();
}

/** A window-timed sitting (no deadline of its own) whose assignment closed 10 minutes ago, released from a 45-minute
 *  stop (darurat_geser_detik 2700): read by the effective deadline, the teacher's list, the decider and the closer.
 *  One transaction, rolled back. */
function bacaBergeser(db: string): { ok: boolean; err: string; efektif: number; daftar: number; keadaan: string; putus: string; tutup: string } {
  const b = psqlStdin(db, `select s.id || '|' || aa.id || '|' || aa.node_id || '|' || a.auth_user_id
  from public.assessment_sessions s join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
  join public.org_nodes n on n.id = aa.node_id and n.kind = 'CLASS' and s.class_node_id = aa.node_id
  join public.learning_assignments la on la.id = aa.learning_assignment_id and not public.release_is_professional(la.plp_release_id)
  join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = s.institution_id
   and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until and r.person_id <> s.person_id
  join public.accounts a on a.person_id = r.person_id
  order by s.id limit 1;`);
  const [sumber, aa, kelas, admin] = b.split("|");
  if (!admin) throw new Error("no sitting of a class assignment with a school admin: the seed changed");
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
set local session_replication_role = replica;
update public.assessment_assignments set closes_at = now() - interval '10 minutes' where id = '${aa}';
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS', 'authoritative_deadline', null,
  'created_at', now() - interval '1 minute', 'started_at', now() - interval '1 minute', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_geser_detik', 2700))).*
  from public.assessment_sessions s where s.id = '${sumber}';
delete from public.assessment_results where session_id = '${SESI}';
-- the learner's other sittings of this assignment go (rolled back), so the teacher's list shows this one
delete from public.assessment_sessions x using public.assessment_sessions s
 where s.id = '${SESI}' and x.person_id = s.person_id and x.assessment_assignment_id = s.assessment_assignment_id and x.id <> s.id;
set local session_replication_role = origin;
create temp table a2a_c703_c as select closes_at as c from public.assessment_assignments where id = '${aa}';
select 'EFEKTIF|' || extract(epoch from (public.pengerjaan_tenggat_efektif('${SESI}') - c.c))::int from a2a_c703_c c;
select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select 'DAFTAR|' || extract(epoch from (d.tenggat - c.c))::int || '|' || d.keadaan from public.daftar_pengerjaan('${kelas}', '${aa}') d, a2a_c703_c c where d.sesi_id = '${SESI}';
select set_config('request.jwt.claims', '', true);
select 'PUTUS|' || public.pengerjaan_putus_tenggat('${SESI}', true);
select public.pengerjaan_tutup_terjadwal(500) is not null;
select 'TUTUP|' || status from public.assessment_sessions where id = '${SESI}';
rollback;` });
  const ambil = (k: string) => (r.stdout ?? "").split("\n").find((l) => l.startsWith(k + "|"))?.split("|") ?? [];
  return { ok: r.status === 0, err: (r.stderr ?? "").trim().split("\n")[0] ?? "", efektif: Number(ambil("EFEKTIF")[1] ?? -1),
    daftar: Number(ambil("DAFTAR")[1] ?? -1), keadaan: ambil("DAFTAR")[2] ?? "", putus: ambil("PUTUS")[1] ?? "", tutup: ambil("TUTUP")[1] ?? "" };
}
const PUTUS_BARU = "      v_tenggat := public.pengerjaan_tenggat_efektif(p_session);   -- A2a D6.3: closes_at with the stop's shift\n";
const PUTUS_LAMA = "      select aa.closes_at into v_tenggat from public.assessment_assignments aa where aa.id = v.assessment_assignment_id;\n";

a2aDaruratTests.push({
  id: "A2A-C703",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const tanpa = pembacaTanpaGeser(db);
    c.expect(tanpa.length === 0, `HARUS readers that read closes_at without the stop's shift (C7-3): ${tanpa.join(", ")}`);
    const r = bacaBergeser(db);
    c.expect(r.ok, `the shifted readers' run failed: ${r.err}`);
    c.expect(r.efektif === 2700, `the effective deadline is closes_at + ${r.efektif} s, not + 2700`);
    c.expect(r.daftar === 2700 && r.keadaan === "OPEN", `the teacher's list shows closes_at + ${r.daftar} s, ${r.keadaan} (AturPengerjaan computes from it)`);
    c.expect(r.putus === "IN_PROGRESS", `the decider ended a sitting inside its shifted time: ${r.putus}`);
    c.expect(r.tutup === "IN_PROGRESS", `the closer ended a sitting inside its shifted time: ${r.tutup}`);
    // the plants: the decider and the teacher's list as they were
    const balik = gantiFungsi("public.pengerjaan_putus_tenggat(uuid,boolean)", PUTUS_BARU, PUTUS_LAMA);
    let tanam: ReturnType<typeof bacaBergeser>;
    try { tanam = bacaBergeser(db); } finally { balik(); }
    c.expect(tanam.putus !== "IN_PROGRESS", `with the plant (the decider reading closes_at raw) the sitting was not ended: ${JSON.stringify(tanam)}`);
    const balik2 = gantiFungsi("public.daftar_pengerjaan(uuid,uuid)", "aa.closes_at + make_interval(secs => s.darurat_geser_detik)", "aa.closes_at");
    let tanam2: string[];
    try { tanam2 = pembacaTanpaGeser(db); } finally { balik2(); }
    c.expect(tanam2.includes("daftar_pengerjaan"), "with the plant (the teacher's list reading closes_at raw) the reader was not reported");
    return c.verdict(`every HARUS reader reading closes_at adds darurat_geser_detik; a window-timed sitting whose assignment closed 10 min ago, released from a 45-min stop: effective deadline and the teacher's list +2700 s (OPEN), the decider and the closer leave it IN_PROGRESS; with the plants the decider ended it (${tanam.putus}) and the list was reported`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C704 · the promotion run during a stop (M-1)

/** A class with a learner holding an open sitting, a later school year, the school's admin; a class stop. The
 *  promotion's preview and its application are each tried in a subtransaction; then the stop is lifted and the
 *  preview tried again. One transaction, rolled back. Returns each attempt's SQLSTATE|DETAIL|HINT, or OK. */
function kenaikanSaatBerhenti(db: string): { pratinjau: string; terapkan: string; sesudah: string; ditahan: number; err: string } {
  const b = psqlStdin(db, `select k.id || '|' || ap.id || '|' || pop.person_id || '|' || pop.enrollment_id || '|' || k.institution_id || '|' || a.auth_user_id
  from public.org_nodes k join public.academic_periods kp on kp.id = k.academic_period_id
  join public.academic_periods ap on ap.institution_id = k.institution_id and ap.id <> kp.id and ap.starts_on > kp.starts_on
  cross join lateral public.kenaikan_populasi(k.id) pop
  join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = k.institution_id
   and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until and r.person_id <> pop.person_id
  join public.accounts a on a.person_id = r.person_id
  where k.kind = 'CLASS' and pop.sumber = 'KELAS' order by k.id, pop.person_id limit 1;`);
  const [kelas, tahun, person, enr, inst, admin] = b.split("|");
  if (!admin) throw new Error("no class with a later school year, a learner and a school admin: the seed changed");
  const coba = (terapkan: boolean) => `pg_temp.a2a_coba($q$select public.kenaikan_tetapkan('${kelas}', '${tahun}', '[]'::jsonb, false, ${terapkan})$q$)`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $f$
declare d text; h text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics d = pg_exception_detail, h = pg_exception_hint;
  return sqlstate || '|' || coalesce(d, '') || '|' || coalesce(h, '');
end $f$;
set local session_replication_role = replica;
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS', 'person_id', '${person}',
  'enrollment_id', '${enr}', 'institution_id', '${inst}', 'class_node_id', '${kelas}', 'cohort_node_id', null,
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '10 minutes', 'finalized_at', null,
  'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'darurat_sejak', null, 'darurat_jendela_id', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by (s.institution_id = '${inst}') desc, s.id limit 1;
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${kelas}'::uuid], now(), now(), 'A2A-C704',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
set local session_replication_role = origin;
select 'DITAHAN|' || count(distinct a.person_id) from public.kenaikan_populasi('${kelas}') pop
  join public.assessment_sessions a on a.person_id = pop.person_id and a.enrollment_id = pop.enrollment_id
 where a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and public.pengerjaan_dilindungi(a.id);
select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select 'PRATINJAU|' || ${coba(false)};
select 'TERAPKAN|' || ${coba(true)};
set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now(), t_lift = now() where id = '${JENDELA}';
set local session_replication_role = origin;
select 'SESUDAH|' || ${coba(false)};
rollback;` });
  const ambil = (k: string) => (r.stdout ?? "").split("\n").find((l) => l.startsWith(k + "|"))?.slice(k.length + 1) ?? "";
  return { pratinjau: ambil("PRATINJAU"), terapkan: ambil("TERAPKAN"), sesudah: ambil("SESUDAH"), ditahan: Number(ambil("DITAHAN") || -1),
    err: (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}

a2aDaruratTests.push({
  id: "A2A-C704",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = kenaikanSaatBerhenti(db);
    c.expect(!r.err, `the run failed: ${r.err}`);
    c.expect(r.ditahan >= 1, `no learner of the class is held by the stop: ${r.ditahan}`);
    const mau = `PR070|PROMO_STOPPED|${r.ditahan}`;
    c.expect(r.pratinjau === mau, `the promotion's preview during the stop answered ${r.pratinjau}, not ${mau}`);
    c.expect(r.terapkan === mau, `the promotion's application during the stop answered ${r.terapkan}, not ${mau}`);
    c.expect(!r.sesudah.includes("PROMO_STOPPED"), `after the lift the promotion is still refused for the stop: ${r.sesudah}`);
    const balik = gantiFungsi("public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)", "  if v_ditahan > 0 then\n", "  if false then\n");
    let tanam: ReturnType<typeof kenaikanSaatBerhenti>;
    try { tanam = kenaikanSaatBerhenti(db); } finally { balik(); }
    c.expect(!tanam.terapkan.includes("PROMO_STOPPED"), `with the plant (no refusal) the application was still refused for the stop: ${tanam.terapkan}`);
    return c.verdict(`during a class stop the promotion's preview and application are refused PR070 PROMO_STOPPED with ${r.ditahan} learner(s) in HINT; after the lift it goes on to its own checks (${r.sesudah}); with the plant the application went on (${tanam.terapkan})`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C705 · the closer never starves, in small batches (D6.6)

/** R1: four overdue sittings created long ago (so they come first): two held by a lifted-never stop (marked), one
 *  protected by an active class stop but not yet marked, and one of a learner no stop affects. Asked for three
 *  candidates, the closer's selection must name the unaffected one. Rolled back. */
function calonTanpaLapar(db: string): { ada: boolean; berapa: number; err: string } {
  const f = fiksur(db);
  const b = psqlStdin(db, `select s.id from public.assessment_sessions s where s.person_id <> '${f.person}'
     and not exists (select 1 from public.memberships m where m.enrollment_id in (select e.id from public.enrollments e where e.person_id = s.person_id) and m.node_id = '${f.node}')
   order by s.id limit 1;`);
  if (!b) throw new Error("no sitting of a learner outside the stopped class: the seed changed");
  const ids = ["a2a1c705-0000-4000-8000-000000000001", "a2a1c705-0000-4000-8000-000000000002", "a2a1c705-0000-4000-8000-000000000003", "a2a1c705-0000-4000-8000-000000000004"];
  /** One overdue sitting copied from `sumber` (an SQL expression), as `orang` (an SQL expression), created at `umur`. */
  const sesi = (id: string, sumber: string, orang: string, umur: string, ditahan: boolean) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'person_id', ${orang},
  'authoritative_deadline', timestamptz '2001-01-01', 'created_at', timestamptz '${umur}', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', ${ditahan ? "now()" : "null"}, 'darurat_jendela_id', ${ditahan ? `'${JENDELA}'` : "null"}))).*
  from public.assessment_sessions s where s.id = ${sumber};`;
  const asal = "(select id from a2a_c705_s)";
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
set local session_replication_role = replica;
create temp table a2a_c705_s as select id from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
${sesi(ids[0], asal, `'${f.person}'`, "2000-01-01 00:00:01", true)}
${sesi(ids[1], asal, `'${f.person}'`, "2000-01-01 00:00:02", true)}
${sesi(ids[2], asal, `'${f.person}'`, "2000-01-01 00:00:03", false)}
${sesi(ids[3], `'${b}'`, "s.person_id", "2000-01-01 00:00:04", false)}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now(), now(), 'A2A-C705',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
set local session_replication_role = origin;
select 'CALON|' || ('${ids[3]}' = any(array(select public.pengerjaan_tutup_calon(3))))::text || '|'
  || (select count(*) from public.pengerjaan_tutup_calon(3) x where x::text like 'a2a1c705-%');
rollback;` });
  const h = (r.stdout ?? "").split("\n").find((l) => l.startsWith("CALON|"))?.split("|") ?? [];
  return { ada: h[1] === "true", berapa: Number(h[2] ?? -1), err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}
const CALON_KECUALI = `     and a.darurat_sejak is null
     and not public.pengerjaan_dilindungi(a.id)
`;

a2aDaruratTests.push({
  id: "A2A-C705",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    // R2, structurally: the job is the procedure, which commits; the selection and the step are internal
    const [jenis, perintah, komit, hak] = psqlStdin(db, `select p.prokind::text || '|' || (select command from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal')
        || '|' || (p.prosrc ~* '\\mcommit\\M')::text || '|'
        || (has_function_privilege('service_role', 'public.pengerjaan_tutup_berkala(integer,integer)', 'execute')
            or has_function_privilege('authenticated', 'public.pengerjaan_tutup_berkala(integer,integer)', 'execute'))::text
      from pg_proc p where p.oid = 'public.pengerjaan_tutup_berkala(integer,integer)'::regprocedure;`).split("|");
    c.expect(jenis === "p" && perintah === "call public.pengerjaan_tutup_berkala()" && komit === "true" && hak === "false",
      `the job is not the committing procedure, callable by neither a client nor the server key: kind ${jenis}, «${perintah}», commits ${komit}, granted ${hak}`);
    // R1
    const r = calonTanpaLapar(db);
    c.expect(!r.err, `R1's run failed: ${r.err}`);
    c.expect(r.ada && r.berapa === 1, `asked for three, the closer's selection did not name the unaffected overdue sitting first (named it: ${r.ada}; of the four: ${r.berapa})`);
    const balik = gantiFungsi("public.pengerjaan_tutup_calon(integer)", CALON_KECUALI, "");
    let tanam: ReturnType<typeof calonTanpaLapar>;
    try { tanam = calonTanpaLapar(db); } finally { balik(); }
    c.expect(!tanam.ada, `with the plant (held and protected not excluded) the unaffected sitting was still selected: ${JSON.stringify(tanam)}`);
    return c.verdict(`the job is «${perintah}», a procedure that commits (in batches of 20) and that neither a client nor the server key may call; asked for three candidates with two held and one protected sitting first, the selection names the unaffected overdue one and none of the three; with the plant (no exclusion) the three fill the limit and it waits (R1)`);
  },
});
