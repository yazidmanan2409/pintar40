/**
 * Z · V2 (R-22, PETE-27; Sharon VERIFY-58-feb1317b.md; ruling 81): THE RESULT IN FORCE ON THE LEARNER'S SUMMARY.
 *
 *   Z-V2-01  hasil_belajar_sesi_saya (Hasil Belajar's summary), read by the learner on the seeded human-evaluation
 *            sitting (her one finalised Uji Penguasaan), each case in its own rolled-back transaction with a later
 *            sitting of the same Uji Penguasaan added: none, SELESAI with the finished result and no line; a retake
 *            begun (IN_PROGRESS) or paused, the finished result stays in force with ulang_berjalan; a retake ended
 *            unfinished (TERMINATED, EXPIRED), the finished result stays and no line; a retake finalised later replaces
 *            it, no line. D14: a recalculation of the result in force is marked on it (sesi_saya_dihitung_ulang). Red on
 *            300: a later sitting begun or ended turns the summary to BERJALAN with no result.
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";

function ringkasan(st: string | null, ulangHitung = false): string {
  const tambah = st === null ? "" : `
insert into public.assessment_sessions select (jsonb_populate_record(t, jsonb_build_object('id', pg_temp.z_baru(), 'status', ${lit(st)},
  'created_at', now() + interval '1 minute', 'started_at', now() + interval '1 minute',
  'submitted_at', ${st === "FINALIZED" ? "now() + interval '30 minutes'" : "null"}, 'finalized_at', ${st === "FINALIZED" ? "now() + interval '30 minutes'" : "null"}))).* from t_s t;
${st === "FINALIZED" ? `insert into public.assessment_results select (jsonb_populate_record(r, jsonb_build_object('id', gen_random_uuid(), 'session_id', pg_temp.z_baru(), 'computed_at', now() + interval '30 minutes'))).*
  from public.assessment_results r where r.session_id = (select id from t_s) and r.supersedes_result_id is null;` : ""}`;
  const hitung = !ulangHitung ? "" : `
insert into public.assessment_results select (jsonb_populate_record(r, jsonb_build_object('id', gen_random_uuid(), 'supersedes_result_id', r.id,
  'recomputation_reason', 'Z-V2-01: an audited recalculation', 'mastery', 0.5, 'computed_at', now() + interval '2 minutes'))).*
  from public.assessment_results r where r.session_id = (select id from t_s) and r.supersedes_result_id is null;`;
  return psql(`begin;
create temp table t_s on commit drop as select s.* from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id
  join auth.users u on u.id = a.auth_user_id where u.email = ${lit(SISWA)} and s.status = 'FINALIZED' and s.mode = 'POST_TEST';
create temp table t_baru on commit drop as select gen_random_uuid() as id;
create function pg_temp.z_baru() returns uuid language sql stable as $$ select id from t_baru $$;
grant select on t_s, t_baru to authenticated;
set local session_replication_role = replica;${tambah}${hitung}
set local session_replication_role = origin;
select selftest.as_user(${lit(SISWA)});
select 'hasil|' || coalesce(h.keadaan, 'NULL') || '|' || case when h.post_session = (select id from t_s) then 'asli' when h.post_session = (select id from t_baru) then 'baru' else coalesce(h.post_session::text, 'NULL') end
  || '|' || coalesce(to_jsonb(h) ->> 'ulang_berjalan', 'NULL') || '|' || coalesce(public.sesi_saya_dihitung_ulang(h.post_session)::text, 'NULL')
  from public.hasil_belajar_sesi_saya() h where h.learning_assignment_id = (select learning_assignment_id from t_s);
rollback;`).split("\n").find((b) => b.startsWith("hasil|"))?.slice(6) ?? "no row";
}

export const zV2Tests: SelfTest[] = [
  {
    id: "Z-V2-01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const baca = (st: string | null, h = false) => { try { return ringkasan(st, h); } catch (e) { return `error: ${(e as Error).message}`; } };
      const kasus: Array<[string | null, boolean, string, string]> = [
        [null, false, "SELESAI|asli|false|false", "no later sitting"],
        ["IN_PROGRESS", false, "SELESAI|asli|true|false", "a retake begun and not finished: the finished result stays in force, with the line"],
        ["PAUSED", false, "SELESAI|asli|true|false", "a retake paused: still open, the line"],
        ["TERMINATED", false, "SELESAI|asli|false|false", "a retake ended unfinished (by a teacher or a rollover): the finished result kept, no line"],
        ["EXPIRED", false, "SELESAI|asli|false|false", "a retake timed out: the finished result kept, no line"],
        ["FINALIZED", false, "SELESAI|baru|false|false", "a retake finalised later replaces the result, no line"],
        [null, true, "SELESAI|asli|false|true", "D14: an audited recalculation of the result in force is marked on it"],
      ];
      const lihat: string[] = [];
      for (const [st, h, mau, apa] of kasus) {
        const dapat = baca(st, h);
        lihat.push(`${st ?? (h ? "recalculated" : "none")}: ${dapat}`);
        c.expect(dapat === mau, `${apa}: ${dapat} (expected ${mau})`);
      }
      return c.verdict(`reads hasil_belajar_sesi_saya as the learner on the seeded sitting, each case rolled back (keadaan|which result|ulang_berjalan|D14 marker): ${lihat.join("; ")}`);
    },
  },
];
