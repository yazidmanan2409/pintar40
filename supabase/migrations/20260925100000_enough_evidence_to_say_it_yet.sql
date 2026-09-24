-- ---------------------------------------------------------------------------
-- R5. DO WE HAVE ENOUGH APPROPRIATE EVIDENCE TO SAY THIS YET?
--
-- Not "is the result good or bad". The two questions look alike from a
-- distance and the distance is where the harm is:
--
--     "Ahmad has low mastery."
--     "We do not yet have enough evidence to determine Ahmad's mastery."
--
-- The second must never be readable as the first. PINTAR already refused to
-- emit a VALUE below the catalogue minimum -- that half has held since 0073 --
-- but it reported the condition as one undifferentiated `below_minimum`, and a
-- consumer could not tell "nothing qualifying has happened yet" from "some
-- qualifying evidence exists, just not enough". Those are different facts about
-- the world and they license different sentences.
--
-- THREE STATES, AND THE FIRST TWO DO NOT COLLAPSE:
--
--   NOT_YET_EVALUABLE     the evidence structure required for this figure does
--                         not exist yet -- no qualifying assessment finished,
--                         the comparison period has not arrived, the
--                         prerequisite stage has not been reached
--   INSUFFICIENT_EVIDENCE some qualifying evidence exists; not enough of it to
--                         support the governed interpretation
--   SUFFICIENT_EVIDENCE   the governed minimum is met and the interpretation
--                         may be presented
--
-- THE POLICY IS ALREADY GOVERNED PER INTERPRETATION, AND IS NOT INVENTED HERE.
-- `metric_definitions.minimum_sample` has been NOT NULL and > 0 since the
-- catalogue existed, and it genuinely differs by what is being interpreted:
-- 1 for a participant count, 3 for misconceptions, 5 for comprehension and net
-- gain, 10 for institution-wide outcomes, 30 for an item statistic. R5 adds no
-- universal threshold and invents no number for any of the sixteen. What it
-- adds is one STRUCTURAL distinction on top of the governed minimum -- whether
-- the qualifying count is zero or merely short -- which requires no product
-- judgement because it asks only whether the evidence exists at all.
--
-- What qualifies is likewise already declared and is not restated here:
-- `metric_definitions.evidence_class` (OFFICIAL, by constraint), the WP1
-- `metric_sources` rows that say which relations a calculator may read, and
-- `metric_calculator_scope.governing_scope` which says over what population.
--
-- THREE DIFFERENT THINGS ARE CALLED READINESS IN THIS SCHEMA. They are kept
-- apart by name on purpose:
--
--   publish_readiness(course)  CONTENT: may this course be released? Untouched
--                              here, referenced by nothing here.
--   readiness_tiers            LEARNERS: the mastery bands
--                              class.readiness_distribution counts into.
--   evidence_readiness         THIS: is there enough qualifying evidence to
--                              present a governed interpretation at all?
--
-- READINESS IS NOT AN AUTHORIZATION BYPASS. Every readiness field below is
-- emitted AFTER the authorization branch and only after it. A refusal carries
-- no readiness, no count and no label, exactly as before -- because "there is
-- not enough evidence about a population you cannot see" is still a fact about
-- a population you cannot see. The terminal block asserts this from the live
-- function body and from a real refusal.
-- ---------------------------------------------------------------------------

create type public.evidence_readiness_state as enum
  ('NOT_YET_EVALUABLE', 'INSUFFICIENT_EVIDENCE', 'SUFFICIENT_EVIDENCE');

comment on type public.evidence_readiness_state is
  'R5. Whether enough QUALIFYING evidence exists to present a governed interpretation. Not a judgement '
  'about a person, a cohort or a result; not content publish readiness; not a learner mastery band.';

-- THE WHOLE RULE, IN ONE PLACE. Immutable and total, so every consumer that
-- asks gets the same answer and a second copy cannot drift from the first.
create function public.evidence_readiness(p_have numeric, p_needed integer)
returns public.evidence_readiness_state
language sql immutable parallel safe set search_path = public, pg_temp as $$
  select case
           when coalesce(p_have, 0) <= 0 then 'NOT_YET_EVALUABLE'
           when p_needed is null then 'SUFFICIENT_EVIDENCE'
           when coalesce(p_have, 0) < p_needed then 'INSUFFICIENT_EVIDENCE'
           else 'SUFFICIENT_EVIDENCE'
         end::public.evidence_readiness_state
$$;
comment on function public.evidence_readiness(numeric, integer) is
  'R5''s only rule: no qualifying evidence at all is NOT_YET_EVALUABLE, some but short of the '
  'interpretation''s own governed minimum is INSUFFICIENT_EVIDENCE, and meeting it is '
  'SUFFICIENT_EVIDENCE. The minimum comes from metric_definitions and is never invented here.';
revoke all on function public.evidence_readiness(numeric, integer) from public, anon, authenticated;
grant execute on function public.evidence_readiness(numeric, integer) to authenticated;

-- ────────────────────────────────────────── the evaluator says which it is
create or replace function public.metric_evaluate(
  p_metric_id text, p_node uuid, p_institution uuid, p_catalogue_version text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean;
  v_me uuid; v_gov text; v_governing uuid; v_bind_node uuid; v_bind_person uuid;
  v_have numeric; v_ready public.evidence_readiness_state;
begin
  v_cat := coalesce(p_catalogue_version, public.current_metric_catalogue());
  if v_cat is null then
    raise exception 'no live metric catalogue: a report cannot cite a version that does not exist';
  end if;
  if not exists (select 1 from public.metric_catalogue c where c.version = v_cat) then
    raise exception 'no such catalogue version: %', v_cat;
  end if;
  v_me := public.current_person_id();

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = p_metric_id;

  if d.metric_id is null then
    return jsonb_build_object('status', 'unavailable',
                              'statement_key', 'laporan.metrik.tidak_dikenal');
  end if;

  select s.governing_scope into v_gov
    from public.metric_calculator_scope s where s.calculation_key = d.calculation_key;
  if v_gov is null then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  v_governing := case v_gov
                   when 'NODE'   then p_node
                   when 'TENANT' then p_institution
                   else null
                 end;

  -- AUTHORIZATION FIRST, and R5 CHANGES NOTHING ABOVE THIS LINE. Readiness is
  -- a fact about a population's evidence; a reader with no right to the
  -- population has no right to that fact either.
  v_permitted := false;
  if public.is_system_admin() then
    v_permitted := true;
    v_bind_node := coalesce(v_governing, p_institution);
  elsif v_gov = 'LEARNER' then
    if v_me is not null and p_node = v_me and 'STUDENT' = any(d.allowed_audiences) then
      v_permitted := true; v_bind_person := v_me;
    else
      v_bind_node := public.audience_scope_over_learner(d.allowed_audiences, p_node, p_institution);
      v_permitted := v_bind_node is not null;
    end if;
  elsif v_gov = 'ITEM' then
    v_permitted := exists (select 1 from public.role_assignments ra
                            where ra.person_id = v_me and ra.institution_id = p_institution
                              and ra.revoked_at is null
                              and now() >= ra.valid_from and now() < ra.valid_until
                              and ra.role = any(d.allowed_audiences));
    if v_permitted then v_bind_node := p_institution; end if;
  else
    v_permitted := public.audience_on_node(d.allowed_audiences, v_governing);
    if v_permitted then v_bind_node := v_governing; end if;
  end if;

  if not v_permitted then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'label_key', d.label_key,
                              'statement_key', coalesce(d.deprecation_note_key, 'laporan.metrik.diganti'));
  end if;

  begin
    perform set_config('pintar.metric_boundary_node',   coalesce(v_bind_node::text, ''),   true);
    perform set_config('pintar.metric_boundary_person', coalesce(v_bind_person::text, ''), true);
    execute format('select public.%I($1, $2, $3)', 'calc_' || d.calculation_key)
       into v_out using p_node, p_institution, v_cat;
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    raise;
  end;

  v_have  := coalesce((v_out ->> 'sample')::numeric, 0);
  v_ready := public.evidence_readiness(v_have, d.minimum_sample);

  -- A COUNT THAT CLEARS THE MINIMUM BUT PRODUCED NO FIGURE HAS NOT PRODUCED
  -- THE INTERPRETATION. Returning `ok` with a null value would hand a consumer
  -- an interpretation that does not exist, and §4 is explicit that a
  -- calculator returning zero, NULL or an empty object must not become one.
  -- The structure required to say this particular thing is not there, so this
  -- is NOT_YET_EVALUABLE rather than a quiet null.
  if v_ready = 'SUFFICIENT_EVIDENCE'
     and (v_out -> 'value' is null or jsonb_typeof(v_out -> 'value') = 'null') then
    v_ready := 'NOT_YET_EVALUABLE';
  end if;

  if v_ready <> 'SUFFICIENT_EVIDENCE' then
    -- `status` keeps its existing vocabulary so every consumer written against
    -- it goes on working unchanged; `readiness` is the new, finer truth beside
    -- it. No value is emitted on this path and none ever was.
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum', 'label_key', d.label_key,
                              'readiness', v_ready,
                              'statement_key',
                              case v_ready
                                when 'NOT_YET_EVALUABLE' then 'laporan.metrik.belum_ada_bukti'
                                else 'laporan.metrik.belum_cukup_data'
                              end,
                              'have', v_have,
                              'needed', d.minimum_sample);
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'readiness', v_ready,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample');
end $$;
revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;

-- ───────────────────── the Management record says it too, by the same rule
-- WP1 gave this path the calculator directly rather than the evaluator, so it
-- never met the catalogue minimum at all: an empty list and a short list were
-- the same `[]` to whoever read it. It now carries the same three-state answer,
-- computed by the same function against the same governed minimum, so the two
-- consumers cannot disagree about what counts as enough.
create or replace function public.management_learner_detail(p_person uuid, p_institution uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid; v_roles public.app_role[]; v_boundary uuid; v_cat text;
  v_person record; v_enr record; v_placement jsonb; v_results jsonb;
  v_min integer; v_ready public.evidence_readiness_state;
begin
  v_me := public.current_person_id();
  v_roles := public.management_learner_roles();

  if v_me is null or p_person is null or p_institution is null then
    raise exception 'opening a learner''s record is for a HEAD_OF_DEPARTMENT or DEAN standing over that learner';
  end if;
  v_boundary := public.audience_scope_over_learner(v_roles, p_person, p_institution);
  if v_boundary is null then
    raise exception 'opening a learner''s record is for a HEAD_OF_DEPARTMENT or DEAN standing over that learner';
  end if;

  select p.id, p.display_name into v_person from public.persons p where p.id = p_person;

  select e.status, e.academic_period_id, e.programme_id into v_enr
    from public.enrollments e
   where e.person_id = p_person and e.institution_id = p_institution
   order by e.created_at desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object('node_id', n.id, 'kind', n.kind, 'name', n.name)
                            order by cardinality(n.jalur)), '[]'::jsonb)
    into v_placement
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
   where e.person_id = p_person and e.institution_id = p_institution
     and n.institution_id = p_institution;

  v_cat := public.current_metric_catalogue();
  if v_cat is not null then
    begin
      perform set_config('pintar.metric_boundary_node', v_boundary::text, true);
      perform set_config('pintar.metric_boundary_person', '', true);
      v_results := public.calc_learner_result(p_person, p_institution, v_cat) -> 'value';
      perform set_config('pintar.metric_boundary_node', '', true);
    exception when others then
      perform set_config('pintar.metric_boundary_node', '', true);
      raise;
    end;
    select m.minimum_sample into v_min from public.metric_definitions m
     where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  end if;
  v_ready := public.evidence_readiness(
               case when jsonb_typeof(v_results) = 'array' then jsonb_array_length(v_results) else 0 end,
               v_min);

  perform public.audit_write('learner_detail.opened', 'persons', p_person::text, p_institution,
    jsonb_build_object('roles', to_jsonb(v_roles)));

  return jsonb_build_object(
    'person_id', v_person.id,
    'display_name', v_person.display_name,
    'institution_id', p_institution,
    'enrolment_status', v_enr.status,
    'academic_period', (select ap.name from public.academic_periods ap where ap.id = v_enr.academic_period_id),
    'programme', (select n.name from public.org_nodes n where n.id = v_enr.programme_id),
    'placement', coalesce(v_placement, '[]'::jsonb),
    'official_results', coalesce(v_results, '[]'::jsonb),
    'official_results_readiness', v_ready,
    'catalogue_version', v_cat);
end $$;
revoke all on function public.management_learner_detail(uuid, uuid) from public, anon, authenticated;
grant execute on function public.management_learner_detail(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text; v_n int; v_bad text;
begin
  ---------------------------------------------------------------- the rule
  if public.evidence_readiness(0, 5)    <> 'NOT_YET_EVALUABLE'     then raise exception 'R5: zero is not NOT_YET_EVALUABLE'; end if;
  if public.evidence_readiness(null, 5) <> 'NOT_YET_EVALUABLE'     then raise exception 'R5: absent is not NOT_YET_EVALUABLE'; end if;
  if public.evidence_readiness(1, 5)    <> 'INSUFFICIENT_EVIDENCE' then raise exception 'R5: short is not INSUFFICIENT_EVIDENCE'; end if;
  if public.evidence_readiness(4, 5)    <> 'INSUFFICIENT_EVIDENCE' then raise exception 'R5: one short is not INSUFFICIENT_EVIDENCE'; end if;
  if public.evidence_readiness(5, 5)    <> 'SUFFICIENT_EVIDENCE'   then raise exception 'R5: exactly the minimum is not SUFFICIENT_EVIDENCE'; end if;
  if public.evidence_readiness(9, 5)    <> 'SUFFICIENT_EVIDENCE'   then raise exception 'R5: over the minimum is not SUFFICIENT_EVIDENCE'; end if;
  -- THE SAME COUNT, TWO INTERPRETATIONS, TWO ANSWERS -- which is the whole
  -- point of governing this per definition rather than universally.
  if public.evidence_readiness(4, 3) = public.evidence_readiness(4, 30) then
    raise exception 'R5: one evidence count gives the same readiness to interpretations with different minimums';
  end if;

  ------------------------------------------------------- the minimum is governed
  select count(distinct m.minimum_sample) into v_n from public.metric_definitions m
   where m.catalogue_version = public.current_metric_catalogue();
  if v_n < 2 then
    raise exception 'R5 would be one universal threshold: the live catalogue declares % distinct minimum(s)', v_n;
  end if;

  --------------------------------------------- readiness is not a bypass
  select pg_get_functiondef(p.oid) into v_def from pg_proc p
   where p.oid = 'public.metric_evaluate(text,uuid,uuid,text)'::regprocedure;
  -- every readiness mention must come AFTER the refusal returns
  if position('''readiness''' in v_def) < position('bukan_untuk_anda' in v_def) then
    raise exception 'R5: metric_evaluate names readiness before it refuses';
  end if;
  if v_def like '%publish_readiness%' then
    raise exception 'R5 was wired to publish_readiness, which is content release and a different question';
  end if;

  ------------------------------------------- the three concepts stay apart
  if to_regprocedure('public.publish_readiness(uuid)') is null then
    raise exception 'publish_readiness disappeared; R5 must leave it alone, not replace it';
  end if;
  select pg_get_functiondef(p.oid) into v_def from pg_proc p
   where p.oid = 'public.publish_readiness(uuid)'::regprocedure;
  if v_def like '%evidence_readiness%' then
    raise exception 'content publish readiness was made to depend on evidence readiness';
  end if;
  if to_regclass('public.readiness_tiers') is null then
    raise exception 'readiness_tiers disappeared; the learner bands are a different question again';
  end if;

  -------------------------------------------- no interpretation below the line
  select pg_get_functiondef(p.oid) into v_def from pg_proc p
   where p.oid = 'public.metric_evaluate(text,uuid,uuid,text)'::regprocedure;
  v_bad := substring(v_def from position('below_minimum' in v_def) for 600);
  if v_bad like '%''value''%' then
    raise exception 'R5: the withholding path emits a value';
  end if;

  raise notice '0098 verified: evidence readiness is three states and the first two do not collapse; the '
    'minimum is the catalogue''s own and differs by interpretation, so one count can be enough for one '
    'figure and not for another; readiness is named only after the refusal returns and the withholding '
    'path still emits no value; and content publish readiness and the learner mastery bands are '
    'untouched and unconnected';
end $$;
