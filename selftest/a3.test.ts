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
 *   A3-R1V  A3-R1's pin (Sharon, 5ac3645d): a definition that has been sat cannot have its version updated (INV-04), so
 *           the start's (definition, version) key, read under the assignment's share lock, cannot name a moving version.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

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

export const a3DbTests: SelfTest[] = [
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
    // A3-R1's pin (Sharon, 5ac3645d): the start reads its key's version under the assignment's share lock, which holds
    // the assignment's definition still; the version itself must not change once the definition can be sat (INV-04).
    id: "A3-R1V",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create function pg_temp.coba(p_def uuid) returns text language plpgsql as $f$
declare s text; m text;
begin
  update public.assessment_definitions set version = version + 1 where id = p_def;
  return 'UPDATED';
exception when others then get stacked diagnostics s = returned_sqlstate, m = message_text; return s || ':' || m;
end $f$;
select 'def|' || d.id || '|' || pg_temp.coba(d.id)
  from public.assessment_definitions d
 where exists (select 1 from public.assessment_sessions s where s.assessment_definition_id = d.id)
 order by d.id limit 3;
-- the plant: the guard's trigger off, inside this rolled-back transaction; the same UPDATE must then go through
alter table public.assessment_definitions disable trigger assessment_definitions_taught_immutable;
select 'tanam|' || d.id || '|' || pg_temp.coba(d.id)
  from public.assessment_definitions d
 where exists (select 1 from public.assessment_sessions s where s.assessment_definition_id = d.id)
 order by d.id limit 1;
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      if (!c.expect(r.status === 0, `the probe could not run: ${(r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
      const baris = r.stdout.split("\n").filter((l) => l.startsWith("def|"));
      if (!c.expect(baris.length > 0, "the world holds no definition that has been sat (the pin cannot be asked)")) return c.verdict("");
      for (const b of baris) {
        const [, d, hasil] = b.split("|");
        c.expect(/immutable once the course is frozen \(INV-04\)/.test(hasil ?? ""), `definition ${d}, already sat: its version must not change (INV-04): ${hasil}`);
      }
      const tanam = r.stdout.split("\n").find((l) => l.startsWith("tanam|"));
      c.expect((tanam ?? "").endsWith("|UPDATED"), `the plant (the taught-immutable trigger disabled) must let the version move, or this pin proves nothing: ${tanam}`);
      return c.verdict(`for ${baris.length} definition(s) that have been sat, an UPDATE of the version is refused with INV-04 (enforce_taught_content_immutable), so the start's (definition, version) key read under the assignment's share lock names a version that cannot move; with the guard's trigger disabled (the plant) the update goes through; rolled back`);
    },
  },
];
