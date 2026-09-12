-- 0030 — FABLE-03 §0, §1, §4, §5: the delivery half of the one engine.
-- Start eligibility, the draw, the allow-list sanitizer, answer acceptance and
-- the session lifecycle. Scoring is 0031; lessons and assistance are 0032.
--
-- WHY THE DELIVERY SURFACE IS SQL AND THE ENGINE MODULE IS A FACADE OVER IT.
-- §0 requires one engine module that owns assembly, sanitization, response
-- acceptance and grading, and INV-26 forbids a second implementation of any
-- of them. It does not say which layer holds the implementation, and the
-- privileges already decide: FABLE-02 granted SELECT on items and item_options
-- behind a CAN_DRAFT policy, and role_capabilities('STUDENT') is empty, so a
-- learner cannot read one row of the bank through any client path. A
-- TypeScript sanitizer would therefore have to run as service_role and hold
-- the whole authoring row -- answer key included -- in a Node process, and
-- "the sanitizer" would become "whatever that code happened to drop". Here the
-- answer key never leaves the database. lib/assessment-engine/ is the single
-- module every route calls; these functions are what it calls. There is one of
-- each, and 0031's verification block and the INV-26 lint both assert it.
--
-- THE ALLOW-LIST IS DATA, NOT CODE. item_type_registry.sanitizer_allowlist has
-- existed since 0014 and was empty. It is filled here, and session_paper()
-- projects exactly the keys it names out of a candidate object. A type with no
-- allow-list yields NO payload rather than a default one, and a field added to
-- the candidate object later is invisible until someone adds it to a type's
-- allow-list -- doc 12's "new authoring fields default to excluded", as a
-- property of the query rather than a rule someone has to remember.
--
-- OPTIONS ARE SHUFFLED, AND THE CLIENT NEVER LEARNS THE AUTHORED ORDER.
-- doc 07 requires the shuffle to be seeded, deterministic per session and not
-- derivable by the client. Emitting the authored label beside each option
-- would make it cosmetic: anyone reading the JSON recovers the authoring order
-- and with it any positional habit in how the bank was written. The learner
-- sees a display position and answers with it; record_answer() recomputes the
-- same permutation server-side and stores the authored label, so the stored
-- value keeps FABLE-02's {"pilihan":"A"} shape and 0026's aggregates keep
-- working untouched.
--
-- ON MODE NAMES. §"The cycle" writes LEARNING_CYCLE_PRETEST and
-- LEARNING_CYCLE_POSTTEST; FABLE-02's assessment_mode enum reads PRE_TEST and
-- POST_TEST. The enum is NOT renamed. `mode::text` is inside the frozen
-- content hash (ADR-0004 §1), so renaming a label would silently change the
-- hash of every release that contains an assessment definition -- the one
-- thing the freeze exists to make impossible. The names are mapped instead,
-- once, in ADR-0005. There is still exactly one vocabulary in the schema.
--
-- FIRST VIEW IS DELIVERY EVIDENCE, NOT TELEMETRY. presented_items is written
-- for the whole paper at assembly (doc 07, session creation), so presented_at
-- cannot answer "how long has this learner been looking at THIS question",
-- which §6's hesitation window needs. presented_item_views records, on the
-- server clock, when the learner first opened each item. It is the
-- `item_presented` fact refined (doc 06 category 1), no scoring path reads it,
-- and because the server stamps it a client cannot backdate it to pull a hint
-- forward.

-- ---------------------------------------------------------------------------
-- 1. The allow-list. Every registered type gets one, because the sanitizer is
--    registry-driven and a type without an entry must produce nothing rather
--    than something. Which types get a learner UI is OD-8: §5 builds
--    MCQ_SINGLE and MCQ_MULTI now and leaves the rest until the product owner
--    confirms real content, so no authoring convention is invented here for a
--    type that has none.
-- ---------------------------------------------------------------------------
update public.item_type_registry set sanitizer_allowlist = v.allow
  from (values
    ('MCQ_SINGLE'::public.item_type,        '["item_type","stem","stimulus","opsi"]'::jsonb),
    ('MCQ_MULTI',                           '["item_type","stem","stimulus","opsi"]'::jsonb),
    ('NUMERIC',                             '["item_type","stem","stimulus"]'::jsonb),
    ('GRID',                                '["item_type","stem","stimulus","opsi"]'::jsonb),
    ('TRUE_FALSE_BATTERY',                  '["item_type","stem","stimulus","opsi"]'::jsonb),
    ('MATCHING',                            '["item_type","stem","stimulus","opsi"]'::jsonb),
    ('IMAGE_ANCHORED',                      '["item_type","stem","stimulus","opsi"]'::jsonb)
  ) as v(item_type, allow)
 where public.item_type_registry.item_type = v.item_type;

-- Which types this phase actually delivers to a learner. OD-8 governs the
-- rest; a paper may not contain a type with no learner renderer, and the
-- assembler refuses rather than shipping a question nobody can answer.
create table public.item_type_learner_support (
  item_type   public.item_type primary key references public.item_type_registry(item_type),
  since_phase text not null check (btrim(since_phase) <> ''),
  note        text not null check (btrim(note) <> '')
);
alter table public.item_type_learner_support enable row level security;
insert into public.item_type_learner_support values
  ('MCQ_SINGLE', 'FABLE-03', 'one correct option; the learner answers with one display position'),
  ('MCQ_MULTI',  'FABLE-03', 'several correct options; the learner answers with a set of display positions');
grant select on public.item_type_learner_support to authenticated;
create policy item_type_learner_support_select on public.item_type_learner_support
  for select to authenticated using (public.current_person_id() is not null);

-- ---------------------------------------------------------------------------
-- 2. Deterministic, seed-derived ordering.
-- ---------------------------------------------------------------------------
create function public.seeded_index(p_seed bigint, p_salt text, p_key text)
returns bigint language sql immutable parallel safe as $$
  select hashtextextended(p_salt || '|' || p_key, p_seed)
$$;
revoke all on function public.seeded_index(bigint, text, text) from public, anon;
grant execute on function public.seeded_index(bigint, text, text) to authenticated, service_role;

-- The option permutation for one item in one session: authored label -> the
-- display position the learner sees. One definition, used by the sanitizer and
-- by record_answer(), so the two cannot disagree.
create function public.option_display_order(p_session uuid, p_item uuid)
returns table (label text, display_position integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with s as (
    select sn.shuffle_seed,
           (select d.shuffle_policy from public.assessment_definitions d
             where d.id = sn.assessment_definition_id) as policy
      from public.assessment_sessions sn where sn.id = p_session
  )
  select o.label,
         row_number() over (
           order by case when s.policy = 'ITEMS_AND_OPTIONS'
                         then public.seeded_index(s.shuffle_seed, p_item::text, o.label)
                    end,
                    o.label collate "C")::integer
    from public.item_options o cross join s
   where o.item_id = p_item
$$;
revoke all on function public.option_display_order(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. First view. Server clock, once, per delivered item.
-- ---------------------------------------------------------------------------
create table public.presented_item_views (
  presented_item_id uuid primary key references public.presented_items(id),
  session_id        uuid not null references public.assessment_sessions(id),
  institution_id    uuid not null references public.institutions(id),
  first_viewed_at   timestamptz not null default now()
);
create index presented_item_views_session_idx on public.presented_item_views (session_id);
alter table public.presented_item_views enable row level security;

create function public.enforce_first_view() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_inst uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a first view happens once: %.% is never rewritten',
      tg_table_schema, tg_table_name;
  end if;
  select p.session_id, p.institution_id into v_session, v_inst
    from public.presented_items p where p.id = new.presented_item_id;
  if v_session is null then raise exception 'unknown presented item %', new.presented_item_id; end if;
  new.session_id := v_session;
  new.institution_id := v_inst;
  new.first_viewed_at := now();                 -- server clock, never the caller's
  return new;
end $$;
revoke all on function public.enforce_first_view() from public, anon, authenticated;
create trigger presented_item_views_write before insert or update or delete on public.presented_item_views
  for each row execute function public.enforce_first_view();

grant select on public.presented_item_views to authenticated;
create policy presented_item_views_select on public.presented_item_views for select to authenticated
  using (exists (select 1 from public.assessment_sessions s
                  where s.id = session_id and s.person_id = public.current_person_id()));

insert into public.record_class_registry values
  ('presented_item_views',      'INSTITUTION_SCOPED', 'evidence never travels with a learner'),
  ('item_type_learner_support', 'INSTITUTION_SCOPED', 'platform reference data, not learner evidence');

-- ---------------------------------------------------------------------------
-- 4. Identity and permission. Every learner-facing function below is SECURITY
--    DEFINER granted to `authenticated` and derives the learner from
--    current_person_id(). Nothing takes a person_id.
--
--    That is INV-08 made structural rather than route discipline: there is no
--    argument in which a person could be forged, so a bug in a route cannot
--    attribute one learner's evidence to another. It also settles the
--    roadmap's §5.1 trap -- open_assessment_session() and submit_response()
--    are service_role-only, but a SECURITY DEFINER function owned by the
--    schema owner may call them, so lib/assessment-engine/ never imports the
--    service-role client and F01-S03 stays exactly as FABLE-01 wrote it.
-- ---------------------------------------------------------------------------
create function public.engine_version() returns text
language sql immutable parallel safe as $$ select 'pintar-engine/1'::text $$;
create function public.scoring_policy_version() returns text
language sql immutable parallel safe as $$ select 'pintar-scoring/1'::text $$;
revoke all on function public.engine_version() from public, anon;
revoke all on function public.scoring_policy_version() from public, anon;
grant execute on function public.engine_version() to authenticated, service_role;
grant execute on function public.scoring_policy_version() to authenticated, service_role;

create function public.session_is_mine(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.assessment_sessions s
                  where s.id = p_session and s.person_id = public.current_person_id())
$$;
revoke all on function public.session_is_mine(uuid) from public, anon;
grant execute on function public.session_is_mine(uuid) to authenticated, service_role;

-- A session past its authoritative deadline is EXPIRED before anything else is
-- allowed. Applied on the next server-side check rather than by a sweeper, so
-- "time-bounded" is bounded even if no job ever runs.
create function public.session_enforce_deadline(p_session uuid)
returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.assessment_sessions;
begin
  select * into v from public.assessment_sessions where id = p_session;
  if v.id is null then raise exception 'unknown session %', p_session; end if;
  if v.authoritative_deadline is not null
     and now() >= v.authoritative_deadline
     and v.status in ('CREATED','IN_PROGRESS','PAUSED') then
    update public.assessment_sessions set status = 'EXPIRED' where id = p_session;
    return 'EXPIRED';
  end if;
  return v.status;
end $$;
revoke all on function public.session_enforce_deadline(uuid) from public, anon;
grant execute on function public.session_enforce_deadline(uuid) to authenticated, service_role;

-- INV-27, the asymmetry stated as two different functions rather than one flag.
--
-- STARTING needs the window open. CONTINUING does not: §0 is explicit that the
-- assignment window closing or the class ending does not stop a learner who
-- legitimately started. What does stop them is the session's own deadline and
-- INV-17 -- an enrolment that is no longer ACTIVE. Two questions, two answers,
-- no caller in a position to confuse them.
create function public.may_continue_session(p_session uuid)
returns table (ok boolean, reason text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v public.assessment_sessions; v_status text;
begin
  select * into v from public.assessment_sessions where id = p_session;
  if v.id is null then ok := false; reason := 'UNKNOWN_SESSION'; return next; return; end if;
  if v.person_id is distinct from public.current_person_id() then
    ok := false; reason := 'NOT_YOURS'; return next; return;
  end if;
  if v.status not in ('CREATED','IN_PROGRESS','PAUSED') then
    ok := false; reason := 'SESSION_' || v.status::text; return next; return;
  end if;
  if v.authoritative_deadline is not null and now() >= v.authoritative_deadline then
    ok := false; reason := 'DEADLINE_PASSED'; return next; return;
  end if;
  -- INV-17: a revoked or ended enrolment stops the next scored action, mid-session
  select e.status::text into v_status from public.enrollments e where e.id = v.enrollment_id;
  if v_status is distinct from 'ACTIVE' then
    ok := false; reason := 'ENROLMENT_NOT_ACTIVE'; return next; return;
  end if;
  ok := true; reason := 'OK'; return next;
end $$;
revoke all on function public.may_continue_session(uuid) from public, anon;
grant execute on function public.may_continue_session(uuid) to authenticated, service_role;

create function public.may_start_assessment(p_assessment_assignment uuid)
returns table (ok boolean, reason text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
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
end $$;
revoke all on function public.may_start_assessment(uuid) from public, anon;
grant execute on function public.may_start_assessment(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. The draw. Calls 0029's drawable_items_for_definition() rather than
--    re-deriving eligibility, so bank-tier isolation (INV-12), EXAM cooling
--    and the INV-24 pre-test exclusion stay owned by the functions that own
--    those rules. On top it applies the three things that belong to the paper:
--    no two members of one parallel group, the safety-critical minimum, and
--    the difficulty mix.
--
--    IT FAILS LOUDLY. A definition asking for more items, more safety-critical
--    items or more of a band than the bank can supply raises. Quietly
--    delivering a shorter paper would be doc 01's Lesson 6 wearing an
--    assessment costume: a result that looks like a measurement and is not.
-- ---------------------------------------------------------------------------
create function public.difficulty_band(p numeric) returns text
language sql immutable parallel safe as $$
  -- predicted_difficulty is a p-value: high means most learners get it right
  select case when p is null then 'SEDANG' when p >= 0.7 then 'MUDAH'
              when p <= 0.4 then 'SULIT' else 'SEDANG' end
$$;
revoke all on function public.difficulty_band(numeric) from public, anon;
grant execute on function public.difficulty_band(numeric) to authenticated, service_role;

create function public.assemble_session(p_session uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_s public.assessment_sessions; v_d public.assessment_definitions;
  v_seed bigint; v_band text; v_want integer; v_got integer;
  v_chosen uuid[] := '{}'; v_groups uuid[] := '{}'; v_bands jsonb := '{}'::jsonb;
  r record; v_n integer; v_safety integer; v_bad text;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  if v_s.status <> 'CREATED' then
    raise exception 'a paper is drawn once, at CREATED; this session is %', v_s.status;
  end if;
  if exists (select 1 from public.presented_items where session_id = p_session) then
    raise exception 'this session already has a paper';
  end if;
  select * into v_d from public.assessment_definitions where id = v_s.assessment_definition_id;
  v_seed := v_s.shuffle_seed;

  -- `on commit drop` is not enough: two sessions assembled in one transaction
  -- would collide on the name before either commit happens. Checked through
  -- the catalog rather than `drop table if exists`, which emits a NOTICE on
  -- every ordinary first call and would train a reader to ignore them.
  if to_regclass('pg_temp.pool') is not null then execute 'drop table pool'; end if;
  create temporary table pool on commit drop as
    select c.item_id, i.item_type, i.parallel_group, i.is_safety_critical,
           public.difficulty_band(i.predicted_difficulty) as band,
           public.seeded_index(v_seed, 'item', c.item_id::text) as ord
      from public.drawable_items_for_definition(
             v_s.assessment_definition_id, v_s.person_id, v_s.cohort_node_id,
             v_s.learning_assignment_id) c
      join public.items i on i.id = c.item_id;

  -- OD-8: a paper never contains a type this phase cannot render. Refusing is
  -- the honest failure; delivering a question the learner cannot answer is not.
  delete from pool p where p.item_type not in
    (select s.item_type from public.item_type_learner_support s);

  -- (a) THE SAFETY-CRITICAL MINIMUM COMES FIRST, and its picks count toward
  --     their own difficulty bands. Filling the mix first and topping up
  --     afterwards is the wrong order: a mix whose counts already sum to
  --     item_count leaves no room, and the paper would either lose its safety
  --     floor or exceed its length. INV-10 is the constraint that cannot bend,
  --     so it is satisfied before anything competes for the space.
  v_safety := 0;
  for r in select * from pool p where p.is_safety_critical order by p.ord loop
    exit when v_safety >= v_d.safety_critical_minimum;
    continue when r.parallel_group is not null and r.parallel_group = any (v_groups);
    v_chosen := v_chosen || r.item_id;
    if r.parallel_group is not null then v_groups := v_groups || r.parallel_group; end if;
    v_bands := jsonb_set(v_bands, array[r.band],
                 to_jsonb(coalesce((v_bands ->> r.band)::integer, 0) + 1));
    v_safety := v_safety + 1;
  end loop;
  if v_safety < v_d.safety_critical_minimum then
    raise exception 'the bank supplies % drawable safety-critical item(s) but the definition requires % (INV-10)',
      v_safety, v_d.safety_critical_minimum;
  end if;

  -- (b) the difficulty mix, topped up to each band's requested count
  for v_band, v_want in
    select key, value::integer from jsonb_each_text(coalesce(v_d.difficulty_mix, '{}'::jsonb))
     order by key collate "C"
  loop
    if v_band not in ('MUDAH','SEDANG','SULIT') then
      raise exception 'difficulty_mix names an unknown band "%": expected MUDAH, SEDANG or SULIT', v_band;
    end if;
    v_got := coalesce((v_bands ->> v_band)::integer, 0);
    for r in select * from pool p where p.band = v_band order by p.ord loop
      exit when v_got >= v_want;
      continue when r.item_id = any (v_chosen);
      continue when r.parallel_group is not null and r.parallel_group = any (v_groups);
      v_chosen := v_chosen || r.item_id;
      if r.parallel_group is not null then v_groups := v_groups || r.parallel_group; end if;
      v_got := v_got + 1;
    end loop;
    v_bands := jsonb_set(v_bands, array[v_band], to_jsonb(v_got));
    if v_got < v_want then
      raise exception 'the bank supplies % drawable item(s) in band % but the definition asks for %',
        v_got, v_band, v_want;
    end if;
  end loop;
  if coalesce(array_length(v_chosen, 1), 0) > v_d.item_count then
    raise exception 'the difficulty mix and the safety-critical minimum together require % item(s) but the definition is % long',
      array_length(v_chosen, 1), v_d.item_count;
  end if;

  -- (c) the remainder, still deterministically
  for r in select * from pool p order by p.ord loop
    exit when coalesce(array_length(v_chosen, 1), 0) >= v_d.item_count;
    continue when r.item_id = any (v_chosen);
    continue when r.parallel_group is not null and r.parallel_group = any (v_groups);
    v_chosen := v_chosen || r.item_id;
    if r.parallel_group is not null then v_groups := v_groups || r.parallel_group; end if;
  end loop;
  v_n := coalesce(array_length(v_chosen, 1), 0);
  if v_n < v_d.item_count then
    select string_agg(distinct x.reason, '; ') into v_bad
      from public.excluded_items_for_post_test(v_s.person_id, v_s.learning_assignment_id) x;
    raise exception 'the bank supplies % drawable item(s) but the definition asks for % (bank tier, cooling and sibling exclusion already applied%)',
      v_n, v_d.item_count, coalesce('; exclusions: ' || v_bad, '');
  end if;
  if v_n > v_d.item_count then
    v_chosen := v_chosen[1:v_d.item_count];
    v_n := v_d.item_count;
  end if;

  -- (d) item order on the paper: seeded when the policy shuffles items
  insert into public.presented_items (session_id, item_id, institution_id, position)
  select p_session, x.item_id, v_s.institution_id,
         (row_number() over (
            order by case when v_d.shuffle_policy in ('ITEMS','ITEMS_AND_OPTIONS')
                          then public.seeded_index(v_seed, 'paper', x.item_id::text) end,
                     x.ord))::smallint
    from unnest(v_chosen) with ordinality as x(item_id, ord);

  return v_n;
end $$;
revoke all on function public.assemble_session(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. The one way a learner-cycle session comes into existence.
-- ---------------------------------------------------------------------------
create function public.start_learning_session(p_assessment_assignment uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
begin
  v_person := public.current_person_id();
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;
  if v_aa.learning_assignment_id is null then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
  if v_la.status <> 'ACTIVE' then
    raise exception 'the learning assignment is % and assigns nothing', v_la.status;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  -- the release is the one the LEARNING assignment binds, never "the newest"
  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_la.plp_release_id, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_la.id, v_aa.id);

  perform public.assemble_session(v_session);
  return v_session;
end $$;
revoke all on function public.start_learning_session(uuid) from public, anon;
grant execute on function public.start_learning_session(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. The sanitizer. The allow-list decides what exists in the payload; the
--    candidate object is filtered BY it, never trimmed by a caller.
-- ---------------------------------------------------------------------------
create function public.session_paper(p_session uuid)
returns table (presented_item_id uuid, posisi smallint, muatan jsonb)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
    select p.id, p.position,
           (select jsonb_object_agg(k.key, c.candidate -> k.key)
              from jsonb_array_elements_text(reg.sanitizer_allowlist) as k(key)
             where c.candidate ? k.key)
      from public.presented_items p
      join public.items i on i.id = p.item_id
      join public.item_type_registry reg on reg.item_type = i.item_type
      cross join lateral (
        select jsonb_build_object(
                 'item_type', i.item_type::text,
                 'stem',      i.stem,
                 'stimulus',  i.stimulus,
                 'opsi', coalesce((
                   select jsonb_agg(jsonb_build_object('posisi', d.display_position, 'teks', o.body)
                                    order by d.display_position)
                     from public.option_display_order(p_session, i.id) d
                     join public.item_options o on o.item_id = i.id and o.label = d.label), '[]'::jsonb)
               ) as candidate) c
     where p.session_id = p_session
     order by p.position;
end $$;
revoke all on function public.session_paper(uuid) from public, anon;
grant execute on function public.session_paper(uuid) to authenticated, service_role;

-- One item, same projection, for the assistance context (INV-31, §6). Built
-- from session_paper() rather than beside it, so the assistance context cannot
-- drift into being a second sanitizer.
create function public.sanitized_item(p_presented_item uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_session uuid; v jsonb;
begin
  select p.session_id into v_session from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  select sp.muatan into v from public.session_paper(v_session) sp
   where sp.presented_item_id = p_presented_item;
  return v;
end $$;
revoke all on function public.sanitized_item(uuid) from public, anon;
grant execute on function public.sanitized_item(uuid) to authenticated, service_role;

-- Record that the learner has this item in front of them. Idempotent; the
-- server clock stamps it.
create function public.note_item_view(p_presented_item uuid) returns timestamptz
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_at timestamptz;
begin
  select p.session_id into v_session from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  insert into public.presented_item_views (presented_item_id, session_id, institution_id)
  values (p_presented_item, v_session, '00000000-0000-0000-0000-000000000000')
  on conflict (presented_item_id) do nothing;
  select first_viewed_at into v_at from public.presented_item_views
   where presented_item_id = p_presented_item;
  return v_at;
end $$;
revoke all on function public.note_item_view(uuid) from public, anon;
grant execute on function public.note_item_view(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Answer acceptance. Translates display positions to authored labels and
--    hands the canonical value to FABLE-02's submit_response(), which owns
--    idempotency (INV-28). This function adds permission and translation; it
--    does not re-implement the receipt.
-- ---------------------------------------------------------------------------
create function public.record_answer(
  p_presented_item uuid,
  p_client_seq integer,
  p_jawaban jsonb,
  p_client_asserted_at timestamptz default null,
  p_receipt_mode public.receipt_mode default 'LIVE'
) returns table (response_id uuid, outcome text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session uuid; v_item uuid; v_type public.item_type;
  v_ok boolean; v_reason text; v_value jsonb; v_label text; v_labels text[];
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;

  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
  if not v_ok then raise exception 'this session accepts no further answers: %', v_reason; end if;

  -- first answer moves the session; the allow-list trigger decides legality
  if (select s.status from public.assessment_sessions s where s.id = v_session) = 'CREATED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_session;
  end if;

  select i.item_type into v_type from public.items i where i.id = v_item;

  if v_type = 'MCQ_SINGLE' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'number' then
      raise exception 'MCQ_SINGLE expects {"posisi": n}';
    end if;
    select d.label into v_label from public.option_display_order(v_session, v_item) d
     where d.display_position = (p_jawaban ->> 'posisi')::integer;
    if v_label is null then raise exception 'no option at display position %', p_jawaban ->> 'posisi'; end if;
    v_value := jsonb_build_object('pilihan', v_label);

  elsif v_type = 'MCQ_MULTI' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'array' then
      raise exception 'MCQ_MULTI expects {"posisi": [n, ...]}';
    end if;
    select array_agg(d.label order by d.label collate "C") into v_labels
      from public.option_display_order(v_session, v_item) d
     where d.display_position in (
       select x::integer from jsonb_array_elements_text(p_jawaban -> 'posisi') x);
    if coalesce(array_length(v_labels, 1), 0)
       <> (select count(distinct x) from jsonb_array_elements_text(p_jawaban -> 'posisi') x) then
      raise exception 'one or more display positions do not exist on this item';
    end if;
    v_value := jsonb_build_object('pilihan', to_jsonb(coalesce(v_labels, '{}'::text[])));

  else
    raise exception 'item type % has no learner answer path in this phase (OD-8)', v_type;
  end if;

  return query select r.response_id, r.outcome
    from public.submit_response(p_presented_item, p_client_seq, v_value,
                                p_client_asserted_at, p_receipt_mode, true) r;
end $$;
revoke all on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode)
  from public, anon;
grant execute on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode)
  to authenticated, service_role;

-- What the learner has already answered, as display positions -- so a returning
-- client rebuilds its state from the server (§4 resilience) and never from
-- local storage.
create function public.session_answers(p_session uuid)
returns table (presented_item_id uuid, client_seq integer, posisi jsonb, received_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
    select r.presented_item_id, r.client_seq,
           case when jsonb_typeof(r.value -> 'pilihan') = 'array'
                then (select coalesce(jsonb_agg(d.display_position order by d.display_position), '[]'::jsonb)
                        from public.option_display_order(p_session, p.item_id) d
                       where d.label in (select x from jsonb_array_elements_text(r.value -> 'pilihan') x))
                else (select to_jsonb(d.display_position)
                        from public.option_display_order(p_session, p.item_id) d
                       where d.label = (r.value ->> 'pilihan'))
           end,
           r.received_at
      from public.responses r
      join public.presented_items p on p.id = r.presented_item_id
     where r.session_id = p_session
     order by p.position, r.client_seq;
end $$;
revoke all on function public.session_answers(uuid) from public, anon;
grant execute on function public.session_answers(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Lifecycle moves a learner may make. Each one asks the allow-list; none
--    writes a status the graph does not permit.
-- ---------------------------------------------------------------------------
create function public.pause_session(p_session uuid) returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ok boolean; v_reason text; v_allows boolean;
begin
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(p_session) c;
  if not v_ok then raise exception 'cannot pause: %', v_reason; end if;
  select d.allows_pause into v_allows
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = p_session;
  if not v_allows then raise exception 'this assessment does not allow pausing'; end if;
  update public.assessment_sessions set status = 'PAUSED' where id = p_session;
  return 'PAUSED';
end $$;

create function public.resume_session(p_session uuid) returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ok boolean; v_reason text;
begin
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(p_session) c;
  if not v_ok then raise exception 'cannot resume: %', v_reason; end if;
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  return 'IN_PROGRESS';
end $$;

create function public.submit_session(p_session uuid) returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status public.session_status;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  v_status := public.session_enforce_deadline(p_session);
  if v_status = 'EXPIRED' then return v_status; end if;   -- finalize scores what was answered
  if v_status = 'SUBMITTED' then return v_status; end if; -- idempotent
  if v_status = 'PAUSED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  end if;
  update public.assessment_sessions set status = 'SUBMITTED' where id = p_session;
  return 'SUBMITTED';
end $$;

revoke all on function public.pause_session(uuid)   from public, anon;
revoke all on function public.resume_session(uuid)  from public, anon;
revoke all on function public.submit_session(uuid)  from public, anon;
grant execute on function public.pause_session(uuid)  to authenticated, service_role;
grant execute on function public.resume_session(uuid) to authenticated, service_role;
grant execute on function public.submit_session(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v text;
begin
  -- Every function this block inspects must exist first. Without this, a typo
  -- in a proname makes pg_get_functiondef() return NULL, every `def not like`
  -- below evaluates to NULL, and the whole block passes while checking nothing.
  for v in select unnest(array['session_paper','sanitized_item','assemble_session',
                               'record_answer','start_learning_session','may_start_assessment',
                               'may_continue_session','option_display_order','session_answers',
                               'note_item_view','submit_session','pause_session','resume_session',
                               'seeded_index','difficulty_band','session_is_mine',
                               'session_enforce_deadline','engine_version','scoring_policy_version'])
  loop
    if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                    where ns.nspname='public' and p.proname = v) then
      raise exception 'this migration did not create public.%()', v;
    end if;
  end loop;

  -- RLS on, no permissive policy, no unpinned SECDEF, anon executes nothing
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity
   and tablename in ('presented_item_views','item_type_learner_support');
  if n > 0 then raise exception 'RLS not enabled on % new table(s)', n; end if;
  select count(*) into n from pg_policies where schemaname in ('public','telemetry')
   and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without a pinned search_path: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;

  -- no client write path on the new evidence table
  select string_agg(g.table_name || '.' || g.privilege_type || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee in ('anon','authenticated')
     and g.table_name in ('presented_item_views','item_type_learner_support')
     and g.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES');
  if bad is not null then raise exception 'a client role can write %', bad; end if;

  -- INV-08: no learner-facing entry point takes a person, an institution or an
  -- evidence class. The identity comes from current_person_id(), full stop.
  for v in select p.proname from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
            where ns.nspname='public'
              and p.proname in ('start_learning_session','record_answer','session_paper',
                                'session_answers','may_start_assessment','may_continue_session',
                                'submit_session','pause_session','resume_session',
                                'note_item_view','sanitized_item')
  loop
    select pg_get_function_identity_arguments(p.oid) into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = v;
    if def ilike '%person%' or def ilike '%institution%' or def ilike '%evidence_class%' then
      raise exception 'learner entry point %(%) accepts an identity or class argument (INV-08)', v, def;
    end if;
  end loop;

  -- INV-01: every allow-list is a jsonb array naming only learner-safe keys,
  -- and no allow-list may ever name an answer-key field
  select string_agg(item_type::text, ', ') into bad from public.item_type_registry
   where jsonb_typeof(sanitizer_allowlist) <> 'array' or jsonb_array_length(sanitizer_allowlist) = 0;
  if bad is not null then raise exception 'item type(s) with no sanitizer allow-list: %', bad; end if;
  select string_agg(r.item_type::text || ':' || k.key, ', ') into bad
    from public.item_type_registry r,
         lateral jsonb_array_elements_text(r.sanitizer_allowlist) k(key)
   where k.key in ('is_correct','rationale','misconception_code','petunjuk','arah_berpikir',
                   'predicted_difficulty','empirical_difficulty','objective_ids','label');
  if bad is not null then
    raise exception 'a sanitizer allow-list names an authoring-only field: % (INV-01)', bad;
  end if;

  -- INV-01, again but behaviourally: the sanitizer's candidate object is built
  -- from named columns, and none of them is an answer key
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='session_paper';
  if def ~* '\y(i\.petunjuk|i\.arah_berpikir|o\.is_correct|o\.rationale|o\.misconception_code|o\.label\s*(as|,))' then
    raise exception 'session_paper projects an authoring-only column (INV-01)';
  end if;
  if def not like '%sanitizer_allowlist%' then
    raise exception 'session_paper does not project through the allow-list';
  end if;

  -- the assistance context is the sanitized shape, not a second projection
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='sanitized_item';
  if def not like '%session_paper%' then
    raise exception 'sanitized_item does not derive from session_paper (INV-31 would have two shapes)';
  end if;

  -- INV-26: exactly one assembler, one sanitizer, one answer path
  for v in select unnest(array['assemble_session','session_paper','record_answer','start_learning_session']) loop
    select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = v;
    if n <> 1 then raise exception 'INV-26: % has % implementations, expected 1', v, n; end if;
  end loop;

  -- INV-27 asymmetry: continuing is not gated on the assignment window, and
  -- starting is. Read from the function bodies so a later edit that collapses
  -- them into one rule fails here rather than in production.
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='may_continue_session';
  if def like '%assessment_assignments%' then
    raise exception 'may_continue_session reads the assignment window; a closing window must not stop a started session (INV-27)';
  end if;
  if def not like '%enrollments%' then
    raise exception 'may_continue_session does not check the enrolment; INV-17 would not interrupt a session';
  end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='may_start_assessment';
  if def not like '%OPEN%' or def not like '%memberships%' then
    raise exception 'may_start_assessment does not require an OPEN assignment and an ACTIVE membership (INV-27)';
  end if;

  -- the draw calls FABLE-02's functions rather than re-deriving eligibility
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='assemble_session';
  if def not like '%drawable_items_for_definition%' then
    raise exception 'the assembler does not call drawable_items_for_definition (bank tier, cooling and INV-24 would be re-derived)';
  end if;
  if def ~* '\yfrom\s+public\.items\s+i\s+where\y' then
    raise exception 'the assembler selects items directly; the draw must go through the eligibility functions';
  end if;

  -- the shuffle is seeded, not random()
  for v in select unnest(array['assemble_session','option_display_order']) loop
    select pg_get_functiondef(p.oid) into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = v;
    if def ~* '\yrandom\s*\(' then
      raise exception '% shuffles with random(); the order must be reproducible from the session seed', v;
    end if;
    if def not like '%seeded_index%' then
      raise exception '% does not use the session seed', v;
    end if;
  end loop;

  -- INV-11 still holds: nothing in public reaches telemetry
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind='f'
     and pg_get_functiondef(p.oid) ~* '\ytelemetry\.'
     and p.proname <> 'enforce_observation_write';
  if bad is not null then raise exception 'function(s) in public reference telemetry (INV-11): %', bad; end if;

  -- every new table is classified for transfer
  select string_agg(t, ', ') into bad from unnest(array['presented_item_views','item_type_learner_support']) t
   where not exists (select 1 from public.record_class_registry r where r.table_name = t);
  if bad is not null then raise exception 'table(s) with no record class: %', bad; end if;
end $$;
