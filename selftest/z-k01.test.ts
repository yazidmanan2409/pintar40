/**
 * Z · K-01, the SQL (ruling 78; Sharon's PASS of the Z0 inventory, Q1-Q3; Bob's Q2): THE MUST-BE-RIGHT GATE IS PART OF
 * THE VERDICT EVERYWHERE IT IS READ.
 *
 *   Z-K01-01  On the seeded human-evaluation sitting (peraga-siswa's finalised Uji Penguasaan, mastery 1.0 over a mark
 *             of 0.60), each case rolled back. Made a gate-only failure (her must-be-right answer moved to a wrong option,
 *             the result row's gate false): her session_outcome says lulus false and carries tujuan_gerbang, that item's
 *             objectives; her teacher's tujuan_belum_tercapai returns exactly those objectives (the learner's key equals
 *             the teacher's gate rows); the head of department's retake queue shows the figure, the target and gerbang
 *             false, the school admin none of the three. Untouched (the gate passed): tujuan_gerbang [] and nothing for
 *             the teacher. Another learner reading her session is refused. A pre-test carries no key. The objectives come
 *             from the result row's own key: a basis key that makes her answer right leaves nothing missed.
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";
const GURU = "peraga-guru@evaluasi.pintar.test";
const KAPRODI = "peraga-kaprodi@evaluasi.pintar.test";
const ADMIN = "peraga-admin@evaluasi.pintar.test";
type Mode = { gerbang?: boolean; pra?: boolean; basis?: boolean; orangLain?: boolean; antrean?: boolean };

function baca(m: Mode): Record<string, string> {
  const gagal = m.gerbang === false;
  return psql(`begin;
create temp table t_s on commit drop as select s.* from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id join auth.users u on u.id = a.auth_user_id
 where u.email = ${lit(SISWA)} and s.status = 'FINALIZED' and s.mode = 'POST_TEST';
create temp table t_w on commit drop as select f.item_id, (select o.label from public.item_options o where o.item_id = f.item_id and not o.is_correct order by o.label limit 1) as salah,
  (select i.objective_ids from public.items i where i.id = f.item_id) as tujuan
  from public.session_final_responses((select id from t_s)) f where f.is_safety_critical limit 1;
grant select on t_s, t_w to authenticated;
select 'tujuan|' || (select array_to_string(tujuan, ',') from t_w);
set local session_replication_role = replica;
${gagal ? `update public.responses r set value = jsonb_build_object('pilihan', (select salah from t_w)) from public.presented_items p
 where p.id = r.presented_item_id and r.is_final and p.session_id = (select id from t_s) and p.item_id = (select item_id from t_w);
update public.assessment_results set safety_gate_passed = false where session_id = (select id from t_s);` : ""}
${m.pra ? `update public.assessment_sessions set mode = 'PRE_TEST' where id = (select id from t_s);` : ""}
${m.basis ? `create temp table t_r on commit drop as select gen_random_uuid() as baru, r.id as asli from public.assessment_results r where r.session_id = (select id from t_s) and r.supersedes_result_id is null;
insert into public.assessment_results select (jsonb_populate_record(r, jsonb_build_object('id', (select baru from t_r), 'supersedes_result_id', r.id,
  'recomputation_reason', 'Z-K01-01: a governed key correction', 'computed_at', now() + interval '1 minute'))).*
  from public.assessment_results r where r.id = (select asli from t_r);
insert into public.assessment_result_bases (result_id, session_id, institution_id, key_correction_id, supersedes_result_id, basis, written_at)
select (select baru from t_r), t.id, t.institution_id, gen_random_uuid(), (select asli from t_r),
       jsonb_build_object('soal', jsonb_build_object((select item_id from t_w)::text, jsonb_build_object('kunci', jsonb_build_array((select salah from t_w))))), now() + interval '1 minute'
  from t_s t;` : ""}
${m.antrean ? `insert into public.attempt_requests (id, person_id, session_id, assessment_assignment_id, institution_id, requested_by_person_id, requested_at, reason, status)
select gen_random_uuid(), t.person_id, t.id, t.assessment_assignment_id, t.institution_id,
       (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(GURU)}), now(), 'Z-K01-01: one more attempt for the selftest', 'PENDING' from t_s t;` : ""}
set local session_replication_role = origin;
create function pg_temp.coba_hasil() returns text language plpgsql as $f$
begin
  return (select coalesce(x ->> 'lulus', 'null') || '|' || coalesce(x ->> 'gerbang_keselamatan', 'null') || '|' || coalesce((select string_agg(e, ',' order by e) from jsonb_array_elements_text(x -> 'tujuan_gerbang') e), case when x ? 'tujuan_gerbang' then '' else 'TIDAK ADA' end)
            from public.session_outcome((select id from t_s)) x);
exception when others then return 'ditolak|' || sqlerrm;
end $f$;
select selftest.as_user(${lit(m.orangLain ? "__lain__" : SISWA).replace("'__lain__'", "(select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id join public.enrollments e on e.person_id = a.person_id where e.status = 'ACTIVE' and u.email is not null and u.email <> " + lit(SISWA) + " and not exists (select 1 from public.role_assignments ra where ra.person_id = a.person_id) order by u.email limit 1)")});
select 'murid|' || pg_temp.coba_hasil();
select selftest.as_user(${lit(GURU)});
select 'guru|' || coalesce((select string_agg(t.objective_id::text, ',' order by t.objective_id) from public.tujuan_belum_tercapai((select class_node_id from t_s), (select person_id from t_s)) t), '');
${m.antrean ? `select selftest.as_user(${lit(KAPRODI)});
select 'kaprodi|' || coalesce((select string_agg(coalesce(a.hasil_terakhir::text, '-') || ':' || coalesce(a.target::text, '-') || ':' || coalesce(to_jsonb(a) ->> 'gerbang', 'null'), ',') from public.percobaan_antrean((select institution_id from t_s)) a), 'none');
select selftest.as_user(${lit(ADMIN)});
select 'admin|' || coalesce((select string_agg(coalesce(a.hasil_terakhir::text, '-') || ':' || coalesce(a.target::text, '-') || ':' || coalesce(to_jsonb(a) ->> 'gerbang', 'null'), ',') from public.percobaan_antrean((select institution_id from t_s)) a), 'none');` : ""}
rollback;`).split("\n").filter((b) => /^(tujuan|murid|guru|kaprodi|admin)\|/.test(b))
    .reduce<Record<string, string>>((o, b) => { const i = b.indexOf("|"); o[b.slice(0, i)] = b.slice(i + 1); return o; }, {});
}

export const zK01Tests: SelfTest[] = [
  {
    id: "Z-K01-01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const coba = (m: Mode) => { try { return baca(m); } catch (e) { return { galat: (e as Error).message, murid: `galat: ${(e as Error).message}` } as Record<string, string>; } };
      const gagal = coba({ gerbang: false, antrean: true });
      const tujuan = gagal.tujuan ?? "";
      c.expect(tujuan !== "", `the seeded sitting's must-be-right item has no objective: ${JSON.stringify(gagal)}`);
      // the gate-only failure: the learner told why, the teacher shown the same objectives, the queue not «reached»
      c.expect(gagal.murid === `false|false|${tujuan}`, `the learner's result of a gate-only failure: ${gagal.murid} (lulus false, gate false, tujuan_gerbang ${tujuan})`);
      c.expect(gagal.guru === tujuan, `the teacher's objectives not yet reached: «${gagal.guru}» (exactly the learner's tujuan_gerbang, ${tujuan})`);
      c.expect(/^[0-9.]+:0\.60:false$/.test(gagal.kaprodi ?? ""), `the head of department's retake queue: ${gagal.kaprodi} (figure, target and gerbang false)`);
      c.expect(gagal.admin === "-:-:null", `the school admin's retake queue: ${gagal.admin} (no figure, no target, no gate: an administrator is not an examiner)`);
      // the gate passed: nothing missed, nothing to study
      const lulus = coba({});
      c.expect(lulus.murid === "true||" || lulus.murid === "true|true|", `the untouched sitting (gate passed): ${lulus.murid} (lulus true, gate true, tujuan_gerbang [])`);
      c.expect(lulus.guru === "", `the teacher's objectives for the untouched sitting: «${lulus.guru}» (none)`);
      // another learner is refused the session
      const lain = coba({ gerbang: false, orangLain: true });
      c.expect((lain.murid ?? "").startsWith("ditolak|"), `another learner reading her session: ${lain.murid} (refused)`);
      // a pre-test carries no key
      const pra = coba({ gerbang: false, pra: true });
      c.expect((pra.murid ?? "").endsWith("|TIDAK ADA"), `a pre-test's result: ${pra.murid} (no tujuan_gerbang key)`);
      // the row's own key decides: a basis key that makes her answer right leaves nothing missed
      const basis = coba({ gerbang: false, basis: true });
      c.expect(basis.murid === "false|false|", `the gate-failed row graded by its basis's key, which accepts her answer: ${basis.murid} (tujuan_gerbang [], never regraded with another key)`);
      return c.verdict(`executes session_outcome, tujuan_belum_tercapai and percobaan_antrean against the migrations, rolled back, on the seeded sitting: a gate-only failure gives the learner lulus false with tujuan_gerbang ${tujuan}, the teacher exactly ${gagal.guru}, the head of department's queue ${gagal.kaprodi} and the admin's ${gagal.admin}; the gate passed gives ${lulus.murid} and nothing to the teacher; another learner is refused; a pre-test carries no key; a basis key that accepts her answer leaves nothing missed`);
    },
  },
];
