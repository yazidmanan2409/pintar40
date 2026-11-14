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
 */
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

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
