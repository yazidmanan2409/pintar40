-- 0010 — Policy read helpers (fix-forward of 0009).
-- Finding: the 0009 policies on enrollments and memberships referenced each
-- other's tables under RLS → "infinite recursion detected in policy". The
-- existence checks now live in SECURITY DEFINER helpers (pinned
-- search_path, fail-closed) so each policy is a single function call and no
-- policy re-enters another. Semantics are unchanged from 0009.
-- Architecture: INV-13, INV-14, INV-25; Lesson 11.

create function public.enrollment_readable(p_enrollment uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare e record; v_me uuid;
begin
  if p_enrollment is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  select id, person_id, institution_id, created_at into e from public.enrollments where id = p_enrollment;
  if e.id is null then return false; end if;
  if e.person_id = v_me then return true; end if;
  if public.has_scope('INSTITUTION_ADMIN', e.institution_id) then return true; end if;
  if exists (select 1 from public.memberships m where m.enrollment_id = e.id and public.has_scope('EDUCATOR', m.node_id)) then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = e.person_id and e.created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $$;

create function public.membership_readable(p_membership uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m record; e record; v_me uuid;
begin
  if p_membership is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  select id, enrollment_id, node_id, created_at into m from public.memberships where id = p_membership;
  if m.id is null then return false; end if;
  if public.has_scope('EDUCATOR', m.node_id) then return true; end if;
  select person_id into e from public.enrollments where id = m.enrollment_id;
  if e.person_id = v_me then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = e.person_id and m.created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $$;

revoke all on function public.enrollment_readable(uuid) from public, anon, authenticated;
revoke all on function public.membership_readable(uuid) from public, anon, authenticated;
grant execute on function public.enrollment_readable(uuid) to authenticated;
grant execute on function public.membership_readable(uuid) to authenticated;

drop policy enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select to authenticated
  using (public.enrollment_readable(id));

drop policy memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated
  using (public.membership_readable(id));

do $$
declare n int; bad text;
begin
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if bad is not null then raise exception 'anon can execute: %', bad; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public'
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) without pinned search_path', n; end if;
  if public.enrollment_readable(null) or public.membership_readable(null) then
    raise exception 'read helper failed open on null (Lesson 11)';
  end if;
end $$;
