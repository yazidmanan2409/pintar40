-- 0046 — FABLE-04 §5 meets INV-04, and the collision is real.
--
-- WHAT THE SUITE FOUND. `launch_quick_assessment` was refused with "taught
-- content cannot be added under a frozen course (INV-04)". That is not a bug in
-- the trigger and not a bug in Quick Assessment: `assessment_definitions` is in
-- the taught-content set, its columns are inside the frozen
-- `PINTAR-CONTENT-SHA256/1` payload, and a release is sealed permanently once
-- any release of its course reaches FROZEN. So an educator could never launch a
-- quick assessment for a PUBLISHED course -- which is every course a class is
-- actually learning from. §5's one-minute promise and INV-04's seal are in
-- direct contradiction as the schema stood.
--
-- HOW IT IS RESOLVED, AND WHY THIS IS NOT A WEAKENING. A Quick Assessment is
-- not taught content. It is an educator's ad-hoc instrument over content that
-- was already sealed -- it teaches nothing, it is not part of what a certificate
-- binds to, and it is not published. So the distinction is made explicit:
-- `is_ad_hoc` marks a definition as outside the release, such a definition is
-- EXCLUDED from the content payload, and only such a definition may be created
-- under a sealed course. Everything else about INV-04 is untouched: a
-- release-bound definition still cannot be added, edited or deleted after the
-- freeze, and an ad-hoc definition can never become release-bound.
--
-- THE HASH DOES NOT MOVE, AND THAT IS PROVEN NOT ASSERTED. Excluding ad-hoc
-- rows from the payload is only safe if no existing row is ad-hoc. The column
-- defaults to false, so none is -- and the verification block captures every
-- sealed release's stored hash, applies the new payload function, and requires
-- each to still equal a fresh recomputation. If any moved, this migration
-- refuses to apply.
--
-- ALSO HERE: `publish_scoring_policy` and `recompute_result` were revoked from
-- every role, including the SYSTEM_ADMIN they check for internally, so the
-- INV-29 correction path was unreachable by anyone. They now follow
-- `platform_schema_lint`'s pattern -- granted to `authenticated`, gated inside
-- on `is_system_admin()` -- and are registered as STAFF.

alter table public.assessment_definitions
  add column if not exists is_ad_hoc boolean not null default false;

comment on column public.assessment_definitions.is_ad_hoc is
  'An educator''s ad-hoc instrument (Quick Assessment), outside the taught-content release: excluded from PINTAR-CONTENT-SHA256/1 and permitted under a sealed course. Never becomes release-bound.';

-- ---------------------------------------------------------------------------
-- 1. The payload excludes ad-hoc definitions.
-- ---------------------------------------------------------------------------
create or replace function public.content_canonical_payload(p_course uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
with
course_row as (
  select c.subject, c.stage, c.grade_label, c.title
    from public.courses c where c.id = p_course
),
course_lessons as (
  select l.id as lesson_id, l.module_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
),
-- objectives of a lesson: a set, keyed by the stable `code`
objective_payload as (
  select lo.lesson_id,
         string_agg(public.content_field(lo.code)
                 || public.content_field(lo.statement)
                 || public.content_field(lo.bloom::text)
                 || public.content_field(lo.is_core::text),
                    '' order by lo.code collate "C") as payload
    from public.learning_objectives lo
    join course_lessons cl on cl.lesson_id = lo.lesson_id
   group by lo.lesson_id
),
-- options of an item: ORDERED, because `label` is the position a learner sees
option_payload as (
  select o.item_id,
         string_agg(public.content_field(o.label)
                 || public.content_field(o.body)
                 || public.content_field(o.is_correct::text)
                 || public.content_field(o.rationale)
                 || public.content_field(o.misconception_code),
                    '' order by o.label collate "C") as payload
    from public.item_options o
    join public.items i on i.id = o.item_id
    join course_lessons cl on cl.lesson_id = i.lesson_id
   group by o.item_id
),
-- the objectives an item targets, by code: never by objective_ids (uuids)
item_objective_payload as (
  select i.id as item_id,
         string_agg(public.content_field(lo.code), '' order by lo.code collate "C") as payload
    from public.items i
    join course_lessons cl on cl.lesson_id = i.lesson_id
    join public.learning_objectives lo on lo.id = any (i.objective_ids)
   group by i.id
),
item_base as (
  select i.id, i.lesson_id, i.parallel_group,
         public.content_digest(
              public.content_field(i.item_type::text)
           || public.content_field(i.bank_type::text)
           || public.content_field(i.stem)
           || public.content_field(i.stimulus)
           || public.content_field(i.petunjuk)
           || public.content_field(i.arah_berpikir)
           || public.content_field(i.predicted_difficulty::text)
           || public.content_field(i.is_safety_critical::text)
           || public.content_field(iop.payload)
           || public.content_field(op.payload)) as digest
    from public.items i
    join course_lessons cl on cl.lesson_id = i.lesson_id
    left join item_objective_payload iop on iop.item_id = i.id
    left join option_payload op on op.item_id = i.id
),
-- parallel_group is a uuid, so it cannot be hashed, but regrouping parallel
-- items changes what a learner can be shown and must not be invisible. Groups
-- are ordered by the sorted concatenation of their members' digests and given
-- a dense_rank; that rank -- pure content, no identifier -- enters the item.
parallel_key as (
  select ib.parallel_group,
         string_agg(ib.digest, '' order by ib.digest collate "C") as k
    from item_base ib where ib.parallel_group is not null
   group by ib.parallel_group
),
parallel_rank as (
  select pk.parallel_group, dense_rank() over (order by pk.k collate "C") as idx
    from parallel_key pk
),
item_final as (
  select ib.lesson_id,
         public.content_digest(public.content_field(ib.digest)
                            || public.content_field(pr.idx::text)) as digest
    from item_base ib
    left join parallel_rank pr on pr.parallel_group = ib.parallel_group
),
-- items in a lesson: a set
item_payload as (
  select itf.lesson_id, string_agg(itf.digest, '' order by itf.digest collate "C") as payload
    from item_final itf group by itf.lesson_id
),
lesson_digest as (
  select l.module_id, l.ordinal,
         public.content_digest(
              public.content_field(l.ordinal::text)
           || public.content_field(l.title)
           || public.content_field(l.summary)
           || public.content_field(l.body_markdown)
           || public.content_field(l.worked_examples::text)
           || public.content_field(l.media::text)
           || public.content_field(ob.payload)
           || public.content_field(ip.payload)) as digest
    from public.lessons l
    join public.modules m on m.id = l.module_id and m.course_id = p_course
    left join objective_payload ob on ob.lesson_id = l.id
    left join item_payload ip on ip.lesson_id = l.id
),
-- lessons in a module and modules in a course: ORDERED by ordinal
module_payload as (
  select m.course_id,
         string_agg(public.content_digest(
                         public.content_field(m.ordinal::text)
                      || public.content_field(m.title)
                      || public.content_field(lp.payload)),
                    '' order by m.ordinal) as payload
    from public.modules m
    left join lateral (select string_agg(ld.digest, '' order by ld.ordinal) as payload
                         from lesson_digest ld where ld.module_id = m.id) lp on true
   where m.course_id = p_course
   group by m.course_id
),
-- assessment definitions in scope: bound to the course, or to one of its
-- modules. The module binding enters as that module's ordinal, never its uuid.
assessment_digest as (
  select public.content_digest(
              public.content_field(a.title)
           || public.content_field(a.mode::text)
           || public.content_field(a.bank_type::text)
           || public.content_field(a.version::text)
           || public.content_field(a.item_count::text)
           || public.content_field(a.difficulty_mix::text)
           || public.content_field(a.safety_critical_minimum::text)
           || public.content_field(a.passing_rules::text)
           || public.content_field(a.hesitation_window_seconds::text)
           || public.content_field(a.shuffle_policy)
           || public.content_field(a.allows_pause::text)
           || public.content_field(a.offline_tolerant::text)
           || public.content_field(a.late_sync_grace_seconds::text)
           || public.content_field(a.attempt_limit::text)
           || public.content_field(am.ordinal::text)) as digest
    from public.assessment_definitions a
    left join public.modules am on am.id = a.module_id
   -- ADDED IN 0046: an ad-hoc instrument (Quick Assessment) is not part of
   -- the taught release, so it is not part of what the release hash addresses.
   where (a.course_id = p_course or am.course_id = p_course) and not a.is_ad_hoc
),
assessment_payload as (
  select string_agg(ad.digest, '' order by ad.digest collate "C") as payload
    from assessment_digest ad
)
select 'PINTAR-CONTENT-SHA256/1'
    || public.content_field(cr.subject)
    || public.content_field(cr.stage)
    || public.content_field(cr.grade_label)
    || public.content_field(cr.title)
    || public.content_field(mp.payload)
    || public.content_field(ap.payload)
  from course_row cr
  left join module_payload mp on true
  left join assessment_payload ap on true
$$;
revoke all on function public.content_canonical_payload(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Only an ad-hoc definition may be created under a sealed course.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_taught_content_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_course uuid; v_cols text[]; v_col text; v_row jsonb; v_new jsonb; v_old jsonb;
begin
  if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;

  case tg_table_name
    when 'courses' then
      v_course := (v_row ->> 'id')::uuid;
      v_cols := array['subject','stage','grade_label','title'];
    when 'modules' then
      v_course := (v_row ->> 'course_id')::uuid;
      v_cols := array['course_id','ordinal','title'];
    when 'lessons' then
      select m.course_id into v_course from public.modules m
       where m.id = (v_row ->> 'module_id')::uuid;
      v_cols := array['module_id','ordinal','title','summary','body_markdown',
                      'worked_examples','media'];
    when 'learning_objectives' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      v_cols := array['lesson_id','code','statement','bloom','is_core'];
    when 'items' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      v_cols := array['lesson_id','item_type','bank_type','stem','stimulus','petunjuk',
                      'arah_berpikir','objective_ids','is_safety_critical',
                      'predicted_difficulty','parallel_group'];
    when 'item_options' then
      select m.course_id into v_course from public.items i
        join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id
       where i.id = (v_row ->> 'item_id')::uuid;
      v_cols := array['item_id','label','body','is_correct','rationale','misconception_code'];
    when 'assessment_definitions' then
      if (v_row ->> 'course_id') is not null then
        v_course := (v_row ->> 'course_id')::uuid;
      else
        select m.course_id into v_course from public.modules m
         where m.id = (v_row ->> 'module_id')::uuid;
      end if;
      v_cols := array['course_id','module_id','title','mode','bank_type','version','item_count',
                      'difficulty_mix','safety_critical_minimum','passing_rules',
                      'hesitation_window_seconds','shuffle_policy','allows_pause',
                      'offline_tolerant','late_sync_grace_seconds','attempt_limit','is_ad_hoc'];
    else
      raise exception 'taught-content immutability trigger attached to an unexpected table: %.%',
        tg_table_schema, tg_table_name;
  end case;

  -- ADDED IN 0046. An ad-hoc assessment is not taught content: it is outside
  -- the release payload, so creating one changes no sealed hash. It may never
  -- become release-bound, and every other row is governed exactly as before.
  if tg_table_name = 'assessment_definitions' then
    if tg_op = 'INSERT' and coalesce((v_row ->> 'is_ad_hoc')::boolean, false) then
      return new;
    end if;
    if tg_op = 'UPDATE' and coalesce((to_jsonb(old) ->> 'is_ad_hoc')::boolean, false) then
      if not coalesce((to_jsonb(new) ->> 'is_ad_hoc')::boolean, false) then
        raise exception 'an ad-hoc assessment never becomes part of a release (INV-04)';
      end if;
      return new;
    end if;
  end if;

  if v_course is null or not public.content_is_sealed(v_course) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'taught content cannot be added under a frozen course (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'taught content cannot be deleted once frozen (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;

  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array v_cols loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception '%.%.% is immutable once the course is frozen (INV-04)',
        tg_table_schema, tg_table_name, v_col;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.enforce_taught_content_immutable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Quick Assessment creates an ad-hoc definition, and says so.
-- ---------------------------------------------------------------------------
create or replace function public.launch_quick_assessment(
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

  if p_item_count is null or p_item_count < 3 or p_item_count > 20 then
    raise exception 'a quick assessment carries between 3 and 20 questions, not %', p_item_count;
  end if;
  if p_minutes is null or p_minutes < 5 or p_minutes > 60 then
    raise exception 'a quick assessment runs between 5 and 60 minutes, not %', p_minutes;
  end if;

  select m.max_bank_tier into v_tier from public.mode_policy m where m.mode = 'QUICK';
  if v_tier is null then raise exception 'QUICK has no mode policy row'; end if;
  if v_tier = 'EXAM' then
    raise exception 'the QUICK mode policy reaches the EXAM tier; that is an INV-12 violation, not a configuration';
  end if;

  insert into public.assessment_definitions (
    institution_id, module_id, title, mode, bank_type, item_count,
    safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
    allows_pause, offline_tolerant, hesitation_window_seconds, shuffle_policy,
    status, author_person_id, is_ad_hoc)
  values (
    v_inst, p_module,
    'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI'),
    'QUICK', v_tier, p_item_count,
    0, jsonb_build_object('SEDANG', greatest(p_item_count / 2, 1), 'MUDAH', p_item_count - greatest(p_item_count / 2, 1)),
    jsonb_build_object('mastery_min', 0.6), 1,
    false, false, 25, 'ITEMS_AND_OPTIONS',
    'INGESTED', v_actor,
    -- INV-04: an ad-hoc instrument is outside the taught-content release, which
    -- is the only reason it may be created over a course that is already sealed
    true)
  returning id into v_def;

  select count(*) into v_drawable from public.drawable_items_for_definition(v_def);
  if v_drawable < p_item_count then
    raise exception 'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled',
      v_drawable, v_tier, p_item_count;
  end if;

  insert into public.assessment_assignments (
    institution_id, assessment_definition_id, node_id, academic_period_id,
    opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (v_inst, v_def, p_node, v_period, now(), now() + make_interval(mins => p_minutes),
          v_actor, now())
  returning id into v_assign;
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_assign;
  update public.assessment_assignments set status = 'OPEN' where id = v_assign;

  perform public.audit_write('quick_assessment.launched', 'assessment_assignments', v_assign::text,
    v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node,
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier, 'ad_hoc', true));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $$;
revoke all on function public.launch_quick_assessment(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.launch_quick_assessment(uuid, uuid, integer, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. The INV-29 correction path was unreachable by anyone. Same pattern as
--    platform_schema_lint: granted, then gated inside on is_system_admin().
-- ---------------------------------------------------------------------------
grant execute on function public.publish_scoring_policy(text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text)
  to authenticated, service_role;
grant execute on function public.recompute_result(uuid, text) to authenticated, service_role;
insert into public.client_rpc_registry values
  ('publish_scoring_policy', 'STAFF', 'SYSTEM_ADMIN only, checked in the body; audited (INV-29)'),
  ('recompute_result', 'STAFF', 'SYSTEM_ADMIN only, checked in the body; writes a new linked result, never an edit (INV-29)');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). The hash-invariance half is behavioural and
-- non-negotiable: if any sealed release moved, this migration does not apply.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; v_ok boolean; v_detail text; v_course uuid; v_def uuid; v_inst uuid;
begin
  select count(*), string_agg(r.version_label, ', ') into n, bad
    from public.plp_releases r
   where r.content_sha256 is not null
     and r.content_sha256 <> public.course_content_sha256(r.course_id);
  if n > 0 then
    raise exception 'excluding ad-hoc definitions moved % sealed release hash(es): %', n, bad;
  end if;

  -- an ad-hoc definition may be created under a sealed course; a release-bound
  -- one may not. Both halves, on a real sealed course.
  select c.id, c.institution_id into v_course, v_inst from public.courses c
    join public.plp_releases r on r.course_id = c.id
   where r.status in ('FROZEN','PUBLISHED','SUPERSEDED') limit 1;
  if v_course is not null then
    if not public.content_is_sealed(v_course) then
      raise exception 'the probe course is not sealed; the test would prove nothing';
    end if;
    begin
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy,
        allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, status)
      values (v_inst, v_course, 'probe release-bound', 'TEST', 'TEST', 3,
              jsonb_build_object('MUDAH', 3), 0, jsonb_build_object('mastery_min', 0.6),
              'ITEMS_AND_OPTIONS', false, false, 0, 1, 'INGESTED');
      raise exception 'a release-bound definition was created under a sealed course (INV-04)';
    exception when raise_exception then
      if sqlerrm !~ 'frozen course' then raise; end if;
    end;

    insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
      item_count, difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy,
      allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, status, is_ad_hoc)
    values (v_inst, v_course, 'probe ad-hoc', 'QUICK', 'TEST', 3,
            jsonb_build_object('MUDAH', 3), 0, jsonb_build_object('mastery_min', 0.6),
            'ITEMS_AND_OPTIONS', false, false, 0, 1, 'INGESTED', true)
    returning id into v_def;

    -- and it changed nothing about the sealed hash
    select count(*) into n from public.plp_releases r
     where r.content_sha256 is not null
       and r.content_sha256 <> public.course_content_sha256(r.course_id);
    if n > 0 then
      raise exception 'creating an ad-hoc assessment moved % sealed release hash(es)', n;
    end if;

    -- it can never become release-bound
    begin
      update public.assessment_definitions set is_ad_hoc = false where id = v_def;
      raise exception 'an ad-hoc assessment was promoted into a release (INV-04)';
    exception when raise_exception then
      if sqlerrm !~ 'never becomes part of a release' then raise; end if;
    end;
    delete from public.assessment_assignments where assessment_definition_id = v_def;
    delete from public.assessment_definitions where id = v_def;
  end if;

  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'ownership reachability: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_audit_write_arity() a;
  if not v_ok then raise exception 'audit_write arity: %', v_detail; end if;
end $$;
