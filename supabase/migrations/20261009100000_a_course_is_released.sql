-- BOB-03 -- A COURSE IS RELEASED (audit B3).
--
-- THE GAP. A course could be approved, and a release could be frozen and
-- published, but nothing could CREATE a release: no function inserted into
-- plp_releases, and no Studio action did either. So the path stopped at an
-- approved course that no teacher could ever assign (ADM-12, ADM-13, EDU-06).
--
-- THE PATH, each step one function, each refusal a stable code (D-011):
--   create_release(course)    CAN_FREEZE_RELEASE; the course is APPROVED and has
--                             no release yet; a school's course, never the
--                             platform library's (D-029). The release is the
--                             course's: its author is the course's author.
--   freeze_release(release)   CAN_FREEZE_RELEASE; runs both validators NOW, so
--                             readiness is measured on the content being sealed;
--                             a BLOCKED course is not sealed (the findings stay
--                             visible to fix); otherwise the release is approved
--                             by the caller and frozen, which seals the course.
--   publish_release(release)  CAN_PUBLISH; FROZEN only; READY only.
--   withdraw_release(r, why)  CAN_PUBLISH; PUBLISHED only; a reason.
-- Refusals are SQLSTATE PR040 with the code in DETAIL. A result that carries
-- findings (freeze on a BLOCKED course) is returned, not raised, so the
-- findings the validators just wrote survive for the author to act on.
--
-- THE FOUR-EYES RULE IS UNCHANGED. enforce_content_status still refuses a
-- release approved by its author. What this migration decides is only who the
-- author IS: the course's author, never whoever pressed "create". So the same
-- two people who wrote and reviewed the course are the two the release needs,
-- and nobody can make themselves the author of someone else's work -- or
-- escape the rule by letting a colleague create the row. freeze_release names
-- the refusal (RELEASE_SAME_PERSON) before the trigger would.
--
-- VERSIONS. The first release of a course is 1.0.0. A revision's first release
-- (create_course_revision, E1) chains to its predecessor's latest published
-- release and takes the next minor version, so v1.0.0 -> v1.1.0 reads as the
-- correction it is. A course has at most one release: once frozen it is sealed,
-- and a correction is a revision, never a second release of the same content.
-- ---------------------------------------------------------------------------

create function public.release_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR040',
    detail  = p_code,
    message = case p_code
      when 'RELEASE_NOT_ALLOWED'         then 'creating or freezing a release requires CAN_FREEZE_RELEASE in the owning institution'
      when 'RELEASE_PUBLISH_NOT_ALLOWED' then 'publishing or withdrawing a release requires CAN_PUBLISH in the owning institution (INV-32)'
      when 'RELEASE_SCHOOL_NOT_ALLOWED'  then 'a release is made from a school''s course, not from the platform library (D-029)'
      when 'RELEASE_COURSE_NOT_APPROVED' then 'a release is made from an APPROVED course'
      when 'RELEASE_EXISTS'              then 'this course already has a release; a correction is a revision of the course'
      when 'RELEASE_STATE_INVALID'       then 'the release is not at the step this action takes'
      when 'RELEASE_SAME_PERSON'         then 'the author of a course cannot approve its release; a second person freezes it'
      when 'RELEASE_NOT_READY'           then 'publish readiness is not READY: the course has findings to resolve'
      when 'RELEASE_REASON_REQUIRED'     then 'a withdrawal records why; the reason is not optional'
      else 'the release could not be processed' end;
end $$;
revoke all on function public.release_refuse(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. CREATE -- from an APPROVED course, authored by the course's author.
-- ---------------------------------------------------------------------------
create function public.create_release(p_course uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses; v_prev public.plp_releases; v_label text; v_id uuid;
begin
  select * into c from public.courses where id = p_course;
  -- an unknown course and another school's answer alike
  if c.id is null or not public.can_in_institution('CAN_FREEZE_RELEASE', c.institution_id) then
    perform public.release_refuse('RELEASE_NOT_ALLOWED');
  end if;
  if exists (select 1 from public.institutions i where i.id = c.institution_id and i.tenant_kind = 'PLATFORM_CANONICAL') then
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
end $$;
revoke all on function public.create_release(uuid) from public, anon, authenticated;
grant execute on function public.create_release(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. FREEZE -- readiness measured now, then approved by a second person and
--    sealed. The walk is the state graph's own; the triggers stamp the hash.
-- ---------------------------------------------------------------------------
create function public.freeze_release(p_release uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r public.plp_releases; c public.courses; v_me uuid; v_ready record; v_to text;
  v_order constant text[] := array['INGESTED', 'STRUCTURED', 'VALIDATED', 'IN_REVIEW', 'APPROVED', 'FROZEN'];
begin
  select * into r from public.plp_releases where id = p_release;
  if r.id is null or not public.can_in_institution('CAN_FREEZE_RELEASE', r.institution_id) then
    perform public.release_refuse('RELEASE_NOT_ALLOWED');
  end if;
  -- one freeze at a time per release
  perform 1 from public.plp_releases where id = r.id for update;
  select * into r from public.plp_releases where id = r.id;
  if not (r.status::text = any (v_order[1:5])) then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;
  select * into c from public.courses where id = r.course_id;
  if c.status <> 'APPROVED' then perform public.release_refuse('RELEASE_COURSE_NOT_APPROVED'); end if;
  v_me := public.current_person_id();
  if r.status <> 'APPROVED' and r.author_person_id is not distinct from v_me then
    perform public.release_refuse('RELEASE_SAME_PERSON');
  end if;

  -- readiness on the content about to be sealed, not on whatever was last run
  perform public.validate_course_content(c.id);
  perform public.run_mcq_quality(c.id);
  select * into v_ready from public.publish_readiness(c.id);
  if v_ready.status = 'BLOCKED' then
    return jsonb_build_object('ok', false, 'code', 'RELEASE_NOT_READY', 'release', r.id,
                              'readiness', v_ready.status, 'blockers', to_jsonb(v_ready.blockers));
  end if;

  foreach v_to in array v_order[2:6] loop
    if array_position(v_order, r.status::text) < array_position(v_order, v_to) then
      if v_to = 'APPROVED' then
        update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_me where id = r.id;
      else
        update public.plp_releases set status = v_to::public.content_status where id = r.id;
      end if;
    end if;
  end loop;
  select * into r from public.plp_releases where id = r.id;

  perform public.audit_write('RELEASE_FROZEN', 'plp_releases', r.id::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'content_sha256', r.content_sha256, 'readiness', v_ready.status));
  return jsonb_build_object('ok', true, 'release', r.id, 'status', r.status, 'content_sha256', r.content_sha256,
                            'readiness', v_ready.status, 'blockers', to_jsonb(v_ready.blockers));
end $$;
revoke all on function public.freeze_release(uuid) from public, anon, authenticated;
grant execute on function public.freeze_release(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. PUBLISH and WITHDRAW -- as before, with every refusal a code. The
--    readiness trigger still guards a direct update; this checks first so the
--    refusal can say which step is missing.
-- ---------------------------------------------------------------------------
create or replace function public.publish_release(p_release uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_ready record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  if r.status <> 'FROZEN' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;
  select * into v_ready from public.publish_readiness(r.course_id);
  if v_ready.status <> 'READY' then perform public.release_refuse('RELEASE_NOT_READY'); end if;

  update public.plp_releases set status = 'PUBLISHED' where id = p_release;

  perform public.audit_write('RELEASE_PUBLISHED', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'assigns_nothing', true));
  return p_release;
end $$;
revoke all on function public.publish_release(uuid) from public, anon, authenticated;
grant execute on function public.publish_release(uuid) to authenticated;

create or replace function public.withdraw_release(p_release uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  if p_reason is null or btrim(p_reason) = '' then perform public.release_refuse('RELEASE_REASON_REQUIRED'); end if;
  if r.status <> 'PUBLISHED' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;

  -- SUPERSEDED, never deleted: the chain stays intact and every session,
  -- result and certificate already bound to this release stays bound to it.
  update public.plp_releases set status = 'SUPERSEDED' where id = p_release;

  perform public.audit_write('RELEASE_WITHDRAWN', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'reason', p_reason, 'evidence_untouched', true));
  return p_release;
end $$;
revoke all on function public.withdraw_release(uuid, text) from public, anon, authenticated;
grant execute on function public.withdraw_release(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE REGISTRY (L3-F02).
-- ---------------------------------------------------------------------------
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('create_release', 'STAFF',
   'BOB-03: creates the release of an APPROVED school course that has none, authored by the course''s author '
   || '(so the four-eyes rule binds the same two people), versioned 1.0.0 or, for a revision, the next minor '
   || 'after its predecessor''s release. Audited. Refusals are PR040 with a stable code in DETAIL.',
   'CAPABILITY', 'CAN_FREEZE_RELEASE'),
  ('freeze_release', 'STAFF',
   'BOB-03: runs both validators, refuses to seal a BLOCKED course (returning its findings), then approves the '
   || 'release as the caller -- never its author -- and freezes it, stamping the content hash. Audited.',
   'CAPABILITY', 'CAN_FREEZE_RELEASE')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

update public.client_rpc_registry
   set note = 'Publishes a FROZEN release of a READY course under CAN_PUBLISH; publishing assigns nothing and '
           || 'the audit row says so. Refusals are PR040 with a stable code in DETAIL (BOB-03).'
 where function_name = 'publish_release';
update public.client_rpc_registry
   set note = 'Moves a PUBLISHED release to SUPERSEDED under CAN_PUBLISH with a reason, chain intact and never '
           || 'deleted; evidence, results and certificates are untouched. Refusals are PR040 (BOB-03).'
 where function_name = 'withdraw_release';

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Structural here; the behaviour is
-- selftest/db/fable12.sql, on every run.
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from public.client_rpc_registry
   where function_name in ('create_release', 'freeze_release')
     and exposure = 'STAFF' and authorization_kind = 'CAPABILITY' and authorization_requirement = 'CAN_FREEZE_RELEASE';
  if n <> 2 then raise exception 'BOB-03: % of 2 release functions are declared', n; end if;
  select count(*) into n from public.client_rpc_registry
   where function_name in ('publish_release', 'withdraw_release')
     and authorization_kind = 'CAPABILITY' and authorization_requirement = 'CAN_PUBLISH';
  if n <> 2 then raise exception 'BOB-03: publish and withdraw lost their declared requirement'; end if;
  if has_function_privilege('authenticated', 'public.release_refuse(text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.release_refuse(text)'::regprocedure, 'execute') then
    raise exception 'BOB-03: release_refuse is client-callable';
  end if;
  if has_function_privilege('anon', 'public.create_release(uuid)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.freeze_release(uuid)'::regprocedure, 'execute') then
    raise exception 'BOB-03: an anonymous caller can reach a release function';
  end if;
  -- the four-eyes rule this migration relies on is still the trigger's
  if pg_get_functiondef('public.enforce_content_status()'::regprocedure) !~ 'reviewed_by_person_id' then
    raise exception 'BOB-03: enforce_content_status no longer checks the reviewer';
  end if;
end $$;
