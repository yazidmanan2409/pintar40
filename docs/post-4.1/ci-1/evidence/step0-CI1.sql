-- CI-1 · STEP 0: a read-only count, on staging, BEFORE the BEFORE read and before 20270125100000.
-- 20270125100000 writes no record. It changes what the readers SAY: from it on, an issued certificate whose review is open
-- OR whose result in force (hasil_murid_id) fails the certifying rule (sertifikat_layak_dengan) reads DITINJAU, not
-- BERLAKU, publicly, to its learner and on Konfigurasi. This says, before the promotion, which issued certificates will read
-- differently, and why, so the owner sees them first. The functions it uses all exist at 309. Nothing is written.
begin read only;
-- the issued certificates by what the one helper will say of them
select (exists (select 1 from public.certificate_reviews v where v.certificate_id = c.id and v.decision is null)) as review_open,
       not coalesce((select public.sertifikat_layak_dengan(c.session_id, r.mastery, r.safety_gate_passed)
                       from public.assessment_results r where r.id = public.hasil_murid_id(c.session_id)), false) as result_in_force_fails,
       count(*) as issued_certificates
  from public.certificates c where c.status = 'ISSUED'
 group by 1, 2 order by 1, 2;
-- the ones that will turn from BERLAKU to DITINJAU (no open review, result in force fails), by the rule's parts: zero is
-- expected unless an L-67 row exists (a review CONFIRMED on a failing result) or the rule reads differently today than at issue
select s.mode::text as mode, m.certifies as mode_certifies_now,
       exists (select 1 from public.official_sessions o where o.id = c.session_id) as official,
       s.pass_mark is not null as has_pass_mark, r.id is not null as has_result_in_force,
       coalesce(r.safety_gate_passed, false) as gate_passed, (r.mastery >= s.pass_mark) as mastery_clears_mark,
       exists (select 1 from public.certificate_reviews v where v.certificate_id = c.id and v.decision = 'CONFIRMED') as was_confirmed,
       count(*) as will_read_ditinjau
  from public.certificates c
  join public.assessment_sessions s on s.id = c.session_id
  left join public.mode_policy m on m.mode = s.mode
  left join public.assessment_results r on r.id = public.hasil_murid_id(c.session_id)
 where c.status = 'ISSUED'
   and not exists (select 1 from public.certificate_reviews v where v.certificate_id = c.id and v.decision is null)
   and not coalesce(public.sertifikat_layak_dengan(c.session_id, r.mastery, r.safety_gate_passed), false)
 group by 1, 2, 3, 4, 5, 6, 7, 8 order by 1;
rollback;
