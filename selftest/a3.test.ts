/**
 * A3 · RECOVERY, ONE WRITER PER SITTING: the red cases, written first (THE PLAN §5.5 G2; PLAN-A3-C3W-Z.md §2.5 A3-1;
 * docs/completion-4.1/C1-D125-INVESTIGATION.md §5). The seeded learning-cycle school with a learner of this suite's
 * own; real sittings through start_learning_session and record_answer. A "device" is a verified Auth session: the
 * session id inside the claims, which sesi_saya() reads (D2). Every scenario is one transaction, rolled back.
 *
 * These cases state BEHAVIOUR only. They name no refusal code, no column and no function A3 has yet to add: the codes
 * (D12) and the lock order wait for Sharon's pre-build review. A refusal is any error raised at the boundary.
 *
 *   A3-R01  two signed-in sessions of one learner (C1-D125 §5 cases 1, 2, 3): the sitting is started and answered on
 *           session A. Session B's answer to another question is refused; B's later, higher-sequence answer to A's
 *           question is refused and the final answer stays A's; B answering while A has paused is refused; B handing
 *           in A's sitting is refused; a caller with no verified session id is refused. Session A's own answer is
 *           accepted throughout (the control). Red on ac25e9b1: every one of B's writes lands, the higher sequence
 *           wins from either session, and a caller with no session id writes.
 *   A3-L1P  Sharon's L01 ruling (b) (16 Nov 22:54, a1b66843): learning_assignments and assessment_assignments stay
 *           unranked in A2A-L01; this pairwise check, read by A2A-L01's own reader with the two tables ranked for its
 *           own run only, requires that every function that locks both takes learning_assignments first (the order of
 *           «Akhiri», both moves and the start since A3-R1), so no start can hold an assessment assignment while it waits on
 *           a learning assignment. A plant that locks them the other way round is reported.
 *   A3-LN1  ruling 46's lineage (Sharon, 478c8750; replaces A3-R1V, whose claim was false for ad-hoc definitions): every
 *           definition has a NOT NULL, immutable lineage root that is a root of its own school; a new one is its own root.
 *   A3-LN2  the line check refuses a revision with two predecessors (the backfill's strictness).
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { URUTAN, bacaUrutan, type Kunci } from "./a2a-l01.test";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}

/** The helpers the scenario stands on: role switches, the cycle fixture, a learner's answers, a learner of our own. */
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable03.sql", "fable06.sql", "fable09.sql", "fable11.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}

const q = (s: string) => `$q$${s}$q$`;
/** One probe, kept as «ok:<value>» or «<SQLSTATE>:<DETAIL or the message's start>»: as the learner on session `sesi`
 * (A, B, or NONE for a verified token without a session id), run `sql`. */
const langkah = (k: string, sesi: "A" | "B" | "NONE", sql: string) => `v := v || jsonb_build_object('${k}', pg_temp.a3('${sesi}', ${q(sql)}));`;
/** The presented item at position `n` (1-based) of the sitting. */
const soal = (n: number) => `(select p.id from public.presented_items p where p.session_id = current_setting('a3.s')::uuid order by p.position offset ${n - 1} limit 1)`;
const jawab = (n: number, seq: number, benar: boolean) =>
  `select x.outcome from public.record_answer(${soal(n)}, ${seq}, selftest.f09_answer(${soal(n)}, ${benar})) x`;
/** The sitting's final answer to question `n`, as scoring reads it. */
const akhir = (n: number) =>
  `(select fr.value::text from public.session_final_responses(current_setting('a3.s')::uuid) fr where fr.presented_item_id = ${soal(n)})`;

function skenario(): string {
  return `
begin;
create function pg_temp.a3(p_sesi text, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text; v_u uuid := current_setting('a3.u')::uuid;
begin
  begin
    reset role;
    perform set_config('request.jwt.claims', case p_sesi
      when 'NONE' then json_build_object('sub', v_u, 'role', 'authenticated')
      else json_build_object('sub', v_u, 'role', 'authenticated', 'session_id', current_setting('a3.sesi_' || p_sesi)) end::text, true);
    perform set_config('request.jwt.claim.sub', v_u::text, true);
    set local role authenticated;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 70));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create temp table a3_snap (v jsonb) on commit drop;
do $a3$
declare v jsonb := '{}'::jsonb; f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid; v_s uuid;
begin
  perform selftest.as_owner();
  perform set_config('a3.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
  perform set_config('a3.sesi_A', gen_random_uuid()::text, true);
  perform set_config('a3.sesi_B', gen_random_uuid()::text, true);
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
  -- a learner of our own, in the cycle's Kelas, who has never sat its Pemetaan Awal
  v_u := selftest.f06p10_person('a3-murid-' || current_setting('a3.tag'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  if v_e is null then raise exception 'the fixture Kelas has no learner to enrol beside'; end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  perform set_config('a3.u', v_u::text, true);
  -- the harness's hand: the Pemetaan Awal allows a pause, so case 3 can be asked (rolled back with the rest)
  set local session_replication_role = replica;
  update public.assessment_definitions d set allows_pause = true
    from public.assessment_assignments aa where aa.id = f.aa_pre and d.id = aa.assessment_definition_id;
  set local session_replication_role = origin;
  -- started on session A, which answers the first question
  v := v || jsonb_build_object('mulai_A', pg_temp.a3('A', format('select public.start_learning_session(%L)::text', f.aa_pre)));
  select s.id into v_s from public.assessment_sessions s where s.person_id = v_p and s.assessment_assignment_id = f.aa_pre;
  if v_s is null then raise exception 'the sitting was not started: %', v ->> 'mulai_A'; end if;
  perform set_config('a3.s', v_s::text, true);
  ${langkah("A_jawab_1", "A", jawab(1, 1, true))}
  -- case 1: session B answers another question, then answers A's question with a higher sequence
  ${langkah("B_jawab_2", "B", jawab(2, 1, true))}
  ${langkah("B_timpa_1", "B", jawab(1, 9, false))}
  v := v || jsonb_build_object('akhir_1', (select ${akhir(1)}), 'akhir_1_A', (select r.value::text from public.responses r
          where r.presented_item_id = ${soal(1)} and r.client_seq = 1));
  -- the control: A's own next answer is accepted
  ${langkah("A_jawab_3", "A", jawab(3, 1, true))}
  -- case 3: A pauses; B answers while it is paused
  ${langkah("A_jeda", "A", "select public.pause_session(current_setting('a3.s')::uuid)::text")}
  ${langkah("B_jawab_4_jeda", "B", jawab(4, 1, true))}
  ${langkah("A_lanjut", "A", "select public.resume_session(current_setting('a3.s')::uuid)::text")}
  -- a verified token with no session id at all
  ${langkah("NONE_jawab_5", "NONE", jawab(5, 1, true))}
  -- case 2's root: B hands in A's sitting
  ${langkah("B_serahkan", "B", "select public.submit_session(current_setting('a3.s')::uuid)::text")}
  perform selftest.as_owner();
  insert into a3_snap values (v);
end $a3$;
select 'A3' || chr(9) || v::text from a3_snap;
rollback;
`;
}

function jalankan(c: Checks, repoRoot: string): Record<string, string> | null {
  const gagal = siapkan(repoRoot);
  if (!c.expect(gagal === null, gagal ?? "")) return null;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(), db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
  if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return null;
  const baris = r.stdout.split("\n").find((l) => l.startsWith("A3\t"));
  if (!c.expect(!!baris, "the scenario returned nothing")) return null;
  return JSON.parse(baris!.slice(3)) as Record<string, string>;
}

const diterima = (x: string | undefined) => (x ?? "").startsWith("ok:");

/** The first index of each table in one function's lock list (A2A-L01's reading), or -1. */
function pertama(l: Kunci[], t: string): number {
  return l.findIndex((k) => k.t === t);
}
/** A3-L1P: the functions that lock assessment_assignments before learning_assignments, read with both tables ranked. */
function aaSebelumLa(db: string, tanam = ""): { salah: string[]; keduanya: number } {
  const asli = { la: URUTAN.learning_assignments, aa: URUTAN.assessment_assignments };
  URUTAN.learning_assignments = 8.3;
  URUTAN.assessment_assignments = 8.6;
  try {
    const r = bacaUrutan(db, tanam);
    const salah: string[] = [];
    let keduanya = 0;
    for (const [fn, l] of r.semua) {
      const la = pertama(l, "learning_assignments"), aa = pertama(l, "assessment_assignments");
      if (la < 0 || aa < 0) continue;
      keduanya++;
      if (aa < la) salah.push(`${fn}: assessment_assignments before learning_assignments — via ${l[aa].lewat}`);
    }
    return { salah, keduanya };
  } finally {
    if (asli.la === undefined) delete URUTAN.learning_assignments; else URUTAN.learning_assignments = asli.la;
    if (asli.aa === undefined) delete URUTAN.assessment_assignments; else URUTAN.assessment_assignments = asli.aa;
  }
}
const TANAM_L1P = `create function public._a3_l1p_tanam(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.assessment_assignments a where a.id = p for share;
      perform 1 from public.learning_assignments la where la.id = p for key share; end $t$;`;

export const a3DbTests: SelfTest[] = [
  {
    id: "A3-L1P",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const nyata = aaSebelumLa(db());
      c.expect(nyata.keduanya > 0, "no function locks both learning_assignments and assessment_assignments (the reader found nothing to check)");
      c.expect(nyata.salah.length === 0, `functions that lock an assessment assignment before its learning assignment:\n  ${nyata.salah.join("\n  ")}`);
      const tanam = aaSebelumLa(db(), TANAM_L1P);
      c.expect(tanam.salah.some((x) => x.startsWith("_a3_l1p_tanam:")), "the plant (assessment_assignments, then learning_assignments) was not reported");
      c.expect(URUTAN.learning_assignments === undefined && URUTAN.assessment_assignments === undefined, "A2A-L01's ranks were not restored after the check");
      return c.verdict(`A2A-L01's reader, with the two tables ranked for this check only: all ${nyata.keduanya} functions that lock both learning_assignments and assessment_assignments take learning_assignments first; a plant locking them the other way round is reported; A2A-L01's ranks are left as they were`);
    },
  },
  {
    id: "A3-R01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      // the controls: the start and A's own answers
      c.expect(diterima(v.mulai_A), `session A starts the sitting: ${v.mulai_A}`);
      c.expect(diterima(v.A_jawab_1), `session A's answer is accepted: ${v.A_jawab_1}`);
      c.expect(diterima(v.A_jawab_3), `session A's next answer is accepted (the control): ${v.A_jawab_3}`);
      c.expect(diterima(v.A_jeda) && diterima(v.A_lanjut), `session A pauses and resumes its own sitting: ${v.A_jeda}, ${v.A_lanjut}`);
      // case 1
      c.expect(!diterima(v.B_jawab_2), `case 1: session B's answer to another question must be refused, the sitting has one writer: ${v.B_jawab_2}`);
      c.expect(!diterima(v.B_timpa_1), `case 1: session B's later, higher-sequence answer to A's question must be refused: ${v.B_timpa_1}`);
      c.expect(v.akhir_1 === v.akhir_1_A, `case 1: the final answer to question 1 stays session A's (${v.akhir_1_A}), never the other session's: ${v.akhir_1}`);
      // case 3
      c.expect(!diterima(v.B_jawab_4_jeda), `case 3: session B answering while A has paused must be refused: ${v.B_jawab_4_jeda}`);
      // no verified session
      c.expect(!diterima(v.NONE_jawab_5), `a caller with no verified session id must be refused, never treated as any writer: ${v.NONE_jawab_5}`);
      // case 2's root
      c.expect(!diterima(v.B_serahkan), `case 2: session B handing in A's sitting must be refused: ${v.B_serahkan}`);
      return c.verdict(
        "two signed-in sessions of one learner, one sitting: started and answered on session A; session B's answers, its higher-sequence overwrite, its answer while A is paused and its hand-in are each refused, and the final answer stays A's; a caller with no verified session id is refused; A's own answers, pause and resume are accepted",
      );
    },
  },
  {
    // A3, ruling 46 (Sharon's lineage design, 478c8750): REPLACES A3-R1V, whose claim was false (a sat ad-hoc definition's
    // version is NOT immutable: enforce_taught_content_immutable exempts ad-hoc definitions; the full suite on 8861ffc3
    // found one). The start's key and may_start's count use the lineage root instead, which this pins.
    id: "A3-LN1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v text; s text; m text;
begin
  execute p_sql into v; return 'ok:' || coalesce(v, '');
exception when others then get stacked diagnostics s = returned_sqlstate, m = message_text; return s || ':' || left(m, 120);
end $f$;
select 'kolom|' || coalesce((select (is_nullable = 'NO')::text from information_schema.columns
  where table_schema = 'public' and table_name = 'assessment_definitions' and column_name = 'lineage_root_definition_id'), 'absent');
select 'akar_diri|' || pg_temp.coba($s$select count(*)::text from public.assessment_definitions d where d.lineage_root_definition_id is null
  or not exists (select 1 from public.assessment_definitions r where r.id = d.lineage_root_definition_id and r.lineage_root_definition_id = r.id
                  and r.institution_id = d.institution_id)$s$);
select 'periksa|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
-- a definition inserted without a root is its own root
select 'baru|' || pg_temp.coba($s$with x as (insert into public.assessment_definitions
    select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000001', 'version', d.version + 100,
      'lineage_root_definition_id', null))).* from public.assessment_definitions d order by d.id limit 1
    returning id, lineage_root_definition_id) select (lineage_root_definition_id = id)::text from x$s$);
-- the root cannot change
select 'ubah|' || pg_temp.coba($s$update public.assessment_definitions set lineage_root_definition_id = id
  where id = (select d.id from public.assessment_definitions d where d.lineage_root_definition_id <> d.id order by d.id limit 1) returning 'UPDATED'$s$);
-- a root must be a root of the same school
select 'bukan_akar|' || pg_temp.coba($s$with x as (insert into public.assessment_definitions
    select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000002', 'version', d.version + 200,
      'lineage_root_definition_id', (select d2.id from public.assessment_definitions d2 where d2.lineage_root_definition_id <> d2.id order by d2.id limit 1)))).*
      from public.assessment_definitions d order by d.id limit 1 returning 'INSERTED') select * from x$s$);
-- the plant: the root's guard trigger disabled, the same update goes through
alter table public.assessment_definitions disable trigger assessment_definitions_lineage_root;
select 'tanam|' || pg_temp.coba($s$update public.assessment_definitions set lineage_root_definition_id = id
  where id = (select d.id from public.assessment_definitions d where d.lineage_root_definition_id <> d.id order by d.id limit 1) returning 'UPDATED'$s$);
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=0", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      c.expect(v.kolom === "true", `assessment_definitions.lineage_root_definition_id must exist and be NOT NULL: ${v.kolom ?? "no answer"}`);
      c.expect(v.akar_diri === "ok:0", `every definition's root must be a root (its own root) of the same school: ${v.akar_diri ?? "no answer"}`);
      c.expect(v.periksa === "ok:0", `the line check must find no definition with more than one predecessor: ${v.periksa ?? "no answer"}`);
      c.expect(v.baru === "ok:true", `a definition inserted without a root must be its own root: ${v.baru ?? "no answer"}`);
      c.expect(!!v.ubah && !v.ubah.startsWith("ok:"), `a definition's root must not change: ${v.ubah ?? "no answer"}`);
      c.expect(!!v.bukan_akar && !v.bukan_akar.startsWith("ok:"), `a root that is not itself a root must be refused: ${v.bukan_akar ?? "no answer"}`);
      c.expect(v.tanam === "ok:UPDATED", `the plant (the root's guard disabled) must let the root change, or this pin proves nothing: ${v.tanam ?? "no answer"}`);
      return c.verdict("assessment_definitions.lineage_root_definition_id exists, NOT NULL, and every root is a root of its own school; the line check finds no definition with two predecessors; a new definition is its own root; a root never changes, and a root that is not a root is refused; with the guard's trigger disabled (the plant) the change goes through; rolled back");
    },
  },
  {
    // A3, ruling 46: the line check refuses an ambiguous predecessor (Sharon, 478c8750: "verifies that every non-root
    // revision found exactly one predecessor, or it refuses"). A revised course's definition is given a second same-titled,
    // same-mode definition in the course it supersedes (the harness's hand, rolled back): the check must refuse.
    id: "A3-LN2",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v text; s text; m text;
begin
  execute p_sql into v; return 'ok:' || coalesce(v, '');
exception when others then get stacked diagnostics s = returned_sqlstate, m = message_text; return s || ':' || left(m, 160);
end $f$;
create temp table ln2 on commit drop as
select d0.* from public.assessment_definitions d0 where d0.module_id is not null and not d0.is_ad_hoc order by d0.id limit 1;
select 'ada|' || count(*) from ln2;
set local session_replication_role = replica;
-- revision 2 of the course (supersedes it), its module's revision (supersedes the module), and revision 2 of the
-- definition in that module (version + 300): exactly one predecessor, as salin_kursus_revisi makes them
insert into public.courses select (jsonb_populate_record(c, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000004', 'supersedes_course_id', c.id))).*
  from public.courses c where c.id = (select m.course_id from public.modules m where m.id = (select module_id from ln2));
insert into public.modules select (jsonb_populate_record(m, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000006',
    'course_id', 'a3a1e000-0000-4000-8000-a30100000004', 'supersedes_module_id', m.id))).*
  from public.modules m where m.id = (select module_id from ln2);
insert into public.assessment_definitions select (jsonb_populate_record(d0, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000005',
    'module_id', 'a3a1e000-0000-4000-8000-a30100000006', 'version', d0.version + 300))).*
  from public.assessment_definitions d0 where d0.id = (select id from ln2);
set local session_replication_role = origin;
select 'tunggal|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
-- a second same-titled, same-mode definition in the superseded module: two predecessors
set local session_replication_role = replica;
insert into public.assessment_definitions select (jsonb_populate_record(d0, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000003', 'version', d0.version + 400))).*
  from public.assessment_definitions d0 where d0.id = (select id from ln2);
set local session_replication_role = origin;
select 'ganda|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=0", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      if (!c.expect(v.ada === "1", `the world must hold a course's definition to revise (the case cannot be set up): ${v.ada ?? "no answer"}`)) return c.verdict("");
      c.expect(v.tunggal === "ok:0", `a revision with exactly one predecessor must pass the line check: ${v.tunggal ?? "no answer"}`);
      c.expect(!!v.ganda && !v.ganda.startsWith("ok:") && /predecessor|pendahulu/i.test(v.ganda), `a revision with two same-titled, same-mode predecessors must be refused by the line check: ${v.ganda ?? "no answer"}`);
      return c.verdict("a revision of a course (supersedes_course_id) with a revision of its definition passes garis_definisi_periksa, the check the lineage backfill runs; given a second same-titled, same-mode definition in the course it supersedes, the check refuses; rolled back");
    },
  },
];
