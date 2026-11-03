-- W1.7 (Batch 3 closure, owner 2 Nov: «Batch 3 final closure», item 1): A SUPERSEDED VERSION IS HISTORY, NOT A TASK.
--
-- Found on staging (Batch 3 verification, 04-STAGING-VERIFICATION-REPORT.md §6, defect 1): once a sent-back draft is
-- corrected as the next version of its line (D-085 M10; W1.6), the version it replaced keeps its draft status
-- (VALIDATION_FAILED, or STRUCTURED if its author had marked it again) for ever. Nobody can act on it any more: a
-- correction is made only through the newest version of a line (package_revision_problems, REVISION_NOT_LATEST). Yet
-- studio_home still counted it in «Menunggu tindakan Anda», and a blocking finding left on it still counted in
-- «Tertahan».
--
-- studio_home is 20260915160000's text with one condition added to each package bucket: the package is the newest
-- version of its line (no course names it in supersedes_course_id). The superseded version stays where it was: its
-- rows, its review outcomes, its findings and the correction's note naming it are untouched, and «Riwayat perbaikan»
-- still lists and opens it. Nothing else changes: the same buckets, the same capabilities, the same grants.

create or replace function public.studio_home()
returns table (bucket text, institution_id uuid, count int)
language sql stable security definer set search_path = public, pg_temp as $$
  with mine as (
    select i.id, i.name from public.institutions i
     where public.can_in_institution('CAN_DRAFT', i.id)
        or public.can_in_institution('CAN_REVIEW', i.id)
        or public.can_in_institution('CAN_ASSIGN_LEARNING', i.id)
  )
  select 'ACTION_REQUIRED', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and c.status in ('INGESTED','STRUCTURED','VALIDATION_FAILED')
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'AWAITING_MY_REVIEW', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW', m.id)
     and c.status = 'IN_REVIEW'
     and c.author_person_id is distinct from public.current_person_id()
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'BLOCKED', m.id, count(distinct f.course_id)::int
    from mine m join public.mcq_quality_findings f on f.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and f.severity = 'ERROR' and f.acknowledged_at is null
     and not exists (select 1 from public.courses n where n.supersedes_course_id = f.course_id)
   group by m.id having count(*) > 0
  union all
  select 'QUESTION_HEALTH', m.id, count(*)::int
    from mine m join public.question_health q on q.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', m.id)
     and q.state = 'SIGNAL_RAISED'
   group by m.id having count(*) > 0
  union all
  select 'DISTRIBUTED_CANONICAL', d.institution_id, count(*)::int
    from public.release_distributions d
   where d.status = 'ACTIVE'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
   group by d.institution_id having count(*) > 0
$$;
revoke all on function public.studio_home() from public, anon, authenticated;
grant execute on function public.studio_home() to authenticated;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'studio_home' and p.prosecdef
                    and array_to_string(p.proconfig, ',') like '%search_path=public, pg_temp%'
                    and p.prosrc like '%supersedes_course_id = c.id%' and p.prosrc like '%supersedes_course_id = f.course_id%') then
    raise exception 'W1.7: studio_home is missing, not SECURITY DEFINER, has no pinned search_path, or still counts superseded versions';
  end if;
  if has_function_privilege('anon', 'public.studio_home()', 'execute') then
    raise exception 'W1.7: studio_home is executable by anon';
  end if;
  if not exists (select 1 from public.client_rpc_registry where function_name = 'studio_home') then
    raise exception 'W1.7: studio_home has no exposure class';
  end if;
end $$;
