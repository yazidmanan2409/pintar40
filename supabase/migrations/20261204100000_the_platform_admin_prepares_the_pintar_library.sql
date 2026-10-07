-- CR-51 (D-120 Q7): THE PLATFORM ADMIN PREPARES AND APPROVES THE PINTAR LIBRARY'S STANDARD CONTENT.
--
-- «The platform admin prepares and approves standard content, through the same package and workbook import aimed at
-- the library. D-029's refusal stays for every school role.» (D-120, Q7; M6: «prepared once, governed centrally and
-- distributed»). Implementation consequence: «One import target opened to the platform admin only, with its audit.»
--
-- Until now nothing could author into the library (PLATFORM_CANONICAL): package_batch refused every package for it
-- and create_release every release of it, for every role, the platform admin included (D-029, M8). Distribution of a
-- published library release to schools was built and stays as it is (grant_release_distribution, S26d).
--   1. package_batch (prepare_ingest_batch and confirm_ingest_batch ask it first): a package for the library is
--      accepted from the platform admin only. A person holding a school role in the library itself (CAN_DRAFT there) is
--      still refused PACKAGE_SCHOOL_NOT_ALLOWED: a capability is not enough, the role is.
--   2. create_release: the library's release is created by the platform admin only, on the same terms as a school's.
--   3. Nothing else is opened. The two-person rules stand as for any school: the person who confirms the import is the
--      chapter's author, and a SECOND person approves it (enforce_content_status: reviewer is not the author) and
--      freezes its release (freeze_release: RELEASE_SAME_PERSON). For the library that second person is a second
--      platform admin.
--   4. Its audit is the import's own: ingest.prepared, ingest.confirmed and RELEASE_CREATED carry the library as their
--      institution and the platform admin as the actor, as they do for a school.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- 1. the import
CREATE OR REPLACE FUNCTION public.package_batch(p_batch uuid)
 RETURNS ingest_batches
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare b public.ingest_batches;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null or not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    perform public.package_refuse('PACKAGE_NOT_ALLOWED');
  end if;
  -- D-120 Q7: the PINTAR library takes a package from the platform admin only; every school role stays refused
  if exists (select 1 from public.institutions x where x.id = b.institution_id and x.tenant_kind = 'PLATFORM_CANONICAL')
     and not public.is_system_admin() then
    perform public.package_refuse('PACKAGE_SCHOOL_NOT_ALLOWED');
  end if;
  return b;
end $function$;
revoke all on function public.package_batch(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.package_refuse(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception using
    errcode = 'PR030',
    detail  = p_code,
    message = case p_code
      when 'PACKAGE_NOT_ALLOWED'       then 'preparing or confirming a lesson package requires CAN_DRAFT in the owning institution'
      when 'PACKAGE_STATE_INVALID'     then 'this package has already been confirmed, materialised or rejected'
      when 'PACKAGE_SCHOOL_NOT_ALLOWED' then 'a lesson package becomes a course of a school; the platform library''s content is prepared by the platform administrator (D-120 Q7)'
      else 'the lesson package could not be processed' end;
end $function$;
revoke all on function public.package_refuse(text) from public, anon, authenticated;

-- 2. the release
CREATE OR REPLACE FUNCTION public.create_release(p_course uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare c public.courses; v_prev public.plp_releases; v_label text; v_id uuid;
begin
  select * into c from public.courses where id = p_course;
  -- an unknown course and another school's answer alike
  if c.id is null or not public.can_in_institution('CAN_FREEZE_RELEASE', c.institution_id) then
    perform public.release_refuse('RELEASE_NOT_ALLOWED');
  end if;
  -- D-120 Q7: the PINTAR library's release is the platform admin's; every school role stays refused
  if exists (select 1 from public.institutions i where i.id = c.institution_id and i.tenant_kind = 'PLATFORM_CANONICAL')
     and not public.is_system_admin() then
    perform public.release_refuse('RELEASE_SCHOOL_NOT_ALLOWED');
  end if;
  -- one creation at a time per course: a double click is one release
  perform 1 from public.courses where id = c.id for update;
  select * into c from public.courses where id = c.id;
  if c.status <> 'APPROVED' then perform public.release_refuse('RELEASE_COURSE_NOT_APPROVED'); end if;
  if exists (select 1 from public.plp_releases r where r.course_id = c.id) then
    perform public.release_refuse('RELEASE_EXISTS');
  end if;

  if c.supersedes_course_id is not null then
    select * into v_prev from public.plp_releases r
     where r.course_id = c.supersedes_course_id and r.published_at is not null
     order by r.published_at desc limit 1;
  end if;
  v_label := case when v_prev.id is null then '1.0.0'
                  else split_part(v_prev.version_label, '.', 1) || '.'
                       || (split_part(v_prev.version_label, '.', 2)::int + 1)::text || '.0' end;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id, supersedes_release_id)
  values (c.institution_id, c.id, v_label, c.author_person_id, v_prev.id)
  returning id into v_id;

  perform public.audit_write('RELEASE_CREATED', 'plp_releases', v_id::text, c.institution_id,
    jsonb_build_object('course_id', c.id, 'version_label', v_label, 'supersedes_release_id', v_prev.id));
  return jsonb_build_object('ok', true, 'release', v_id, 'version_label', v_label, 'status', 'INGESTED');
end $function$;
revoke all on function public.create_release(uuid) from public, anon, authenticated;
grant execute on function public.create_release(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.release_refuse(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception using
    errcode = 'PR040',
    detail  = p_code,
    message = case p_code
      when 'RELEASE_NOT_ALLOWED'         then 'creating or freezing a release requires CAN_FREEZE_RELEASE in the owning institution'
      when 'RELEASE_PUBLISH_NOT_ALLOWED' then 'publishing or withdrawing a release requires CAN_PUBLISH in the owning institution (INV-32)'
      when 'RELEASE_SCHOOL_NOT_ALLOWED'  then 'a release is made from a school''s course; the platform library''s release is the platform administrator''s (D-029, D-120 Q7)'
      when 'RELEASE_COURSE_NOT_APPROVED' then 'a release is made from an APPROVED course'
      when 'RELEASE_EXISTS'              then 'this course already has a release; a correction is a revision of the course'
      when 'RELEASE_STATE_INVALID'       then 'the release is not at the step this action takes'
      when 'RELEASE_SAME_PERSON'         then 'the author of a course cannot approve its release; a second person freezes it'
      when 'RELEASE_NOT_READY'           then 'publish readiness is not READY: the course has findings to resolve'
      when 'RELEASE_REASON_REQUIRED'     then 'a withdrawal records why; the reason is not optional'
      else 'the release could not be processed' end;
end $function$;
revoke all on function public.release_refuse(text) from public, anon, authenticated;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if pg_get_functiondef('public.package_batch(uuid)'::regprocedure) !~ 'PLATFORM_CANONICAL''\)\s+and not public\.is_system_admin\(\)'
     or pg_get_functiondef('public.create_release(uuid)'::regprocedure) !~ 'PLATFORM_CANONICAL''\)\s+and not public\.is_system_admin\(\)' then
    raise exception 'the library is not opened to the platform admin alone';
  end if;
  if pg_get_functiondef('public.freeze_release(uuid)'::regprocedure) !~ 'RELEASE_SAME_PERSON' then
    raise exception 'the two-person freeze is gone';
  end if;
  if has_function_privilege('anon', 'public.create_release(uuid)', 'execute') then
    raise exception 'create_release is reached by anon';
  end if;
end $$;
