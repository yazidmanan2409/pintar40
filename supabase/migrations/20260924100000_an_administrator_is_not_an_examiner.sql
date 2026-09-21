-- ---------------------------------------------------------------------------
-- R6. AN INDIVIDUAL ACADEMIC RESULT IS NOT ADMINISTRATIVE PROPERTY.
--
-- Second Eye found this during WP1's final verification. It predates WP1 and
-- did not block it. `assessment_results_select` read:
--
--     person_id = current_person_id()
--     or can_in_institution('CAN_REVIEW_INTEGRITY', institution_id)
--     or can_in_institution('CAN_ASSIGN_LEARNING',  institution_id)
--
-- `can_in_institution` asks only whether the caller holds the capability
-- ANYWHERE in the tenant. It is the institution-flat shape WP1 removed from
-- the metric path, still standing on the row that carries a named learner's
-- mastery. A head of department scoped to one department could read the
-- academic results of a sibling department, and an institution administrator
-- could read every result in the school because administering a school
-- happens to carry CAN_ASSIGN_LEARNING.
--
-- TWO SEPARATE MISTAKES, and they need different corrections.
--
--   (1) THE WRONG AXIS. The capability was checked against the TENANT when
--       the question is organizational: does this reader stand over the place
--       this evidence was produced? `can_on_node` already answers exactly
--       that, by the same `jalur` containment every WP1 boundary uses. The
--       session carries `class_node_id`, so the result has an organizational
--       home and does not need one invented.
--
--   (2) THE WRONG CAPABILITY. Narrowing the axis alone does NOT deny the
--       institution administrator: they are scoped at the institution ROOT,
--       and the root is an ancestor of every class, so containment admits
--       them everywhere by construction. Rank cannot express this either --
--       INSTITUTION_ADMIN outranks HEAD_OF_DEPARTMENT, so any rank floor that
--       admits the head admits the administrator above them.
--
--       The ruling is that administrative authority is not academic
--       authority. In this schema that sentence has one honest spelling: a
--       CAPABILITY the administrator does not hold. CAN_VIEW_LEARNER_RESULT
--       goes to the roles whose work is teaching and academic oversight --
--       EDUCATOR, HEAD_OF_DEPARTMENT, SYSTEM_ADMIN -- and to nobody else.
--
-- WHAT DELIBERATELY DOES NOT MOVE:
--
--   * THE DEAN GAINS NOTHING. A dean holds neither CAN_REVIEW_INTEGRITY nor
--     CAN_ASSIGN_LEARNING, so a dean could not read an individual result
--     before this migration and cannot after it. The new capability is not
--     granted to DEAN. F06-P12 asserts `role_capabilities('DEAN')` is exactly
--     `{CAN_VIEW_LEARNER_ROSTER}` and that assertion still holds.
--
--   * THE LEARNER KEEPS THEIR OWN RECORD, by the same `person_id =
--     current_person_id()` disjunct, untouched and first.
--
--   * THE METRIC ENGINE IS NOT INVOLVED. `official_results` is a
--     security_invoker view over this table, but every catalogue calculator
--     runs inside `metric_evaluate`, which is SECURITY DEFINER, so those reads
--     are the owner's and RLS was never what contained them. WP1's scoped
--     sources are. Nothing in the metric architecture is reopened here.
--
-- A SESSION WITH NO CLASS NODE IS READABLE BY NOBODY BUT ITS LEARNER. That is
-- the fail-closed direction: an evidence row with no organizational home has
-- no containment to satisfy, and inventing one -- falling back to the tenant --
-- would reinstate exactly the defect this migration removes.
-- ---------------------------------------------------------------------------

-- ─────────────────────────────────── 1. the capability, granted deliberately
CREATE OR REPLACE FUNCTION public.role_capabilities(r app_role)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case r
    when 'SYSTEM_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    -- NO CAN_VIEW_LEARNER_RESULT. Running a school is not reading a named
    -- learner's mastery; R6 is precisely this line.
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER']
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    -- UNCHANGED, AND CHECKED: F06-P12 requires this to be exactly one element.
    when 'DEAN' then array['CAN_VIEW_LEARNER_ROSTER']
    when 'STUDENT' then array[]::text[]
  end
$function$;
revoke all on function public.role_capabilities(app_role) from public, anon, authenticated;
grant execute on function public.role_capabilities(app_role) to authenticated;

-- ────────────────────────────── 2. the predicate, on the evidence's own node
-- SECURITY DEFINER because it reads `assessment_sessions`, which carries its
-- own policy: without it the answer would depend on whether the reader could
-- already see the session, which is a different question from this one.
create function public.assessment_result_readable(p_session uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_node uuid;
begin
  if p_session is null then return false; end if;
  select s.class_node_id into v_node from public.assessment_sessions s where s.id = p_session;
  if v_node is null then return false; end if;
  return public.can_on_node('CAN_VIEW_LEARNER_RESULT', v_node);
exception when others then return false;
end $$;
comment on function public.assessment_result_readable(uuid) is
  'R6: an individual academic result is readable by a reader who holds CAN_VIEW_LEARNER_RESULT '
  'over the organizational node the evidence was produced in. Capability x containment, the same '
  'two axes every other authorization in this schema uses. A session with no class node fails closed.';
revoke all on function public.assessment_result_readable(uuid) from public, anon, authenticated;
grant execute on function public.assessment_result_readable(uuid) to authenticated;

-- A POLICY PREDICATE IS CLIENT-EXECUTABLE BY NECESSITY -- RLS evaluates it as
-- the reader -- so it takes an exposure class like every other one (PLATFORM,
-- the class the WP1 roster predicates carry).
insert into public.client_rpc_registry (function_name, exposure, note)
values ('assessment_result_readable', 'PLATFORM',
        'Row predicate behind assessment_results_select. Answers whether the caller holds '
        'CAN_VIEW_LEARNER_RESULT over the node the evidence was produced in. Takes no identity '
        'argument and returns no data.')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note;

-- ─────────────────────────────────────────────────────── 3. the policy itself
drop policy assessment_results_select on public.assessment_results;
create policy assessment_results_select on public.assessment_results for select to authenticated
  using (person_id = public.current_person_id()
      or public.assessment_result_readable(session_id));

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). STRUCTURAL HERE, BEHAVIOURAL IN F06-P14.
--
-- The property this migration is about is a ROW-LEVEL one, and a migration
-- runs as the table owner, who bypasses RLS. A probe here would have to build
-- a two-branch school, five actors and two finalized sessions, then switch
-- roles -- machinery `selftest` already owns and exercises. Duplicating it
-- would mean a second copy to keep true. So this block asserts the two things
-- that are structurally decidable, and F06-P14 measures the seven-case matrix
-- against real rows on both sides of the boundary.
-- ---------------------------------------------------------------------------
do $$
declare v_qual text; v_role text;
begin
  -- WHO HOLDS IT. The denials are asserted before the grants, because the
  -- denials are what R6 is.
  if 'CAN_VIEW_LEARNER_RESULT' = any (public.role_capabilities('INSTITUTION_ADMIN')) then
    raise exception 'the institution administrator holds the academic-result capability';
  end if;
  if 'CAN_VIEW_LEARNER_RESULT' = any (public.role_capabilities('DEAN')) then
    raise exception 'the dean was widened by the R6 correction';
  end if;
  if 'CAN_VIEW_LEARNER_RESULT' = any (public.role_capabilities('STUDENT')) then
    raise exception 'a learner holds a staff capability';
  end if;
  if public.role_capabilities('DEAN') <> array['CAN_VIEW_LEARNER_ROSTER'] then
    raise exception 'the dean no longer holds exactly the one looking capability';
  end if;
  foreach v_role in array array['EDUCATOR','HEAD_OF_DEPARTMENT','SYSTEM_ADMIN'] loop
    if not ('CAN_VIEW_LEARNER_RESULT' = any (public.role_capabilities(v_role::public.app_role))) then
      raise exception 'a teaching or academic-oversight role lost the result capability: %', v_role;
    end if;
  end loop;

  -- WHAT THE POLICY READS. Asserted against the LIVE policy expression rather
  -- than the text of this file, so a later migration that reinstates the flat
  -- shape is caught by the next clean build rather than by a reviewer.
  select pg_get_expr(p.polqual, p.polrelid) into v_qual from pg_policy p
   where p.polrelid = 'public.assessment_results'::regclass and p.polname = 'assessment_results_select';
  if v_qual is null then raise exception 'assessment_results carries no select policy'; end if;
  if v_qual like '%can_in_institution%' then
    raise exception 'the academic-result policy still reads institution-flat: %', v_qual;
  end if;
  if v_qual not like '%assessment_result_readable%' then
    raise exception 'the academic-result policy does not go through the contained predicate: %', v_qual;
  end if;
  if v_qual not like '%current_person_id%' then
    raise exception 'the learner lost their own record from the academic-result policy';
  end if;

  -- AND THAT THE PREDICATE IS CONTAINED. It must reach `can_on_node`, which is
  -- the jalur containment, and must NOT reach `can_in_institution`, which is
  -- the shape being removed. Read from the function body, so a later edit that
  -- swaps one for the other cannot pass by keeping the name.
  select pg_get_functiondef(p.oid) into v_qual from pg_proc p
   where p.oid = 'public.assessment_result_readable(uuid)'::regprocedure;
  if v_qual not like '%can_on_node%' or v_qual like '%can_in_institution%' then
    raise exception 'assessment_result_readable does not decide by organizational containment';
  end if;
  if v_qual not like '%class_node_id%' then
    raise exception 'assessment_result_readable does not anchor on the evidence''s own node';
  end if;

  raise notice '0096 verified: an individual academic result is reached by capability over the node the '
    'evidence was produced in rather than by holding a capability somewhere in the tenant; the '
    'institution administrator does not hold that capability, the dean was not widened, the learner keeps '
    'their own record, and F06-P14 measures the seven-case matrix against populated branches';
end $$;
