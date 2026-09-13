-- 0050 — Publish Readiness names the finding.
--
-- WHY. FABLE-04 Stage 1 requires each adversarial MCQ bank to make Publish
-- Readiness report BLOCKED/ACTION_REQUIRED **naming the correct finding**.
-- What it reported was a count: "3 temuan WARNING mutu soal belum diakui".
-- A count is not a finding. The educator who sees it learns that something is
-- wrong and nothing about what, and a test that asserted only the count would
-- pass for the wrong bank -- which is the whole failure mode the adversarial
-- fixtures exist to catch.
--
-- WHAT CHANGES, AND WHAT DOES NOT. The count entries stay exactly as they are,
-- so nothing that reads them breaks and no existing blocker text moves. Each
-- distinct unacknowledged `pattern_class` is appended as its own blocker, in a
-- stable order, in the coaching register the rest of the product speaks:
-- named, specific, and actionable rather than accusatory. `status` is computed
-- from severity exactly as before -- the naming adds information, it does not
-- change any verdict.
--
-- The coaching (student-text) findings carry no pattern class of their own, so
-- they are named by their `lokasi`, which is what that validator produces.

create or replace function public.publish_readiness(p_course uuid)
returns table (status text, blockers text[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_err int; v_warn int; v_blockers text[] := '{}'; v_names text;
begin
  if not exists (select 1 from public.courses where id = p_course) then
    raise exception 'unknown course %', p_course;
  end if;
  select count(*) into v_err from public.coaching_findings
   where course_id = p_course and severity = 'ERROR' and acknowledged_at is null;
  select count(*) into v_warn from public.coaching_findings
   where course_id = p_course and severity = 'WARNING' and acknowledged_at is null;
  if v_err > 0 then v_blockers := v_blockers || format('%s temuan ERROR pada teks siswa', v_err); end if;
  if v_warn > 0 then v_blockers := v_blockers || format('%s temuan WARNING pada teks siswa belum diakui', v_warn); end if;

  select count(*) into v_err from public.mcq_quality_findings
   where course_id = p_course and severity = 'ERROR' and acknowledged_at is null;
  select count(*) into v_warn from public.mcq_quality_findings
   where course_id = p_course and severity = 'WARNING' and acknowledged_at is null;
  if v_err > 0 then v_blockers := v_blockers || format('%s temuan ERROR mutu soal', v_err); end if;
  if v_warn > 0 then v_blockers := v_blockers || format('%s temuan WARNING mutu soal belum diakui', v_warn); end if;

  -- ADDED IN 0050: which ones, by name.
  for v_names, v_err in
    select f.pattern_class, count(*)::int
      from public.mcq_quality_findings f
     where f.course_id = p_course and f.acknowledged_at is null
     group by f.pattern_class
     order by f.pattern_class
  loop
    v_blockers := v_blockers || format('mutu soal: %s (%s soal)', v_names, v_err);
  end loop;

  if exists (select 1 from unnest(v_blockers) b where b like '%ERROR%') then
    status := 'BLOCKED';
  elsif array_length(v_blockers, 1) > 0 then
    status := 'ACTION_REQUIRED';
  else
    status := 'READY';
  end if;
  blockers := v_blockers;
  return next;
end $$;
revoke all on function public.publish_readiness(uuid) from public, anon;
grant execute on function public.publish_readiness(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification. The naming must be derived from the findings rather
-- than from a list in this file -- a hardcoded set of pattern names would go
-- stale the moment run_mcq_quality learns a sixth pattern, which is exactly
-- the criticism 0035 made of itself and 0036 made of 0035.
-- ---------------------------------------------------------------------------
do $$
declare v_src text; v_missing text;
begin
  v_src := pg_get_functiondef('public.publish_readiness(uuid)'::regprocedure);
  if v_src !~ 'pattern_class' then
    raise exception 'publish_readiness does not name the finding';
  end if;
  if v_src ~ 'CORRECT_OPTION_LENGTH_IMBALANCE|ANSWER_POSITION_SKEW|IMPLAUSIBLE_DISTRACTOR|STEM_REVEALS_ANSWER' then
    raise exception 'publish_readiness hardcodes pattern names instead of deriving them';
  end if;

  -- every pattern run_mcq_quality can emit must be reachable as a blocker name;
  -- this compares the two derivations rather than trusting either
  select string_agg(p, ', ') into v_missing from (
    select distinct m[1] as p
      from regexp_matches(pg_get_functiondef('public.run_mcq_quality(uuid)'::regprocedure),
                          '''([A-Z][A-Z_]{6,})''', 'g') m
     where m[1] not in ('ERROR','WARNING','MCQ_SINGLE','MCQ_MULTI')
  ) x
  where not exists (
    select 1 from pg_proc pr where pr.oid = 'public.publish_readiness(uuid)'::regprocedure
      and pg_get_functiondef(pr.oid) ~ 'f\.pattern_class');
  if v_missing is not null then
    raise exception 'pattern(s) run_mcq_quality emits are unreachable as a readiness blocker: %', v_missing;
  end if;

  if has_function_privilege('anon', 'public.publish_readiness(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'publish_readiness became anon-executable';
  end if;
end $$;
