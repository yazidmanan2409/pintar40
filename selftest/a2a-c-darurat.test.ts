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
import { PEMBACA_DB, PEMBACA_SRC, type Kelas } from "./a2a-c-pembaca.test";

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
/** Sharon's K2 (A2A-C-11-14-35ee833a.md), in her form: marking in batches of one (p_batas = 1), two learners of the
 *  stopped class; the first batch marks the first (the second is held by another connection, SKIP LOCKED: the batch
 *  stops there); between batches the second learner is moved to another class; the second batch marks them as of
 *  T_stop; then the lift and the release: both move by exactly t_lift − t_stop. */
async function antarBatch(db: string): Promise<{ satu: string; dua: string; tepat: string; err: string }> {
  const { psqlLain, tidur } = await import("./balapan");
  const b = psqlStdin(db, `select e1.person_id || '|' || e2.person_id || '|' || m1.node_id || '|' || e1.institution_id || '|' || m2.id || '|' || e2.id || '|'
     || (select n2.id from public.org_nodes n2 where n2.kind = 'CLASS' and n2.institution_id = e1.institution_id and n2.id <> m1.node_id order by n2.id limit 1)
  from public.enrollments e1 join public.memberships m1 on m1.enrollment_id = e1.id and m1.valid_to is null
  join public.org_nodes n on n.id = m1.node_id and n.kind = 'CLASS'
  join public.memberships m2 on m2.node_id = m1.node_id and m2.valid_to is null and m2.enrollment_id <> e1.id
  join public.enrollments e2 on e2.id = m2.enrollment_id and e2.status = 'ACTIVE' and e2.person_id <> e1.person_id
  where e1.status = 'ACTIVE'
    and exists (select 1 from public.org_nodes n2 where n2.kind = 'CLASS' and n2.institution_id = e1.institution_id and n2.id <> m1.node_id)
  order by e1.id, e2.id limit 1;`);
  const [p1, p2, kelas, inst, mem2, enr2, lain] = b.split("|");
  if (!lain) throw new Error("no class with two learners in a school with a second class: the seed changed");
  const S1 = "a2a1c701-0000-4000-8000-000000000021", S2 = "a2a1c701-0000-4000-8000-000000000022";
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
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${kelas}'::uuid], now(), clock_timestamp(), 'A2A-K01 between batches',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
commit;`);
    const pegang = psqlLain(`begin; select 1 from public.assessment_sessions where id = '${S2}' for update; select pg_sleep(1.5); commit;`);
    await tidur(300);
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(1);");
    const satu = psqlStdin(db, `select string_agg((darurat_sejak is not null)::text, ',' order by id) from public.assessment_sessions where id in ('${S1}', '${S2}');`);
    await pegang;
    // between batches: the second learner moved to another class
    psqlStdin(db, `begin; set local session_replication_role = replica;
update public.memberships set valid_to = clock_timestamp(), close_reason = 'MOVED' where id = '${mem2}';
insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
select '${enr2}', '${lain}', m.academic_period_id, clock_timestamp() from public.memberships m where m.id = '${mem2}';
commit;`);
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(1);");
    const dua = psqlStdin(db, `select string_agg((darurat_sejak is not null)::text, ',' order by id) from public.assessment_sessions where id in ('${S1}', '${S2}');`);
    const out = psqlStdin(db, `create temp table a2a_k2_d as select id, authoritative_deadline as d from public.assessment_sessions where id in ('${S1}', '${S2}');
begin; set local session_replication_role = replica;
update public.maintenance_windows set ended_at = t_stop + interval '${LAMA_MENIT} minutes', t_lift = t_stop + interval '${LAMA_MENIT} minutes' where id = '${JENDELA}';
commit;
call public.pengerjaan_lepas_darurat_semua(1);
select 'TEPAT|' || string_agg(((s.authoritative_deadline - d.d) = interval '${LAMA_MENIT} minutes' and s.darurat_sejak is null)::text, ',' order by s.id)
  from public.assessment_sessions s join a2a_k2_d d on d.id = s.id;`);
    const tepat = out.split("\n").find((l) => l.startsWith("TEPAT|"))?.slice(6) ?? "";
    return { satu, dua, tepat, err: "" };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_sessions where id in ('${S1}', '${S2}');
delete from public.memberships where enrollment_id = '${enr2}' and node_id = '${lain}' and valid_from > now() - interval '1 hour';
update public.memberships set valid_to = null, close_reason = null where id = '${mem2}';
delete from public.maintenance_windows where id = '${JENDELA}';
commit;`);
  }
}
// C18-1 (commit 30): the lift no longer marks; what the interrupted batch missed is credited once by the release batch
// (C30-2 S2: the pass walks in id order, so the call stands alone)
const KREDIT_BATCH = "      perform public.pengerjaan_kredit_darurat(r.id);\n";

// the plant: marking judged by the placement now, as draft 7 had it
const TANDAI_SEKARANG_DARI = `                               and s.created_at <= w.t_stop
                               and public.maintenance_affects_pada(w, s.person_id, w.t_stop)`;
const TANDAI_SEKARANG_KE = `                               and public.maintenance_affects_kini(w, s.person_id)`;
// C18-1: the credit judges placement at T_stop too, so the plant breaks it there as well (else the credit would give
// the moved learner the time the plant's marking lost)
const KREDIT_PADA = "public.maintenance_affects_pada(x, s.person_id, x.t_stop)";
const KREDIT_KINI = "public.maintenance_affects_kini(x, s.person_id)";

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
      // marking interrupted half-way, then the real lift and the release batch: the unmarked sitting is credited once
      const tp = await terputus(db);
      c.expect(!tp.err, `the interrupted run failed: ${tp.err}`);
      c.expect(tp.separuh === "true,false", `the marking batch was not interrupted half-way (marked: ${tp.separuh})`);
      c.expect(tp.tepat === "true,true", `after the lift and the release, the two sittings did not each move by exactly T_lift − T_stop: ${tp.tepat}`);
      const balikA = gantiFungsi("public.pengerjaan_lepas_darurat_semua(integer)", KREDIT_BATCH, "      null;\n");
      let tpTanam: Awaited<ReturnType<typeof terputus>>;
      try { tpTanam = await terputus(db); } finally { balikA(); }
      c.expect(tpTanam.tepat !== "true,true", `with the plant (the release batch not crediting) both sittings still moved: ${JSON.stringify(tpTanam)}`);
      // Sharon's K2: batches of one, the second learner moved between batches; with the plant (marking judged now) red
      const ab = await antarBatch(db);
      c.expect(ab.satu === "true,false" && ab.dua === "true,true", `batches of one, the second learner moved between them: marked ${ab.satu} after the first batch, ${ab.dua} after the second`);
      c.expect(ab.tepat === "true,true", `after the lift and the release (batches of one) the two did not each move by exactly the stop: ${ab.tepat}`);
      const balikB = gantiFungsi("public.pengerjaan_tandai_darurat(integer)", TANDAI_SEKARANG_DARI, TANDAI_SEKARANG_KE);
      const balikB2 = gantiFungsi("public.penghentian_kredit(public.assessment_sessions)", KREDIT_PADA, KREDIT_KINI);
      let abTanam: Awaited<ReturnType<typeof antarBatch>>;
      try { abTanam = await antarBatch(db); } finally { balikB2(); balikB(); }
      c.expect(abTanam.tepat !== "true,true", `with the plant (marking judged now) the learner moved between batches still kept the time: ${JSON.stringify(abTanam)}`);
      const balik = gantiFungsi("public.pengerjaan_tandai_darurat(integer)", TANDAI_SEKARANG_DARI, TANDAI_SEKARANG_KE);
      const balik2 = gantiFungsi("public.penghentian_kredit(public.assessment_sessions)", KREDIT_PADA, KREDIT_KINI);
      let tanam: ReturnType<typeof satuKali>;
      try { tanam = satuKali(db, "MOVED"); } finally { balik2(); balik(); }
      c.expect(!tanam.ditandai && tanam.geser === 0, `with the plant (marking judged now) the moved learner still kept the time: ${JSON.stringify(tanam)}`);
      return c.verdict(`stop → moved, transferred, or a teacher's role ended → late marking → lift: each still stopped after the change, marked, and moved by exactly T_lift − T_stop (${LAMA_MENIT} min); a learner who joined the stopped class after T_stop is neither stopped nor held, deadline unchanged; marking in batches of one with the second learner moved between them: both moved by exactly the stop (red with the plant); marking interrupted half-way, then the real lift: both sittings moved by exactly T_lift − T_stop (with the plant, the batch not crediting, the unmarked one did not: ${tpTanam.tepat}); with the plant (marking judged now) the moved learner lost the time`);
    },
  },
];

// ═══════════════════════════════════════════════════════════ A2A-C702 · first-touch release (Sharon's C7-2)

/** Writers of a sitting that need not take the helper first, each with its reason. `menunggu`: not yet built, named so
 *  the enumeration is never green by omission; each is removed when its act is built. */
export const PENULIS_DIKECUALIKAN: Record<string, { alasan: string; menunggu?: true }> = {
  pengerjaan_lepas_darurat: { alasan: "the release itself" },
  pengerjaan_tandai_darurat: { alasan: "the marking: writes only the held state of a sitting protected at its window's T_stop (D6.2's declared list)" },
  pengerjaan_kredit_darurat: { alasan: "the credit of an unmarked sitting of a lifted stop (C18-1): reached from pengerjaan_pagar after the fence, and from the release batch; writes only the deadline (or the window-timed shift) and the watermark" },
  pengerjaan_keluar_terapkan: { alasan: "the departure's inner step (C39-1): reached only from pengerjaan_pagar, after its release and credit, when the sitting is no longer protected; it takes the people and the fence again in order, then ends the sitting by the ordinary rule" },
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
    const balik2 = gantiFungsi("public.daftar_pengerjaan(uuid,uuid)", "(select public.pengerjaan_tenggat_efektif(s.id) as tenggat)", "(select coalesce(s.authoritative_deadline, aa.closes_at) as tenggat)");
    let tanam2: string[];
    try { tanam2 = pembacaTanpaGeser(db); } finally { balik2(); }
    c.expect(tanam2.includes("daftar_pengerjaan"), "with the plant (the teacher's list reading closes_at raw) the reader was not reported");
    return c.verdict(`every HARUS reader reading closes_at adds darurat_geser_detik; a window-timed sitting whose assignment closed 10 min ago, released from a 45-min stop: effective deadline and the teacher's list +2700 s (OPEN), the decider and the closer leave it IN_PROGRESS; with the plants the decider ended it (${tanam.putus}) and the list was reported`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C704 · the promotion run during a stop (M-1)

const TAHUN_BARU = "a2a1c704-0000-4000-8000-0000000000e1";
const KENAIKAN_BASI = "     and public.pengerjaan_dilindungi(a.id);   -- C41-2: a stale mark after the lift holds nothing";

/** A class with a learner holding an open sitting, a later school year, the school's admin; a class stop. The
 *  promotion's preview and its application are each tried in a subtransaction; then the stop is lifted and the
 *  preview tried again. One transaction, rolled back. Returns each attempt's SQLSTATE|DETAIL|HINT, or OK. */
function kenaikanSaatBerhenti(db: string): { pratinjau: string; terapkan: string; sesudah: string; basi: string; ditahan: number; err: string } {
  // the class needs a learner and a school admin; a later school year is added inside the rolled-back transaction when
  // the school has none (the whole manifest moves the seed's learners before this test runs)
  const b = psqlStdin(db, `select k.id || '|' || coalesce((select ap.id::text from public.academic_periods ap where ap.institution_id = k.institution_id
         and ap.id <> kp.id and ap.starts_on > kp.starts_on order by ap.starts_on limit 1), '${TAHUN_BARU}') || '|' || pop.person_id || '|' || pop.enrollment_id
         || '|' || k.institution_id || '|' || a.auth_user_id || '|' || kp.ends_on
  from public.org_nodes k join public.academic_periods kp on kp.id = k.academic_period_id
  cross join lateral public.kenaikan_populasi(k.id) pop
  join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = k.institution_id
   and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until and r.person_id <> pop.person_id
  join public.accounts a on a.person_id = r.person_id
  where k.kind = 'CLASS' and pop.sumber = 'KELAS' order by k.id, pop.person_id limit 1;`);
  const [kelas, tahun, person, enr, inst, admin, akhirTahun] = b.split("|");
  if (!admin) throw new Error("no class with a learner and a school admin: the seed changed");
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
${tahun === TAHUN_BARU ? `insert into public.academic_periods (id, institution_id, name, starts_on, ends_on)
values ('${TAHUN_BARU}', '${inst}', 'A2A-C704 tahun berikut', '${akhirTahun}'::date + 1, '${akhirTahun}'::date + 365);` : ""}
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
-- C41-2: the marking batch had marked the sitting; lifted, no release batch yet: the stale mark holds nothing
set local session_replication_role = replica;
update public.assessment_sessions set darurat_sejak = (select t_stop from public.maintenance_windows where id = '${JENDELA}'), darurat_jendela_id = '${JENDELA}' where id = '${SESI}';
set local session_replication_role = origin;
select 'BASI|' || ${coba(true)};
rollback;` });
  const ambil = (k: string) => (r.stdout ?? "").split("\n").find((l) => l.startsWith(k + "|"))?.slice(k.length + 1) ?? "";
  return { pratinjau: ambil("PRATINJAU"), terapkan: ambil("TERAPKAN"), sesudah: ambil("SESUDAH"), basi: ambil("BASI"), ditahan: Number(ambil("DITAHAN") || -1),
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
    c.expect(!!r.basi && !r.basi.includes("PROMO_STOPPED"), `C41-2: after the lift, with the stop's mark not yet released (no batch), the application is still refused for the stop: ${r.basi}`);
    const balik = gantiFungsi("public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)", "  if v_ditahan > 0 then\n", "  if false then\n");
    let tanam: ReturnType<typeof kenaikanSaatBerhenti>;
    try { tanam = kenaikanSaatBerhenti(db); } finally { balik(); }
    c.expect(!tanam.terapkan.includes("PROMO_STOPPED"), `with the plant (no refusal) the application was still refused for the stop: ${tanam.terapkan}`);
    // C41-2's plant: the stale mark counted again
    const balik2 = gantiFungsi("public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)", KENAIKAN_BASI,
      "     and (public.pengerjaan_dilindungi(a.id) or a.darurat_sejak is not null);");
    let tanam2: ReturnType<typeof kenaikanSaatBerhenti>;
    try { tanam2 = kenaikanSaatBerhenti(db); } finally { balik2(); }
    c.expect(tanam2.basi.includes("PROMO_STOPPED"), `with C41-2's plant (the stale mark counted) the application after the lift was not refused: ${tanam2.basi}`);
    return c.verdict(`during a class stop the promotion's preview and application are refused PR070 PROMO_STOPPED with ${r.ditahan} learner(s) in HINT; after the lift it goes on to its own checks (${r.sesudah}), and so does the application while the stop's mark is not yet released (C41-2: ${r.basi}); plants: no refusal, the application went on (${tanam.terapkan}); the stale mark counted, refused (${tanam2.basi})`);
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

// ═══════════════════════════════════════════════════════════ A2A-C706 · rescheduling a stopped class's assignment (C9-2)

/** A live class assignment, its teacher, a learner's open sitting of it; a class stop. The teacher reschedules the
 *  assignment: refused SITTING_CLASS_STOPPED, the assignments' closing times and the sitting's effective deadline
 *  unchanged; after the lift the same change goes through. One transaction, rolled back. */
function jadwalSaatBerhenti(db: string): { saat: string; tetap: string; sesudah: string; err: string } {
  const b = psqlStdin(db, `select la.id || '|' || la.node_id || '|' || la.institution_id || '|' || a.auth_user_id || '|' || aa.id
  from public.learning_assignments la join public.org_nodes n on n.id = la.node_id and n.kind = 'CLASS'
  join public.assessment_assignments aa on aa.learning_assignment_id = la.id
  join public.role_assignments r on r.role = 'EDUCATOR' and r.scope_node_id = la.node_id and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
  join public.accounts a on a.person_id = r.person_id
  where la.status = 'ACTIVE' and not public.release_is_professional(la.plp_release_id) order by la.id, aa.id limit 20;`);
  // the first candidate whose window can be changed at all (its own guards: content still shared with the school, no
  // sealed pass mark), tried in a rolled-back transaction: the whole manifest changes the seed's first one before this
  const bisa = b.split("\n").find((baris) => {
    const id = baris.split("|")[0];
    return spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `begin;
update public.learning_assignments set available_from = now() + interval '1 hour', available_until = now() + interval '3 days' where id = '${id}';
update public.assessment_assignments set opens_at = now() + interval '1 hour', closes_at = now() + interval '3 days'
 where learning_assignment_id = '${id}' and status in ('SCHEDULED', 'OPEN');
rollback;` }).status === 0;
  }) ?? "";
  const [la, kelas, inst, guru, aa] = bisa.split("|");
  if (!aa) throw new Error("no live class assignment with a teacher whose window can be changed: the seed changed");
  const coba = `pg_temp.a2a_coba($q$select public.ubah_jadwal_penugasan('${la}', now() + interval '1 hour', now() + interval '3 days', 'A2A-C706: jadwal baru saat berhenti')$q$)`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $f$
declare d text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics d = pg_exception_detail;
  return sqlstate || '|' || coalesce(d, '');
end $f$;
set local session_replication_role = replica;
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI}', 'status', 'IN_PROGRESS',
  'person_id', (select e.person_id from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                 where m.node_id = '${kelas}' and m.valid_to is null and e.status = 'ACTIVE' order by e.id limit 1),
  'institution_id', '${inst}', 'assessment_assignment_id', '${aa}', 'class_node_id', '${kelas}', 'cohort_node_id', null,
  'authoritative_deadline', null, 'created_at', now() - interval '10 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'darurat_sejak', null, 'darurat_jendela_id', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${kelas}'::uuid], now(), now(), 'A2A-C706',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
set local session_replication_role = origin;
create temp table a2a_c706_t as select (select string_agg(coalesce(closes_at::text, '-'), ',' order by id) from public.assessment_assignments where learning_assignment_id = '${la}') as c,
  coalesce(public.pengerjaan_tenggat_efektif('${SESI}')::text, '-') as e;
select set_config('request.jwt.claims', '{"sub":"${guru}","role":"authenticated"}', true);
select 'SAAT|' || ${coba};
select 'TETAP|' || ((select string_agg(coalesce(closes_at::text, '-'), ',' order by id) from public.assessment_assignments where learning_assignment_id = '${la}') = t.c
  and coalesce(public.pengerjaan_tenggat_efektif('${SESI}')::text, '-') = t.e)::text from a2a_c706_t t;
set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now(), t_lift = now() where id = '${JENDELA}';
set local session_replication_role = origin;
select 'SESUDAH|' || ${coba};
rollback;` });
  const ambil = (k: string) => (r.stdout ?? "").split("\n").find((l) => l.startsWith(k + "|"))?.slice(k.length + 1) ?? "";
  return { saat: ambil("SAAT"), tetap: ambil("TETAP"), sesudah: ambil("SESUDAH"), err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}
const JADWAL_TOLAK = "    perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED');\n  end if;\n";

a2aDaruratTests.push({
  id: "A2A-C706",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = jadwalSaatBerhenti(db);
    c.expect(!r.err, `the run failed: ${r.err}`);
    c.expect(r.saat === "PR170|SITTING_CLASS_STOPPED", `rescheduling the stopped class's assignment answered ${r.saat}, not PR170|SITTING_CLASS_STOPPED`);
    c.expect(r.tetap === "true", "the refused rescheduling changed an assignment's closing time or the sitting's effective deadline");
    c.expect(r.sesudah === "OK", `after the lift the same rescheduling answered ${r.sesudah}`);
    const balik = gantiFungsi("public.ubah_jadwal_penugasan(uuid,timestamp with time zone,timestamp with time zone,text)", JADWAL_TOLAK, "    null;\n  end if;\n");
    let tanam: ReturnType<typeof jadwalSaatBerhenti>;
    try { tanam = jadwalSaatBerhenti(db); } finally { balik(); }
    c.expect(tanam.saat === "OK", `with the plant (no refusal) the rescheduling was still refused: ${tanam.saat}`);
    return c.verdict("during a class stop the teacher's rescheduling of the class's assignment is refused SITTING_CLASS_STOPPED under the shared fence, the assignments' closing times and the sitting's effective deadline unchanged; after the lift it goes through; with the plant it went through during the stop");
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C707 · every act after a lift, before the batch (C7-2)

/** Sharon's C7-2, in full: a class stop, lifted (45 minutes after T_stop), no release batch run. Each act, as its own
 *  actor, on its own sitting still marked by the stop, unshifted deadline already passed: it succeeds, the sitting
 *  released with the stop's shift first; SITTING_EMERGENCY_HELD is never raised. One transaction, each act in a
 *  subtransaction, rolled back. Returns act → "OK|released|moved seconds" or its refusal. */
const TINDAKAN: { nama: string; aktor: "guru" | "admin" | "murid"; status: string; sql: (s: string) => string }[] = [
  { nama: "tambah_waktu_pengerjaan", aktor: "guru", status: "IN_PROGRESS", sql: (s) => `select public.tambah_waktu_pengerjaan('${s}', 10, 'A2A-C707: tambah waktu')` },
  { nama: "akhiri_pengerjaan", aktor: "guru", status: "IN_PROGRESS", sql: (s) => `select public.akhiri_pengerjaan('${s}', 'NOT_COUNTED', 'A2A-C707: akhiri tanpa menghitung')` },
  { nama: "extend_session_deadline", aktor: "guru", status: "IN_PROGRESS", sql: (s) => `select public.extend_session_deadline('${s}', 10, 'A2A-C707: perpanjang')` },
  { nama: "terminate_session", aktor: "admin", status: "IN_PROGRESS", sql: (s) => `select public.terminate_session('${s}', 'SECURITY_INTERVENTION', 'A2A-C707: integritas')` },
  // the learner's gate, through the hand-in (pausing is a definition's option; the hand-in reaches the gate always)
  { nama: "finish_my_session (the gate)", aktor: "murid", status: "IN_PROGRESS", sql: (s) => `select public.finish_my_session('${s}', null)` },
  { nama: "resume_session", aktor: "murid", status: "PAUSED", sql: (s) => `select public.resume_session('${s}')` },
];
function setiapTindakan(db: string): { hasil: Record<string, string>; err: string } {
  const b = psqlStdin(db, `select e.person_id || '|' || e.id || '|' || m.node_id || '|' || e.institution_id || '|' || am.auth_user_id || '|' || ag.auth_user_id || '|' || aa.auth_user_id
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  join public.accounts am on am.person_id = e.person_id
  join public.role_assignments rg on rg.role = 'EDUCATOR' and rg.scope_node_id = m.node_id and rg.revoked_at is null and now() >= rg.valid_from and now() < rg.valid_until
  join public.accounts ag on ag.person_id = rg.person_id
  join public.role_assignments ra on ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = e.institution_id and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
  join public.accounts aa on aa.person_id = ra.person_id
  where e.status = 'ACTIVE' and rg.person_id <> e.person_id and ra.person_id <> e.person_id order by e.id limit 1;`);
  const [orang, enr, kelas, inst, murid, guru, admin] = b.split("|");
  if (!admin) throw new Error("no class with a learner, a teacher and a school admin who have accounts: the seed changed");
  const aktor = { guru, admin, murid };
  const id = (i: number) => `a2a1c707-0000-4000-8000-00000000000${i}`;
  const per = TINDAKAN.map((x, i) => `
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id(i)}', 'status', '${x.status}', 'person_id', '${orang}',
  'enrollment_id', '${enr}', 'institution_id', '${inst}', 'class_node_id', '${kelas}', 'cohort_node_id', null,
  'authoritative_deadline', now() - interval '10 minutes', 'created_at', now() - interval '60 minutes', 'started_at', now() - interval '60 minutes',
  'finalized_at', null, 'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null,
  'unfrozen_at', null, 'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'deadline_extended_count', 0, 'darurat_sejak', now() - interval '50 minutes', 'darurat_jendela_id', '${JENDELA}'))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by (s.institution_id = '${inst}') desc, s.id limit 1;`).join("\n");
  const coba = TINDAKAN.map((x, i) => `
select set_config('request.jwt.claims', '{"sub":"${aktor[x.aktor]}","role":"authenticated"}', true);
create temp table a2a_c707_${i} as select pg_temp.a2a_coba($q$${x.sql(id(i))}$q$) as h;
-- a statement of its own: the act's writes are read after it, not in its snapshot
select 'T${i}|' || (select h from a2a_c707_${i}) || '|' || coalesce((select (s.darurat_sejak is null)::text || '|'
   || extract(epoch from (s.authoritative_deadline - (now() - interval '10 minutes')))::int from public.assessment_sessions s where s.id = '${id(i)}'), '-');`).join("\n");
  const sqlC707 = `
begin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $f$
declare d text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics d = pg_exception_detail;
  return sqlstate || ':' || coalesce(d, '') || ':' || left(sqlerrm, 80);
end $f$;
set local session_replication_role = replica;
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, ended_at, t_lift, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${inst}'::uuid], array['${kelas}'::uuid], now() - interval '50 minutes', now() - interval '50 minutes',
       now() - interval '5 minutes', now() - interval '5 minutes', 'A2A-C707',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '50 minutes';
${per}
set local session_replication_role = origin;
${coba}
rollback;`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sqlC707 });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const m = /^T(\d+)\|(.*)$/.exec(l); if (m) hasil[TINDAKAN[Number(m[1])].nama] = m[2]; }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}

a2aDaruratTests.push({
  id: "A2A-C707",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = setiapTindakan(db);
    c.expect(!r.err, `the run failed: ${r.err}`);
    for (const x of TINDAKAN) {
      const h = r.hasil[x.nama] ?? "(not run)";
      const [ok, dilepas, geser] = h.split("|");
      c.expect(ok === "OK", `${x.nama} after the lift, before the batch, did not succeed: ${h}`);
      c.expect(!/SITTING_EMERGENCY_HELD/.test(h), `${x.nama} raised SITTING_EMERGENCY_HELD on a sitting whose chain had ended`);
      c.expect(dilepas === "true" && Number(geser) >= 45 * 60, `${x.nama}: the sitting was not released with the stop's shift first (released ${dilepas}, moved ${geser} s)`);
    }
    const balik = gantiFungsi("public.pengerjaan_pagar(uuid)", RILIS_PAGAR, "    null;\n");
    let tanam: ReturnType<typeof setiapTindakan>;
    try { tanam = setiapTindakan(db); } finally { balik(); }
    const ditahan = Object.entries(tanam.hasil).filter(([, h]) => /SITTING_EMERGENCY_HELD/.test(h)).map(([k]) => k);
    c.expect(ditahan.length > 0, `with the plant (no release in the helper) no act was refused SITTING_EMERGENCY_HELD: ${JSON.stringify(tanam.hasil)}`);
    return c.verdict(`after a lift with no release batch, each of ${TINDAKAN.map((x) => x.nama).join(", ")} succeeds as its own actor, the sitting released with the stop's 45 min first; none raises SITTING_EMERGENCY_HELD; with the plant (no release) ${ditahan.length} of them did (${ditahan.join(", ")})`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C708 · D6.3's shift test, from A2A-T01's table (C7-3)

/** Sharon's C7-3 (A2A-C-BEFORE-FREEZE-8bc74097.md, section 3): every HARUS reader of A2A-T01 reads the same effective
 *  deadline after a lift. Each is covered one of three ways, and a HARUS reader with no case fails the test:
 *   NILAI       it returns a deadline: probed, it equals pengerjaan_tenggat_efektif;
 *   KEPUTUSAN   it decides on the deadline: probed, it treats the sitting as still inside its shifted time;
 *   KONSTRUKSI  it reads only authoritative_deadline (moved in place by the release), the effective deadline, or a
 *               stored remaining time, never closes_at: so it is consistent for both kinds of sitting, and that is
 *               checked on its source. */
type CaraGeser = "NILAI" | "KEPUTUSAN" | "KONSTRUKSI";
export const KASUS_GESER: Record<string, CaraGeser> = {
  pengerjaan_tenggat_efektif: "NILAI", daftar_pengerjaan: "NILAI", pengerjaan_saya: "NILAI", session_state: "NILAI",
  pengerjaan_putus_tenggat: "KEPUTUSAN", pengerjaan_tutup_calon: "KEPUTUSAN", may_continue_session: "KEPUTUSAN", maintenance_draining: "KEPUTUSAN",
  finalize_session: "KONSTRUKSI", record_answer: "KONSTRUKSI", pengerjaan_tahan_orang: "KONSTRUKSI", extend_session_deadline: "KONSTRUKSI",
  tambah_waktu_pengerjaan: "KONSTRUKSI", lanjutkan_pengerjaan: "KONSTRUKSI", pengerjaan_jaga: "KONSTRUKSI", pengerjaan_lepas_darurat: "KONSTRUKSI",
  pengerjaan_tandai_darurat: "KONSTRUKSI", pengerjaan_kredit_darurat: "KONSTRUKSI", pengerjaan_dalam_tenggang_pada: "KONSTRUKSI",
  // the app: the player shows session_state's value (probed above); AturPengerjaan's client computation is checked
  // against the server's own added time below
  "src/lib/assessment-engine/index.ts": "NILAI", "src/components/mengajar/AturPengerjaan.tsx": "NILAI",
};
/** Sharon's C30-1 (A2A-C-30-8cbda9cc.md): a HARUS reader of authoritative_deadline reads it through
 *  pengerjaan_tenggat_efektif, or touches the sitting (pengerjaan_pagar, or a helper whose first act it is) before its
 *  first read, so it decides on the credited deadline. The credit machinery itself is named, with why. */
export const MESIN_TENGGAT: Record<string, string> = {
  pengerjaan_jaga: "the guard: it checks a write, decides nothing on the deadline",
  pengerjaan_tenggat_efektif: "D1 itself: the raw deadline plus the pending credit",
  pengerjaan_kredit_darurat: "the credit: it moves the deadline by the pending credit, under the sitting's lock",
  pengerjaan_lepas_darurat: "the release: it moves the deadline by the stop's shift and the credit before the mark",
  pengerjaan_tandai_darurat: "the marking: it records when a hold began, never moves or decides on the deadline",
  pengerjaan_dalam_tenggang_pada: "the grace helper: judged at the instant it is given",
  pengerjaan_tutup_calon: "the closer's selection: each selected sitting is credited at pengerjaan_tutup_satu's first touch, then judged (Sharon's read of commit 30)",
};
const SENTUH = /public\.(pengerjaan_pagar|pengerjaan_gerbang|pengerjaan_ditahan_periksa|pengerjaan_putus_tenggat)\(/;
/** The HARUS readers that read authoritative_deadline neither through the effective deadline nor after a touch. */
export function bacaSebelumSentuh(src: Map<string, string>, harus: string[]): string[] {
  return harus.filter((fn) => {
    const s = src.get(fn);
    if (!s || fn in MESIN_TENGGAT) return false;
    const baca = s.search(/\bauthoritative_deadline\b/);
    if (baca < 0 || s.includes("pengerjaan_tenggat_efektif")) return false;
    const sentuh = s.search(SENTUH);
    return sentuh < 0 || sentuh > baca;
  }).sort();
}
/** The HARUS and KLIEN readers of A2A-T01's tables that have no case here (the coverage half). */
export function tanpaKasus(db: Record<string, Kelas>, src: Record<string, Kelas>, kasus: Record<string, CaraGeser>): string[] {
  return [...Object.entries(db), ...Object.entries(src)].filter(([, k]) => k.kelas === "HARUS" || k.kelas === "KLIEN")
    .map(([n]) => n).filter((n) => !(n in kasus)).sort();
}

/** The probes, rolled back: W, a window-timed sitting whose assignment closed 10 minutes ago, released from a 45-minute
 *  stop (darurat_geser_detik 2700); O, an own-deadline sitting of the same learner released the same way (its deadline
 *  moved in place). As the learner, the teacher and the job, each probe answers true when it agrees. */
function probeGeser(db: string): { hasil: Record<string, string>; err: string } {
  const b = psqlStdin(db, `select s.id || '|' || aa.id || '|' || aa.node_id || '|' || am.auth_user_id || '|' || ag.auth_user_id || '|' || s.person_id
  from public.assessment_sessions s join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
  join public.org_nodes n on n.id = aa.node_id and n.kind = 'CLASS' and s.class_node_id = aa.node_id
  join public.learning_assignments la on la.id = aa.learning_assignment_id and not public.release_is_professional(la.plp_release_id)
  join public.accounts am on am.person_id = s.person_id
  join public.role_assignments rg on rg.role = 'EDUCATOR' and rg.scope_node_id = aa.node_id and rg.revoked_at is null and now() >= rg.valid_from and now() < rg.valid_until
  join public.accounts ag on ag.person_id = rg.person_id
  where rg.person_id <> s.person_id order by s.id limit 1;`);
  const [sumber, aa, kelas, murid, guru, orang] = b.split("|");
  if (!orang) throw new Error("no sitting of a class assignment whose learner and teacher have accounts: the seed changed");
  const W = "a2a1c708-0000-4000-8000-000000000001", O = "a2a1c708-0000-4000-8000-000000000002";
  const salin = (id: string, tenggat: string, geser: number, dibuat: string) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'authoritative_deadline', ${tenggat},
  'created_at', ${dibuat}, 'started_at', ${dibuat}, 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'deadline_extended_count', 0, 'cohort_node_id', null, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_geser_detik', ${geser}))).*
  from public.assessment_sessions s where s.id = '${sumber}';`;
  const sebagai = (uid: string) => `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
set local session_replication_role = replica;
update public.assessment_assignments set closes_at = now() - interval '10 minutes' where id = '${aa}';
${salin(O, "now() + interval '35 minutes'", 0, "now() - interval '3 minutes'")}
${salin(W, "null", 2700, "now() - interval '2 minutes'")}
-- the learner's other sittings of this assignment go (rolled back), after the copies: the list shows W
delete from public.assessment_sessions x where x.person_id = '${orang}' and x.assessment_assignment_id = '${aa}' and x.id not in ('${W}', '${O}');
set local session_replication_role = origin;
create temp table e as select public.pengerjaan_tenggat_efektif('${W}') as w, public.pengerjaan_tenggat_efektif('${O}') as o,
  (select closes_at from public.assessment_assignments where id = '${aa}') as c;
select 'pengerjaan_tenggat_efektif|' || (e.w = e.c + interval '2700 seconds' and e.o = now() + interval '35 minutes')::text from e;
${sebagai(murid)}
-- the player's read, before anything else touches W: an own-deadline sitting shows its moved deadline; a window-timed one
-- shows none (no countdown, as before A2a), never the unshifted closing time
select 'session_state|' || ((select x.authoritative_deadline from public.session_state('${O}') x) = e.o
  and (select x.authoritative_deadline is null from public.session_state('${W}') x))::text from e;
select 'src/lib/assessment-engine/index.ts|' || ((select x.authoritative_deadline from public.session_state('${O}') x) = e.o)::text from e;
${sebagai(guru)}
create temp table d as select d.sesi_id, d.tenggat from public.daftar_pengerjaan('${kelas}', '${aa}') d where d.person_id = '${orang}';
select 'daftar_pengerjaan|' || coalesce((select (d.sesi_id = '${W}' and d.tenggat = e.w)::text from d, e), 'false');
create temp table k as select public.tambah_waktu_pengerjaan('${W}', 10, 'A2A-C708: the client formula') as j;
select 'src/components/mengajar/AturPengerjaan.tsx|' || coalesce((select ((k.j ->> 'tenggat_baru')::timestamptz = d.tenggat + interval '10 minutes')::text from k, d), 'false');
${sebagai(murid)}
select 'pengerjaan_saya|' || ((public.pengerjaan_saya('${W}') ->> 'tenggat')::timestamptz = e.w + interval '10 minutes'
  and (public.pengerjaan_saya('${O}') ->> 'tenggat')::timestamptz = e.o)::text from e;
select 'may_continue_session|' || ((select x.ok from public.may_continue_session('${W}') x) and (select x.ok from public.may_continue_session('${O}') x))::text;
select 'maintenance_draining|' || public.maintenance_draining('${orang}')::text;
select set_config('request.jwt.claims', '', true);
select 'pengerjaan_putus_tenggat|' || (public.pengerjaan_putus_tenggat('${W}', true) = 'IN_PROGRESS' and public.pengerjaan_putus_tenggat('${O}', true) = 'IN_PROGRESS')::text;
select 'pengerjaan_tutup_calon|' || (not exists (select 1 from public.pengerjaan_tutup_calon(5000) x where x in ('${W}', '${O}')))::text;
rollback;` });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const i = l.lastIndexOf("|"); if (i > 0) hasil[l.slice(0, i)] = l.slice(i + 1); }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}

a2aDaruratTests.push({
  id: "A2A-C708",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    // coverage, from A2A-T01's own tables; its plant first: a HARUS reader with no case
    c.expect(tanpaKasus({ ...PEMBACA_DB, _a2a_c708_tanam: { kelas: "HARUS", alasan: "plant" } }, PEMBACA_SRC, KASUS_GESER).includes("_a2a_c708_tanam"),
      "a planted HARUS reader with no case was not reported");
    const tanpa = tanpaKasus(PEMBACA_DB, PEMBACA_SRC, KASUS_GESER);
    c.expect(tanpa.length === 0, `HARUS or KLIEN readers of A2A-T01 with no case in D6.3's shift test: ${tanpa.join(", ")}`);
    // KONSTRUKSI, on the source
    const src = new Map<string, string>();
    for (const [fn, s] of psqlBaris(db, "select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'"))
      src.set(fn, (src.get(fn) ?? "") + "\n" + (s ?? "").replace(/--[^\n]*/g, " "));
    for (const [fn, cara] of Object.entries(KASUS_GESER)) if (cara === "KONSTRUKSI")
      c.expect(src.has(fn) && !/\bcloses_at\b/.test(src.get(fn)!), `${fn} is classed as consistent by construction, but ${src.has(fn) ? "reads closes_at" : "does not exist"}`);
    // C30-1: every HARUS reader of authoritative_deadline reads it through the effective deadline or after a touch;
    // its plant: record_answer without the helper before its read
    const harus = Object.entries(PEMBACA_DB).filter(([, k]) => k.kelas === "HARUS").map(([n]) => n);
    const sebelum = bacaSebelumSentuh(src, harus);
    c.expect(sebelum.length === 0, `HARUS readers that read authoritative_deadline before any touch and not through pengerjaan_tenggat_efektif: ${sebelum.join(", ")}`);
    const tanpaSentuh = new Map(src);
    tanpaSentuh.set("record_answer", (src.get("record_answer") ?? "").replace(/perform public\.pengerjaan_gerbang\(v_session, 'ANSWER'\);/, ""));
    c.expect(bacaSebelumSentuh(tanpaSentuh, harus).includes("record_answer"), "the plant (record_answer without the helper before its read) was not reported");
    // NILAI and KEPUTUSAN, probed
    const r = probeGeser(db);
    c.expect(!r.err, `the probes failed: ${r.err}`);
    for (const [n, cara] of Object.entries(KASUS_GESER)) if (cara !== "KONSTRUKSI")
      c.expect(r.hasil[n] === "true", `${n} (${cara}) does not agree with the effective deadline after a lift: ${r.hasil[n] ?? "(no answer)"}`);
    // the plant: the teacher's list reading closes_at raw
    const balik = gantiFungsi("public.daftar_pengerjaan(uuid,uuid)", "(select public.pengerjaan_tenggat_efektif(s.id) as tenggat)", "(select coalesce(s.authoritative_deadline, aa.closes_at) as tenggat)");
    let tanam: ReturnType<typeof probeGeser>;
    try { tanam = probeGeser(db); } finally { balik(); }
    c.expect(tanam.hasil.daftar_pengerjaan === "false", `with the plant (the list reading closes_at raw) the list still agreed: ${JSON.stringify(tanam.hasil)}`);
    const n = (k: CaraGeser) => Object.values(KASUS_GESER).filter((x) => x === k).length;
    return c.verdict(`every HARUS reader of authoritative_deadline reads it through the effective deadline or after a touch (C30-1; ${Object.keys(MESIN_TENGGAT).length} credit-machinery functions named; its plant, record_answer without the helper, reported); every HARUS and KLIEN reader of A2A-T01 has a case (${n("NILAI")} value probes, ${n("KEPUTUSAN")} decisions, ${n("KONSTRUKSI")} by construction, never reading closes_at); after a lift, for a window-timed and an own-deadline sitting, each probe agrees with the effective deadline, and AturPengerjaan's client formula equals the server's added time; plants: an uncovered reader, and the list reading closes_at raw`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C709 · one grace rule for protection and marking (C17-1)

/** Sharon's C17-1: "EXPIRED inside its grace" is one helper (pengerjaan_dalam_tenggang_pada), used by protection and
 *  both markings, on the grace readers' own basis (authoritative_deadline plus the definition's grace). A class stop;
 *  two EXPIRED sittings of a learner of the class, of a definition with a grace: A with its own deadline a minute
 *  before T_stop (inside its grace), B window-timed (no deadline of its own: no grace under A1). The marking runs;
 *  protection and marking must agree on each. Then the lift 45 minutes after T_stop and the release: A keeps its grace,
 *  moved by the stop, so the decider does not score it. Committed fixtures, removed after. */
function tenggangSatuAturan(db: string): { a: string; b: string; sesudah: string; err: string } {
  const f = fiksur(db);
  const A = "a2a1c709-0000-4000-8000-000000000001", B = "a2a1c709-0000-4000-8000-000000000002";
  const salin = (id: string, tenggat: string, tutup: string) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'EXPIRED', 'person_id', '${f.person}',
  'authoritative_deadline', ${tenggat}, 'created_at', now() - interval '40 minutes', 'started_at', now() - interval '40 minutes',
  'closure_kind', 'DEADLINE', 'closure_at', now() - interval '1 minute', 'closure_deadline', ${tutup},
  'finalized_at', null, 'submitted_at', null, 'frozen_at', null, 'unfrozen_at', null, 'termination_cause', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_geser_detik', 0))).*
  from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
 where d.late_sync_grace_seconds > 0 order by s.id limit 1;`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
${salin(A, "now() - interval '1 minute'", "now() - interval '1 minute'")}
${salin(B, "null", "now() - interval '1 minute'")}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now(), clock_timestamp(), 'A2A-C709',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
commit;`);
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(50);");
    const keadaan = (id: string) => psqlStdin(db, `select public.pengerjaan_dilindungi('${id}')::text || '|' || (darurat_sejak is not null)::text
      from public.assessment_sessions where id = '${id}';`);
    const a = keadaan(A), b = keadaan(B);
    psqlStdin(db, `begin; set local session_replication_role = replica;
update public.maintenance_windows set ended_at = t_stop + interval '45 minutes', t_lift = t_stop + interval '45 minutes' where id = '${JENDELA}';
commit;`);
    psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
    const sesudah = psqlStdin(db, `select public.pengerjaan_putus_tenggat('${A}', true)::text || '|'
      || (select count(*) from public.assessment_results r where r.session_id = '${A}');`);
    return { a, b, sesudah, err: "" };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_results where session_id in ('${A}', '${B}');
delete from public.audit_log where target_id in ('${A}', '${B}');
delete from public.assessment_sessions where id in ('${A}', '${B}');
delete from public.maintenance_windows where id = '${JENDELA}';
commit;`);
  }
}
const TENGGANG_SATU = "or public.pengerjaan_dalam_tenggang_pada(s, w.t_stop)))   -- C17-1: the one helper";
const TENGGANG_DUA = `or (s.status = 'EXPIRED' and s.closure_at <= w.t_stop and w.t_stop <= s.closure_deadline + interval '5 minutes')))`;

a2aDaruratTests.push({
  id: "A2A-C709",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = tenggangSatuAturan(db);
    c.expect(r.a === "true|true", `the own-deadline EXPIRED sitting inside its grace at T_stop: protected|marked ${r.a}, not true|true`);
    c.expect(r.b === "false|false", `the window-timed EXPIRED sitting (no grace under A1): protected|marked ${r.b}, not false|false`);
    c.expect(r.sesudah === "EXPIRED|0", `after the lift and the release the decider scored the sitting inside its moved grace: ${r.sesudah}`);
    // the plant: protection judged on closure_deadline (draft 17's basis), marking on the grace readers'
    const balik = gantiFungsi("public.pengerjaan_dilindungi(uuid)", TENGGANG_SATU, TENGGANG_DUA);
    let tanam: ReturnType<typeof tenggangSatuAturan>;
    try { tanam = tenggangSatuAturan(db); } finally { balik(); }
    c.expect(tanam.b === "true|false", `with the plant (protection on closure_deadline) the window-timed sitting was not protected-but-unmarked: ${tanam.b}`);
    return c.verdict("one grace rule (pengerjaan_dalam_tenggang_pada, the grace readers' own basis) for protection and both markings: an own-deadline EXPIRED sitting inside its grace at T_stop is protected and marked, and after the lift the decider leaves it inside its moved grace; a window-timed EXPIRED sitting (no grace under A1) is neither; with the plant (protection on closure_deadline) the window-timed one is protected but never marked");
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C710 · only an Admin PINTAR stops or lifts ((a))

/** Sharon's addendum on (a): the exclusive side's audit exception rests on no persona (never a system admin) being able
 *  to stop or lift. So: the stop and the lift both refuse a non-admin (a school admin of the class's school). Rolled
 *  back. Returns each refusal's SQLSTATE|DETAIL, and whether the window is still in force after the refused lift. */
function hanyaAdmin(db: string): { henti: string; angkat: string; masihBerlaku: string; err: string } {
  const f = fiksur(db);
  const admin = psqlStdin(db, `select a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'INSTITUTION_ADMIN' and r.institution_id = '${f.inst}' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until order by r.id limit 1;`);
  if (!admin) throw new Error("no school admin with an account for the class's school: the seed changed");
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `
begin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $f$
declare d text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics d = pg_exception_detail;
  return sqlstate || '|' || coalesce(d, '');
end $f$;
set local session_replication_role = replica;
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${JENDELA}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now(), now(), 'A2A-C710',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now();
set local session_replication_role = origin;
select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select 'HENTI|' || pg_temp.a2a_coba($q$select public.stop_pintar_now(false, array['${f.inst}'::uuid], 'Masalah keamanan', 'HENTIKAN SEKARANG', array['${f.node}'::uuid])$q$);
select 'ANGKAT|' || pg_temp.a2a_coba($q$select public.change_maintenance('${JENDELA}', 'AKHIRI', 'A2A-C710: bukan Admin PINTAR')$q$);
select 'BERLAKU|' || (ended_at is null)::text from public.maintenance_windows where id = '${JENDELA}';
rollback;` });
  const ambil = (k: string) => (r.stdout ?? "").split("\n").find((l) => l.startsWith(k + "|"))?.slice(k.length + 1) ?? "";
  return { henti: ambil("HENTI"), angkat: ambil("ANGKAT"), masihBerlaku: ambil("BERLAKU"), err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n")[0] ?? "" };
}

a2aDaruratTests.push({
  id: "A2A-C710",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const r = hanyaAdmin(db);
    c.expect(!r.err, `the run failed: ${r.err}`);
    c.expect(r.henti !== "OK" && r.henti !== "", `a school admin's stop was not refused: ${r.henti}`);
    c.expect(r.angkat !== "OK" && r.angkat !== "" && r.masihBerlaku === "true", `a school admin's lift was not refused, or the stop ended: ${r.angkat}, still in force ${r.masihBerlaku}`);
    const persona = psqlStdin(db, "select count(*) from pg_constraint where conname = 'evaluation_personas_never_system_admin' and contype = 'c';");
    c.expect(persona === "1", "evaluation_personas_never_system_admin is gone: a persona could be a system admin");
    return c.verdict(`only an Admin PINTAR stops or lifts: a school admin's stop is refused (${r.henti}) and their lift is refused (${r.angkat}) with the stop still in force; no evaluation persona can be a system admin (evaluation_personas_never_system_admin)`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C711 · an unmarked sitting is credited once (C18-1)

/** Sharon's ruling on C18-1 (A2A-C-C18-1-AND-23-28.md): the lift does not mark; a lifted stop gives an unmarked sitting
 *  its time once. Each case on its own committed fixture, removed after: a learner of a class with an open sitting
 *  created an hour ago (own deadline 30 minutes on), and lifted class stops inserted as they stand after their lift. No
 *  marking batch ever runs. Returns the deadline's move in seconds after each step. */
async function kreditSekali(db: string, kasus: "SENTUH" | "BERSAMAAN" | "TUMPANG" | "BATCH" | "TANDAI"):
  Promise<{ baca: number; sekali: number; dua: number; tumpang: number; bacaHarus: number }> {
  const { psqlLain } = await import("./balapan");
  const f = fiksur(db);
  const S = "a2a1c711-0000-4000-8000-000000000001";
  const W1 = "a2a1c711-0000-4000-8000-0000000000a1", W2 = "a2a1c711-0000-4000-8000-0000000000a2";
  // S2 (C30-2's sweep): a sitting of the same learner the release batch selects but has nothing to give (EXPIRED long
  // before the stops, outside its grace), first in id order; the batch, one row a page, must walk past it
  const S0 = "a2a1c711-0000-4000-8000-000000000000";
  // one stop 50 to 5 minutes ago (45 min); for TUMPANG a second, 40 to 0 minutes ago, overlapping it (union 50 min)
  const jendela = (id: string, mulai: number, akhir: number) => `
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, ended_at, t_lift, reason, created_by_person_id, activation_recorded_at)
select '${id}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now() - interval '${mulai} minutes', now() - interval '${mulai} minutes',
       now() - interval '${akhir} minutes', now() - interval '${akhir} minutes', 'A2A-C711',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '${mulai} minutes';`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
-- the learner placed in the class since well before the stops (the seed's rows begin when it was loaded)
create table if not exists public._a2a_c711_asal as select '${f.mem}'::uuid as mem, m.valid_from as m_dari, '${f.enr}'::uuid as enr, e.valid_from as e_dari
  from public.memberships m, public.enrollments e where m.id = '${f.mem}' and e.id = '${f.enr}';
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${f.mem}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${f.enr}';
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${S}', 'status', 'IN_PROGRESS', 'person_id', '${f.person}',
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '60 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
${kasus === "TANDAI" ? jendela(W1, 50, 40) : jendela(W1, 50, 5)}
${kasus === "TUMPANG" ? jendela(W2, 40, 0) : ""}
${kasus === "TANDAI" ? jendela(W2, 30, 0).replace(/now\(\) - interval '0 minutes', now\(\) - interval '0 minutes'/, "null, null") : ""}
${kasus === "BATCH" ? `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${S0}', 'status', 'EXPIRED', 'person_id', '${f.person}',
  'authoritative_deadline', now() - interval '170 minutes', 'created_at', now() - interval '180 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', 'DEADLINE', 'closure_at', now() - interval '170 minutes', 'closure_deadline', now() - interval '170 minutes',
  'frozen_at', null, 'unfrozen_at', null, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;` : ""}
create table if not exists public._a2a_c711_awal (d timestamptz);
delete from public._a2a_c711_awal;
insert into public._a2a_c711_awal select authoritative_deadline from public.assessment_sessions where id = '${S}';
commit;`);
    const gerak = () => Number(psqlStdin(db, `select extract(epoch from (s.authoritative_deadline - a.d))::int from public.assessment_sessions s, public._a2a_c711_awal a where s.id = '${S}';`));
    // a READ before any touch shows the shifted deadline (D1)
    const baca = Number(psqlStdin(db, `select extract(epoch from (public.pengerjaan_tenggat_efektif('${S}') - a.d))::int from public._a2a_c711_awal a;`));
    let sekali = -1, dua = -1;
    if (kasus === "TANDAI") {
      // S1: an earlier stop (W1, 10 minutes) lifted and not yet given; W2 in force since 30 minutes ago; the marking
      // batch marks the sitting, W2 is lifted now, the release: both stops, once
      psqlStdin(db, "call public.pengerjaan_tandai_darurat(50);");
      psqlStdin(db, `begin; set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now(), t_lift = now() where id = '${W2}';
commit;`);
      psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
      sekali = gerak();
      psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
      dua = gerak();
    } else if (kasus === "BATCH") {
      psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(1);");
      sekali = gerak();
      psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(1);");
      dua = gerak();
    } else if (kasus === "BERSAMAAN") {
      const satu = `begin; select public.pengerjaan_kredit_darurat('${S}'); select pg_sleep(0.5); commit;`;
      await Promise.all([psqlLain(satu), psqlLain(satu)]);
      sekali = gerak(); dua = sekali;
    } else {
      // the first touch: the decider, through pengerjaan_pagar
      psqlStdin(db, `select public.pengerjaan_putus_tenggat('${S}', false);`);
      sekali = gerak();
      psqlStdin(db, `select public.pengerjaan_putus_tenggat('${S}', false);`);
      dua = gerak();
    }
    const tumpang = kasus === "TUMPANG" ? 50 * 60 : kasus === "TANDAI" ? 40 * 60 : 45 * 60;
    return { baca, sekali, dua, tumpang, bacaHarus: kasus === "TANDAI" ? 10 * 60 : tumpang };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_sessions where id in ('${S}', '${S0}');
delete from public.maintenance_windows where id in ('${W1}', '${W2}');
drop table if exists public._a2a_c711_awal;
update public.memberships m set valid_from = a.m_dari from public._a2a_c711_asal a where m.id = a.mem;
update public.enrollments e set valid_from = a.e_dari from public._a2a_c711_asal a where e.id = a.enr;
drop table if exists public._a2a_c711_asal;
commit;`);
  }
}
const KREDIT_TANDA = "darurat_dikredit_sampai = k.sampai\n     where id = s.id;";

a2aDaruratTests.push({
  id: "A2A-C711",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    for (const kasus of ["SENTUH", "BERSAMAAN", "TUMPANG", "BATCH", "TANDAI"] as const) {
      const r = await kreditSekali(db, kasus);
      c.expect(r.baca === r.bacaHarus, `${kasus}: a read before any touch showed the deadline moved by ${r.baca} s, not ${r.bacaHarus} (D1)`);
      c.expect(r.sekali === r.tumpang, `${kasus}: the first credit moved the deadline by ${r.sekali} s, not exactly ${r.tumpang}`);
      c.expect(r.dua === r.tumpang, `${kasus}: a second touch moved it to ${r.dua} s: credited more than once`);
    }
    // the plant: the credit does not write its watermark (own-deadline branch), so a second touch credits again
    const balik = gantiFungsi("public.pengerjaan_kredit_darurat(uuid)", KREDIT_TANDA, "darurat_dikredit_sampai = s.darurat_dikredit_sampai\n     where id = s.id;");
    let tanam: Awaited<ReturnType<typeof kreditSekali>>;
    try { tanam = await kreditSekali(db, "SENTUH"); } finally { balik(); }
    c.expect(tanam.dua > tanam.sekali, `with the plant (no watermark) a second touch did not credit again: ${JSON.stringify(tanam)}`);
    // S1's plant: a marked sitting's pending credit nothing (as before C30-2's sweep): the earlier stop is lost
    const balik1 = gantiFungsi("public.penghentian_kredit(assessment_sessions)", "       and (s.darurat_sejak is null or x.t_stop < s.darurat_sejak)\n", "       and s.darurat_sejak is null\n");
    let tanam1: Awaited<ReturnType<typeof kreditSekali>>;
    try { tanam1 = await kreditSekali(db, "TANDAI"); } finally { balik1(); }
    c.expect(tanam1.sekali < tanam1.tumpang, `with S1's plant (no credit before a mark) the earlier stop was still given: ${JSON.stringify(tanam1)}`);
    // S2's plant: the credit pass ends at a page with nothing to give
    const balik2 = gantiFungsi("public.pengerjaan_lepas_darurat_semua(integer)", "      perform public.pengerjaan_kredit_darurat(r.id);\n      n := n + 1; v_dari := r.id;", "      perform public.pengerjaan_kredit_darurat(r.id);\n      v_dari := r.id;");
    let tanam2: Awaited<ReturnType<typeof kreditSekali>>;
    try { tanam2 = await kreditSekali(db, "BATCH"); } finally { balik2(); }
    c.expect(tanam2.sekali === 0, `with S2's plant (the pass ends at a page with nothing to give) the sitting after it was still credited: ${JSON.stringify(tanam2)}`);
    return c.verdict(`with no marking batch (but in S1's case): a read before any touch shows the moved deadline (D1); the first touch (the decider) credits exactly T_lift − T_stop and a second touch nothing; two concurrent credits give it once; two overlapping stops are credited as their union (50 min) once; the release batch alone, one row a page, walks past a sitting with nothing to give and credits once (S2); a stop lifted before a later stop marks the sitting is given with that stop's release, once (S1: 40 min); plants: no watermark, a second touch credited again (${tanam.dua} s after ${tanam.sekali}); no credit before a mark (${tanam1.sekali} s); the pass ending at a page with nothing to give (${tanam2.sekali} s)`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C712 · an answer after a lift is judged on the credited deadline (C30-1)

/** The fixtures of C712 and C713: the C701 learner, their class's teacher, accounts for both, and a source sitting (its
 *  definition with a late-sync grace of at least two minutes, a single-choice item presented). */
type FiksurJawab = Fiksur & { murid: string; guru: string; sumber: string };
function fiksurJawab(db: string): FiksurJawab {
  // a live learner with an account, in a class whose teacher has one (searched whole: the manifest moves the seed's
  // first learner before these tests run)
  const g = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.id || '|' || m.node_id || '|' || e.institution_id || '|' || e.status
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  where e.status = 'ACTIVE' and e.valid_to is null
    and exists (select 1 from public.accounts a where a.person_id = e.person_id)
    and not exists (select 1 from public.person_suspensions ps where ps.person_id = e.person_id and ps.ended_at is null)
    and exists (select 1 from public.role_assignments rg join public.accounts ag on ag.person_id = rg.person_id
                 where rg.role = 'EDUCATOR' and rg.scope_node_id = m.node_id and rg.revoked_at is null and now() >= rg.valid_from
                   and now() < rg.valid_until and rg.person_id <> e.person_id)
  order by e.id limit 1;`);
  const [enr, person, mem, node, inst, st] = g.split("|");
  if (!st) throw new Error("no live learner with an account in a class whose teacher has one: the seed changed");
  const f: Fiksur = { enr, person, mem, node, inst, lain: "", st, er: "" };
  const b = psqlStdin(db, `select (select a.auth_user_id from public.accounts a where a.person_id = '${f.person}' order by a.auth_user_id limit 1)
  || '|' || (select ag.auth_user_id from public.role_assignments rg join public.accounts ag on ag.person_id = rg.person_id
              where rg.role = 'EDUCATOR' and rg.scope_node_id = '${f.node}' and rg.revoked_at is null and now() >= rg.valid_from
                and now() < rg.valid_until and rg.person_id <> '${f.person}' order by rg.id limit 1)
  || '|' || (select s.id from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
              where s.status = 'FINALIZED' and d.late_sync_grace_seconds >= 120
                and exists (select 1 from public.presented_items p join public.items i on i.id = p.item_id
                             where p.session_id = s.id and i.item_type = 'MCQ_SINGLE' and p.position = 1)
              order by s.id limit 1);`);
  const [murid, guru, sumber] = b.split("|");
  if (!sumber) throw new Error("no learner and teacher with accounts, or no sitting with a grace and a single-choice item: the seed changed");
  return { ...f, murid, guru, sumber };
}
/** The sitting S of the C701 learner in their class (copied from the source), created an hour ago; the learner placed
 *  there since a day before (the seed's rows begin when it was loaded). Inside one transaction, rolled back. */
function sesiSalinan(f: FiksurJawab, S: string, tenggat: string): string {
  return `set local session_replication_role = replica;
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${f.mem}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${f.enr}';
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${S}', 'status', 'IN_PROGRESS', 'person_id', '${f.person}',
  'enrollment_id', '${f.enr}', 'class_node_id', '${f.node}', 'cohort_node_id', null,
  'authoritative_deadline', ${tenggat}, 'created_at', now() - interval '60 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null))).*
  from public.assessment_sessions s where s.id = '${f.sumber}';`;
}
const jendelaKelas = (f: Fiksur, id: string, mulai: string, akhir: string | null) => `
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, ended_at, t_lift, reason, created_by_person_id, activation_recorded_at)
select '${id}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], ${mulai}, ${mulai}, ${akhir ?? "null"}, ${akhir ?? "null"}, 'A2A-C712/C713',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), ${mulai};`;
const sebagaiOrang = (uid: string) => `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);`;
function barisKunci(db: string, sql: string): { hasil: Record<string, string>; err: string } {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const i = l.indexOf("|"); if (i > 0) hasil[l.slice(0, i)] = l.slice(i + 1); }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n").filter((x) => /ERROR|DETAIL/.test(x)).join(" ") };
}

/** Sharon's C30-1: after a 45-minute stop lifted 5 minutes ago, with no batch and no other touch, the learner answers.
 *  DALAM: the deadline was 2 minutes ago, credited 43 minutes on: the answer is in time (LIVE). TENGGANG: the deadline was
 *  46 minutes ago, credited a minute ago, inside the definition's grace: LATE_SYNC, scored. Rolled back. */
function jawabSesudahAngkat(db: string, f: FiksurJawab, kasus: "DALAM" | "TENGGANG") {
  const S = "a2a1c712-0000-4000-8000-000000000001", P = "a2a1c712-0000-4000-8000-0000000000c1", W = "a2a1c712-0000-4000-8000-0000000000a1";
  return barisKunci(db, `begin;
${sesiSalinan(f, S, kasus === "DALAM" ? "now() - interval '2 minutes'" : "now() - interval '46 minutes'")}
insert into public.presented_items (id, session_id, item_id, institution_id, position, presented_at)
select '${P}', '${S}', p.item_id, p.institution_id, p.position, now() - interval '59 minutes'
  from public.presented_items p where p.session_id = '${f.sumber}' and p.position = 1;
${jendelaKelas(f, W, "now() - interval '50 minutes'", "now() - interval '5 minutes'")}
set local session_replication_role = origin;
${sebagaiOrang(f.murid)}
select 'hasil|' || r.outcome from public.record_answer('${P}', 1, '{"posisi": 1}'::jsonb) r;
select set_config('request.jwt.claims', '', true);
select 'mode|' || r.receipt_mode from public.responses r where r.session_id = '${S}';
rollback;`);
}
const JAWAB_SENTUH = "  perform public.pengerjaan_gerbang(v_session, 'ANSWER');   -- A1\n";

a2aDaruratTests.push({
  id: "A2A-C712",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const f = fiksurJawab(db);
    const dalam = jawabSesudahAngkat(db, f, "DALAM"), tenggang = jawabSesudahAngkat(db, f, "TENGGANG");
    c.expect(!dalam.err && !tenggang.err, `the answers failed: ${dalam.err} ${tenggang.err}`);
    c.expect(dalam.hasil.mode === "LIVE" && dalam.hasil.hasil === "RECORDED", `an answer inside the credited time: ${JSON.stringify(dalam.hasil)}, not LIVE and RECORDED`);
    c.expect(tenggang.hasil.mode === "LATE_SYNC" && tenggang.hasil.hasil === "RECORDED", `an answer inside the credited grace: ${JSON.stringify(tenggang.hasil)}, not LATE_SYNC and scored`);
    // the plant: record_answer without the helper (the credit then comes in the response's trigger, after the decision)
    const balik = gantiFungsi("public.record_answer(uuid,integer,jsonb,timestamp with time zone,receipt_mode)", JAWAB_SENTUH, "");
    let t1: ReturnType<typeof jawabSesudahAngkat>, t2: ReturnType<typeof jawabSesudahAngkat>;
    try { t1 = jawabSesudahAngkat(db, f, "DALAM"); t2 = jawabSesudahAngkat(db, f, "TENGGANG"); } finally { balik(); }
    c.expect(t1.hasil.mode !== "LIVE" && t2.hasil.hasil !== "RECORDED", `with the plant the answers were still judged on the credited deadline: ${JSON.stringify(t1.hasil)} ${JSON.stringify(t2.hasil)}`);
    return c.verdict(`after a 45-minute stop lifted with no batch and no touch: an answer inside the credited time is LIVE, one inside the credited grace LATE_SYNC and scored (record_answer reaches pengerjaan_pagar, through pengerjaan_gerbang, before it reads the deadline); with the plant (no helper before the read) they were ${t1.hasil.mode} and ${t2.hasil.hasil}`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C713 · A1's hold meets a stop: time runs only while neither (C30-2)

type UrutanTahan = "HENTI_TAHAN" | "HENTI_TANDAI_TAHAN" | "TAHAN_HENTI" | "BEKU_SENTUH";
/** Sharon's C30-2, each case in one transaction, rolled back. S has its own deadline 30 minutes on, created an hour ago.
 *  HENTI_TAHAN (scenario 6): a class stop from 20 minutes ago; a suspension now holds S; the stop is lifted a minute ago,
 *    the suspension ended; the teacher resumes S; then a touch. Time left at T_stop: 50 minutes, after the resume and
 *    after the touch. HENTI_TANDAI_TAHAN: the same with S marked at T_stop before the hold.
 *  TAHAN_HENTI: the suspension holds S (30 minutes left) and its hold is dated 50 minutes ago; a stop from 40 to 5
 *    minutes ago, inside the hold; the suspension ends; the resume; a touch. Time left: 30 minutes, both times.
 *  BEKU_SENTUH: as TAHAN_HENTI, but S is still held when touched (the decider) after the lift: the act succeeds and
 *    nothing is credited (the deadline and the watermark unchanged). */
function tahanBertemuHenti(db: string, f: FiksurJawab, urutan: UrutanTahan) {
  const S = "a2a1c713-0000-4000-8000-000000000001", W = "a2a1c713-0000-4000-8000-0000000000a1", T = "a2a1c713-0000-4000-8000-0000000000b1";
  const hentiDulu = urutan === "HENTI_TAHAN" || urutan === "HENTI_TANDAI_TAHAN";
  const sisa = `extract(epoch from (authoritative_deadline - now()))::int`;
  return barisKunci(db, `begin;
${sesiSalinan(f, S, "now() + interval '30 minutes'")}
${hentiDulu ? jendelaKelas(f, W, "now() - interval '20 minutes'", null) : ""}
${urutan === "HENTI_TANDAI_TAHAN" ? `update public.assessment_sessions set darurat_sejak = now() - interval '20 minutes', darurat_jendela_id = '${W}' where id = '${S}';` : ""}
insert into public.person_suspensions (id, person_id, category, started_by, started_at)
select '${T}', '${f.person}', 'OTHER', (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1),
       now() - interval '${hentiDulu ? 10 : 50} minutes';
set local session_replication_role = origin;
select 'ditahan|' || public.pengerjaan_tahan_orang('${f.person}', '${T}');
select 'sisa_ditahan|' || frozen_remaining_seconds from public.assessment_sessions where id = '${S}';
set local session_replication_role = replica;
${hentiDulu
    ? `update public.maintenance_windows set ended_at = now() - interval '1 minute', t_lift = now() - interval '1 minute' where id = '${W}';`
    : `update public.assessment_sessions set frozen_at = now() - interval '50 minutes' where id = '${S}';
${jendelaKelas(f, W, "now() - interval '40 minutes'", "now() - interval '5 minutes'")}`}
${urutan === "BEKU_SENTUH" ? "" : `update public.person_suspensions set ended_at = now(), ended_by = started_by, end_reason = 'A2A-C713: reinstated' where id = '${T}';`}
set local session_replication_role = origin;
${urutan === "BEKU_SENTUH"
    ? `select 'efektif|' || extract(epoch from (public.pengerjaan_tenggat_efektif('${S}') - now()))::int;
select 'sentuh|' || public.pengerjaan_putus_tenggat('${S}', false);
select 'sesudah|' || ${sisa} || '|' || (darurat_dikredit_sampai is null)::text from public.assessment_sessions where id = '${S}';`
    : `${sebagaiOrang(f.guru)}
select 'lanjut|' || (public.lanjutkan_pengerjaan('${S}', 'A2A-C713') ->> 'ok');
select set_config('request.jwt.claims', '', true);
select 'sisa_lanjut|' || ${sisa} from public.assessment_sessions where id = '${S}';
select 'sentuh|' || public.pengerjaan_putus_tenggat('${S}', false);
select 'sisa_sentuh|' || ${sisa} from public.assessment_sessions where id = '${S}';`}
rollback;`);
}
const TAHAN_DI_TSTOP = "(select w.t_stop from public.maintenance_windows w where w.id = public.penghentian_berlaku(v)), now()";
const LANJUT_TANDA = "   where a.id = p_session and k.sampai is not null\n";
const KREDIT_BEKU = "     or (s.frozen_at is not null and s.unfrozen_at is null) then return; end if;";

a2aDaruratTests.push({
  id: "A2A-C713",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const f = fiksurJawab(db);
    const dekat = (x: string | undefined, n: number) => x !== undefined && Math.abs(Number(x) - n) <= 2;
    for (const u of ["HENTI_TAHAN", "HENTI_TANDAI_TAHAN", "TAHAN_HENTI"] as const) {
      const r = tahanBertemuHenti(db, f, u), n = u === "TAHAN_HENTI" ? 1800 : 3000;
      c.expect(!r.err, `${u}: failed: ${r.err}`);
      c.expect(dekat(r.hasil.sisa_ditahan, n), `${u}: the hold recorded ${r.hasil.sisa_ditahan} s left, not ${n}`);
      c.expect(r.hasil.lanjut === "true" && dekat(r.hasil.sisa_lanjut, n), `${u}: after the resume ${r.hasil.sisa_lanjut} s left, not ${n}`);
      c.expect(dekat(r.hasil.sisa_sentuh, n), `${u}: after a touch ${r.hasil.sisa_sentuh} s left, not ${n} (credited for time under the hold)`);
    }
    const b = tahanBertemuHenti(db, f, "BEKU_SENTUH");
    c.expect(!b.err && b.hasil.sentuh === "IN_PROGRESS", `a held sitting touched after a lift: ${b.err || b.hasil.sentuh}, not a successful act`);
    c.expect(dekat(b.hasil.efektif, 1800) && /^(179[89]|180[012])\|true$/.test(b.hasil.sesudah ?? ""),
      `a held sitting touched after a lift was credited: effective ${b.hasil.efektif} s, after ${b.hasil.sesudah}`);
    // the plants, one per case
    let p1: ReturnType<typeof tahanBertemuHenti>, p2: ReturnType<typeof tahanBertemuHenti>, p3: ReturnType<typeof tahanBertemuHenti>;
    let balik = gantiFungsi("public.pengerjaan_tahan_orang(uuid,uuid)", TAHAN_DI_TSTOP, "null::timestamptz, now()");
    try { p1 = tahanBertemuHenti(db, f, "HENTI_TAHAN"); } finally { balik(); }
    c.expect(!dekat(p1.hasil.sisa_lanjut, 3000), `with the plant (the hold measured at the hold) the resume still gave ${p1.hasil.sisa_lanjut} s`);
    balik = gantiFungsi("public.lanjutkan_pengerjaan(uuid,text)", LANJUT_TANDA, "   where a.id = p_session and false\n");
    try { p2 = tahanBertemuHenti(db, f, "TAHAN_HENTI"); } finally { balik(); }
    c.expect(!dekat(p2.hasil.sisa_sentuh, 1800), `with the plant (no watermark at the resume) a touch after it still left ${p2.hasil.sisa_sentuh} s`);
    balik = gantiFungsi("public.penghentian_kredit(assessment_sessions)", KREDIT_BEKU, "     then return; end if;");
    try { p3 = tahanBertemuHenti(db, f, "BEKU_SENTUH"); } finally { balik(); }
    c.expect(p3.err !== "" || p3.hasil.sentuh !== "IN_PROGRESS", `with the plant (the credit not skipped while held) the touch still succeeded uncredited: ${JSON.stringify(p3.hasil)}`);
    return c.verdict(`time runs only while a sitting is neither stopped nor held: stop → suspension → lift → resume leaves the 50 minutes left at T_stop (unmarked and marked), and a touch after adds nothing; suspension → stop inside the hold → lift → resume leaves the 30 minutes left at the hold, and a touch after adds nothing; a held sitting touched after a lift: the act succeeds, nothing credited; plants: the hold measured at the hold (${p1.hasil.sisa_lanjut} s), no watermark at the resume (${p2.hasil.sisa_sentuh} s), the credit not skipped while held (${p3.err ? "refused" : p3.hasil.sentuh})`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C714 · the three committing procedures, an enforced exception

/** Bob's ruling (option 1) with Sharon's yes and her additions (a) and (b): the platform lint counts every unpinned public
 *  function and procedure through jalur_tanpa_pin(); exactly three procedures are excused, and each only while all
 *  conditions hold. Each plant runs in its own transaction, rolled back, and must make the count 1 and name its cause. */
const LEPAS_SEMUA = "public.pengerjaan_lepas_darurat_semua(integer)";
const JALUR_PERTAMA = "  perform set_config('search_path', 'public, pg_temp', false);   -- the first act (pinned by hand: it commits)\n";
function tanamJalur(db: string, tanam: string): string {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: `begin;
${tanam}
select public.jalur_tanpa_pin() || '|' || coalesce(public.jalur_pengecualian_cacat(to_regprocedure('${LEPAS_SEMUA}')), 'ok');
rollback;` });
  return r.status === 0 ? r.stdout.trim().split("\n").pop() ?? "" : `ERR ${(r.stderr ?? "").trim().split("\n")[0]}`;
}
const ganti = (dari: string, ke: string) => `do $$ declare v text := pg_get_functiondef('${LEPAS_SEMUA}'::regprocedure);
begin
  if position(${"$q$"}${dari}${"$q$"} in v) = 0 then raise exception 'plant anchor missing'; end if;
  execute replace(v, ${"$q$"}${dari}${"$q$"}, ${ke ? "$q$" + ke + "$q$" : "''"});
end $$;`;

a2aDaruratTests.push({
  id: "A2A-C714",
  requires: ["db"],
  run: async ({ repoRoot }) => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const bersih = tanamJalur(db, "");
    c.expect(bersih === "0|ok", `unplanted, the lint's count and the release batch's standing: ${bersih}, not 0|ok`);
    const sumber = psqlStdin(db, "select prosrc from pg_proc where proname = 'platform_schema_lint';");
    c.expect(sumber.includes("public.jalur_pengecualian_cacat(p.oid) is not null"), "platform_schema_lint does not count through the one rule");
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    c.expect(readFileSync(join(repoRoot, "docs", "audit", "launch-readiness.sql"), "utf8").includes("public.jalur_tanpa_pin()"),
      "the launch readiness row does not count through the one rule");
    const plants: Array<[string, string, RegExp]> = [
      ["another unpinned procedure", "create procedure public.a2a_c714_tanam() language plpgsql as $p$ begin null; end $p$;", /^1\|ok$/],
      ["not a procedure (prokind)", `drop procedure ${LEPAS_SEMUA}; create function public.pengerjaan_lepas_darurat_semua(p_batas integer) returns void language plpgsql as $p$ begin perform set_config('search_path', 'public, pg_temp', false); end $p$;`, /^1\|not a procedure$/],
      ["SECURITY DEFINER", `alter procedure ${LEPAS_SEMUA} security definer;`, /^1\|SECURITY DEFINER$/],
      ["EXECUTE for authenticated", `grant execute on procedure ${LEPAS_SEMUA} to authenticated;`, /^1\|EXECUTE for authenticated$/],
      ["EXECUTE for PUBLIC", `grant execute on procedure ${LEPAS_SEMUA} to public;`, /^1\|EXECUTE for PUBLIC$/],
      ["no first act", ganti(JALUR_PERTAMA, ""), /^1\|its first act is not/],
      ["the first act after the first commit (Sharon's (b))", ganti(JALUR_PERTAMA, "").replace("end $$;", "") +
        `  v := pg_get_functiondef('${LEPAS_SEMUA}'::regprocedure);\n  execute regexp_replace(v, '    commit;', '    commit;\n' || ${"$q$"}${JALUR_PERTAMA}${"$q$"});\nend $$;`, /^1\|its first act is not/],
      ["a bare name", ganti("public.pengerjaan_kredit_darurat(r.id)", "pengerjaan_kredit_darurat(r.id)"), /^1\|a bare name: pengerjaan_kredit_darurat$/],
      ["owned by another role (Sharon's (a))", `create role a2a_c714_lain nologin; grant a2a_c714_lain to current_user; grant create on schema public to a2a_c714_lain; alter procedure ${LEPAS_SEMUA} owner to a2a_c714_lain;`, /^1\|owned by a2a_c714_lain/],
    ];
    for (const [nama, tanam, harus] of plants) {
      const r = tanamJalur(db, tanam);
      c.expect(harus.test(r), `with the plant "${nama}" the lint read ${r}`);
    }
    return c.verdict(`the platform lint and the launch readiness row count every unpinned public function and procedure through jalur_tanpa_pin(): 0 unplanted, the three committing procedures excused while each condition holds (a procedure, not SECURITY DEFINER, no EXECUTE beyond its owner, set_config('search_path', ...) its first statement before any commit, every public name schema-qualified, owned by the cron job's user); ${plants.length} plants on the release batch's procedure, each counted again with its cause: ${plants.map((p) => p[0]).join("; ")}`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C715 · O1 after the lift: the departure's rule

/** THE PLAN §5.3 D6.2 (O1): during a class stop the school's admin ends a learner's enrolment; the learner's two
 *  protected sittings are preserved, unscored. A: its own deadline 30 minutes on. B: its own deadline 50 minutes ago
 *  (already overdue at T_stop, never closed). The stop (T_stop 40 minutes ago) is lifted 5 minutes ago, 35 minutes
 *  long, and the release batch runs. A, inside its shifted deadline, is terminated unscored by the departure's actor
 *  with its reason, answers kept; B, past its shifted deadline (15 minutes ago) and its grace, is scored by the ordinary
 *  rule, never terminated. Each is audited, naming the stop. Committed fixtures (the batch commits), put back after. */
function keluarSesudahHenti(db: string) {
  const b = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.id || '|' || m.node_id || '|' || e.institution_id || '|' || a.auth_user_id
     || '|' || r.person_id || '|' || e.status || '|' || coalesce(e.end_reason::text, '')
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = e.institution_id
   and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until and r.person_id <> e.person_id
  join public.accounts a on a.person_id = r.person_id
  where e.status = 'ACTIVE' and e.valid_to is null
    and not exists (select 1 from public.assessment_sessions x where x.enrollment_id = e.id and x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED'))
  order by e.id limit 1;`);
  const [enr, person, mem, node, inst, admin, adminPerson, st, er] = b.split("|");
  if (!st) throw new Error("no live learner with no open sitting, in a class with a school admin: the seed changed");
  const A = "a2a1c715-0000-4000-8000-000000000001", B = "a2a1c715-0000-4000-8000-000000000002", W = "a2a1c715-0000-4000-8000-0000000000a1";
  const salin = (id: string, tenggat: string, dibuat: string) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'person_id', '${person}',
  'enrollment_id', '${enr}', 'institution_id', '${inst}', 'class_node_id', '${node}', 'cohort_node_id', null,
  'authoritative_deadline', ${tenggat}, 'created_at', ${dibuat}, 'started_at', ${dibuat}, 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null, 'darurat_keluar', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by (s.institution_id = '${inst}') desc, s.id limit 1;`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
-- every membership the enrolment has open (its Kelas and its Tingkat): the departure closes them all, so all are put
-- back (ADM09-S01's cause: only the Kelas was, and a learner left without their Tingkat failed it in a later run)
create table if not exists public._a2a_c715_asal as select m.id as mem, m.valid_from as m_dari from public.memberships m
 where m.enrollment_id = '${enr}' and m.valid_to is null;
create table if not exists public._a2a_c715_asal_e as select '${enr}'::uuid as enr, e.valid_from as e_dari,
  (select count(*) from public.memberships m where m.enrollment_id = e.id and m.valid_to is null) as buka from public.enrollments e where e.id = '${enr}';
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${mem}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${enr}';
${salin(A, "now() + interval '30 minutes'", "now() - interval '60 minutes'")}
${salin(B, "now() - interval '50 minutes'", "now() - interval '70 minutes'")}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${W}', 'EMERGENCY', false, array['${inst}'::uuid], array['${node}'::uuid], now() - interval '40 minutes', now() - interval '40 minutes', 'A2A-C715',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '40 minutes';
commit;`);
    // the departure, during the stop, by the school's admin
    psqlStdin(db, `begin; select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
select public.akhiri_pendaftaran('${enr}', 'WITHDRAWN', null, null) is not null; commit;`);
    const saat = psqlStdin(db, `select string_agg(status || ':' || (darurat_keluar is not null)::text, ',' order by id) from public.assessment_sessions where id in ('${A}', '${B}');`);
    // the lift, then the release batch
    psqlStdin(db, `begin; set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now() - interval '5 minutes', t_lift = now() - interval '5 minutes' where id = '${W}';
commit;`);
    psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
    const nilai = (id: string) => psqlStdin(db, `select s.status || '|' || coalesce(s.termination_cause::text, '') || '|' || coalesce(s.terminated_by_person_id::text, '')
      || '|' || coalesce(s.termination_reason, '') || '|' || (select count(*) from public.assessment_results x where x.session_id = s.id)
      || '|' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.departure_applied' and l.summary ->> 'stop' = '${W}')
      || '|' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.departure_preserved')
      from public.assessment_sessions s where s.id = '${id}';`).split("|");
    return { saat, a: nilai(A), b: nilai(B), adminPerson };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.assessment_results where session_id in ('${A}', '${B}');
delete from public.audit_log where target_id in ('${A}', '${B}', '${W}');
delete from public.assessment_sessions where id in ('${A}', '${B}');
delete from public.maintenance_windows where id = '${W}';
update public.memberships m set valid_from = a.m_dari, valid_to = null, close_reason = null from public._a2a_c715_asal a where m.id = a.mem;
update public.enrollments e set valid_from = a.e_dari, valid_to = null, status = '${st}', end_reason = ${er ? `'${er}'` : "null"} from public._a2a_c715_asal_e a where e.id = a.enr;
commit;`);
    // the learner as they were: exactly the memberships open before, open again (a committed fixture leaves nothing)
    c715Pulih = psqlStdin(db, `select (select buka from public._a2a_c715_asal_e) || '|' || (select count(*) from public.memberships m
      where m.enrollment_id = '${enr}' and m.valid_to is null) || '|' || (select count(*) from public._a2a_c715_asal a
      join public.memberships m on m.id = a.mem and m.valid_to is null);`);
    psqlStdin(db, `drop table if exists public._a2a_c715_asal; drop table if exists public._a2a_c715_asal_e;`);
  }
}
let c715Pulih = "";
const KELUAR_BATCH = "      perform public.pengerjaan_keluar_sesudah_henti(r.id);\n";

a2aDaruratTests.push({
  id: "A2A-C715",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = keluarSesudahHenti(db);
    const [sebelum, terbuka, kembali] = c715Pulih.split("|");
    c.expect(Number(sebelum) >= 1 && sebelum === terbuka && sebelum === kembali,
      `the learner was not put back as they were: ${sebelum} membership(s) open before, ${terbuka} open after, ${kembali} of them the same (ADM09-S01's cause)`);
    c.expect(r.saat === "IN_PROGRESS:true,IN_PROGRESS:true", `during the stop the departure did not preserve both sittings with who and why: ${r.saat}`);
    const [aSt, aSebab, aOleh, aAlasan, aHasil, aAudit, aSimpan] = r.a;
    c.expect(aSt === "TERMINATED" && aSebab === "INSTITUTIONAL_REVOCATION" && aOleh === r.adminPerson && aAlasan.startsWith("Pendaftaran diakhiri") && aHasil === "0",
      `the sitting inside its shifted deadline: ${r.a.join("|")}, not terminated unscored by the departure's actor with its reason`);
    c.expect(aAudit === "1" && aSimpan === "1", `the sitting inside its shifted deadline was not audited at the departure and after the lift naming the stop: ${aSimpan}, ${aAudit}`);
    const [bSt, bSebab, , , , bAudit] = r.b;
    c.expect((bSt === "FINALIZED" || bSt === "EXPIRED") && bSebab === "" && bAudit === "1",
      `the sitting past its shifted deadline: ${r.b.join("|")}, not judged by the ordinary rule (scored, never terminated) and audited naming the stop`);
    // the plant: the release batch without the departure's pass
    const balik = gantiFungsi("public.pengerjaan_lepas_darurat_semua(integer)", KELUAR_BATCH, "      null;\n");
    let tanam: ReturnType<typeof keluarSesudahHenti>;
    try { tanam = keluarSesudahHenti(db); } finally { balik(); }
    c.expect(tanam.a[0] === "IN_PROGRESS", `with the plant (no departure pass in the release batch) the preserved sitting was still ended: ${tanam.a.join("|")}`);
    return c.verdict(`a class stop; the school's admin ends the learner's enrolment during it: both protected sittings are preserved, unscored, with who and why recorded; after the lift the release batch applies the ordinary departure rule on the shifted deadline: the one inside it terminated INSTITUTIONAL_REVOCATION by the departure's actor with its reason, unscored, and the one past it and its grace judged by the deadline rule (${bSt}), never terminated; each audited at the departure and after the lift, naming the stop; with the plant (no departure pass) the preserved sitting stayed ${tanam.a[0]}`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C716 · D6.9: the marking and the release, counted once

/** THE PLAN §5.3 D6.9: one row when marking completes (how many held), one after the lift (T_lift; how many released,
 *  how many held for a suspension and left held); scenario 9: stopping or lifting twice writes no second row. A class
 *  stop holds the learner's open sitting A and their sitting B held by A1 (a suspension). The marking batch runs twice;
 *  the stop is lifted; the release batch runs twice. Committed fixtures (the batches commit), put back after. */
function hitungHenti(db: string) {
  const f = fiksur(db);
  const A = "a2a1c716-0000-4000-8000-000000000001", B = "a2a1c716-0000-4000-8000-000000000002", W = "a2a1c716-0000-4000-8000-0000000000a1";
  const C = "a2a1c716-0000-4000-8000-000000000003";   // D6.9's count: credited at first touch, finished before the batch
  const salin = (id: string, beku: boolean) => `insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'person_id', '${f.person}',
  'enrollment_id', '${f.enr}', 'institution_id', '${f.inst}', 'class_node_id', '${f.node}', 'cohort_node_id', null,
  'authoritative_deadline', now() + interval '30 minutes', 'created_at', now() - interval '60 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null,
  'frozen_at', ${beku ? "now() - interval '45 minutes'" : "null"}, 'frozen_cause', ${beku ? "'ACCOUNT_SUSPENDED'" : "null"},
  'frozen_suspension_id', null, 'frozen_remaining_seconds', ${beku ? "1800" : "null"}, 'unfrozen_at', null, 'unfrozen_by_person_id', null,
  'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null, 'darurat_keluar', null))).*
  from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;`;
  const baris = (aksi: string) => psqlStdin(db, `select count(*) || '|' || coalesce(max(summary::text), '{}') from public.audit_log
    where action = '${aksi}' and target_id = '${W}';`);
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
create table if not exists public._a2a_c716_asal as select '${f.mem}'::uuid as mem, m.valid_from as m_dari, '${f.enr}'::uuid as enr, e.valid_from as e_dari
  from public.memberships m, public.enrollments e where m.id = '${f.mem}' and e.id = '${f.enr}';
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${f.mem}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${f.enr}';
${salin(A, false)}
${salin(B, true)}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, reason, created_by_person_id, activation_recorded_at)
select '${W}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], now() - interval '20 minutes', now() - interval '20 minutes', 'A2A-C716',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '20 minutes';
commit;`);
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(50);");
    psqlStdin(db, "call public.pengerjaan_tandai_darurat(50);");
    const tanda = baris("maintenance.marking_completed");
    const ditandai = psqlStdin(db, `select string_agg(coalesce(darurat_jendela_id = '${W}', false)::text, ',' order by id) from public.assessment_sessions where id in ('${A}', '${B}');`);
    // C: open at T_stop, never marked (it joins after the marking ran); after the lift its first touch credits it, and
    // it is finished before the release batch runs
    psqlStdin(db, `begin; set local session_replication_role = replica;
${salin(C, false)}
update public.maintenance_windows set ended_at = now(), t_lift = now() where id = '${W}';
commit;`);
    psqlStdin(db, `select public.pengerjaan_putus_tenggat('${C}', true);`);
    const kreditC = psqlStdin(db, `select (darurat_dikredit_sampai is not null)::text from public.assessment_sessions where id = '${C}';`);
    psqlStdin(db, `begin; set local session_replication_role = replica;
update public.assessment_sessions set status = 'FINALIZED', finalized_at = now(), submitted_at = now() where id = '${C}';
commit;`);
    psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
    psqlStdin(db, "call public.pengerjaan_lepas_darurat_semua(50);");
    const lepas = baris("maintenance.release_completed");
    const sesudah = psqlStdin(db, `select string_agg(coalesce(darurat_jendela_id::text, '-') || ':' || (frozen_at is not null and unfrozen_at is null)::text, ',' order by id)
      from public.assessment_sessions where id in ('${A}', '${B}');`);
    return { tanda, ditandai, lepas, sesudah, kreditC };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.audit_log where target_id in ('${A}', '${B}', '${C}', '${W}');
delete from public.assessment_sessions where id in ('${A}', '${B}', '${C}');
delete from public.maintenance_windows where id = '${W}';
update public.memberships m set valid_from = a.m_dari from public._a2a_c716_asal a where m.id = a.mem;
update public.enrollments e set valid_from = a.e_dari from public._a2a_c716_asal a where e.id = a.enr;
drop table if exists public._a2a_c716_asal;
commit;`);
  }
}
const RILIS_HITUNG = "                'released', count(*) filter (where s.darurat_dikredit_sampai is not null\n                  and s.darurat_dikredit_sampai >= w2.t_stop + public.penghentian_geser(s.person_id, w2.id)),\n";
const TANDA_SEKALI = "and not exists (select 1 from public.audit_log l where l.action = 'maintenance.marking_completed' and l.target_id = w.id::text)";

a2aDaruratTests.push({
  id: "A2A-C716",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = hitungHenti(db);
    const [nTanda, tanda] = r.tanda.split("|");
    const t = JSON.parse(tanda || "{}") as { held?: number; t_stop?: string };
    c.expect(nTanda === "1" && (t.held ?? 0) >= 1 && !!t.t_stop, `the marking completed: ${r.tanda}, not one row with how many it holds and T_stop`);
    c.expect(r.ditandai === "true,false", `the stop marked the open sitting and not the one held for a suspension: ${r.ditandai}`);
    const [nLepas, lepas] = r.lepas.split("|");
    const l = JSON.parse(lepas || "{}") as { released?: number; held_for_suspension?: number; t_lift?: string };
    c.expect(r.kreditC === "true", `the sitting touched after the lift was not credited at first touch: ${r.kreditC}`);
    c.expect(nLepas === "1" && l.released === 2 && l.held_for_suspension === 1 && !!l.t_lift,
      `the release completed: ${r.lepas}, not one row with T_lift, released 2 (the one the batch released and the one credited at first touch and finished before it) and 1 left held for a suspension`);
    c.expect(r.sesudah === "-:false,-:true", `after the release, the open sitting released and the suspended one left held: ${r.sesudah}`);
    // the plant: the marking's row not guarded once, so a second run writes a second row
    const balik = gantiFungsi("public.pengerjaan_tandai_darurat(integer)", TANDA_SEKALI, "and true");
    let tanam: ReturnType<typeof hitungHenti>;
    try { tanam = hitungHenti(db); } finally { balik(); }
    c.expect(tanam.tanda.split("|")[0] !== "1", `with the plant (no once-only guard) the marking still wrote one row: ${tanam.tanda}`);
    // D6.9's plant: the count of the sittings still open at the batch (commit 40's), which misses the finished one
    const balik2 = gantiFungsi("public.pengerjaan_lepas_darurat_semua(integer)", RILIS_HITUNG,
      "                'released', count(*) filter (where s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (s.frozen_at is not null and s.unfrozen_at is null)),\n");
    let tanam2: ReturnType<typeof hitungHenti>;
    try { tanam2 = hitungHenti(db); } finally { balik2(); }
    const l2 = JSON.parse(tanam2.lepas.split("|").slice(1).join("|") || "{}") as { released?: number };
    c.expect(l2.released !== 2, `with D6.9's plant (the sittings still open at the batch) the released count was still 2: ${tanam2.lepas}`);
    return c.verdict(`a class stop holding an open sitting and one held for a suspension: the marking batch, run twice, writes one maintenance.marking_completed row (held ${t.held}, T_stop); after the lift the release batch, run twice, writes one maintenance.release_completed row (T_lift, released ${l.released}, the one credited at first touch and finished before the batch among them, held for a suspension ${l.held_for_suspension}); with the plant (no once-only guard) the marking wrote ${tanam.tanda.split("|")[0]} rows; with D6.9's plant (only sittings still open counted) released ${l2.released}`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C717 · THE PLAN §5.3 H, the per-blocker tests B3 to B6

/** Sharon's scenarios 3 to 6, word for word in THE PLAN §5.3 H, each in one transaction, rolled back, on the C712
 *  learner's own class with a class stop (T_stop = starts_at, T_lift = ended_at). No marking or release batch runs: the
 *  first touch and the credit (C18-1) carry the stop's time, as they do in production between batch runs. */
type KasusB = "B3_DALAM" | "B3_LEWAT" | "B3_SERAH" | "B4" | "B5" | "B6";
/** Sharon's C41-1: a stop as hosted records it, starts_at 3 s before T_stop and ended_at 2 s before T_lift, so a rule
 *  read from starts_at and ended_at is told apart from the approved one (T_stop and T_lift only). */
const jendelaHosted = (f: Fiksur, id: string, tStop: string, tLift: string | null) => `
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, t_stop, ended_at, t_lift, reason, created_by_person_id, activation_recorded_at)
select '${id}', 'EMERGENCY', false, array['${f.inst}'::uuid], array['${f.node}'::uuid], ${tStop} - interval '3 seconds', ${tStop},
       ${tLift ? `${tLift} - interval '2 seconds'` : "null"}, ${tLift ?? "null"}, 'A2A-C717',
       (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), ${tStop};`;
function skenarioB(db: string, f: FiksurJawab, g: number, kasus: KasusB) {
  const S = "a2a1c717-0000-4000-8000-000000000001", P = "a2a1c717-0000-4000-8000-0000000000c1";
  const W1 = "a2a1c717-0000-4000-8000-0000000000a1", W3 = "a2a1c717-0000-4000-8000-0000000000a3";
  const T = "a2a1c717-0000-4000-8000-0000000000b1";
  const detik = (x: number) => `now() - interval '${x} seconds'`;
  // B3: the deadline D0 a minute before T_stop (inside its grace at T_stop, EXPIRED); the stop 50 minutes ago, longer
  // than the grace; lifted so that the restored grace is still open (DALAM, SERAH) or already over (LEWAT)
  const d0 = 51 * 60, tStop = 50 * 60;
  const angkat = kasus === "B3_LEWAT" ? g : 10;          // T_lift, seconds ago
  let susun = "";
  if (kasus.startsWith("B3")) {
    susun = `${sesiSalinan(f, S, detik(d0))}
update public.assessment_sessions set status = 'EXPIRED', closure_kind = 'DEADLINE', closure_at = ${detik(d0)}, closure_deadline = ${detik(d0)},
  created_at = now() - interval '70 minutes', started_at = now() - interval '70 minutes' where id = '${S}';
insert into public.presented_items (id, session_id, item_id, institution_id, position, presented_at)
select '${P}', '${S}', p.item_id, p.institution_id, p.position, now() - interval '69 minutes'
  from public.presented_items p where p.session_id = '${f.sumber}' and p.position = 1;
${jendelaKelas(f, W1, detik(tStop), detik(angkat))}`;
  } else if (kasus === "B4") {
    // window-timed: no deadline of its own; the assignment's closes_at (10 minutes after T_stop) passes during the stop
    susun = `${sesiSalinan(f, S, "null")}
update public.assessment_assignments set closes_at = now() - interval '40 minutes'
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${S}');
${jendelaHosted(f, W1, "now() - interval '50 minutes'", "now() - interval '5 minutes'")}`;
  } else if (kasus === "B5") {
    // re-stop: W1 50 to 60 minutes ago (10 min), lifted; the gap; W3 from 40 minutes ago, lifted 5 minutes ago; no release
    // ran between them. D0 10 minutes on: W1 restores D1 = D0 + 10 min; the final = W3.ended_at + (D1 − W3.starts_at)
    susun = `${sesiSalinan(f, S, "now() + interval '10 minutes'")}
update public.assessment_sessions set created_at = now() - interval '70 minutes' where id = '${S}';
${jendelaHosted(f, W1, "now() - interval '60 minutes'", "now() - interval '50 minutes'")}
${jendelaHosted(f, W3, "now() - interval '40 minutes'", "now() - interval '5 minutes'")}`;
  } else {
    // B6: the stop 20 minutes ago; suspended 10 minutes ago (held, the time left measured at T_stop); the deadline then
    // passes (D0 5 minutes ago, raw); the stop lifts a minute ago; the suspension stays
    susun = `${sesiSalinan(f, S, "now() + interval '15 minutes'")}
${jendelaKelas(f, W1, "now() - interval '20 minutes'", "null")}
insert into public.person_suspensions (id, person_id, category, started_by, started_at)
select '${T}', '${f.person}', 'OTHER', (select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' order by id limit 1), now() - interval '10 minutes';
set local session_replication_role = origin;
select 'ditahan|' || public.pengerjaan_tahan_orang('${f.person}', '${T}');
set local session_replication_role = replica;
update public.assessment_sessions set authoritative_deadline = now() - interval '5 minutes' where id = '${S}';
update public.maintenance_windows set ended_at = now() - interval '1 minute', t_lift = now() - interval '1 minute' where id = '${W1}';`;
  }
  const ukur = `extract(epoch from (public.pengerjaan_tenggat_efektif('${S}') - now()))::int`;
  let periksa = "";
  if (kasus === "B3_DALAM" || kasus === "B3_LEWAT") {
    periksa = `${sebagaiOrang(f.murid)}
select 'jawab|' || r.outcome from public.record_answer('${P}', 1, '{"posisi": 1}'::jsonb) r;
select set_config('request.jwt.claims', '', true);
select 'mode|' || r.receipt_mode from public.responses r where r.session_id = '${S}';
select 'putus|' || public.pengerjaan_putus_tenggat('${S}', true);`;
  } else if (kasus === "B3_SERAH") {
    periksa = `${sebagaiOrang(f.murid)}
select 'jawab|' || r.outcome from public.record_answer('${P}', 1, '{"posisi": 1}'::jsonb) r;
select 'serah|' || (public.finish_my_session('${S}', '{"${P}": 1}'::jsonb) is not null);
select set_config('request.jwt.claims', '', true);
select 'status|' || status from public.assessment_sessions where id = '${S}';`;
  } else if (kasus === "B4") {
    // B4 = closes_at + (T_lift − T_stop)
    periksa = `select 'tepat|' || (public.pengerjaan_tenggat_efektif('${S}')
      = (select aa.closes_at from public.assessment_assignments aa join public.assessment_sessions s on s.assessment_assignment_id = aa.id where s.id = '${S}')
        + (select x.t_lift - x.t_stop from public.maintenance_windows x where x.id = '${W1}'))::text;
select 'putus|' || public.pengerjaan_putus_tenggat('${S}', true);`;
  } else if (kasus === "B5") {
    periksa = `create temp table b5 as select authoritative_deadline as d0 from public.assessment_sessions where id = '${S}';
select 'putus|' || public.pengerjaan_putus_tenggat('${S}', false);
-- B5 = W3.T_lift + (W1's restored deadline − W3.T_stop), W1's restored deadline = D0 + (W1.T_lift − W1.T_stop)
select 'tepat|' || (s.authoritative_deadline = (select x.t_lift from public.maintenance_windows x where x.id = '${W3}')
      + ((b5.d0 + (select x.t_lift - x.t_stop from public.maintenance_windows x where x.id = '${W1}'))
         - (select x.t_stop from public.maintenance_windows x where x.id = '${W3}')))::text
  from public.assessment_sessions s, b5 where s.id = '${S}';`;
  } else {
    periksa = `create temp table b6 as select frozen_remaining_seconds as r from public.assessment_sessions where id = '${S}';
select 'putus|' || public.pengerjaan_putus_tenggat('${S}', true);
select 'calon|' || (not exists (select 1 from public.pengerjaan_tutup_calon(5000) x where x = '${S}'))::text;
select 'tahan|' || (s.frozen_at is not null and s.unfrozen_at is null and s.frozen_cause = 'ACCOUNT_SUSPENDED')::text || ':' || (s.frozen_remaining_seconds = b6.r)::text
  || ':' || abs(b6.r - 35 * 60)
  from public.assessment_sessions s, b6 where s.id = '${S}';`;
  }
  return barisKunci(db, `begin;
${susun}
set local session_replication_role = origin;
select 'efektif|' || coalesce(${ukur}::text, '-');
${periksa}
rollback;`);
}
const B3_KREDIT = "and (s.status <> 'EXPIRED' or public.pengerjaan_dalam_tenggang_pada(s, x.t_stop))";
const B4_EFEKTIF = "         + (public.penghentian_kredit(s)).geser";
const B5_RANTAI = "    geser := geser + g; sampai := w.t_stop + g;";
const GESER_TLIFT = "  select x.t_stop, case when x.ended_at is null then null else coalesce(x.t_lift, x.ended_at) end into v_awal, v_akhir";
const B6_TAHAN = "  if public.pengerjaan_ditahan(v) then return v.status; end if;\n";

a2aDaruratTests.push({
  id: "A2A-C717",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const f = fiksurJawab(db);
    const g = Number(psqlStdin(db, `select d.late_sync_grace_seconds from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id where s.id = '${f.sumber}';`));
    const lari = (k: KasusB) => skenarioB(db, f, g, k);
    const b3a = lari("B3_DALAM"), b3b = lari("B3_LEWAT"), b3c = lari("B3_SERAH"), b4 = lari("B4"), b5 = lari("B5"), b6 = lari("B6");
    for (const [n, r] of [["B3 (inside)", b3a], ["B3 (after)", b3b], ["B3 (hand-in)", b3c], ["B4", b4], ["B5", b5], ["B6", b6]] as const)
      c.expect(!r.err, `${n}: failed: ${r.err}`);
    c.expect(b3a.hasil.mode === "LATE_SYNC" && b3a.hasil.jawab === "RECORDED" && b3a.hasil.putus === "EXPIRED",
      `B3: an answer within the restored grace: ${JSON.stringify(b3a.hasil)}, not LATE_SYNC and scored with the scoring waiting (EXPIRED)`);
    c.expect(b3b.hasil.mode === "LATE_SYNC" && /retained_unscored/.test(b3b.hasil.jawab ?? ""),
      `B3: an answer after the restored grace: ${JSON.stringify(b3b.hasil)}, not kept unscored`);
    c.expect(b3c.hasil.serah === "true" && b3c.hasil.status === "FINALIZED", `B3: a manifest-complete hand-in after the lift: ${JSON.stringify(b3c.hasil)}, not closed early`);
    c.expect(b4.hasil.tepat === "true" && b4.hasil.putus === "IN_PROGRESS", `B4: the window-timed sitting: ${JSON.stringify(b4.hasil)}, not closes_at + (T_lift − T_stop) and left open`);
    c.expect(b5.hasil.tepat === "true", `B5: the re-stop's final deadline: ${JSON.stringify(b5.hasil)}, not W3.T_lift + (W1's restored deadline − W3.T_stop)`);
    c.expect(b6.hasil.putus === "IN_PROGRESS" && b6.hasil.calon === "true" && /^true:true:\d$/.test(b6.hasil.tahan ?? ""),
      `B6: the suspended sitting after the lift: ${JSON.stringify(b6.hasil)}, not still held as ACCOUNT_SUSPENDED with the time left at T_stop, untouched by the scheduler`);
    // the plants, one per scenario
    const tanam = (fn: string, dari: string, ke: string, k: KasusB) => { const b = gantiFungsi(fn, dari, ke); try { return lari(k); } finally { b(); } };
    const p3 = tanam("public.penghentian_kredit(assessment_sessions)", B3_KREDIT, "and s.status <> 'EXPIRED'", "B3_DALAM");
    c.expect(p3.hasil.jawab !== "RECORDED" || p3.hasil.mode !== "LATE_SYNC", `B3's plant (an EXPIRED sitting given no time back) still scored the late answer: ${JSON.stringify(p3.hasil)}`);
    const p4 = tanam("public.pengerjaan_tenggat_efektif(uuid)", B4_EFEKTIF, "", "B4");
    c.expect(p4.hasil.tepat !== "true", `B4's plant (the effective deadline without the stop's time) still matched: ${JSON.stringify(p4.hasil)}`);
    const p5 = tanam("public.penghentian_kredit(assessment_sessions)", B5_RANTAI, "    geser := g; sampai := w.t_stop + g;", "B5");
    c.expect(p5.hasil.tepat !== "true", `B5's plant (only the last stop counted) still matched: ${JSON.stringify(p5.hasil)}`);
    // C41-1's plant: the shift read from starts_at and ended_at
    for (const k of ["B4", "B5"] as const) {
      const p = tanam("public.penghentian_geser(uuid,uuid)", GESER_TLIFT,
        "  select x.starts_at, case when x.ended_at is null then null else x.ended_at end into v_awal, v_akhir", k);
      c.expect(p.hasil.tepat !== "true", `C41-1's plant (the shift from ended_at − starts_at) still matched ${k}: ${JSON.stringify(p.hasil)}`);
    }
    const p6 = tanam("public.pengerjaan_putus_tenggat(uuid,boolean)", B6_TAHAN, "", "B6");
    c.expect(p6.hasil.putus !== "IN_PROGRESS" || !!p6.err, `B6's plant (the scheduler not skipping a held sitting) still left it open: ${JSON.stringify(p6.hasil)}`);
    return c.verdict(`THE PLAN §5.3 H, scenarios 3 to 6, on a class stop (grace ${g} s): B3 an answer within the restored grace is LATE_SYNC and scored while the scoring waits, one after it is kept unscored, and a manifest-complete hand-in after the lift closes the sitting early; B4 the window-timed sitting has closes_at + (T_lift − T_stop) and is not ended; B5 the re-stop's final deadline is W3.T_lift + (W1's restored deadline − W3.T_stop), both on stops whose starts_at and ended_at differ from T_stop and T_lift as hosted records them; B6 the sitting suspended during the stop stays held as ACCOUNT_SUSPENDED with the time left at T_stop after the lift, and the scheduler neither ends nor selects it; one plant each and C41-1's (the shift from ended_at − starts_at) on B4 and B5, each caught`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C718 · required change 1, through every reader

/** A2a's page, required change 1: a class-scoped window still names its school, so every reader that matched on the
 *  school alone would read it as school-wide. A class stop on the C712 learner's class; another learner of another
 *  class of the same school; the class's teacher. Each reader of the table, asked for each, in one transaction, rolled
 *  back: maintenance_affects, the request hook, pintar_status_saya, the sitting-start trigger and maintenance_controls.
 *  (maintenance_draining reads PLANNED windows' draining, which a class EMERGENCY window never has; and
 *  maintenance_collisions plans a PLANNED window, which A2a cannot make at class scope: both stay as they were.) */
function bacaKelas(db: string) {
  const f = fiksurJawab(db);
  // another learner, with an account, no role and no suspension, enrolled in the transaction at the same school in K2, a
  // sibling class made for it (independent of the seed: its school may have one class and one such learner)
  const lain = psqlStdin(db, `select p.id || '|' || a.auth_user_id from public.persons p join public.accounts a on a.person_id = p.id
   where p.id <> '${f.person}' and exists (select 1 from public.enrollments e where e.person_id = p.id and e.status = 'ACTIVE')
     and not exists (select 1 from public.enrollments e where e.person_id = p.id and e.institution_id = '${f.inst}')
     and not exists (select 1 from public.role_assignments r where r.person_id = p.id and r.revoked_at is null)
     and not exists (select 1 from public.person_suspensions ps where ps.person_id = p.id and ps.ended_at is null)
   order by p.id limit 1;`);
  const [lainOrang, lainUid] = lain.split("|");
  const lainEnr = "a2a1c718-0000-4000-8000-0000000000e1", lainMem = "a2a1c718-0000-4000-8000-0000000000e3";
  const lainKelas = "a2a1c718-0000-4000-8000-0000000000e2";
  if (!lainUid) return { err: "no other learner with an account, no role and no suspension: the seed changed", hasil: {} as Record<string, string> };
  const guru = psqlStdin(db, `select rg.person_id || '|' || a.auth_user_id from public.role_assignments rg join public.accounts a on a.person_id = rg.person_id
    where rg.role = 'EDUCATOR' and rg.scope_node_id = '${f.node}' and rg.revoked_at is null and now() >= rg.valid_from and now() < rg.valid_until
    order by rg.id limit 1;`).split("|");
  const admin = psqlStdin(db, `select a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'INSTITUTION_ADMIN' and r.institution_id = '${f.inst}' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until order by r.id limit 1;`);
  const sys = psqlStdin(db, `select a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null order by r.id limit 1;`);
  const W = "a2a1c718-0000-4000-8000-0000000000a1";
  const blok = (uid: string, k: string) => `${sebagaiOrang(uid)}
select '${k}|' || coalesce(public.maintenance_block_for_me(), 'none');
select '${k}_status|' || coalesce((public.pintar_status_saya() -> 'terhenti')::text, 'null');
select set_config('request.jwt.claims', '', true);`;
  return barisKunci(db, `begin;
set local session_replication_role = replica;
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${f.mem}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${f.enr}';
insert into public.org_nodes (id, institution_id, parent_id, kind, name, jalur, academic_period_id, is_active, created_at, learning_context)
select '${lainKelas}', n.institution_id, n.parent_id, n.kind, n.name || ' (K2)', n.jalur[1:cardinality(n.jalur) - 1] || '${lainKelas}'::uuid,
       n.academic_period_id, true, now() - interval '2 days', n.learning_context
  from public.org_nodes n where n.id = '${f.node}';
update public.role_assignments set valid_from = valid_from - interval '1 day'
 where person_id = '${guru[0]}' and role = 'EDUCATOR' and scope_node_id = '${f.node}' and revoked_at is null;
insert into public.enrollments select (jsonb_populate_record(e, jsonb_build_object('id', '${lainEnr}', 'person_id', '${lainOrang}'))).*
  from public.enrollments e where e.id = '${f.enr}';
insert into public.memberships select (jsonb_populate_record(m, jsonb_build_object('id', '${lainMem}', 'enrollment_id', '${lainEnr}', 'node_id', '${lainKelas}'))).*
  from public.memberships m where m.id = '${f.mem}';
${jendelaKelas(f, W, "now() - interval '10 minutes'", null)}
set local session_replication_role = origin;
select 'affects|' || public.maintenance_affects(w, '${f.person}')::text || ':' || public.maintenance_affects(w, '${lainOrang}')::text
  || ':' || public.maintenance_affects(w, '${guru[0]}')::text from public.maintenance_windows w where w.id = '${W}';
${blok(f.murid, "hook_kelas")}
${blok(lainUid, "hook_lain")}
${blok(guru[1], "hook_guru")}
-- the start trigger alone (the seed's school has no sitting of its own to copy, so the provenance and the course's
-- checks would refuse a copy for their own reasons): the others are off in this transaction only
alter table public.assessment_sessions disable trigger _l1f4_assessment_sessions_person_id, disable trigger assessment_sessions_provenance,
  disable trigger assessment_sessions_release_is_its_course, disable trigger assessment_sessions_status,
  disable trigger assessment_sessions_the_pass_mark_is_sealed, disable trigger assessment_sessions_zz_exposed_is_not_assessed;
create function pg_temp.a2a_mulai(p_sql text) returns text language plpgsql as $m$
begin execute p_sql; return 'OK'; exception when others then return sqlstate || ':' || sqlerrm; end $m$;
select 'mulai_kelas|' || pg_temp.a2a_mulai($q$insert into public.assessment_sessions select (jsonb_populate_record(s, jsonb_build_object('id', gen_random_uuid(), 'status', 'CREATED', 'person_id', '${f.person}', 'enrollment_id', '${f.enr}', 'class_node_id', '${f.node}', 'cohort_node_id', null, 'created_at', now(), 'started_at', null, 'finalized_at', null, 'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null, 'termination_cause', null, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null, 'darurat_keluar', null))).* from public.assessment_sessions s where s.id = '${f.sumber}'$q$);
select 'mulai_lain|' || pg_temp.a2a_mulai($q$insert into public.assessment_sessions select (jsonb_populate_record(s, jsonb_build_object('id', gen_random_uuid(), 'status', 'CREATED', 'person_id', '${lainOrang}', 'enrollment_id', '${lainEnr}', 'class_node_id', '${lainKelas}', 'cohort_node_id', null, 'created_at', now(), 'started_at', null, 'finalized_at', null, 'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null, 'termination_cause', null, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null, 'darurat_keluar', null))).* from public.assessment_sessions s where s.id = '${f.sumber}'$q$);
${sebagaiOrang(admin)}
select 'kendali_admin|' || public.maintenance_controls(w)::text from public.maintenance_windows w where w.id = '${W}';
${sebagaiOrang(sys)}
select 'kendali_sys|' || public.maintenance_controls(w)::text from public.maintenance_windows w where w.id = '${W}';
rollback;`);
}
const RC1_KELAS = "where e.person_id = p_person and m.node_id = any (w.node_ids)";

a2aDaruratTests.push({
  id: "A2A-C718",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = bacaKelas(db);
    c.expect(!r.err, `the readers failed: ${r.err}`);
    const h = r.hasil;
    c.expect(h.affects === "true:false:true", `maintenance_affects (the class's learner, another class's learner, the class's teacher): ${h.affects}, not true:false:true`);
    c.expect(h.hook_kelas !== "none" && h.hook_guru !== "none" && h.hook_lain === "none",
      `the request hook: class ${h.hook_kelas}, teacher ${h.hook_guru}, another class ${h.hook_lain}: the stop must reach the class and its teacher only`);
    c.expect(h.hook_kelas_status !== "null" && h.hook_lain_status === "null",
      `pintar_status_saya: class ${h.hook_kelas_status}, another class ${h.hook_lain_status}: the window must name the class's people only`);
    c.expect(!/^OK/.test(h.mulai_kelas ?? "") && h.mulai_lain === "OK", `the sitting-start trigger: class ${h.mulai_kelas}, another class ${h.mulai_lain}`);
    c.expect(h.kendali_sys === "true" && h.kendali_admin === "false", `maintenance_controls: Admin PINTAR ${h.kendali_sys}, the school's admin ${h.kendali_admin} (an emergency is Admin PINTAR's)`);
    // the plant: the class branch matching on the school, as a reader that read institution_ids alone would
    const balik = gantiFungsi("public.maintenance_affects_pada(maintenance_windows,uuid,timestamp with time zone)", RC1_KELAS,
      "where e.person_id = p_person and e.institution_id = any (w.institution_ids)");
    let tanam: ReturnType<typeof bacaKelas>;
    try { tanam = bacaKelas(db); } finally { balik(); }
    c.expect(tanam.hasil.affects !== "true:false:true" || tanam.hasil.hook_lain !== "none",
      `with the plant (a class window read by its school) another class's learner was still not reached: ${JSON.stringify(tanam.hasil)}`);
    return c.verdict(`a class stop names its school, and every reader of the table narrows it to the class: maintenance_affects reaches the class's learner and teacher and not another class's learner of the same school; the request hook and pintar_status_saya stop the class's people only; the sitting-start trigger refuses the class (${(h.mulai_kelas ?? "").split(":")[0]}) and lets the other class start; maintenance_controls is Admin PINTAR's; with the plant (the window read by its school) another class's learner was reached`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C719 · C39-1: the departure is applied at first touch

/** Sharon's C39-1: during a class stop the school's admin ends the learner's enrolment; the protected sitting is
 *  preserved. The stop is lifted; before any batch run the learner answers and hands in. The first touch applies the
 *  departure before the act, so each act is refused and nothing is scored; a refused act's transaction rolls back with
 *  its refusal, and the departure lands at the next touch that commits (here the decider, as the closer and the
 *  learner's status read run it): TERMINATED INSTITUTIONAL_REVOCATION by the departure's actor with its reason, audited
 *  once. One transaction, each act in a subtransaction, rolled back. */
function keluarSentuhPertama(db: string) {
  const f = fiksurJawab(db);
  const adm = psqlStdin(db, `select r.person_id || '|' || a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'INSTITUTION_ADMIN' and r.institution_id = '${f.inst}' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
      and r.person_id <> '${f.person}' order by r.id limit 1;`).split("|");
  if (!adm[1]) return { err: "no school admin with an account: the seed changed", hasil: {} as Record<string, string>, admin: "" };
  const S = "a2a1c719-0000-4000-8000-000000000001", P = "a2a1c719-0000-4000-8000-0000000000c1", W = "a2a1c719-0000-4000-8000-0000000000a1";
  const r = barisKunci(db, `begin;
${sesiSalinan(f, S, "now() + interval '30 minutes'")}
-- the school's own sitting (the departure ends only those): the source may be another school's
update public.assessment_sessions set institution_id = '${f.inst}' where id = '${S}';
insert into public.presented_items (id, session_id, item_id, institution_id, position, presented_at)
select '${P}', '${S}', p.item_id, '${f.inst}', p.position, now() - interval '59 minutes'
  from public.presented_items p where p.session_id = '${f.sumber}' and p.position = 1;
${jendelaKelas(f, W, "now() - interval '40 minutes'", null)}
set local session_replication_role = origin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $c$
declare v text;
begin execute p_sql into v; return 'OK:' || coalesce(v, ''); exception when others then return 'REFUSED:' || sqlstate; end $c$;
-- the departure, during the stop, by the school's admin
${sebagaiOrang(adm[1])}
select 'keluar|' || pg_temp.a2a_coba($q$select (public.akhiri_pendaftaran('${f.enr}', 'WITHDRAWN', null, null) is not null)::text$q$);
select set_config('request.jwt.claims', '', true);
select 'saat|' || status || ':' || (darurat_keluar is not null)::text from public.assessment_sessions where id = '${S}';
-- the lift; no batch
set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now() - interval '5 minutes', t_lift = now() - interval '5 minutes' where id = '${W}';
set local session_replication_role = origin;
-- N42-1: the departed learner's open sittings do not offer it (its assessment made one the list would show)
set local session_replication_role = replica;
update public.assessment_assignments set learning_assignment_id = null, status = 'OPEN', closes_at = now() - interval '1 minute'
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${S}');
set local session_replication_role = origin;
${sebagaiOrang(f.murid)}
select 'tawar|' || count(*) from public.pengerjaan_terbuka_saya() x where x.sesi_id = '${S}';
-- the learner answers and hands in
select 'jawab|' || pg_temp.a2a_coba($q$select r.outcome from public.record_answer('${P}', 1, '{"posisi": 1}'::jsonb) r$q$);
select 'serah|' || pg_temp.a2a_coba($q$select (public.finish_my_session('${S}', '{}'::jsonb) is not null)::text$q$);
select set_config('request.jwt.claims', '', true);
select 'sesudah|' || status || ':' || (select count(*) from public.assessment_results x where x.session_id = '${S}') from public.assessment_sessions where id = '${S}';
-- the next touch that commits: the decider
select 'putus|' || public.pengerjaan_putus_tenggat('${S}', true);
select 'akhir|' || s.status || '|' || coalesce(s.termination_cause::text, '') || '|' || coalesce(s.terminated_by_person_id::text, '')
  || '|' || left(coalesce(s.termination_reason, ''), 20) || '|' || (select count(*) from public.assessment_results x where x.session_id = s.id)
  || '|' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.departure_applied' and l.summary ->> 'stop' = '${W}')
  || '|' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.terminated')
  from public.assessment_sessions s where s.id = '${S}';
select 'lagi|' || public.pengerjaan_putus_tenggat('${S}', true) || ':' || (select count(*) from public.audit_log l where l.target_id = '${S}' and l.action = 'assessment_session.departure_applied');
rollback;`);
  return { ...r, admin: adm[0] };
}
const KELUAR_SENTUH = "    perform public.pengerjaan_keluar_terapkan(p_session);\n";

a2aDaruratTests.push({
  id: "A2A-C719",
  requires: ["db"],
  run: async () => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = keluarSentuhPertama(db);
    c.expect(!r.err, `failed: ${r.err}`);
    const h = r.hasil;
    c.expect(h.keluar === "OK:true" && h.saat === "IN_PROGRESS:true", `the departure during the stop: ${h.keluar}, ${h.saat}, not done with the sitting preserved`);
    c.expect(/^REFUSED/.test(h.jawab ?? "") && /^REFUSED/.test(h.serah ?? ""), `after the lift, before any batch, the learner's answer (${h.jawab}) and hand-in (${h.serah}) were not refused`);
    c.expect(h.tawar === "0", `N42-1: after the lift the departed learner's open sittings still offered the preserved one: ${h.tawar}`);
    c.expect(h.sesudah === "IN_PROGRESS:0", `after the refused acts: ${h.sesudah}, not unscored (each refusal rolls back its own transaction)`);
    const [st, sebab, oleh, alasan, hasil, audit, akhir] = (h.akhir ?? "").split("|");
    c.expect(h.putus === "TERMINATED" && st === "TERMINATED" && sebab === "INSTITUTIONAL_REVOCATION" && oleh === r.admin && alasan.startsWith("Pendaftaran diakhiri") && hasil === "0",
      `the next committing touch: ${h.putus}, ${h.akhir}, not terminated unscored by the departure's actor with its reason`);
    c.expect(audit === "1" && akhir === "1" && h.lagi === "TERMINATED:1", `the departure applied was not audited once naming the stop: ${h.akhir}, again ${h.lagi}`);
    // the plant: no first-touch application, so the hand-in scores the departed learner's sitting
    const balik = gantiFungsi("public.pengerjaan_pagar(uuid)", KELUAR_SENTUH, "    null;\n");
    let tanam: ReturnType<typeof keluarSentuhPertama>;
    try { tanam = keluarSentuhPertama(db); } finally { balik(); }
    c.expect(/^OK/.test(tanam.hasil.serah ?? "") || tanam.hasil.putus !== "TERMINATED",
      `with the plant (no first-touch application) the hand-in was still refused and the sitting ended: ${JSON.stringify(tanam.hasil)}`);
    // N42-1's plant: the list without its departure clause offers the sitting
    const balik2 = gantiFungsi("public.pengerjaan_terbuka_saya()", "     and s.darurat_keluar is null   -- N42-1: a departure preserved through a stop is not offered to its learner\n", "");
    let tanam2: ReturnType<typeof keluarSentuhPertama>;
    try { tanam2 = keluarSentuhPertama(db); } finally { balik2(); }
    c.expect(tanam2.hasil.tawar === "1", `with N42-1's plant (no departure clause) the list still did not offer the sitting (the check would not bite): ${tanam2.hasil.tawar}`);
    return c.verdict(`a departure during a class stop, then the lift, no batch: the learner's answer and hand-in are refused (${h.jawab}, ${h.serah}) and nothing is scored; the next committing touch (the decider) ends it TERMINATED INSTITUTIONAL_REVOCATION by the departure's actor with its reason, unscored, departure_applied audited once naming the stop, and a second touch adds nothing; the departed learner's open sittings do not offer it (N42-1; with its plant they do); with the plant (no first-touch application) the hand-in was ${tanam.hasil.serah} and the sitting ${tanam.hasil.sesudah}`);
  },
});

// ═══════════════════════════════════════════════════════════ A2A-C720 · the O1 refusals, recorded afterwards

/** Sharon's question 3 (A2A-C-39-d77609ec.md): each O1 refusal audited, on catat_penolakan_henti, the second call after
 *  the refused transaction, which records only a refusal that still stands for the caller. A class stop in force holds
 *  the learner's sitting; its learning assignment is given to the class. The class's teacher records
 *  SITTING_CLASS_STOPPED (the sitting, and the assignment's «Ubah jadwal») and ASSIGN_CLASS_STOPPED; the school's admin
 *  PROMO_STOPPED on the Kelas. Each is one row naming the stop. Refused: the learner, the fence's retry code, an unknown
 *  code, the admin's PROMO_STOPPED on a class with nothing held, and the teacher's after the lift. One transaction,
 *  rolled back. */
function catatHenti(db: string) {
  const f = fiksurJawab(db);
  const adm = psqlStdin(db, `select a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'INSTITUTION_ADMIN' and r.institution_id = '${f.inst}' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
      and r.person_id <> '${f.person}' order by r.id limit 1;`);
  if (!adm) return { err: "no school admin with an account: the seed changed", hasil: {} as Record<string, string> };
  const S = "a2a1c720-0000-4000-8000-000000000001", W = "a2a1c720-0000-4000-8000-0000000000a1";
  const coba = (k: string, uid: string, sasaran: string, kode: string) => `${sebagaiOrang(uid)}
select '${k}|' || pg_temp.a2a_coba($q$select public.catat_penolakan_henti(${sasaran}, '${kode}')::text$q$);`;
  const LA = `(select aa.learning_assignment_id from public.assessment_assignments aa join public.assessment_sessions s on s.assessment_assignment_id = aa.id where s.id = '${S}')`;
  return barisKunci(db, `begin;
${sesiSalinan(f, S, "now() + interval '30 minutes'")}
update public.assessment_sessions set institution_id = '${f.inst}' where id = '${S}';
-- the sitting's lesson given to the class (the copied source's may be another school's)
update public.learning_assignments set node_id = '${f.node}', status = 'ACTIVE' where id = ${LA};
update public.assessment_assignments set node_id = '${f.node}' where id = (select assessment_assignment_id from public.assessment_sessions where id = '${S}');
-- the teacher's list shows each learner's latest sitting of the assignment: the learner's other sittings of it (the seed's,
-- made after this one on a fresh database) dated before this one, in this transaction only
update public.assessment_sessions set created_at = created_at - interval '2 days'
 where person_id = '${f.person}' and id <> '${S}'
   and assessment_assignment_id = (select assessment_assignment_id from public.assessment_sessions where id = '${S}');
${jendelaKelas(f, W, "now() - interval '10 minutes'", null)}
set local session_replication_role = origin;
create function pg_temp.a2a_coba(p_sql text) returns text language plpgsql as $c$
declare v text; d text;
begin execute p_sql into v; return 'OK';
exception when others then get stacked diagnostics d = pg_exception_detail; return 'REFUSED:' || sqlstate || ':' || coalesce(nullif(d, ''), sqlerrm); end $c$;
select 'dilindungi|' || public.pengerjaan_dilindungi('${S}')::text;
${sebagaiOrang(f.guru)}
select 'daftar_tahan|' || coalesce((select x.keadaan from public.daftar_pengerjaan('${f.node}', (select assessment_assignment_id from public.assessment_sessions where id = '${S}')) x where x.sesi_id = '${S}'), '-');
${coba("guru_sesi", f.guru, `'${S}'`, "SITTING_CLASS_STOPPED")}
${coba("guru_sesi_lagi", f.guru, `'${S}'`, "SITTING_CLASS_STOPPED")}
${coba("guru_jadwal", f.guru, LA, "SITTING_CLASS_STOPPED")}
${coba("guru_akhiri", f.guru, LA, "ASSIGN_CLASS_STOPPED")}
${coba("admin_naik", adm, `'${f.node}'`, "PROMO_STOPPED")}
${coba("murid", f.murid, `'${S}'`, "SITTING_CLASS_STOPPED")}
${coba("pagar", f.guru, `'${S}'`, "SITTING_FENCE_BUSY")}
${coba("asing", f.guru, `'${S}'`, "ROLE_LAST_SCHOOL_ADMIN")}
${coba("guru_naik", f.guru, `'${f.node}'`, "PROMO_STOPPED")}
select set_config('request.jwt.claims', '', true);
select 'baris|' || count(*) || ':' || count(*) filter (where summary -> 'windows' @> to_jsonb(array['${W}'])) || ':'
  || string_agg(action || '/' || (summary ->> 'refusal'), ',' order by action, summary ->> 'refusal')
  from public.audit_log where action like '%.stop_refused' and (target_id = '${S}' or target_id = ${LA}::text or target_id = '${f.node}');
-- the lift: the refusal no longer stands
set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now(), t_lift = now() where id = '${W}';
set local session_replication_role = origin;
${coba("sesudah", f.guru, `'${S}'`, "SITTING_CLASS_STOPPED")}
-- C41-2's siblings: the stop's mark not yet released (no batch) holds nothing after the lift
select set_config('request.jwt.claims', '', true);
set local session_replication_role = replica;
update public.assessment_sessions set darurat_sejak = now() - interval '10 minutes', darurat_jendela_id = '${W}' where id = '${S}';
set local session_replication_role = origin;
${coba("basi_sesi", f.guru, `'${S}'`, "SITTING_CLASS_STOPPED")}
${coba("basi_akhiri", f.guru, LA, "ASSIGN_CLASS_STOPPED")}
${coba("basi_naik", adm, `'${f.node}'`, "PROMO_STOPPED")}
select 'daftar_basi|' || coalesce((select x.keadaan from public.daftar_pengerjaan('${f.node}', (select assessment_assignment_id from public.assessment_sessions where id = '${S}')) x where x.sesi_id = '${S}'), '-');
select 'basi_jadwal|' || pg_temp.a2a_coba($q$select public.ubah_jadwal_penugasan(${LA}, now() + interval '1 hour', now() + interval '2 hours', 'A2A-C720 the stale mark')::text$q$);
select set_config('request.jwt.claims', '', true);
select 'baris_akhir|' || count(*) from public.audit_log where action like '%.stop_refused' and (target_id = '${S}' or target_id = ${LA}::text or target_id = '${f.node}');
rollback;`);
}
const HENTI_TAHAN = "      if not public.pengerjaan_dilindungi(s.id)\n         or not";
const JADWAL_BASI = "and public.pengerjaan_dilindungi(s.id)) then   -- C41-2";

a2aDaruratTests.push({
  id: "A2A-C720",
  requires: ["db"],
  run: async ({ repoRoot }) => {
    const c = new Checks();
    const db = process.env.SUPABASE_DB_URL!;
    const { gantiFungsi } = await import("./balapan");
    const r = catatHenti(db);
    c.expect(!r.err, `failed: ${r.err}`);
    const h = r.hasil;
    c.expect(h.dilindungi === "true", `the fixture's sitting is not protected by the stop: ${h.dilindungi}`);
    for (const k of ["guru_sesi", "guru_sesi_lagi", "guru_jadwal", "guru_akhiri", "admin_naik"]) c.expect(h[k] === "OK", `${k}: a refusal that stands was not recorded: ${h[k]}`);
    for (const k of ["murid", "pagar", "asing", "guru_naik", "sesudah", "basi_sesi", "basi_akhiri", "basi_naik"])
      c.expect(/^REFUSED:PR170:STOP_REFUSAL_NOT_FOUND$/.test(h[k] ?? ""), `${k}: a refusal that does not stand for the caller was recorded or failed otherwise: ${h[k]}`);
    c.expect(h.baris === "4:4:assessment_session.stop_refused/SITTING_CLASS_STOPPED,learning_assignment.stop_refused/ASSIGN_CLASS_STOPPED,learning_assignment.stop_refused/SITTING_CLASS_STOPPED,promotion.stop_refused/PROMO_STOPPED",
      `the rows: ${h.baris}, not one per refused act and stop (the teacher's second identical call writes none), each naming the stop`);
    c.expect(h.baris_akhir === "4", `after the lift a teacher's call still wrote a row: ${h.baris_akhir}`);
    c.expect(h.daftar_tahan === "HELD_STOP" && !!h.daftar_basi && h.daftar_basi !== "-" && h.daftar_basi !== "HELD_STOP",
      `C41-2: the teacher's list during the stop (${h.daftar_tahan}) and after the lift with the mark not yet released (${h.daftar_basi}), not HELD_STOP and then not`);
    c.expect(!!h.basi_jadwal && !/SITTING_CLASS_STOPPED/.test(h.basi_jadwal), `C41-2: after the lift, with the stop's mark not yet released, «Ubah jadwal» was refused for the stop: ${h.basi_jadwal}`);
    // the screens: each action refused one of the three codes calls the record once, afterwards
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const baca = (p: string) => readFileSync(join(repoRoot, p), "utf8");
    const atur = baca("src/app/mengajar/pengerjaan-aksi.ts"), ajar = baca("src/app/mengajar/actions.ts"), naik = baca("src/app/konfigurasi/kenaikan-aksi.ts");
    c.expect((atur.match(/if \(error\) await tolak\(db, t, /g) ?? []).length === 5 && /await catatPenolakanHenti\(db, t\.sesi, kode,/.test(atur)
      && /await catatPenolakanHenti\(db, la, kode, "jadwal"\)/.test(atur), "the teacher's sitting acts or «Ubah jadwal» do not record their refusal afterwards");
    c.expect(/await catatPenolakanHenti\(db, penugasan, kode, "akhiri"\)/.test(ajar), "ending an assignment does not record its refusal afterwards");
    c.expect(/await catatPenolakanHenti\([^)]*kelas, kodeGalat\(error\), "kenaikan"\)/.test(naik), "the promotion does not record its refusal afterwards");
    // the plant: the sitting's check forged, so a caller records a refusal the stop no longer holds
    const balik = gantiFungsi("public.catat_penolakan_henti(uuid,text)", HENTI_TAHAN, "      if false\n         or not");
    let tanam: ReturnType<typeof catatHenti>;
    try { tanam = catatHenti(db); } finally { balik(); }
    c.expect(tanam.hasil.sesudah === "OK", `with the plant (a forged record) the teacher's call after the lift was still refused: ${tanam.hasil.sesudah}`);
    // the note on commit 43's plant: no dedupe, so the second identical call writes a second row
    const balik4 = gantiFungsi("public.catat_penolakan_henti(uuid,text)", "  if v_ada is not null then return v_ada; end if;\n", "");
    let tanam4: ReturnType<typeof catatHenti>;
    try { tanam4 = catatHenti(db); } finally { balik4(); }
    c.expect((tanam4.hasil.baris ?? "").startsWith("5:"), `with the dedupe's plant the second identical call still wrote no row: ${tanam4.hasil.baris}`);
    // C41-2's sibling plant: «Ubah jadwal» counting the stale mark again
    const balik2 = gantiFungsi("public.ubah_jadwal_penugasan(uuid,timestamp with time zone,timestamp with time zone,text)", JADWAL_BASI,
      "and (s.darurat_sejak is not null or public.pengerjaan_dilindungi(s.id))) then");
    let tanam2: ReturnType<typeof catatHenti>;
    try { tanam2 = catatHenti(db); } finally { balik2(); }
    const balik3 = gantiFungsi("public.daftar_pengerjaan(uuid,uuid)", "and public.pengerjaan_dilindungi(s.id) then 'HELD_STOP'",
      "and (s.darurat_sejak is not null or public.pengerjaan_dilindungi(s.id)) then 'HELD_STOP'");
    let tanam3: ReturnType<typeof catatHenti>;
    try { tanam3 = catatHenti(db); } finally { balik3(); }
    c.expect(tanam3.hasil.daftar_basi === "HELD_STOP", `with the list's sibling plant (the stale mark counted) it did not say HELD_STOP after the lift: ${tanam3.hasil.daftar_basi}`);
    c.expect(/SITTING_CLASS_STOPPED/.test(tanam2.hasil.basi_jadwal ?? ""), `with C41-2's sibling plant (the stale mark counted) «Ubah jadwal» was not refused: ${tanam2.hasil.basi_jadwal}`);
    return c.verdict(`a class stop in force: the teacher records SITTING_CLASS_STOPPED on the sitting and on the assignment («Ubah jadwal») and ASSIGN_CLASS_STOPPED, the school's admin PROMO_STOPPED on the Kelas: four rows, one per refused act and stop (a second identical call returns the first row, and with its plant writes a fifth), each naming the stop; refused STOP_REFUSAL_NOT_FOUND: the learner, SITTING_FENCE_BUSY, another code, the teacher's PROMO_STOPPED, and the teacher's call after the lift, also while the stop's mark is not yet released (all three codes); «Ubah jadwal» goes on to its own checks then and the teacher's list no longer says HELD_STOP (C41-2's siblings; with their plants refused for the stop and HELD_STOP); the four screen actions call it after the refusal; with the plant (a forged record) the call after the lift was recorded`);
  },
});
