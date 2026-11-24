-- D2-R · STEP 0 (Sharon's §7.2 (d)): a read-only count, on staging, BEFORE the BEFORE read and before 20270124100000.
-- 20270124100000 writes every existing assessment_sessions row (its capture: assistance_policy, bersertifikasi and
-- percobaan_ke) from mode_policy as it stands before the migration changes it. This says which rows it will write, so the
-- owner sees them first: the sittings by mode and status, the open ones apart (an open certifying sitting keeps the
-- help it started with), and the policy each will be given. Nothing is written.
begin read only;
select s.mode::text as mode, s.status::text as status,
       (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) as open, count(*) as sittings,
       max(m.allows_assistance::text) as will_capture_help, max(m.reveals_rationale_on_review::text) as will_capture_reveals,
       max(m.certifies::text) as will_capture_certifies
  from public.assessment_sessions s join public.mode_policy m on m.mode = s.mode
 group by 1, 2, 3 order by 1, 2;
-- every mode has a policy row (the migration refuses otherwise)
select count(*) as sittings_whose_mode_has_no_policy
  from public.assessment_sessions s where not exists (select 1 from public.mode_policy m where m.mode = s.mode);
rollback;
