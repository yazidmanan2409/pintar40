-- 0061 -- for an AD-HOC definition, item eligibility follows authorization
-- rather than ownership. ADR-0018.
--
-- THE GAP, MEASURED AT 0060 RATHER THAN ASSUMED. FABLE-05 made a canonical
-- release assignable by a school holding an active distribution. An educator
-- can teach the authorized chapter and then cannot quick-check it, because two
-- independent same-institution tests stand in the way:
--
--   * `eligible_items_for_definition` filters `i.institution_id = d.institution_id`,
--     and the ad-hoc definition is owned by the SCHOOL, so every canonical item
--     is filtered out and the draw returns nothing;
--   * `launch_quick_assessment` refuses the module outright (0062 repairs that
--     half; this migration is only about what may be drawn).
--
-- Both are correct as written for institution-owned content. Neither knows
-- about distribution. The governing relation is now
-- `release_is_distributed_to(release, institution)` -- the predicate every
-- other FABLE-05 relaxation already reads -- and this migration reads it too
-- rather than restating its conjuncts.
--
-- WHY AN ACCESSOR AND NOT A WIDER WHERE CLAUSE. `eligible_items_for_definition`
-- is SECURITY INVOKER on purpose, and 0020's terminal block refuses it as
-- DEFINER by name. Under RLS `items_select` reads
-- `can_in_institution('CAN_DRAFT', institution_id)`: a school holds no role
-- assignment in the canonical tenant, so the canonical rows are not merely
-- filtered by this function, they are INVISIBLE to the caller. A relaxed WHERE
-- clause would therefore have been vacuous on the one path that matters -- an
-- educator calling it directly -- while appearing to work from inside
-- `launch_quick_assessment`, which is SECURITY DEFINER and bypasses RLS as the
-- table owner. Two call paths, two answers, is exactly the kind of silent
-- divergence this project keeps finding late.
--
-- So the canonical branch reads through a named SECURITY DEFINER accessor, the
-- pattern 0056 established and stated its reasons for: the seven content SELECT
-- policies are left exactly as they are, and reading distributed canonical
-- content goes through accessors that gate on a capability the caller actually
-- holds in a consuming institution. No policy changes here. No new capability
-- is invented. The function stays INVOKER, and 0020's assertion stays true.
--
-- ONE ENGINE (INV-26). The accessor carries NO eligibility logic: no bank tier,
-- no scope, no cooling, no exclusion. It answers one question -- "which item
-- rows are canonical content this institution is authorized to use, and may
-- this caller see them" -- and `eligible_items_for_definition` remains the only
-- place where eligibility is computed, applying the same tier and scope tests
-- to both branches.
--
-- NOTHING MOVES FOR ANY EXISTING DEFINITION. The own-institution branch is
-- reproduced here CHARACTER FOR CHARACTER, and the canonical branch is gated on
-- `d.is_ad_hoc` and additionally excludes the definition's own institution, so
-- it can neither add a row nor duplicate one for a non-ad-hoc definition. That
-- is asserted below over every definition that exists, and asserted as set
-- EQUALITY -- not as absence of error -- in the acceptance suite.
--
-- ONE CONTENT OWNER PER AD-HOC PAPER (ADR-0018). Decided in the ADR, not left
-- to implementation, and enforced rather than merely unimplemented:
-- `enforce_ad_hoc_single_owner` is called at creation by 0062's launcher and
-- again at draw time by `assemble_session`, so a paper hand-built past the
-- launcher is refused too.
--
-- NO HASH IMPLICATION. An ad-hoc definition is outside the frozen
-- PINTAR-CONTENT-SHA256/1 payload by ADR-0011 and can never enter a release.
-- INV-04 is untouched, and the terminal block proves the payload builder does
-- not read this migration's additions.

-- ---------------------------------------------------------------------------
-- 1. The accessor: canonical item rows this institution is authorized to use.
--
--    Two named predicates, no restatement. `release_is_distributed_to` carries
--    the authorization rule -- including the
--    `owner.tenant_kind = 'PLATFORM_CANONICAL'` conjunct that makes
--    School B -> School C structurally impossible -- and
--    `is_member_of_institution` carries the caller's relationship to the
--    consuming school.
--
--    WHY THAT GATE AND NOT 0056's. `caller_may_read_distributed_release` asks
--    whether a member of STAFF may read canonical content in Studio, and it is
--    the right question for the catalogue, the outline and the preview. It is
--    the wrong question here: a paper is drawn by `assemble_session` running as
--    the LEARNER, who holds no capability anywhere and must not need one. The
--    first draft of this migration used it, and the learner's assembly drew an
--    empty pool -- caught by this file's own end-to-end probe, not by reading.
--    Widening the Studio gate to admit learners would have made a canonical
--    lesson body learner-previewable, which is a different and much larger
--    decision, so the gate here is the existing membership predicate instead:
--    staff assignment or active enrolment, the same relationship the rest of
--    the platform means by "belongs to this school".
--
--    WHY IT TAKES NO ARGUMENT. The first draft took the consuming institution
--    as a parameter, and `assert_engine_takes_no_identity` refused it: a
--    LEARNER-classified entry point must not accept a caller-supplied
--    identity. The assertion was right and the parameter was wrong. The
--    institution is now DERIVED -- the function returns rows for the
--    institutions the caller actually belongs to, and there is no id to
--    substitute. That is a stronger control than the membership check alone,
--    because it removes the substitution rather than refusing it.
--
--    EXISTS rather than a join to `plp_releases`: a course may carry several
--    distributed releases, and a join would return the same item once per
--    release. The distinct subquery does the same for the distribution rows.
--    The row shape carries the module and course so the caller can apply the
--    definition's scope test without a second lookup.
-- ---------------------------------------------------------------------------
create function public.authorized_canonical_items()
returns table (consuming_institution_id uuid, item_id uuid, lesson_id uuid, module_id uuid,
               course_id uuid, parallel_group uuid, bank_type public.bank_type,
               owner_institution_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select mine.institution_id, i.id, l.id, m.id, c.id, i.parallel_group, i.bank_type, i.institution_id
    from (select distinct d.institution_id
            from public.release_distributions d
           where d.status = 'ACTIVE'
             and public.is_member_of_institution(d.institution_id)) mine
    join public.courses c on true
    join public.modules m on m.course_id = c.id
    join public.lessons l on l.module_id = m.id
    join public.items i on i.lesson_id = l.id
   where exists (
           select 1 from public.plp_releases r
            where r.course_id = c.id
              and public.release_is_distributed_to(r.id, mine.institution_id))
$$;
revoke all on function public.authorized_canonical_items() from public, anon, authenticated;
grant execute on function public.authorized_canonical_items() to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('authorized_canonical_items', 'LEARNER',
   'Item identity -- id, parallel group and bank tier -- of canonical content the CALLER''S OWN '
   'institutions hold an active distribution for. Takes no argument: the institution is derived '
   'from the caller, never supplied by them, so there is no id to substitute. LEARNER because '
   'the paper is drawn by assemble_session running as the learner. Carries no stem, no option, '
   'no correctness mapping and no rationale: it is the identity half of eligibility, not '
   'content. Exists so eligible_items_for_definition can stay SECURITY INVOKER (ADR-0018).');

comment on function public.authorized_canonical_items() is
  'Canonical item rows an institution is authorized to use, by distribution rather than '
  'ownership. Carries no eligibility logic: tier, scope, cooling and exclusion all remain in '
  'eligible_items_for_definition, which is the only engine (INV-26).';

-- ---------------------------------------------------------------------------
-- 2. The boundary: one content owner per ad-hoc paper (ADR-0018).
--
--    A guard called explicitly, not a trigger: the condition spans the
--    definition, its module, its lessons and their items, so there is no single
--    row whose write could carry it. Called at creation and again at draw.
-- ---------------------------------------------------------------------------
create function public.enforce_ad_hoc_single_owner(p_definition uuid)
returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_ad_hoc boolean; n int; v_owners text;
begin
  select d.is_ad_hoc into v_ad_hoc from public.assessment_definitions d where d.id = p_definition;
  if not coalesce(v_ad_hoc, false) then return; end if;

  select count(distinct i.institution_id), string_agg(distinct inst.name, ', ' order by inst.name)
    into n, v_owners
    from public.eligible_items_for_definition(p_definition) e
    join public.items i on i.id = e.item_id
    join public.institutions inst on inst.id = i.institution_id;

  if n > 1 then
    raise exception
      'a quick assessment draws from one content owner; this one resolves to % (%). Pick the school''s own chapter or one authorized chapter, not both (ADR-0018)',
      n, v_owners;
  end if;
end $$;
revoke all on function public.enforce_ad_hoc_single_owner(uuid) from public, anon, authenticated;

comment on function public.enforce_ad_hoc_single_owner(uuid) is
  'Refuses an ad-hoc paper whose eligible set spans more than one owning institution '
  '(ADR-0018). Non-ad-hoc definitions return immediately and unchanged.';

-- ---------------------------------------------------------------------------
-- 3. Eligibility. Branch (a) is 0020's body, reproduced character for
--    character. Branch (b) is new, and reachable only for an ad-hoc definition.
-- ---------------------------------------------------------------------------
create or replace function public.eligible_items_for_definition(p_definition uuid)
returns table (item_id uuid, parallel_group uuid, bank_type public.bank_type)
language sql stable
-- RESTORED, not added. A later migration had pinned this function's
-- search_path and the first draft of 0061 dropped it by retyping the header
-- from 0020's file instead of from the live catalog. `functions_without_search_path`
-- went 0 -> 1 and F05-T21 named it. The lesson is 0049's, learned twice now:
-- splice from what is running, never from what was written.
set search_path = public, pg_temp as $$
  select i.id, i.parallel_group, i.bank_type
    from public.assessment_definitions d
    join public.lessons l on true
    join public.modules m on m.id = l.module_id
    join public.items i on i.lesson_id = l.id
   where d.id = p_definition
     and i.institution_id = d.institution_id
     and public.item_is_drawable(i.bank_type, d.bank_type)
     and ((d.course_id is not null and m.course_id = d.course_id)
       or (d.module_id is not null and l.module_id = d.module_id))
  union all
  -- AD-HOC ONLY (ADR-0018). Authorized canonical content, under the same tier
  -- and scope tests as the branch above. The owner test is what makes this
  -- branch incapable of duplicating a row from branch (a): every row here is
  -- owned by someone other than the definition's institution.
  select a.item_id, a.parallel_group, a.bank_type
    from public.assessment_definitions d
    join public.authorized_canonical_items() a
      on a.consuming_institution_id = d.institution_id
   where d.id = p_definition
     and d.is_ad_hoc
     and a.owner_institution_id is distinct from d.institution_id
     and public.item_is_drawable(a.bank_type, d.bank_type)
     and ((d.course_id is not null and a.course_id = d.course_id)
       or (d.module_id is not null and a.module_id = d.module_id))
$$;

-- ---------------------------------------------------------------------------
-- 4. The draw refuses a two-owner ad-hoc paper, wherever it was built.
--
--    0062's launcher checks at creation, which is where ADR-0018 puts the
--    boundary. This is the second reading, for a paper assembled past the
--    launcher -- a definition written directly by a holder of CAN_DRAFT, which
--    is precisely the construction an auditor would try.
--
--    Gated on is_ad_hoc inside the guard, so no non-ad-hoc session changes.
-- ---------------------------------------------------------------------------
create or replace function public.assemble_session(p_session uuid)
returns integer
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

  -- ADDED IN 0061 (ADR-0018): one content owner per ad-hoc paper, read again
  -- here so the boundary holds for a definition that never went through the
  -- launcher. Returns immediately for every non-ad-hoc definition.
  perform public.enforce_ad_hoc_single_owner(v_d.id);

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

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- The behavioural half builds every row it reads inside a rolled-back
-- subtransaction -- a canonical package, a school, a real actor holding a real
-- capability, a release, a grant -- so it means the same thing on a from-empty
-- replay as on a seeded database. The structural half always executes; there is
-- no conditional probe here, because a probe that can skip itself proves
-- nothing.
-- ---------------------------------------------------------------------------
do $$
declare
  v_src text; n int;
  v_canon uuid; v_school uuid; v_course uuid; v_mod uuid; v_les uuid; v_item uuid;
  v_rel uuid; v_dist uuid; v_def uuid; v_def2 uuid; v_uid uuid; v_person uuid;
  v_hash_before text; v_hash_after text; v_refused boolean;
begin
  -- === structural ==========================================================
  v_src := pg_get_functiondef('public.eligible_items_for_definition(uuid)'::regprocedure);

  -- 0020's rule, restated as a standing guard because this migration rewrote
  -- the function: INVOKER is what keeps it from being a reader over every
  -- institution's bank.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'eligible_items_for_definition' and p.prosecdef;
  if n > 0 then raise exception 'eligible_items_for_definition became SECURITY DEFINER'; end if;

  -- the own-institution branch is still the ownership equality, unchanged
  if v_src !~ 'i\.institution_id = d\.institution_id' then
    raise exception 'the own-institution eligibility branch is gone';
  end if;
  -- and the new branch is gated on is_ad_hoc, not on anything else
  if v_src !~ 'd\.is_ad_hoc' then
    raise exception 'the canonical eligibility branch is not gated on is_ad_hoc';
  end if;
  if v_src !~ 'authorized_canonical_items' then
    raise exception 'the canonical eligibility branch does not read the accessor';
  end if;

  -- the accessor calls the authorization predicate rather than restating it
  v_src := pg_get_functiondef('public.authorized_canonical_items()'::regprocedure);
  if v_src !~ 'release_is_distributed_to' then
    raise exception 'authorized_canonical_items does not call release_is_distributed_to';
  end if;
  if v_src ~ 'PLATFORM_CANONICAL' then
    raise exception 'authorized_canonical_items restates the tenant-kind rule instead of calling the predicate';
  end if;

  -- exposure: nothing new is reachable anonymously, and the one client-reachable
  -- addition carries a registry row
  if has_function_privilege('anon', 'public.authorized_canonical_items()'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.enforce_ad_hoc_single_owner(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'this migration made a function anon-executable';
  end if;
  if has_function_privilege('authenticated', 'public.enforce_ad_hoc_single_owner(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'the single-owner guard is client-executable; it is an internal guard';
  end if;
  if not exists (select 1 from public.client_rpc_registry
                  where function_name = 'authorized_canonical_items' and exposure = 'LEARNER') then
    raise exception 'authorized_canonical_items is granted to authenticated without a registry row';
  end if;
  -- the caller gate is the membership predicate, called rather than restated
  if pg_get_functiondef('public.authorized_canonical_items()'::regprocedure)
       !~ 'is_member_of_institution' then
    raise exception 'authorized_canonical_items does not gate on the caller''s institution membership';
  end if;
  -- and it accepts no identity at all: there is no argument to substitute
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'authorized_canonical_items' and p.pronargs > 0;
  if n > 0 then
    raise exception 'authorized_canonical_items takes a caller-supplied argument; the institution must be derived';
  end if;
  -- the pinned search_path did not go missing in the rewrite
  if coalesce(array_to_string(
        (select p.proconfig from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
          where ns.nspname = 'public' and p.proname = 'eligible_items_for_definition'), ','), '')
     not like '%search_path%' then
    raise exception 'eligible_items_for_definition lost its pinned search_path in this rewrite';
  end if;

  -- INV-04: the hash payload still excludes ad-hoc definitions by name
  v_src := pg_get_functiondef('public.content_canonical_payload(uuid)'::regprocedure);
  if v_src !~ 'is_ad_hoc' then
    raise exception 'the content payload no longer excludes ad-hoc definitions (INV-04)';
  end if;
  if v_src ~ 'authorized_canonical_items' then
    raise exception 'the content hash basis now reads this migration''s additions (INV-04)';
  end if;

  -- the draw reads the boundary
  if pg_get_functiondef('public.assemble_session(uuid)'::regprocedure) !~ 'enforce_ad_hoc_single_owner' then
    raise exception 'assemble_session does not read the single-owner boundary';
  end if;

  -- no pre-existing definition gains a foreign item. Computed over every row
  -- that exists, not asserted.
  select count(*) into n
    from public.assessment_definitions d
    join public.eligible_items_for_definition(d.id) e on true
    join public.items i on i.id = e.item_id
   where not d.is_ad_hoc and i.institution_id <> d.institution_id;
  if n > 0 then
    raise exception '% non-ad-hoc definition row(s) now draw another institution''s item', n;
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    select i.id into v_canon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
    if v_canon is null then raise exception 'no PLATFORM_CANONICAL tenant exists at 0061'; end if;

    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0061 school', 'probe-0061-school', true, true) returning id into v_school;

    -- a real actor holding a real capability: the accessor gates on one, and a
    -- probe run with no person would pass for the wrong reason
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0061@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    if v_person is null then raise exception 'the probe actor has no person row'; end if;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, 'EDUCATOR', v_school, now() - interval '1 day', now() + interval '1 day');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    if public.current_person_id() is null then raise exception 'the probe actor did not resolve'; end if;

    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_canon, 'Matematika', 'SD', 'Kelas 5', 'probe 0061 canonical') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_course, v_canon, 1, 'probe modul') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_mod, v_canon, 1, 'probe pelajaran', 'isi') returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
    values (v_les, v_canon, 'MCQ_SINGLE', 'PRACTICE', 'probe soal') returning id into v_item;
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_canon, v_course, '9.0.1') returning id into v_rel;

    -- the school's own ad-hoc paper over the canonical module
    insert into public.assessment_definitions
      (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
       difficulty_mix, passing_rules, status, is_ad_hoc)
    values (v_school, v_mod, 'probe 0061 kuis', 'QUICK', 'PRACTICE', 3, 0,
            '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true)
    returning id into v_def;

    -- (1) with no grant at all, the canonical item is not eligible
    select count(*) into n from public.eligible_items_for_definition(v_def);
    if n <> 0 then
      raise exception 'an ad-hoc paper drew % canonical item(s) with no distribution grant', n;
    end if;

    -- (2) under an active grant it is
    insert into public.release_distributions
      (plp_release_id, institution_id, status, authorized_by_person_id)
    values (v_rel, v_school, 'ACTIVE', v_person) returning id into v_dist;
    select count(*) into n from public.eligible_items_for_definition(v_def) where item_id = v_item;
    if n <> 1 then
      raise exception 'an authorized canonical item is not eligible for an ad-hoc paper (got %)', n;
    end if;

    -- (3) the same module, a NON-ad-hoc definition: still refused
    insert into public.assessment_definitions
      (institution_id, module_id, title, mode, bank_type, item_count, safety_critical_minimum,
       difficulty_mix, passing_rules, status, is_ad_hoc)
    values (v_school, v_mod, 'probe 0061 bukan kuis', 'PRACTICE', 'PRACTICE', 3, 0,
            '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', false)
    returning id into v_def2;
    select count(*) into n from public.eligible_items_for_definition(v_def2);
    if n <> 0 then
      raise exception 'a non-ad-hoc definition drew % canonical item(s); the gate is not is_ad_hoc', n;
    end if;

    -- (4) INV-04: an ad-hoc paper over a course changes that course's payload
    --     digest by nothing at all
    select md5(public.content_canonical_payload(v_course)::text) into v_hash_before;
    insert into public.assessment_definitions
      (institution_id, course_id, title, mode, bank_type, item_count, safety_critical_minimum,
       difficulty_mix, passing_rules, status, is_ad_hoc)
    values (v_school, v_course, 'probe 0061 kuis kursus', 'QUICK', 'PRACTICE', 3, 0,
            '{"MUDAH":3}'::jsonb, '{"mastery_min":0.6}'::jsonb, 'INGESTED', true);
    select md5(public.content_canonical_payload(v_course)::text) into v_hash_after;
    if v_hash_before is distinct from v_hash_after then
      raise exception 'an ad-hoc definition moved the content payload digest (INV-04)';
    end if;

    -- (5) the single-owner boundary, against a paper that genuinely spans two
    --     owners: the school adds an item of its own into the canonical lesson
    --     (reachable only because this probe's course is unsealed) and binds an
    --     ad-hoc paper to the whole course, so both branches fire.
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
    values (v_les, v_school, 'MCQ_SINGLE', 'PRACTICE', 'probe soal sekolah');
    select count(distinct i.institution_id) into n
      from public.eligible_items_for_definition(
             (select d.id from public.assessment_definitions d
               where d.institution_id = v_school and d.title = 'probe 0061 kuis kursus')) e
      join public.items i on i.id = e.item_id;
    if n <> 2 then
      raise exception 'the two-owner probe did not build a two-owner paper (% owner(s)); the refusal below would be vacuous', n;
    end if;
    v_refused := false;
    begin
      perform public.enforce_ad_hoc_single_owner(
        (select d.id from public.assessment_definitions d
          where d.institution_id = v_school and d.title = 'probe 0061 kuis kursus'));
    exception when others then
      v_refused := sqlerrm ~ 'one content owner';
    end;
    if not v_refused then
      raise exception 'a two-owner ad-hoc paper was not refused (ADR-0018)';
    end if;

    -- (6) withdrawal removes new eligibility and leaves the grant row standing
    update public.release_distributions
       set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = v_person
     where id = v_dist;
    select count(*) into n
      from public.eligible_items_for_definition(v_def) e
      join public.items i on i.id = e.item_id
     where i.institution_id = v_canon;
    if n <> 0 then
      raise exception 'a withdrawn grant still draws % canonical item(s)', n;
    end if;
    select count(*) into n from public.release_distributions where id = v_dist;
    if n <> 1 then raise exception 'withdrawal deleted the grant row'; end if;

    raise exception 'PROBE_0061_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0061_ROLLBACK' then raise; end if;
  end;
end $$;
