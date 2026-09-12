-- 0011 — Read helpers take row values, never re-read the row.
-- Root cause (stop-patch-loop, doc 16 §7): 0010's helpers looked the row up
-- by id inside the policy. On INSERT … RETURNING the SELECT policy runs
-- before the new row is visible to the helper's snapshot, so the helper
-- returned false and RETURNING was denied (selftest F01-T10). Passing the
-- row's columns removes the re-read entirely and the recursion risk with it.
-- 0010's by-id helpers are dropped; no policy references them.
-- Architecture: INV-13, INV-14, INV-25; Lesson 11; ADR-0001 §Traces.

create function public.enrollment_readable(p_id uuid, p_person uuid, p_institution uuid, p_created_at timestamptz) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  if p_id is null or p_person is null or p_institution is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if p_person = v_me then return true; end if;
  if public.has_scope('INSTITUTION_ADMIN', p_institution) then return true; end if;
  if exists (select 1 from public.memberships m where m.enrollment_id = p_id and public.has_scope('EDUCATOR', m.node_id)) then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and p_created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $$;

create function public.membership_readable(p_enrollment uuid, p_node uuid, p_created_at timestamptz) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_person uuid;
begin
  if p_enrollment is null or p_node is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if public.has_scope('EDUCATOR', p_node) then return true; end if;
  select person_id into v_person from public.enrollments where id = p_enrollment;
  if v_person is null then return false; end if;
  if v_person = v_me then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = v_person and p_created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $$;

revoke all on function public.enrollment_readable(uuid,uuid,uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.membership_readable(uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.enrollment_readable(uuid,uuid,uuid,timestamptz) to authenticated;
grant execute on function public.membership_readable(uuid,uuid,timestamptz) to authenticated;

drop policy enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select to authenticated
  using (public.enrollment_readable(id, person_id, institution_id, created_at));

drop policy memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated
  using (public.membership_readable(enrollment_id, node_id, created_at));

drop function public.enrollment_readable(uuid);
drop function public.membership_readable(uuid);

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
  if public.enrollment_readable(null,null,null,null) or public.membership_readable(null,null,null) then
    raise exception 'read helper failed open on null (Lesson 11)';
  end if;
end $$;
