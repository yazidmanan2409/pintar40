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
 *             Sharon C3 (Z1-SQL-df8d84a0.md): two key corrections through the real two-person path (the school's admin
 *             proposes, the head of department confirms): one making her missed must-be-right answer right gives the
 *             gate passed and [] to the learner and nothing to the teacher; one making her right answer wrong gives its
 *             objective to both. In every case's world, a failed gate ⇔ a non-empty helper, apart from the C2 case.
 *             Bob's ruling: the retake queue reads the result in force (hasil_terkini_id, D11), so a recalculation
 *             stamped before its original is the one whose figure and gate it shows. Red on the queue's computed_at read.
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";
const GURU = "peraga-guru@evaluasi.pintar.test";
const KAPRODI = "peraga-kaprodi@evaluasi.pintar.test";
const ADMIN = "peraga-admin@evaluasi.pintar.test";
type Mode = { gerbang?: boolean; pra?: boolean; basis?: boolean; orangLain?: boolean; antrean?: boolean; koreksi?: boolean; dulu?: boolean };

// Sharon C3: over every Uji Penguasaan result in the world (inside the case's transaction, so its own rows count): a failed
// gate <=> a non-empty helper, apart from the C2 case (every must-be-right item missed has no objective)
const DUNIA = `with r as (
  select r.id, not r.safety_gate_passed as gagal, cardinality(public.tujuan_gerbang_terlewat(r.id)) as helper,
         (select count(*) from public.session_final_responses(r.session_id) f join public.items i on i.id = f.item_id
           left join public.assessment_result_bases b on b.result_id = r.id
          where f.is_safety_critical and coalesce(case when b.basis -> 'soal' ? f.item_id::text then public.grade_kunci(f.item_id, f.value,
                  array(select jsonb_array_elements_text(b.basis -> 'soal' -> f.item_id::text -> 'kunci'))) end, public.grade_response(f.item_id, f.value)) < 1) as meleset,
         (select count(*) from public.session_final_responses(r.session_id) f join public.items i on i.id = f.item_id
           left join public.assessment_result_bases b on b.result_id = r.id
          where f.is_safety_critical and cardinality(i.objective_ids) > 0 and coalesce(case when b.basis -> 'soal' ? f.item_id::text then public.grade_kunci(f.item_id, f.value,
                  array(select jsonb_array_elements_text(b.basis -> 'soal' -> f.item_id::text -> 'kunci'))) end, public.grade_response(f.item_id, f.value)) < 1) as meleset_bertujuan
    from public.assessment_results r join public.assessment_sessions s on s.id = r.session_id
   where s.mode = 'POST_TEST')
select 'dunia|' || count(*) || '|' || count(*) filter (where gagal) || '|' || count(*) filter (where gagal and meleset > 0 and meleset_bertujuan = 0)
       || '|' || count(*) filter (where gagal <> (helper > 0) and not (gagal and meleset > 0 and meleset_bertujuan = 0))
  from r;`;

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
select 'tujuanKode|' || coalesce((select string_agg(o.code, ',' order by o.code) from public.learning_objectives o where o.id in (select unnest(tujuan) from t_w)), '');
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
${m.dulu ? `insert into public.assessment_results select (jsonb_populate_record(r, jsonb_build_object('id', gen_random_uuid(), 'supersedes_result_id', r.id,
  'recomputation_reason', 'Z-K01-01: a recalculation stamped before its original (D11)', 'mastery', 0.1, 'safety_gate_passed', true,
  'computed_at', r.computed_at - interval '1 day'))).*
  from public.assessment_results r where r.session_id = (select id from t_s) and r.supersedes_result_id is null;` : ""}
${m.antrean ? `insert into public.attempt_requests (id, person_id, session_id, assessment_assignment_id, institution_id, requested_by_person_id, requested_at, reason, status)
select gen_random_uuid(), t.person_id, t.id, t.assessment_assignment_id, t.institution_id,
       (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(GURU)}), now(), 'Z-K01-01: one more attempt for the selftest', 'PENDING' from t_s t;` : ""}
set local session_replication_role = origin;
${m.koreksi ? `select selftest.as_user(${lit(ADMIN)});
select set_config('z.k', public.ajukan_koreksi_kunci((select item_id from t_w), array[(select salah from t_w)], 'Z-K01-01 C3: kunci soal wajib diperbaiki oleh dua orang.') ->> 'koreksi', false);
reset role;
select selftest.as_user(${lit(KAPRODI)});
select 'koreksi|' || (public.tegaskan_koreksi_kunci(current_setting('z.k')::uuid) ->> 'ok');
reset role;` : ""}
create function pg_temp.coba_hasil() returns text language plpgsql as $f$
begin
  return (select coalesce(x ->> 'lulus', 'null') || '|' || coalesce(x ->> 'gerbang_keselamatan', 'null') || '|' || coalesce((select string_agg(e, ',' order by e) from jsonb_array_elements_text(x -> 'tujuan_gerbang') e), case when x ? 'tujuan_gerbang' then '' else 'TIDAK ADA' end)
            from public.session_outcome((select id from t_s)) x);
exception when others then return 'ditolak|' || sqlerrm;
end $f$;
create function pg_temp.coba_kode() returns text language plpgsql as $f$
begin
  return coalesce((select case when x ? 'tujuan_gerbang_kode' then coalesce((select string_agg(e, ',' order by e) from jsonb_array_elements_text(x -> 'tujuan_gerbang_kode') e), '') else 'TIDAK ADA' end
                     from public.session_outcome((select id from t_s)) x), 'null');
exception when others then return 'ditolak';
end $f$;
select selftest.as_user(${lit(m.orangLain ? "__lain__" : SISWA).replace("'__lain__'", "(select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id join public.enrollments e on e.person_id = a.person_id where e.status = 'ACTIVE' and u.email is not null and u.email <> " + lit(SISWA) + " and not exists (select 1 from public.role_assignments ra where ra.person_id = a.person_id) order by u.email limit 1)")});
select 'murid|' || pg_temp.coba_hasil();
select 'muridKode|' || pg_temp.coba_kode();
select selftest.as_user(${lit(GURU)});
select 'guru|' || coalesce((select string_agg(t.objective_id::text, ',' order by t.objective_id) from public.tujuan_belum_tercapai((select class_node_id from t_s), (select person_id from t_s)) t), '');
${m.antrean ? `select selftest.as_user(${lit(KAPRODI)});
select 'kaprodi|' || coalesce((select string_agg(coalesce(a.hasil_terakhir::text, '-') || ':' || coalesce(a.target::text, '-') || ':' || coalesce(to_jsonb(a) ->> 'gerbang', 'null'), ',') from public.percobaan_antrean((select institution_id from t_s)) a), 'none');
select selftest.as_user(${lit(ADMIN)});
select 'admin|' || coalesce((select string_agg(coalesce(a.hasil_terakhir::text, '-') || ':' || coalesce(a.target::text, '-') || ':' || coalesce(to_jsonb(a) ->> 'gerbang', 'null'), ',') from public.percobaan_antrean((select institution_id from t_s)) a), 'none');` : ""}
reset role;
${DUNIA}
rollback;`).split("\n").filter((b) => /^(tujuan|tujuanKode|murid|muridKode|guru|kaprodi|admin|koreksi|dunia)\|/.test(b))
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
      // Z3-A: the learner cannot read objectives by id, so her result carries their codes too, from the same helper and row
      c.expect((gagal.tujuanKode ?? "") !== "" && gagal.muridKode === gagal.tujuanKode, `the learner's tujuan_gerbang_kode of a gate-only failure: ${gagal.muridKode} (expected ${gagal.tujuanKode}, the codes of tujuan_gerbang)`);
      c.expect(gagal.guru === tujuan, `the teacher's objectives not yet reached: «${gagal.guru}» (exactly the learner's tujuan_gerbang, ${tujuan})`);
      c.expect(/^[0-9.]+:0\.60:false$/.test(gagal.kaprodi ?? ""), `the head of department's retake queue: ${gagal.kaprodi} (figure, target and gerbang false)`);
      c.expect(gagal.admin === "-:-:null", `the school admin's retake queue: ${gagal.admin} (no figure, no target, no gate: an administrator is not an examiner)`);
      // the gate passed: nothing missed, nothing to study
      const lulus = coba({});
      c.expect(lulus.murid === "true||" || lulus.murid === "true|true|", `the untouched sitting (gate passed): ${lulus.murid} (lulus true, gate true, tujuan_gerbang [])`);
      c.expect(lulus.muridKode === "", `the untouched sitting's tujuan_gerbang_kode: ${lulus.muridKode} (expected [])`);
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
      // Sharon C3: two key corrections through the real two-person path (the school's admin proposes, the head of
      // department confirms; tegaskan_koreksi_kunci writes the corrected result), read by the learner and the teacher
      const keBenar = coba({ gerbang: false, koreksi: true });
      c.expect(keBenar.koreksi === "true", `the correction that makes her missed must-be-right answer right was not confirmed: ${JSON.stringify(keBenar)}`);
      c.expect(keBenar.murid === "true|true|", `after a confirmed correction makes her must-be-right answer right: ${keBenar.murid} (lulus true, gate passed, tujuan_gerbang [])`);
      c.expect(keBenar.guru === "", `the teacher's objectives after that correction: «${keBenar.guru}» (none)`);
      const keSalah = coba({ koreksi: true });
      c.expect(keSalah.koreksi === "true", `the correction that makes her right must-be-right answer wrong was not confirmed: ${JSON.stringify(keSalah)}`);
      c.expect(keSalah.murid === `false|false|${tujuan}`, `after a confirmed correction makes her must-be-right answer wrong: ${keSalah.murid} (lulus false, gate false, tujuan_gerbang ${tujuan})`);
      c.expect(keSalah.guru === tujuan, `the teacher's objectives after that correction: «${keSalah.guru}» (exactly ${tujuan})`);
      // Bob's ruling on Sharon's pre-existing item: the retake queue reads the result in force (hasil_terkini_id, D11), not
      // the newest computed_at: a recalculation stamped before its original is still the one shown, figure and gate
      const dulu = coba({ dulu: true, antrean: true });
      c.expect(/^0\.10*:0\.60:true$/.test(dulu.kaprodi ?? ""), `the retake queue beside a recalculation stamped before its original: ${dulu.kaprodi} (expected the recalculation's 0.1, its target and its gate true)`);
      // Sharon C3: a failed gate <=> a non-empty helper over every Uji Penguasaan result, in every case's world
      // (not the basis case: its hand-written row keeps gate false beside a key that accepts her answer, on purpose, to show
      // the helper reads the row's key; the real correction path never writes that row, and keBenar shows what it writes)
      const dunia = [gagal, lulus, keBenar, keSalah, dulu].map((k) => (k.dunia ?? "").split("|").map(Number));
      const nHasil = dunia.reduce((a, d) => a + (d[0] || 0), 0), nGagal = dunia.reduce((a, d) => a + (d[1] || 0), 0), nC2 = dunia.reduce((a, d) => a + (d[2] || 0), 0);
      c.expect(dunia.every((d) => d.length === 4 && d[3] === 0), `a failed gate without the helper's objectives, or a passed gate with them, outside the C2 case: ${JSON.stringify(dunia)} ([results, failed, C2, mismatches] per case)`);
      c.expect(nGagal > 0, `no failed gate in any case's world, so the equivalence proves nothing: ${JSON.stringify(dunia)}`);
      return c.verdict(`executes session_outcome, tujuan_belum_tercapai and percobaan_antrean against the migrations, rolled back, on the seeded sitting: a gate-only failure gives the learner lulus false with tujuan_gerbang ${tujuan}, the teacher exactly ${gagal.guru}, the head of department's queue ${gagal.kaprodi} and the admin's ${gagal.admin}; the gate passed gives ${lulus.murid} and nothing to the teacher; another learner is refused; a pre-test carries no key; a basis key that accepts her answer leaves nothing missed; two confirmed two-person corrections give ${keBenar.murid} / «${keBenar.guru}» (made right) and ${keSalah.murid} / «${keSalah.guru}» (made wrong); the retake queue beside a recalculation stamped before its original shows ${dulu.kaprodi}; over ${nHasil} results in the cases' worlds, ${nGagal} with a failed gate, a failed gate always has the helper's objectives and a passed one never (${nC2} C2 rows apart)`);
    },
  },
];
