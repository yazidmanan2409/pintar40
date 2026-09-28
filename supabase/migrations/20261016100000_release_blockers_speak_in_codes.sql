-- BOB-17 (D-011; audit M7) -- RELEASE BLOCKERS SPEAK IN CODES.
--
-- publish_readiness returned sentences: "2 temuan ERROR pada teks siswa",
-- "mutu soal: STEM_REVEALS_ANSWER (1 soal)". The Terbit step showed them as
-- they were, check names and severity words included, and the status was even
-- derived by matching '%ERROR%' in its own sentences. studio_package_state
-- added four more sentences of its own. Now every blocker is a code with its
-- parameters -- the count, the lesson it is about, the question-quality
-- pattern -- and the words are the copy table's (src/lib/terbitan-kontrak.ts
-- KODE_HAMBATAN; DAISY-16).
--
--   READINESS_TEXT_ERROR / READINESS_TEXT_WARNING   unacknowledged findings in
--       the learners' text, one blocker per lesson (count, lesson_id, lesson);
--       lesson_id is absent for a finding about the course as a whole
--   READINESS_ITEM_ERROR / READINESS_ITEM_WARNING   unacknowledged question-
--       quality findings, one per lesson and pattern (count, lesson_id,
--       lesson, pattern)
--   READINESS_NOT_VALIDATED / READINESS_RETURNED / READINESS_AWAITING_REVIEW
--       (count), READINESS_NO_RELEASE, READINESS_NOT_SEALED -- the package's
--       own state, added by studio_package_state
--
-- BLOCKED is decided by code: an error in the text or a question, or content
-- returned to be fixed. Any other blocker is ACTION_REQUIRED; none is READY.
-- The same findings, counted the same way, make the same decision as before;
-- only the telling changes.
--
-- The return columns keep their names; `blockers` and `reasons` become jsonb,
-- so publish_readiness and studio_package_state are dropped and made again
-- (a function's result type cannot be altered in place). Their callers are
-- plpgsql, read by name at run time: freeze_release already passes
-- to_jsonb(blockers) through unchanged, and the publish trigger is replaced
-- below to read the new shape.

-- ---------------------------------------------------------------------------
-- 1. publish_readiness
-- ---------------------------------------------------------------------------
drop function public.publish_readiness(uuid);
create function public.publish_readiness(p_course uuid)
returns table (status text, blockers jsonb)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not exists (select 1 from public.courses where id = p_course) then
    raise exception 'unknown course %', p_course;
  end if;

  with teks as (
    -- a finding names a lesson, a question or an option; each belongs to a lesson
    select f.severity::text as sev,
           case f.target_table
             when 'lessons' then f.target_id
             when 'items' then (select i.lesson_id from public.items i where i.id = f.target_id)
             when 'item_options' then (select i.lesson_id from public.item_options o
                                          join public.items i on i.id = o.item_id where o.id = f.target_id)
           end as lesson_id
      from public.coaching_findings f
     where f.course_id = p_course and f.acknowledged_at is null
  ), soal as (
    select f.severity::text as sev, f.pattern_class as pola, i.lesson_id
      from public.mcq_quality_findings f
      left join public.items i on i.id = f.item_id
     where f.course_id = p_course and f.acknowledged_at is null
  ), baris as (
    select case t.sev when 'ERROR' then 'READINESS_TEXT_ERROR' else 'READINESS_TEXT_WARNING' end as code,
           t.lesson_id, null::text as pola, count(*)::int as n
      from teks t group by 1, 2
    union all
    select case q.sev when 'ERROR' then 'READINESS_ITEM_ERROR' else 'READINESS_ITEM_WARNING' end,
           q.lesson_id, q.pola, count(*)::int
      from soal q group by 1, 2, 3
  )
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
           'code', b.code, 'count', b.n, 'lesson_id', b.lesson_id, 'lesson', l.title, 'pattern', b.pola))
         order by b.code like '%_ERROR' desc, b.code, m.ordinal nulls first, l.ordinal nulls first, b.pola), '[]'::jsonb)
    into v
    from baris b
    left join public.lessons l on l.id = b.lesson_id
    left join public.modules m on m.id = l.module_id;

  blockers := v;
  status := case
    when exists (select 1 from jsonb_array_elements(v) e
                  where e ->> 'code' in ('READINESS_TEXT_ERROR', 'READINESS_ITEM_ERROR')) then 'BLOCKED'
    when jsonb_array_length(v) > 0 then 'ACTION_REQUIRED'
    else 'READY' end;
  return next;
end $$;
revoke all on function public.publish_readiness(uuid) from public, anon;
grant execute on function public.publish_readiness(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. The publish gate reads the codes. Its refusal is unchanged (PR040
--    RELEASE_NOT_READY); its message, developer text that never reaches a
--    screen, now lists codes instead of sentences.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_release_publish_readiness() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text; v_blockers jsonb;
begin
  if new.status = 'PUBLISHED' and old.status is distinct from new.status then
    select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(new.course_id) pr;
    if v_status <> 'READY' then
      raise exception using
        errcode = 'PR040',
        detail  = 'RELEASE_NOT_READY',
        message = format('publish readiness is %s: %s', v_status,
                         (select string_agg(e ->> 'code', ', ') from jsonb_array_elements(v_blockers) e));
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_release_publish_readiness() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. studio_package_state: the same checks and decision, told as codes.
-- ---------------------------------------------------------------------------
drop function public.studio_package_state(uuid);
create function public.studio_package_state(p_course uuid)
returns table (surface_state text, reasons jsonb, preview_lesson_id uuid)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  c record; v_status text; v_blockers jsonb; v_reasons jsonb := '[]'::jsonb;
  n_unvalidated int; n_unapproved int; v_release record;
begin
  select * into c from public.courses where id = p_course;
  if c.id is null then raise exception 'unknown course %', p_course; end if;
  if not (public.can_in_institution('CAN_DRAFT', c.institution_id)
       or public.can_in_institution('CAN_ASSIGN_LEARNING', c.institution_id)) then
    raise exception 'reading a package''s state requires CAN_DRAFT or CAN_ASSIGN_LEARNING in the owning institution';
  end if;

  -- the findings gate, read not reimplemented
  select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(p_course) pr;
  v_reasons := v_reasons || coalesce(v_blockers, '[]'::jsonb);

  -- technical validation: anything still short of VALIDATED is work a human
  -- can do in Studio now
  select count(*) into n_unvalidated from (
    select 1 from public.courses x where x.id = p_course and x.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.modules m where m.course_id = p_course and m.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
     where m.course_id = p_course and l.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.status in ('INGESTED','STRUCTURED')) t;
  if n_unvalidated > 0 then
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code', 'READINESS_NOT_VALIDATED', 'count', n_unvalidated));
  end if;

  select count(*) into n_unapproved from (
    select 1 from public.courses x where x.id = p_course and x.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.modules m where m.course_id = p_course and m.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
     where m.course_id = p_course and l.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.status = 'VALIDATION_FAILED') t;
  if n_unapproved > 0 then
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code', 'READINESS_RETURNED', 'count', n_unapproved));
    v_status := 'BLOCKED';
  end if;

  -- academic sign-off
  select count(*) into n_unapproved from (
    select 1 from public.courses x where x.id = p_course and x.reviewed_by_person_id is null
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.reviewed_by_person_id is null) t;
  if n_unapproved > 0 then
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code', 'READINESS_AWAITING_REVIEW', 'count', n_unapproved));
  end if;

  -- the seal
  select r.id, r.status, r.version_label into v_release
    from public.plp_releases r where r.course_id = p_course
   order by r.created_at desc limit 1;
  if v_release.id is null then
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code', 'READINESS_NO_RELEASE'));
  elsif not public.content_is_sealed(p_course) then
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code', 'READINESS_NOT_SEALED'));
  end if;

  if v_status = 'BLOCKED' then
    surface_state := 'BLOCKED';
  elsif jsonb_array_length(v_reasons) > 0 then
    surface_state := 'ACTION_REQUIRED';
  else
    surface_state := 'READY';
  end if;
  reasons := v_reasons;

  select l.id into preview_lesson_id from public.lessons l
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course order by m.ordinal, l.ordinal limit 1;
  return next;
end $$;
revoke all on function public.studio_package_state(uuid) from public, anon, authenticated;
grant execute on function public.studio_package_state(uuid) to authenticated;
update public.client_rpc_registry
   set note = 'The package''s surface state (READY, ACTION_REQUIRED or BLOCKED) and why, as blocker codes with '
           || 'their parameters (BOB-17, D-011; the words are the copy table''s). Composes publish_readiness with '
           || 'the lifecycle facts; reimplements no check.'
 where function_name = 'studio_package_state';

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text; f text;
begin
  -- no sentence is left in either function: the words are the copy table's
  foreach f in array array['public.publish_readiness(uuid)', 'public.studio_package_state(uuid)'] loop
    v_src := pg_get_functiondef(f::regprocedure);
    if v_src ~* '(temuan|belum|bagian isi|paket ini|isi paket|mutu soal:|pada teks)' then
      raise exception 'BOB-17: % still writes a sentence', f;
    end if;
  end loop;
  -- 0050's rules still hold: patterns are read from the findings, never listed here
  v_src := pg_get_functiondef('public.publish_readiness(uuid)'::regprocedure);
  if v_src !~ 'pattern_class' then raise exception 'BOB-17: publish_readiness no longer names the pattern'; end if;
  if v_src ~ 'CORRECT_OPTION_LENGTH_IMBALANCE|ANSWER_POSITION_SKEW|IMPLAUSIBLE_DISTRACTOR|STEM_REVEALS_ANSWER' then
    raise exception 'BOB-17: publish_readiness hardcodes pattern names';
  end if;
  if has_function_privilege('anon', 'public.publish_readiness(uuid)', 'execute')
     or has_function_privilege('anon', 'public.studio_package_state(uuid)', 'execute') then
    raise exception 'BOB-17: a readiness function became anon-executable';
  end if;
end $$;
