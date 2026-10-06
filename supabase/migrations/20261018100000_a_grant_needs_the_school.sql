-- BOB-21 (D-049; D-048's corollary) -- A SCHOOL ADMIN GRANTS ONLY TO A PERSON
-- THEY MAY ACT UPON.
--
-- role_assignments_guard let a grantor with INSTITUTION_ADMIN scope over the
-- target node grant a school-scoped role to ANY person id. Knowing or
-- submitting an internal id was enough: School B's admin could give a School-A
-- teacher a School-B role, and the grant itself then made them School B's
-- (visible since BOB-20, because they now held a role there).
--
-- Now, for a school-scoped grant by anyone but the platform administrator, the
-- person must already have a relationship with THE SCHOOL THE GRANT IS FOR:
--   * that school's institutional identity (its number), or
--   * an active role there that is not SYSTEM_ADMIN, or
--   * a learner enrolment there (PENDING or ACTIVE).
-- It is asked per school -- the grant's own -- and never as "visible to me",
-- so an admin of two schools cannot move a teacher from one to the other by
-- granting. Otherwise the grant is refused, 42501 with DETAIL
-- GRANT_NO_SCHOOL_RELATIONSHIP, and nothing is created: no role, no number, no
-- enrolment, and so no visibility. A person id that does not exist is refused
-- identically (this runs before the foreign key is checked), so the refusal is
-- no oracle for who exists elsewhere in PINTAR.
--
-- Unchanged: the platform administrator's path (any grant, as before); the
-- scope check above it, which still refuses a grant at another school's node
-- first; the unauthenticated branch (day-zero bootstrap and the synthetic
-- seeds); and every other writer, because this is the one guard all of them
-- pass. The only writers are grant_role, import_advance (which issues the
-- school's number before it writes a role, so its rows pass) and
-- bootstrap_first_system_admin (unauthenticated, SYSTEM_ADMIN); authenticated
-- holds SELECT only on role_assignments. How a teacher comes to belong to a
-- second school is not designed here (D-049 (d)): with no canonical staff
-- transition, the direct grant is refused safely.
--
-- No rows change: the guard runs on writes only.

create or replace function public.role_assignments_guard()
returns trigger
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

  if new.scope_node_id is not null then
    select institution_id into v_target_inst from public.org_nodes where id = new.scope_node_id;
    if v_target_inst is null then raise exception 'scope node not found'; end if;
    new.institution_id := v_target_inst;
  end if;
  v_actor := public.current_person_id();
  if auth.uid() is null then
    -- DAY ZERO, AND ONLY DAY ZERO. The marker only `bootstrap_first_system_admin`
    -- sets, naming this very person; the role SYSTEM_ADMIN and no other; no
    -- active SYSTEM_ADMIN anywhere; and an installation that has never been
    -- initialised. The last is what makes this a one-time door rather than a
    -- standing recovery path.
    if current_setting('pintar.bootstrap_first_admin', true) = new.person_id::text
       and new.role = 'SYSTEM_ADMIN'
       and not exists (select 1 from public.platform_bootstrap)
       and not exists (select 1 from public.role_assignments ra
                        where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                          and now() >= ra.valid_from and now() < ra.valid_until) then
      return new;
    end if;

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
    -- BOB-21 (D-049): a person the grant's own school already has -- its
    -- number, a role there, or a learner there. Never "visible to me".
    if not public.is_system_admin()
       and not exists (select 1 from public.institutional_identities ii
                        where ii.person_id = new.person_id and ii.institution_id = v_target_inst)
       and not exists (select 1 from public.role_assignments ra
                        where ra.person_id = new.person_id and ra.institution_id = v_target_inst
                          and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until)
       and not exists (select 1 from public.enrollments e
                        where e.person_id = new.person_id and e.institution_id = v_target_inst
                          and e.status in ('PENDING', 'ACTIVE')) then
      raise exception using
        errcode = '42501',
        detail  = 'GRANT_NO_SCHOOL_RELATIONSHIP',
        message = 'a school-scoped role is granted only to a person the school already has: its institutional ID, '
               || 'a role there or a learner enrolment there (D-049)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.role_assignments_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  if v_src !~ 'GRANT_NO_SCHOOL_RELATIONSHIP' then
    raise exception 'BOB-21: the guard does not ask for the school relationship';
  end if;
  -- per school: the grant's own institution, never the viewer's visibility
  if v_src ~ 'person_visible_to_me' then
    raise exception 'BOB-21: the guard asks "visible to me" instead of the grant''s own school';
  end if;
  if v_src !~ 'ii\.institution_id = v_target_inst' or v_src !~ 'e\.institution_id = v_target_inst'
     or v_src !~ 'ra\.institution_id = v_target_inst' then
    raise exception 'BOB-21: a relationship is not asked of the grant''s own school';
  end if;
  -- the scope check still comes first, and the platform path is untouched
  if position('lacks INSTITUTION_ADMIN scope' in v_src) > position('GRANT_NO_SCHOOL_RELATIONSHIP' in v_src) then
    raise exception 'BOB-21: the relationship is asked before the scope';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'role_assignments_guard'
                  and tgrelid = 'public.role_assignments'::regclass and tgenabled <> 'D') then
    raise exception 'BOB-21: role_assignments_guard is not attached';
  end if;
  if has_table_privilege('authenticated', 'public.role_assignments', 'insert') then
    raise exception 'BOB-21: a client can insert role_assignments directly';
  end if;
end $$;
