-- W6.10 (D-186; ADM-15): THE CYCLE'S ORDER IS HELD BY THE DATABASE.
--
-- Pemetaan Awal → lessons → Uji Penguasaan → result. /belajar/[tugas]/penguasaan sends a learner whose Pemetaan Awal
-- is not finished back to the chapter, but may_start_assessment() accepted the Uji Penguasaan anyway, so a direct
-- call of start_learning_session() opened it before the Pemetaan Awal was begun or while it ran, and the chapter page
-- then put the running Uji Penguasaan first while its own screen sent the learner back.
--
-- One added refusal, PRE_TEST_NOT_FINALIZED: the Uji Penguasaan of a learning assignment that has a Pemetaan Awal
-- waits for the learner's Pemetaan Awal to be FINALIZED. start_learning_session() and assessment_orientation() ask
-- may_start_assessment(), so both follow. Ad-hoc papers and a cycle without a Pemetaan Awal are unchanged. Sittings
-- that already exist are not touched. Red before: docs/completion-4.0/batch-8/evidence/f29-merah-sebelum.txt;
-- held by F29-S01 (selftest/db/fable29.sql).

CREATE OR REPLACE FUNCTION public.may_start_assessment(p_assessment_assignment uuid)
 RETURNS TABLE(ok boolean, reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_aa public.assessment_assignments; v_d public.assessment_definitions;
  v_person uuid; v_enrol uuid; v_attempts integer;
begin
  v_person := public.current_person_id();
  if v_person is null then ok := false; reason := 'NO_PERSON'; return next; return; end if;
  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  if v_aa.id is null then ok := false; reason := 'UNKNOWN_ASSIGNMENT'; return next; return; end if;
  if v_aa.status <> 'OPEN' then
    ok := false; reason := 'ASSIGNMENT_' || v_aa.status::text; return next; return;
  end if;
  if (v_aa.opens_at is not null and now() < v_aa.opens_at)
     or (v_aa.closes_at is not null and now() >= v_aa.closes_at) then
    ok := false; reason := 'OUTSIDE_WINDOW'; return next; return;
  end if;
  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id
     and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;
  if v_enrol is null then ok := false; reason := 'NO_ACTIVE_ENROLMENT'; return next; return; end if;
  -- ACTIVE membership under the assigned node: PUBLISH is not ASSIGN, and an
  -- assignment reaches a learner only through the class or cohort they are in.
  if not exists (select 1 from public.memberships m
                   join public.org_nodes n on n.id = m.node_id
                  where m.enrollment_id = v_enrol and m.valid_to is null
                    and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id])) then
    ok := false; reason := 'NO_ACTIVE_MEMBERSHIP'; return next; return;
  end if;
  select * into v_d from public.assessment_definitions where id = v_aa.assessment_definition_id;
  if v_d.attempt_limit is not null then
    select count(*) into v_attempts from public.assessment_sessions s
     where s.person_id = v_person and s.assessment_assignment_id = p_assessment_assignment;
    if v_attempts >= v_d.attempt_limit then
      ok := false; reason := 'ATTEMPT_LIMIT_REACHED'; return next; return;
    end if;
  end if;
  -- ADDED IN 20261229100000 (W6.10, D-186; ADM-15). The Uji Penguasaan of a chapter given with a Pemetaan Awal waits
  -- for that Pemetaan Awal to be finished. The screens held this order; a direct call did not.
  if v_aa.learning_assignment_id is not null and v_d.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_assignments a
                   join public.assessment_definitions d on d.id = a.assessment_definition_id
                  where a.learning_assignment_id = v_aa.learning_assignment_id and d.mode = 'PRE_TEST')
     and not exists (select 1 from public.assessment_sessions s
                      where s.person_id = v_person and s.learning_assignment_id = v_aa.learning_assignment_id
                        and s.mode = 'PRE_TEST' and s.status = 'FINALIZED') then
    ok := false; reason := 'PRE_TEST_NOT_FINALIZED'; return next; return;
  end if;
  ok := true; reason := 'OK'; return next;
end $function$;
revoke all on function public.may_start_assessment(uuid) from public, anon;
grant execute on function public.may_start_assessment(uuid) to authenticated, service_role;

-- Structural self-check (migrations replay before the seed, so it reads no seeded row)
do $$
begin
  if pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure) !~ 'PRE_TEST_NOT_FINALIZED' then
    raise exception 'W6.10: may_start_assessment does not hold the Uji Penguasaan for the Pemetaan Awal';
  end if;
  if has_function_privilege('anon', 'public.may_start_assessment(uuid)', 'EXECUTE') then
    raise exception 'W6.10: the signed-out role may call may_start_assessment';
  end if;
end $$;
