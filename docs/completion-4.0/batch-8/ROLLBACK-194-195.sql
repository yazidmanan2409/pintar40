-- ROLLBACK OF MIGRATIONS 194-195 (D-183 exposure flag; W6.10 cycle order), the staging promotion's recovery arrangement.
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. It returns a database at 195 to staging's schema at 193 for every
-- object 194-195 created or replaced:
--   * 195 replaced one function, may_start_assessment, which is restored to its 193 text (its only definition at 193 is
--     20260913090000); its md5(prosrc) must equal staging's, read only on 5 Nov: c9b3f4ce04f07edc20f0124b0815ce45;
--   * 194 created only new objects (exposed_content_marks and its append-only trigger, exposure_fingerprint,
--     course_is_exposed, real_assessment_possible, and the two refusal triggers on assessment_assignments and
--     assessment_sessions); they are removed.
-- Run as the database owner in one transaction, only on the owner's say. The physical backup remains the recovery point
-- for data; this script is the schema's way back without a restore.
--
-- What a rollback keeps and loses, by design:
--   * KEPT: every sitting and every assignment. Neither migration writes a row outside exposed_content_marks.
--   * LOST: the 260 exposure fingerprints (20 TITLE, 240 STEM; no text). Re-applying 194 restores them exactly.
--   * AFTER IT: an exposed chapter can again be given and sat as a real assessment in a non-synthetic school (D-183's
--     refusal is gone), and a learner can again start an Uji Penguasaan before the Pemetaan Awal (only the screens hold
--     the order). Both are the state staging is in today, at 193.
-- The two schema_migrations rows are removed too, so that `supabase migration up` (staging.yml) re-applies 194-195
-- cleanly later.
--
-- EVERY STATE A DEPLOYMENT CAN LEAVE. `supabase db push` (staging.yml) applies each migration file in its own
-- transaction together with its schema_migrations row, and stops at the first failure. So staging can only be at 193
-- (194 failed), at 194 (195 failed: 195's function change and its row are both rolled back) or at 195. Tested locally
-- on 5 Nov, each from its real state:
--   195 -> this script -> 193, the checks pass;
--   194 only (made by a planted failure at the end of 195: «division by zero», 195 not recorded, may_start_assessment
--     still 193's md5, 260 marks present) -> this script -> 193, the checks pass;
--   193 -> this script again -> no change, the checks pass (it is safe to run twice or on an untouched database);
--   then `supabase migration up` -> 195, 260 marks, the order rule present.
-- The script itself is one transaction: if any check fails, nothing it did is kept.
-- It names no environment (staging's platform_environment reads «production», D-184), so the operator chooses the
-- target by its connection string. Its last check (exactly 193 migrations) makes it refuse any database not at 193-195.

begin;

-- 195: the Uji Penguasaan waits for the Pemetaan Awal (W6.10) -- back to 193's text
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
  ok := true; reason := 'OK'; return next;
end $function$;
revoke all on function public.may_start_assessment(uuid) from public, anon;
grant execute on function public.may_start_assessment(uuid) to authenticated, service_role;

-- 194: exposed questions never give a real verdict (D-183)
drop trigger if exists assessment_sessions_zz_exposed_is_not_assessed on public.assessment_sessions;
drop trigger if exists assessment_assignments_zz_exposed_is_not_assessed on public.assessment_assignments;
drop function if exists public.refuse_exposed_session();
drop function if exists public.refuse_exposed_assignment();
drop function if exists public.real_assessment_possible(uuid);
drop function if exists public.course_is_exposed(uuid);
drop table if exists public.exposed_content_marks;
drop function if exists public.exposed_content_marks_append_only();
drop function if exists public.exposure_fingerprint(text);

delete from supabase_migrations.schema_migrations where version in ('20261228100000', '20261229100000');

-- the check: 193's schema for every object 194-195 touched, or nothing is committed
do $$
begin
  if md5((select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure))
     <> 'c9b3f4ce04f07edc20f0124b0815ce45' then
    raise exception 'rollback: may_start_assessment is not 193''s text';
  end if;
  if to_regclass('public.exposed_content_marks') is not null or to_regprocedure('public.course_is_exposed(uuid)') is not null
     or exists (select 1 from pg_trigger where tgname like '%zz_exposed_is_not_assessed') then
    raise exception 'rollback: an object of 194 remains';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations) <> 193 then
    raise exception 'rollback: % migrations recorded, expected 193', (select count(*) from supabase_migrations.schema_migrations);
  end if;
end $$;

commit;
