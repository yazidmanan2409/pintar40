-- B2 · Printed-report identification (C6): the database half
-- (docs/completion-4.1/batches/B2-COMPLETION.md; B2-ARCHITECT-NOTES.md §1, the owner's content rule, and §3, Sharon's
-- five changes; THE PLAN §5.2).
--
-- (1) ONE READ OF A LEARNER'S RESULTS. hasil_belajar_sesi_orang(person) returns, per learning assignment the learner
--     has worked on, what /belajar/hasil shows and from which sittings: SELESAI (the Uji Penguasaan finished, and the
--     Pemetaan Awal beside it when finished), DITUTUP_AWAL (a closed chapter, or one of a class left, whose Pemetaan Awal
--     was finished) or BERJALAN (begun, nothing finished; no evidence). The page reads it as the caller
--     (hasil_belajar_sesi_saya), and the print writer reads the same function, so the paper and the event cannot
--     disagree (Sharon's change 3). The rule is the one hasilBelajar applied in TypeScript until now, moved here whole.
-- (2) A LEARNER'S OWN-RESULTS PRINT IS PERSON-SCOPED. akuntabilitas_catat accepts {report, person_id}:
--     - the person must be the requester, who is the verified session's user (the route passes auth.getUser()'s id);
--     - its school snapshot is each printed sitting's own institution_id, from (1): never the learner's live schools,
--       so no historical evidence is attributed to a new school by a transfer (the owner's condition);
--     - several schools are never refused, and no evidence is an empty snapshot (the platform admin's alone).
--     The one-school constraint holds for every other print.
-- (3) THE COMPLETENESS NOTICE'S READER (Sharon's change 6). akuntabilitas_gagal_ringkas(): the platform admin's alone;
--     the count and the last instant of sign-in and sign-out writes that could not be made, over the health check's
--     window (today and the six days before it, in WIB). A failed print write prints nothing and leaves no gap, so it
--     is not counted (Daisy's question, B2-ARCHITECT-NOTES.md §4).

-- ═══════════════════════════════════════════════════════════ (1) one read of a learner's results
create or replace function public.hasil_belajar_sesi_orang(p_person uuid)
returns table (learning_assignment_id uuid, keadaan text, pre_session uuid, post_session uuid)
language sql stable security definer set search_path = public, pg_temp as $$
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
  -- my_cycle_state's sittings: the latest of each test, for this person
  akhir as (
    select distinct on (s.learning_assignment_id, s.mode) s.learning_assignment_id, s.mode, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = p_person and s.learning_assignment_id in (select id from h)
       and s.mode in ('PRE_TEST', 'POST_TEST')
     order by s.learning_assignment_id, s.mode, s.created_at desc
  ),
  c as (
    select h.id, h.status, h.kini,
           (select a.id from akhir a where a.learning_assignment_id = h.id and a.mode = 'PRE_TEST') as pre_id,
           (select a.status from akhir a where a.learning_assignment_id = h.id and a.mode = 'PRE_TEST') as pre_st,
           (select a.id from akhir a where a.learning_assignment_id = h.id and a.mode = 'POST_TEST') as post_id,
           (select a.status from akhir a where a.learning_assignment_id = h.id and a.mode = 'POST_TEST') as post_st
      from h
  ),
  k as (
    select c.*,
           case when c.post_st = 'FINALIZED' then 'SELESAI'
                when (c.status <> 'ACTIVE' or not c.kini) and c.pre_st = 'FINALIZED' then 'DITUTUP_AWAL'
                when c.status = 'ACTIVE' and c.kini and (c.pre_id is not null or c.post_id is not null) then 'BERJALAN'
           end as keadaan
      from c
  )
  select k.id, k.keadaan,
         case when k.keadaan in ('SELESAI', 'DITUTUP_AWAL') and k.pre_st = 'FINALIZED' then k.pre_id end,
         case when k.keadaan = 'SELESAI' then k.post_id end
    from k where k.keadaan is not null
$$;
revoke all on function public.hasil_belajar_sesi_orang(uuid) from public, anon, authenticated, service_role;

create or replace function public.hasil_belajar_sesi_saya()
returns table (learning_assignment_id uuid, keadaan text, pre_session uuid, post_session uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select * from public.hasil_belajar_sesi_orang(public.current_person_id()) where public.current_person_id() is not null
$$;
revoke all on function public.hasil_belajar_sesi_saya() from public, anon;
grant execute on function public.hasil_belajar_sesi_saya() to authenticated;

-- The schools of the evidence a person's own-results report shows: each shown sitting's own institution_id, sorted.
create or replace function public.hasil_belajar_sekolah(p_person uuid)
returns uuid[] language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(distinct s.institution_id order by s.institution_id), '{}'::uuid[])
    from public.hasil_belajar_sesi_orang(p_person) h
    join public.assessment_sessions s on s.id in (h.pre_session, h.post_session)
$$;
revoke all on function public.hasil_belajar_sekolah(uuid) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ (2) the person-scoped print
alter table public.accountability_events drop constraint accountability_events_print_one_school;
alter table public.accountability_events add constraint accountability_events_print_one_school
  check (kind <> 'PRINT_REQUEST' or (resource ? 'person_id') or cardinality(institution_ids) = 1);

do $$
declare v_def text; v_old text; v_new text;
begin
  v_def := pg_get_functiondef('public.akuntabilitas_catat(text,text,text,uuid,text,text,text,jsonb)'::regprocedure);
  v_old := $o$k in ('node_id', 'learning_assignment_id', 'assessment_assignment_id')$o$;
  if position(v_old in v_def) = 0 then raise exception 'B2: akuntabilitas_catat does not check the scope where it did'; end if;
  v_def := replace(v_def, v_old, $n$k in ('node_id', 'learning_assignment_id', 'assessment_assignment_id', 'person_id')$n$);
  v_old := $o$    if v_scope = 'node_id' then
      select n.institution_id into v_inst from public.org_nodes n where n.id = v_rid;
    elsif v_scope = 'learning_assignment_id' then
      select la.institution_id into v_inst from public.learning_assignments la where la.id = v_rid;
    else
      select aa.institution_id into v_inst from public.assessment_assignments aa where aa.id = v_rid;
    end if;
    if v_inst is null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID'); end if;
    v_schools := array[v_inst];
$o$;
  v_new := $n$    if v_scope = 'person_id' then
      -- B2 (Q1, the owner's content rule): a learner's own results, printed by that learner only; the schools are each
      -- printed sitting's own, from the read the page itself makes (hasil_belajar_sesi_orang)
      if v_rid is null or v_rid is distinct from v_person then perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID'); end if;
      v_schools := public.hasil_belajar_sekolah(v_person);
    else
    if v_scope = 'node_id' then
      select n.institution_id into v_inst from public.org_nodes n where n.id = v_rid;
    elsif v_scope = 'learning_assignment_id' then
      select la.institution_id into v_inst from public.learning_assignments la where la.id = v_rid;
    else
      select aa.institution_id into v_inst from public.assessment_assignments aa where aa.id = v_rid;
    end if;
    if v_inst is null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID'); end if;
    v_schools := array[v_inst];
    end if;
$n$;
  if position(v_old in v_def) = 0 then raise exception 'B2: akuntabilitas_catat does not find a print''s school where it did'; end if;
  execute replace(v_def, v_old, v_new);
end $$;

-- ═══════════════════════════════════════════════════════════ (3) the completeness notice's reader
create or replace function public.akuntabilitas_gagal_ringkas()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_n int; v_akhir timestamptz;
begin
  if not public.is_system_admin() then perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED'); end if;
  select coalesce(sum(f.n), 0)::int, max(f.last_at) into v_n, v_akhir
    from public.accountability_write_failures f
   where f.kind in ('SIGN_IN', 'SIGN_OUT') and f.day > (now() at time zone 'Asia/Jakarta')::date - 7;
  return jsonb_build_object('n', v_n, 'terakhir', v_akhir, 'hari', 7);
end $$;
revoke all on function public.akuntabilitas_gagal_ringkas() from public, anon;
grant execute on function public.akuntabilitas_gagal_ringkas() to authenticated;

-- ═══════════════════════════════════════════════════════════ the registry
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('hasil_belajar_sesi_saya', 'LEARNER', 'B2: the caller''s own chapters as /belajar/hasil shows them (finished, closed after a '
   || 'Pemetaan Awal, or begun) and the sittings each shows; the same read decides a person-scoped print''s schools.', null, null),
  ('akuntabilitas_gagal_ringkas', 'STAFF', 'B2 (B1-R4): the count and the last instant of sign-in and sign-out records that could not '
   || 'be written in the last seven days (WIB), for the sign-in record''s completeness notice. The platform administrator only.',
   'SYSTEM_ADMIN', null)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only. selftest/b2.test.ts proves the behaviour.
-- ---------------------------------------------------------------------------
do $$
begin
  if position('hasil_belajar_sekolah(v_person)' in pg_get_functiondef('public.akuntabilitas_catat(text,text,text,uuid,text,text,text,jsonb)'::regprocedure)) = 0 then
    raise exception 'B2: the writer does not compute a person-scoped print''s schools from the results read';
  end if;
  if has_function_privilege('authenticated', 'public.hasil_belajar_sesi_orang(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.hasil_belajar_sekolah(uuid)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.akuntabilitas_gagal_ringkas()'::regprocedure, 'execute') then
    raise exception 'B2: an internal read is client-callable';
  end if;
end $$;
