-- 0004 — Authorization core: staff Role Assignments, the one fail-closed
-- authorization primitive pair, anti-escalation, onboarding trigger, and RLS
-- policies for everything created so far.
-- Architecture: doc 05; INV-13, INV-16, INV-17, INV-19, INV-36, INV-37;
-- Lesson 11 (fail closed).

create table public.role_assignments (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references public.persons(id),
  role             public.app_role not null check (role <> 'STUDENT'),
  scope_node_id    uuid references public.org_nodes(id),   -- null only for SYSTEM_ADMIN (platform level)
  institution_id   uuid references public.institutions(id),
  valid_from       timestamptz not null default now(),
  valid_until      timestamptz not null,
  granted_by       uuid references public.persons(id),
  revoked_at       timestamptz,
  revoked_by       uuid references public.persons(id),
  created_at       timestamptz not null default now(),
  check ((role = 'SYSTEM_ADMIN') or (scope_node_id is not null and institution_id is not null)),
  check (valid_until > valid_from)
);
create index role_assignments_person_idx on public.role_assignments (person_id) where revoked_at is null;
create index role_assignments_scope_idx  on public.role_assignments (scope_node_id) where revoked_at is null;
alter table public.role_assignments enable row level security;

-- ---------------------------------------------------------------------------
-- Authorization primitives. Every one fails CLOSED: null input, missing rows,
-- or any error → false. Called from application code AND from every RLS
-- policy below, so the two layers cannot drift (FABLE-01 §4).
-- ---------------------------------------------------------------------------
create function public.current_person_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select a.person_id from public.accounts a where a.auth_user_id = auth.uid() limit 1
$$;

create function public.is_system_admin() returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = public.current_person_id()
       and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
     limit 1), false);
exception when others then return false;
end $$;

-- has_scope: does the caller hold an active role of at least p_min_role
-- whose scope node is an ancestor-or-self of p_node? One indexed
-- containment check on jalur, no recursion.
create function public.has_scope(p_min_role public.app_role, p_node uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_jalur uuid[]; v_person uuid;
begin
  if p_min_role is null or p_node is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  if exists (select 1 from public.role_assignments ra
              where ra.person_id = v_person and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                and now() >= ra.valid_from and now() < ra.valid_until) then
    return true;
  end if;
  select jalur into v_jalur from public.org_nodes where id = p_node;
  if v_jalur is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and public.role_rank(ra.role) >= public.role_rank(p_min_role)
       and ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]
     limit 1), false);
exception when others then return false;
end $$;

-- can_on_node: does any active role of the caller, scoped over p_node,
-- carry the capability? (capabilities derive from role, never from a user)
create function public.can_on_node(p_capability text, p_node uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_jalur uuid[]; v_person uuid;
begin
  if p_capability is null or p_node is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  select jalur into v_jalur from public.org_nodes where id = p_node;
  if v_jalur is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and p_capability = any (public.role_capabilities(ra.role))
       and (ra.role = 'SYSTEM_ADMIN' or (ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]))
     limit 1), false);
exception when others then return false;
end $$;

-- is_member_of_institution: any active staff assignment inside it, or any
-- non-cancelled enrollment in it, or system admin.
create function public.is_member_of_institution(p_inst uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid;
begin
  if p_inst is null then return false; end if;
  if public.is_system_admin() then return true; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  return exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_person and ra.institution_id = p_inst and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until)
      or exists (select 1 from public.enrollments e
                  where e.person_id = v_person and e.institution_id = p_inst and e.status <> 'CANCELLED');
exception when others then return false;
end $$;

-- person_visible_to_me: self; staff (≥ EDUCATOR) over a node the person is
-- or was a member of; INSTITUTION_ADMIN over an institution the person is
-- or was enrolled in; portable visibility (added in 0005 via transfers).
create function public.person_visible_to_me(p_person uuid) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  if p_person is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if v_me = p_person then return true; end if;
  if public.is_system_admin() then return true; end if;
  if exists (select 1 from public.enrollments e
              where e.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', e.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
              where e.person_id = p_person and public.has_scope('EDUCATOR', m.node_id)) then
    return true;
  end if;
  return false;
exception when others then return false;
end $$;

grant execute on function public.current_person_id() to authenticated;
grant execute on function public.is_system_admin() to authenticated;
grant execute on function public.has_scope(public.app_role, uuid) to authenticated;
grant execute on function public.can_on_node(text, uuid) to authenticated;
grant execute on function public.is_member_of_institution(uuid) to authenticated;
grant execute on function public.person_visible_to_me(uuid) to authenticated;
grant execute on function public.role_capabilities(public.app_role) to authenticated;
grant execute on function public.role_rank(public.app_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Role assignment guard (INV-16): anti-escalation + immutability.
-- Direct INSERTs by clients are not granted at all; grant_role() is the path.
-- Seeds (no auth context) must declare synthetic intent and run outside
-- production (INV-21).
-- ---------------------------------------------------------------------------
create function public.role_assignments_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_env text; v_target_inst uuid;
begin
  if tg_op = 'DELETE' then raise exception 'role assignments are revoked, never deleted (audit)'; end if;
  if tg_op = 'UPDATE' then
    if new.person_id <> old.person_id or new.role <> old.role or new.scope_node_id is distinct from old.scope_node_id
       or new.institution_id is distinct from old.institution_id or new.valid_from <> old.valid_from
       or new.valid_until <> old.valid_until or new.granted_by is distinct from old.granted_by then
      raise exception 'a role assignment is immutable; revoke and grant a new one';
    end if;
    if old.revoked_at is not null then raise exception 'assignment already revoked'; end if;
    return new;
  end if;
  -- INSERT
  if new.scope_node_id is not null then
    select institution_id into v_target_inst from public.org_nodes where id = new.scope_node_id;
    if v_target_inst is null then raise exception 'scope node not found'; end if;
    new.institution_id := v_target_inst;
  end if;
  v_actor := public.current_person_id();
  if auth.uid() is null then
    -- no user context: only a declared synthetic seed outside production may do this
    select environment into v_env from public.platform_environment;
    if v_env = 'production' or current_setting('app.seed_intent', true) is distinct from 'synthetic' then
      raise exception 'role assignments require an authenticated grantor (INV-16)';
    end if;
    return new;
  end if;
  if v_actor is null then raise exception 'grantor has no person (INV-16)'; end if;
  if v_actor = new.person_id then raise exception 'self-grant is never allowed (INV-16)'; end if;
  new.granted_by := v_actor;
  if new.role in ('SYSTEM_ADMIN','INSTITUTION_ADMIN') or new.scope_node_id is null then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % (INV-16)', new.role;
    end if;
  else
    if not public.has_scope('INSTITUTION_ADMIN', new.scope_node_id) then
      raise exception 'grantor lacks INSTITUTION_ADMIN scope over the target node (INV-16)';
    end if;
  end if;
  return new;
end $$;
create trigger role_assignments_guard before insert or update or delete on public.role_assignments
  for each row execute function public.role_assignments_guard();

create function public.role_assignments_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.audit_write(
    case when tg_op='INSERT' then 'role.granted' else 'role.revoked' end,
    'role_assignments', new.id::text, new.institution_id,
    jsonb_build_object('person_id', new.person_id, 'role', new.role, 'scope_node_id', new.scope_node_id,
                       'valid_until', new.valid_until, 'revoked_at', new.revoked_at));
  return null;
end $$;
create trigger role_assignments_audit after insert or update on public.role_assignments
  for each row execute function public.role_assignments_audit();

-- RPCs (the only client path). Security definer so the guard runs under the
-- caller's auth context but the insert itself does not need a table grant.
create function public.grant_role(p_person uuid, p_role public.app_role, p_scope_node uuid, p_valid_until timestamptz)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
  values (p_person, p_role, p_scope_node, p_valid_until) returning id into v_id;
  return v_id;
end $$;
create function public.revoke_role(p_assignment uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  select * into r from public.role_assignments where id = p_assignment;
  if r.id is null then raise exception 'assignment not found'; end if;
  if not (public.is_system_admin() or (r.scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', r.scope_node_id))) then
    raise exception 'not authorized to revoke';
  end if;
  update public.role_assignments set revoked_at = now(), revoked_by = public.current_person_id() where id = p_assignment;
end $$;
grant execute on function public.grant_role(uuid, public.app_role, uuid, timestamptz) to authenticated;
grant execute on function public.revoke_role(uuid) to authenticated;

-- Display role (never authority): highest active role, else STUDENT if enrolled.
create view public.my_profile with (security_invoker = true) as
  select p.id as person_id, p.display_name, p.photo_path,
         coalesce((select ra.role from public.role_assignments ra
                    where ra.person_id = p.id and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
                    order by public.role_rank(ra.role) desc limit 1),
                  case when exists (select 1 from public.enrollments e where e.person_id = p.id and e.status='ACTIVE') then 'STUDENT'::public.app_role end
         ) as display_role
    from public.persons p
   where p.id = public.current_person_id();
grant select on public.my_profile to authenticated;

-- ---------------------------------------------------------------------------
-- Onboarding: every auth user gets exactly one Account and a Person. A server
-- onboarding path that already knows the Person passes person_id in
-- app_metadata (never user-editable); otherwise a new Person is created.
-- ---------------------------------------------------------------------------
create function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_kind public.account_kind; v_card text;
begin
  v_person := nullif(new.raw_app_meta_data->>'person_id','')::uuid;
  v_kind := coalesce(nullif(new.raw_app_meta_data->>'account_kind','')::public.account_kind, 'EMAIL');
  v_card := nullif(new.raw_app_meta_data->>'card_number','');
  if v_person is null then
    insert into public.persons (display_name)
    values (coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,'Pelajar'),'@',1)))
    returning id into v_person;
  end if;
  insert into public.accounts (person_id, auth_user_id, kind, card_number) values (v_person, new.id, v_kind, v_card);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- RLS policies (doc 05). Grants are explicit and minimal; RLS governs rows.
-- No policy uses USING (true) (INV-36).
-- ---------------------------------------------------------------------------
grant select, insert, update on public.institutions to authenticated;
create policy institutions_select on public.institutions for select to authenticated
  using (public.is_member_of_institution(id));
create policy institutions_insert on public.institutions for insert to authenticated
  with check (public.is_system_admin());
create policy institutions_update on public.institutions for update to authenticated
  using (public.has_scope('INSTITUTION_ADMIN', id)) with check (public.has_scope('INSTITUTION_ADMIN', id));

grant select, insert, update on public.academic_periods to authenticated;
create policy academic_periods_select on public.academic_periods for select to authenticated
  using (public.is_member_of_institution(institution_id));
create policy academic_periods_write on public.academic_periods for insert to authenticated
  with check (public.has_scope('INSTITUTION_ADMIN', institution_id));
create policy academic_periods_update on public.academic_periods for update to authenticated
  using (public.has_scope('INSTITUTION_ADMIN', institution_id)) with check (public.has_scope('INSTITUTION_ADMIN', institution_id));

grant select, insert, update on public.org_nodes to authenticated;
create policy org_nodes_select on public.org_nodes for select to authenticated
  using (public.is_member_of_institution(institution_id));
create policy org_nodes_insert on public.org_nodes for insert to authenticated
  with check (public.has_scope('INSTITUTION_ADMIN', institution_id));
create policy org_nodes_update on public.org_nodes for update to authenticated
  using (public.has_scope('INSTITUTION_ADMIN', institution_id)) with check (public.has_scope('INSTITUTION_ADMIN', institution_id));

grant select, insert, update on public.classes to authenticated;
create policy classes_select on public.classes for select to authenticated
  using (exists (select 1 from public.org_nodes n where n.id = node_id and public.is_member_of_institution(n.institution_id)));
create policy classes_insert on public.classes for insert to authenticated
  with check (public.has_scope('HEAD_OF_DEPARTMENT', node_id));
create policy classes_update on public.classes for update to authenticated
  using (public.has_scope('HEAD_OF_DEPARTMENT', node_id)) with check (public.has_scope('HEAD_OF_DEPARTMENT', node_id));

grant select, update (display_name, photo_path) on public.persons to authenticated;
create policy persons_select on public.persons for select to authenticated
  using (public.person_visible_to_me(id));
create policy persons_update_own on public.persons for update to authenticated
  using (id = public.current_person_id()) with check (id = public.current_person_id());

grant select on public.accounts to authenticated;
create policy accounts_select_own on public.accounts for select to authenticated
  using (auth_user_id = auth.uid());

grant select, insert, update on public.enrollments to authenticated;
create policy enrollments_select on public.enrollments for select to authenticated
  using (person_id = public.current_person_id() or public.person_visible_to_me(person_id));
create policy enrollments_insert on public.enrollments for insert to authenticated
  with check (public.has_scope('INSTITUTION_ADMIN', institution_id));
create policy enrollments_update on public.enrollments for update to authenticated
  using (public.has_scope('INSTITUTION_ADMIN', institution_id)) with check (public.has_scope('INSTITUTION_ADMIN', institution_id));

grant select, insert, update on public.memberships to authenticated;
create policy memberships_select on public.memberships for select to authenticated
  using (exists (select 1 from public.enrollments e where e.id = enrollment_id
                   and (e.person_id = public.current_person_id() or public.person_visible_to_me(e.person_id)))
         or public.has_scope('EDUCATOR', node_id));
create policy memberships_insert on public.memberships for insert to authenticated
  with check (public.has_scope('INSTITUTION_ADMIN', node_id));
create policy memberships_update on public.memberships for update to authenticated
  using (public.has_scope('INSTITUTION_ADMIN', node_id)) with check (public.has_scope('INSTITUTION_ADMIN', node_id));

grant select on public.role_assignments to authenticated;   -- writes only via grant_role/revoke_role
create policy role_assignments_select on public.role_assignments for select to authenticated
  using (person_id = public.current_person_id() or public.is_system_admin()
         or (scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', scope_node_id)));

grant select on public.audit_log to authenticated;
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.is_system_admin() or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id)));

grant select on public.platform_environment to authenticated;
create policy platform_environment_select on public.platform_environment for select to authenticated
  using (public.is_system_admin());

grant execute on function public.members_of_node_at(uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*) into n from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;
  -- fail-closed on null input
  if public.has_scope(null, null) or public.can_on_node(null, null) or public.is_member_of_institution(null)
     or public.person_visible_to_me(null) then
    raise exception 'authorization primitive failed open on null input (Lesson 11)';
  end if;
end $$;
