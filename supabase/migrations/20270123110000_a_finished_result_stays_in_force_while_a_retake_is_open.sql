-- ---------------------------------------------------------------------------------------------------------------
-- Z · V2 (R-22, PETE-27; Sharon VERIFY-58-feb1317b.md; ruling 81): A FINISHED RESULT STAYS IN FORCE WHILE A RETAKE IS
-- OPEN, AND AFTER IT ENDS. hasil_belajar_sesi_orang took the latest sitting BEGUN (created_at desc), so a retake begun and
-- not finished hid the learner's finished Uji Penguasaan from Hasil Belajar (BERJALAN, no result), and once that retake
-- ended unfinished (timed out, ended by a teacher or a rollover) the finished result was gone from their summary, while
-- the teacher's readers kept it (the latest FINALISED). Red first: Z-V2-01.
--
--   * The summary reads the latest FINALISED sitting of each test (finalized_at, then created_at): SELESAI whenever an
--     Uji Penguasaan was finalised, whatever later sitting was begun or ended; a retake finalised later replaces it.
--     DITUTUP_AWAL and BERJALAN are read as before for a chapter with no finalised Uji Penguasaan.
--   * A fifth column, ulang_berjalan: true only while a later sitting of the same Uji Penguasaan is open (CREATED,
--     IN_PROGRESS, PAUSED), never after an abandon, a time-out, a teacher's end, a withdrawal or finalisation. The page
--     says Daisy's line, hasil.ulang_berjalan (approved by the owner), beside the result in force.
--   * hasil_belajar_sesi_saya returns the same rows (it is `select *` of this), so both are dropped and created with the
--     new column; its grant (authenticated) and registry row are unchanged. hasil_belajar_sekolah reads the two session
--     columns by name and is unchanged. The D14 marker is the page's (sesi_saya_dihitung_ulang on post_session).
-- ---------------------------------------------------------------------------------------------------------------

drop function public.hasil_belajar_sesi_saya();
drop function public.hasil_belajar_sesi_orang(uuid);

create function public.hasil_belajar_sesi_orang(p_person uuid)
 returns table(learning_assignment_id uuid, keadaan text, pre_session uuid, post_session uuid, ulang_berjalan boolean)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  with h as (
    -- my_learning_history's rows, for this person
    select la.id, la.status,
           exists (select 1 from public.enrollments e
                     join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                     join public.org_nodes n on n.id = m.node_id
                    where e.person_id = p_person and e.status = 'ACTIVE'
                      and (n.id = la.node_id or n.jalur @> array[la.node_id])) as kini
      from public.learning_assignments la
     where la.status in ('ACTIVE', 'ENDED', 'WITHDRAWN')
       and exists (select 1 from public.enrollments e
                     join public.memberships m on m.enrollment_id = e.id
                     join public.org_nodes n on n.id = m.node_id
                    where e.person_id = p_person
                      and m.academic_period_id is not distinct from la.academic_period_id
                      and (n.id = la.node_id or n.jalur @> array[la.node_id]))
  ),
  sesi as (
    select s.learning_assignment_id, s.mode, s.id, s.status, s.created_at, s.finalized_at
      from public.assessment_sessions s
     where s.person_id = p_person and s.learning_assignment_id in (select id from h)
       and s.mode in ('PRE_TEST', 'POST_TEST')
  ),
  -- the latest sitting of each test that was begun (for a chapter still under way)
  mulai as (
    select distinct on (x.learning_assignment_id, x.mode) x.*
      from sesi x order by x.learning_assignment_id, x.mode, x.created_at desc
  ),
  -- Z V2: the latest FINALISED sitting of each test, the result in force whatever was begun or ended after it
  selesai as (
    select distinct on (x.learning_assignment_id, x.mode) x.*
      from sesi x where x.status = 'FINALIZED'
     order by x.learning_assignment_id, x.mode, x.finalized_at desc nulls last, x.created_at desc
  ),
  c as (
    select h.id, h.status, h.kini,
           (select a.id from selesai a where a.learning_assignment_id = h.id and a.mode = 'PRE_TEST') as pre_fin,
           (select a.id from selesai a where a.learning_assignment_id = h.id and a.mode = 'POST_TEST') as post_fin,
           (select a.created_at from selesai a where a.learning_assignment_id = h.id and a.mode = 'POST_TEST') as post_fin_pada,
           exists (select 1 from mulai a where a.learning_assignment_id = h.id) as ada
      from h
  ),
  k as (
    select c.*,
           case when c.post_fin is not null then 'SELESAI'
                when (c.status <> 'ACTIVE' or not c.kini) and c.pre_fin is not null then 'DITUTUP_AWAL'
                when c.status = 'ACTIVE' and c.kini and c.ada then 'BERJALAN'
           end as keadaan
      from c
  )
  select k.id, k.keadaan,
         case when k.keadaan in ('SELESAI', 'DITUTUP_AWAL') then k.pre_fin end,
         case when k.keadaan = 'SELESAI' then k.post_fin end,
         k.keadaan = 'SELESAI' and exists (
           select 1 from sesi x
            where x.learning_assignment_id = k.id and x.mode = 'POST_TEST'
              and x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and x.created_at > k.post_fin_pada)
    from k where k.keadaan is not null
$function$;
revoke all on function public.hasil_belajar_sesi_orang(uuid) from public, anon, authenticated, service_role;

create function public.hasil_belajar_sesi_saya()
 returns table(learning_assignment_id uuid, keadaan text, pre_session uuid, post_session uuid, ulang_berjalan boolean)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select * from public.hasil_belajar_sesi_orang(public.current_person_id()) where public.current_person_id() is not null
$function$;
revoke all on function public.hasil_belajar_sesi_saya() from public, anon, authenticated, service_role;
grant execute on function public.hasil_belajar_sesi_saya() to authenticated;

do $$
begin
  if pg_get_functiondef('public.hasil_belajar_sesi_orang(uuid)'::regprocedure) !~ 'x.status = ''FINALIZED''' then
    raise exception 'Z V2: the summary does not read the latest finalised sitting';
  end if;
  if not has_function_privilege('authenticated', 'public.hasil_belajar_sesi_saya()', 'execute')
     or has_function_privilege('authenticated', 'public.hasil_belajar_sesi_orang(uuid)', 'execute')
     or has_function_privilege('anon', 'public.hasil_belajar_sesi_saya()', 'execute') then
    raise exception 'Z V2: the summary''s grants moved';
  end if;
  if not exists (select 1 from public.client_rpc_registry where function_name = 'hasil_belajar_sesi_saya') then
    raise exception 'Z V2: hasil_belajar_sesi_saya lost its registry row';
  end if;
end $$;
