-- A2A-L01 (A2a's page §6; the owner's decision after the 4.0 look-back): the account lifecycle takes its rows in one
-- order, persons → person_suspensions → auth.users → accounts. Its catalogue test found one path against it:
--
--   Auth's password write (GoTrue's UPDATE of auth.users, holding that row) fires auth_password_write_guard; on an email
--   recovery with the recovery ladder at level 3 it calls recovery_restore_core, whose audit row asks
--   recovery_assist_school for the assisting school, which calls sekolah_memegang, which takes the person FOR UPDATE.
--   That is auth.users → persons, the cycle L1-F2 forbade.
--
-- Not reached today: recovery_assist_school filters on current_person_id(), and Auth's own connection carries no PINTAR
-- person, so no row passes and sekolah_memegang is not called. But only the planner's order of evaluation made that
-- so. This makes it a guarantee: with no current person, the function answers null at once, which is exactly what it
-- answered before (no assisting admin, no school). Nothing else changes: the same signature, owner, grants (postgres
-- only), volatility and security; the same answer for every caller.

create or replace function public.recovery_assist_school(p_person uuid)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  -- A2A-L01: no current person (Auth's own connection, writing a password), no assisting school; nothing is locked
  if public.current_person_id() is null then return null; end if;
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
begin
  if position('if public.current_person_id() is null then return null; end if;' in v) = 0
     or position('if public.current_person_id() is null' in v) > position('sekolah_memegang' in v) then
    raise exception 'A2A-L01: recovery_assist_school does not answer null before it can reach sekolah_memegang';
  end if;
  if has_function_privilege('authenticated', 'public.recovery_assist_school(uuid)', 'execute')
     or has_function_privilege('anon', 'public.recovery_assist_school(uuid)', 'execute') then
    raise exception 'A2A-L01: recovery_assist_school became callable by a client';
  end if;
end $$;
