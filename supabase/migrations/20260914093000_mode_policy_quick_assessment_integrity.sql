-- 0040 — FABLE-04 §1, §5, §6: mode policy as data, Quick Assessment as a
-- surface over the one engine, and integrity signals that scoring cannot read.
--
-- MODE POLICY IS A ROW, NOT A BRANCH. Nine modes now exist and each needs its
-- own policy for hints, rationale timing, retries, randomisation, identity
-- confirmation, cooling and whether it certifies. Written as a CASE inside the
-- engine, that becomes nine branches in every function that cares, and the
-- tenth mode is added by remembering all of them. Written as a registry, the
-- engine asks one question and a missing policy is a failed assertion rather
-- than a silent default -- and `assert_mode_policy_complete()` derives the
-- requirement from `pg_enum` rather than from a list, which is the FABLE-03
-- lesson applied before the defect instead of after it.
--
-- QUICK ASSESSMENT IS NOT A QUICK-QUIZ ENGINE (§5). It creates an assessment
-- definition and an assignment and opens them, in one capability-gated call.
-- Everything downstream -- assembly, sanitizer, timing, grading, safety gate,
-- evidence -- is the same engine. The EXAM tier is unreachable from it by
-- construction, not by a check somebody remembered to write: the definition it
-- creates cannot carry `bank_type = 'EXAM'`, and INV-12's existing isolation
-- does the rest.
--
-- INTEGRITY SIGNALS ARE MEASUREMENT, NEVER INPUT (§6). Same shape as the INV-11
-- telemetry rule and for the same reason: a scoring path that cannot READ a
-- value cannot be influenced by it. `assert_integrity_never_scores()` is that
-- rule, callable, with the scoring surface derived from the engine's own
-- function list. No verdict column exists and none is added -- patterns raise
-- review signals for a human, and nothing accusatory reaches a learner.

-- ---------------------------------------------------------------------------
-- 1. Mode policy.
-- ---------------------------------------------------------------------------
create table public.mode_policy (
  mode                        public.assessment_mode primary key,
  allows_assistance           boolean not null,
  reveals_rationale_on_review boolean not null,
  allows_retry                boolean not null,
  randomises_items            boolean not null,
  requires_identity_confirm   boolean not null,
  applies_exam_cooling        boolean not null,
  certifies                   boolean not null,
  max_bank_tier               public.bank_type not null,
  note                        text not null check (btrim(note) <> '')
);
alter table public.mode_policy enable row level security;
grant select on public.mode_policy to authenticated;
create policy mode_policy_select on public.mode_policy for select to authenticated
  using (public.current_person_id() is not null);
insert into public.record_class_registry values
  ('mode_policy', 'INSTITUTION_SCOPED', 'platform reference data, not learner evidence');

insert into public.mode_policy values
  ('PRE_TEST',    true,  false, false, true,  false, false, false, 'TEST',
   'diagnostic: assistance yes, no rationale reveal, never a verdict, never certifies'),
  ('POST_TEST',   true,  true,  false, true,  false, false, true,  'TEST',
   'the formal stage of the learning cycle; certificate-eligible'),
  ('PRACTICE',    true,  true,  true,  true,  false, false, false, 'PRACTICE',
   'hints, immediate rationale on review, retries; never scores toward a credential'),
  ('TEST',        false, true,  false, true,  false, false, true,  'TEST',
   'randomised, attempts limited, class windows'),
  ('EXAM',        false, true,  false, true,  true,  true,  true,  'EXAM',
   'no assistance, identity confirmation, institution threshold, cooling, audited'),
  ('QUICK',       true,  true,  false, true,  false, false, true,  'TEST',
   'educator-launched over the same engine; evidence is ordinary evidence'),
  ('STANDALONE',  true,  true,  false, true,  false, false, true,  'TEST',
   'an assessment not bound to a learning cycle'),
  ('PUBLIC_DEMO', true,  true,  true,  true,  false, false, false, 'PRACTICE',
   'PUBLIC_DEMO evidence class; never certifies, never reaches an official view'),
  ('PAPER',       false, true,  false, false, false, false, true,  'EXAM',
   'evidence enters by the paper channels; no online workflow in this phase');

create function public.mode_policy(p_mode public.assessment_mode)
returns public.mode_policy
language sql stable security definer set search_path = public, pg_temp as $$
  select * from public.mode_policy where mode = p_mode
$$;
revoke all on function public.mode_policy(public.assessment_mode) from public, anon;
grant execute on function public.mode_policy(public.assessment_mode) to authenticated, service_role;

-- Derived from pg_enum, so a tenth mode fails the build rather than defaulting.
create function public.assert_mode_policy_complete()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
  select string_agg(e.enumlabel::text, ', ' order by e.enumsortorder) into bad
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'assessment_mode'
     and not exists (select 1 from public.mode_policy m where m.mode::text = e.enumlabel::text);
  if bad is not null then problems := problems || ('mode(s) with no policy row: ' || bad); end if;

  -- a mode that certifies must be a formal stage: practice never certifies,
  -- and a diagnostic pre-test is a starting point, not an achievement (§8)
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.certifies and m.mode::text in ('PRE_TEST','PRACTICE','PUBLIC_DEMO');
  if bad is not null then problems := problems || ('mode(s) certifying that must not: ' || bad); end if;

  -- EXAM tier is reachable only from EXAM and PAPER
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.max_bank_tier = 'EXAM' and m.mode::text not in ('EXAM','PAPER');
  if bad is not null then problems := problems || ('mode(s) reaching the EXAM bank tier (INV-12): ' || bad); end if;

  -- an exam offers no assistance
  if exists (select 1 from public.mode_policy where mode::text = 'EXAM' and allows_assistance) then
    problems := problems || 'EXAM allows assistance'::text;
  end if;

  select count(*) into n from public.mode_policy;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format('%s mode(s), every enum label carries a policy; no non-formal mode certifies; the EXAM tier is reachable only from EXAM and PAPER', n)
                 else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_mode_policy_complete() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The engine consults the policy. EXAM offers no assistance.
-- ---------------------------------------------------------------------------
create or replace function public.open_assistance(p_presented_item uuid, p_level smallint)
returns table (level smallint, kode text, isi text, stage text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session uuid; v_item uuid; v_state record; v_text text; v_kode text; v_stage text;
  v_mode public.assessment_mode; v_allows boolean;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;

  -- ADDED IN 0040: the mode decides whether assistance exists at all.
  select s.mode into v_mode from public.assessment_sessions s where s.id = v_session;
  select m.allows_assistance into v_allows from public.mode_policy m where m.mode = v_mode;
  if v_allows is null then
    raise exception 'mode % has no policy row; assistance is refused rather than assumed', v_mode;
  end if;
  if not v_allows then
    raise exception 'this assessment offers no assistance';
  end if;

  select * into v_state from public.assistance_state(p_presented_item);
  if not v_state.due then
    raise exception 'assistance is not available yet on this question';
  end if;
  if p_level is null or p_level < 1 or p_level > 3 then
    raise exception 'assistance has three levels; % is not one of them', p_level;
  end if;
  if p_level > v_state.highest_open + 1 then
    raise exception 'assistance arrives a step at a time: open level % first', v_state.highest_open + 1;
  end if;

  select a.kode into v_kode from public.assistance_levels a where a.level = p_level;
  v_stage := v_state.stage;

  if p_level = 1 then
    select i.arah_berpikir into v_text from public.items i where i.id = v_item;
  elsif p_level = 2 then
    select i.petunjuk into v_text from public.items i where i.id = v_item;
  else
    select (l.worked_examples -> 0 ->> 'judul') || ' — ' ||
           coalesce((select string_agg(x, ' ') from jsonb_array_elements_text(
                       l.worked_examples -> 0 -> 'langkah') x), '')
      into v_text
      from public.items i join public.lessons l on l.id = i.lesson_id
     where i.id = v_item;
  end if;

  if v_text is null or btrim(v_text) = '' then
    raise exception 'this question has no assistance at level % yet', p_level;
  end if;
  if public.hint_reveals_answer_shape(v_text) then
    raise exception 'assistance at level % would narrow to the answer and is refused (INV-02)', p_level;
  end if;

  insert into public.assistance_grants (presented_item_id, session_id, level)
  values (p_presented_item, v_session, p_level) on conflict do nothing;
  insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind, level)
  values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000',
          case p_level when 3 then 'WORKED_EXAMPLE_OPENED'::telemetry.assistance_kind
                       else 'HINT_OPENED'::telemetry.assistance_kind end, p_level);

  level := p_level; kode := v_kode; isi := v_text; stage := v_stage;
  return next;
end $$;
revoke all on function public.open_assistance(uuid, smallint) from public, anon;
grant execute on function public.open_assistance(uuid, smallint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Teacher Quick Assessment (§5).
-- ---------------------------------------------------------------------------
create function public.launch_quick_assessment(
  p_node uuid, p_module uuid, p_item_count integer, p_minutes integer)
returns table (assessment_definition_id uuid, assessment_assignment_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid; v_inst uuid; v_course uuid; v_tier public.bank_type;
  v_period uuid; v_def uuid; v_assign uuid; v_drawable int; v_kind public.org_kind;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;

  select n.institution_id, n.kind, n.academic_period_id into v_inst, v_kind, v_period
    from public.org_nodes n where n.id = p_node;
  if v_inst is null then raise exception 'unknown class %', p_node; end if;
  if v_kind not in ('CLASS','COHORT') then
    raise exception 'a quick assessment is launched for a class or cohort, not a %', v_kind;
  end if;
  if not public.can_on_node('CAN_QUICK_ASSESSMENT', p_node) then
    raise exception 'launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class';
  end if;

  select m.course_id, c.institution_id into v_course, v_inst
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then raise exception 'unknown module %', p_module; end if;
  if v_inst is distinct from (select institution_id from public.org_nodes where id = p_node) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  -- §5 governed limits. Bounded here, not by the caller.
  if p_item_count is null or p_item_count < 3 or p_item_count > 20 then
    raise exception 'a quick assessment carries between 3 and 20 questions, not %', p_item_count;
  end if;
  if p_minutes is null or p_minutes < 5 or p_minutes > 60 then
    raise exception 'a quick assessment runs between 5 and 60 minutes, not %', p_minutes;
  end if;

  -- §5 / INV-12: the EXAM tier is unreachable from here BY CONSTRUCTION. The
  -- definition is created at the mode policy's ceiling, which for QUICK is
  -- TEST, so no EXAM item is ever drawable for it.
  select m.max_bank_tier into v_tier from public.mode_policy m where m.mode = 'QUICK';
  if v_tier is null then raise exception 'QUICK has no mode policy row'; end if;
  if v_tier = 'EXAM' then
    raise exception 'the QUICK mode policy reaches the EXAM tier; that is an INV-12 violation, not a configuration';
  end if;

  -- exactly one of course_id / module_id (assessment_definitions_scope_one);
  -- a quick assessment is always module-scoped
  insert into public.assessment_definitions (
    institution_id, module_id, title, mode, bank_type, item_count,
    safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
    allows_pause, offline_tolerant, hesitation_window_seconds, shuffle_policy,
    status, author_person_id)
  values (
    v_inst, p_module,
    'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI'),
    'QUICK', v_tier, p_item_count,
    0, jsonb_build_object('SEDANG', greatest(p_item_count / 2, 1), 'MUDAH', p_item_count - greatest(p_item_count / 2, 1)),
    jsonb_build_object('mastery_min', 0.6), 1,
    false, false, 25, 'ITEMS_AND_OPTIONS',
    'INGESTED', v_actor)
  returning id into v_def;

  -- the definition must be able to fill itself before anyone is assigned to it
  select count(*) into v_drawable from public.drawable_items_for_definition(v_def);
  if v_drawable < p_item_count then
    raise exception 'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled',
      v_drawable, v_tier, p_item_count;
  end if;

  insert into public.assessment_assignments (
    institution_id, assessment_definition_id, node_id, academic_period_id,
    opens_at, closes_at, status, assigned_by_person_id)
  values (v_inst, v_def, p_node, v_period, now(), now() + make_interval(mins => p_minutes),
          'OPEN', v_actor)
  returning id into v_assign;

  perform public.audit_write('quick_assessment.launched', 'assessment_assignments', v_assign::text,
    v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node,
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $$;
revoke all on function public.launch_quick_assessment(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.launch_quick_assessment(uuid, uuid, integer, integer) to authenticated, service_role;
insert into public.client_rpc_registry values
  ('launch_quick_assessment', 'STAFF',
   'CAN_QUICK_ASSESSMENT over the class; names the class and module it acts on (§5)'),
  ('mode_policy', 'PLATFORM', 'mode reference data; carries no learner identity');

-- ---------------------------------------------------------------------------
-- 4. Integrity signals: recorded, never scored (§6).
-- ---------------------------------------------------------------------------
create function public.record_integrity_signal(
  p_session uuid, p_category public.integrity_category, p_observation jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = p_session;
  insert into public.integrity_signals (session_id, institution_id, category, observation)
  values (p_session, v_inst, p_category, coalesce(p_observation, '{}'::jsonb));
end $$;
revoke all on function public.record_integrity_signal(uuid, public.integrity_category, jsonb) from public, anon;
grant execute on function public.record_integrity_signal(uuid, public.integrity_category, jsonb)
  to authenticated, service_role;
insert into public.client_rpc_registry values
  ('record_integrity_signal', 'LEARNER', 'records a proportionate signal on the caller''s own session; never scoring input');

-- The INV-11-shaped rule for integrity: the scoring surface may not read it.
-- The surface is derived from the engine's own functions rather than listed.
create function public.assert_integrity_never_scores()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; v_scoring text[] := array[
  'grade_response','evaluate_session','finalize_session','session_final_responses',
  'session_outcome','session_review','reading_map','learning_delta','assemble_session',
  'recompute_result'];
begin
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = any (v_scoring)
     and regexp_replace(coalesce(p.prosrc,''), '--[^\n]*', '', 'g') ~* '\yintegrity_signals\y';
  if bad is not null then
    problems := problems || ('scoring function(s) reading integrity_signals: ' || bad);
  end if;

  -- no view may join it into anything scoring reads
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
   where ref.relname = 'integrity_signals' and dep.relname <> 'integrity_signals'
     and dep.relnamespace::regnamespace::text = 'public';
  if bad is not null then problems := problems || ('view(s) depending on integrity_signals: ' || bad); end if;

  -- §6: no verdict column exists, and none is added later
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema='public' and table_name='integrity_signals'
     and column_name ~* '(verdict|cheat|guilty|penalty|score|deduction)';
  if bad is not null then problems := problems || ('integrity_signals carries a verdict-shaped column: ' || bad); end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format('%s scoring function(s) read no integrity signal, no view depends on the table, and it carries no verdict column', cardinality(v_scoring))
                 else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_integrity_never_scores() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003).
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; bad text;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
  if not v_ok then raise exception 'mode policy: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_integrity_never_scores() a;
  if not v_ok then raise exception 'integrity boundary: %', v_detail; end if;

  -- the mode-policy assertion is derived from pg_enum: deleting a row bites
  delete from public.mode_policy where mode = 'PAPER';
  select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
  if v_ok then raise exception 'the mode-policy assertion passed with a mode carrying no policy'; end if;
  if v_detail not like '%PAPER%' then raise exception 'it caught something, but not by name: %', v_detail; end if;
  insert into public.mode_policy values
    ('PAPER', false, true, false, false, false, false, true, 'EXAM',
     'evidence enters by the paper channels; no online workflow in this phase');
  select a.ok into v_ok from public.assert_mode_policy_complete() a;
  if not v_ok then raise exception 'the mode-policy assertion stayed red after the row was restored'; end if;

  -- EXAM offers no assistance, and the engine reads the policy rather than a constant
  if pg_get_functiondef('public.open_assistance(uuid, smallint)'::regprocedure) !~ 'mode_policy' then
    raise exception 'open_assistance does not consult the mode policy';
  end if;

  -- QUICK cannot reach the EXAM tier
  if (select max_bank_tier from public.mode_policy where mode = 'QUICK') = 'EXAM' then
    raise exception 'QUICK reaches the EXAM bank tier (INV-12)';
  end if;
  if pg_get_functiondef('public.launch_quick_assessment(uuid, uuid, integer, integer)'::regprocedure)
       !~ 'CAN_QUICK_ASSESSMENT' then
    raise exception 'launch_quick_assessment does not gate on the capability';
  end if;

  -- every new client entry point is registered (§7: classify at creation)
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'ownership reachability: %', v_detail; end if;

  -- standing hygiene
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) unpinned: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s): %', n, bad; end if;
  foreach bad in array array['mode_policy','client_rpc_registry'] loop
    if not exists (select 1 from public.record_class_registry where table_name = bad) then
      raise exception 'table % has no record class', bad;
    end if;
  end loop;
end $$;
