-- A2A-L01 (A2a's page §6; the owner's decision after the 4.0 look-back; Sharon's ruling 3 in her early read of
-- 7b3b3d31): the account lifecycle takes its rows in one order, persons → … → auth.users → … Its catalogue test found
-- one path against it:
--
--   Auth's password write (GoTrue's UPDATE of auth.users, holding that row) fires auth_password_write_guard; on an email
--   recovery with the recovery ladder at level 3 it calls recovery_restore_core, whose audit row asks
--   recovery_assist_school for the assisting school, which calls sekolah_memegang, which takes the person FOR UPDATE.
--   That is auth.users → persons, the cycle L1-F2 forbade.
--
-- Not reached today: recovery_assist_school filters on current_person_id(), and Auth's own connection carries no PINTAR
-- person, so no row passes; and a person asking about themselves is filtered out by `p_person is distinct from
-- current_person_id()`. But only the planner's order of evaluating those conditions kept sekolah_memegang from being
-- called. This makes both a guarantee: the function answers null at once when there is no current person, or when the
-- current person is the one asked about. Both answered null before (no assisting admin; no one assists themselves), so
-- every caller gets the same answer. Nothing else changes: the signature, owner, grants (postgres only), volatility
-- (stable) and security (definer).

create or replace function public.recovery_assist_school(p_person uuid)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  -- A2A-L01: no school assists without an assisting person, nor a person themselves; nothing is locked
  if public.current_person_id() is null or public.current_person_id() = p_person then return null; end if;
  select mine.institution_id into v_inst
    from public.role_assignments mine
    join public.org_nodes o on o.institution_id = mine.institution_id and o.kind = 'INSTITUTION'
   where mine.person_id = public.current_person_id() and p_person is distinct from public.current_person_id()
     and mine.role = 'INSTITUTION_ADMIN' and mine.revoked_at is null and now() >= mine.valid_from and now() < mine.valid_until
     and public.has_scope('INSTITUTION_ADMIN', o.id)
     -- SI-D03: the person is placed at this school now, or the school is onboarding them
     and public.sekolah_memegang(p_person, mine.institution_id)
   order by mine.institution_id
   limit 1;
  return v_inst;
end $$;
revoke all on function public.recovery_assist_school(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare v text := pg_get_functiondef('public.recovery_assist_school(uuid)'::regprocedure);
        jaga int := position('if public.current_person_id() is null or public.current_person_id() = p_person then return null; end if;' in v);
begin
  if jaga = 0 or jaga > position('sekolah_memegang' in v) then
    raise exception 'A2A-L01: recovery_assist_school does not answer null, for no person or for oneself, before it can reach sekolah_memegang';
  end if;
  if has_function_privilege('authenticated', 'public.recovery_assist_school(uuid)', 'execute')
     or has_function_privilege('anon', 'public.recovery_assist_school(uuid)', 'execute') then
    raise exception 'A2A-L01: recovery_assist_school became callable by a client';
  end if;
  if (select provolatile from pg_proc where oid = 'public.recovery_assist_school(uuid)'::regprocedure) <> 's'
     or not (select prosecdef from pg_proc where oid = 'public.recovery_assist_school(uuid)'::regprocedure) then
    raise exception 'A2A-L01: recovery_assist_school is no longer stable and security definer';
  end if;
end $$;
