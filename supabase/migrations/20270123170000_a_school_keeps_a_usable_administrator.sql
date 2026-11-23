-- Z8 item 8 (stream A). Source: Sharon's R-15 B0 read of 23 Nov (R15-SHARON-ITEMS-7ba18b03.md, item 8 and (b)-(e));
-- Bob 13:16Z (GO), 13:22Z (reuse the B0 guard, one helper) and 13:22Z (Daisy's words name no school).
--
-- A SCHOOL IS NEVER LEFT WITHOUT A USABLE ADMINISTRATOR, BY CLOSING AN ACCOUNT OR BY REVOKING A ROLE.
--
-- What stood on 307:
--   * revoke_role and every other revoking path already meet B0's last-holder rule: the UPDATE that writes revoked_at
--     fires role_assignments_guard, which asks peran_terakhir_kode under the school's lock and raises PR160
--     ROLE_LAST_SCHOOL_ADMIN unless the actor is a platform admin (B0-S01 s_sendiri). So (d)'s route is guarded; what
--     it lacked was (c)'s idea of «usable».
--   * admin_dapat_dipakai, B0's one definition of «usable», asked for a live appointment held by a person neither
--     suspended or closed nor anonymised. It did not ask for an account, nor that the account is not locked, so a
--     school whose other administrator had no account, or was locked (akun_kunci's banned_until), counted as safe.
--   * minta_akun('CLOSE') asked nothing about the school: the last administrator could close their own account, and
--     two administrators closing at the same moment could each see the other as usable.
--
-- Now:
--   (b)(c) admin_dapat_dipakai, for INSTITUTION_ADMIN, also asks that the person has an account that is not locked now
--     (banned_until null or past): admin_akun_dapat_masuk. SYSTEM_ADMIN's definition is unchanged (outside item 8's
--     scope; put to Bob). Pending or future-dated appointments already did not count (valid_from <= now()).
--   ONE QUESTION, admin_sekolah_lain_ada(school, except person, except assignment): is there a usable administrator of
--     the school other than these? The guard's locked question (peran_terakhir_kode) and minta_akun both ask it; there
--     is no second definition. The guard excepts the assignment being revoked (a renewal's new assignment of the same
--     person still counts, as before); the closure excepts the person.
--   ONE LOCK, kunci_admin_sekolah(schools): pg_advisory_xact_lock(hashtextextended('institution_admin:' || id, 0)) per
--     school, in id order (e). minta_akun takes it after the person's row lock; the guard's locked question takes it
--     before its count, on EVERY revoking path, revoke_role included. revoke_role itself is not rewritten: B0 keeps the
--     rule in the guard alone (B0-K01 pins that no revoking function carries a check of its own), and the guard is
--     where revoke_role's check runs, so the lock is taken there, before the check.
--   (c) minta_akun('CLOSE') is refused PR140 ACCOUNT_LAST_SCHOOL_ADMIN when ANY school the caller administers now
--     (an INSTITUTION_ADMIN appointment at the school's node, not revoked, valid_from <= now() < valid_until) has no
--     other usable administrator. The message names no school (Daisy, e53c612e). A platform admin's revocation stays
--     allowed (the guard's exception is unchanged).
--
-- Functions RESTATED IN FULL from their live definitions (pg_get_functiondef), each change marked Z8-8: akun_tolak
-- (one code added), admin_dapat_dipakai, peran_terakhir_kode, minta_akun. CREATE OR REPLACE keeps their grants, which
-- are as they were: minta_akun to authenticated and service_role; the others to service_role only. The two new
-- helpers are granted to no client. Lock order: person (FOR UPDATE) → school advisory locks (id order) → school row
-- (the guard's FOR UPDATE, which minta_akun never takes) → role row.
-- CATALOGUE: unchanged (D-060(c)): no metric, calculator or engine is touched.

-- ═══════════════════════════════════════════════════════════ the refusal
create or replace function public.akun_tolak(p_code text)
 returns void
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $$
begin
  raise exception using
    errcode = 'PR140',
    detail  = p_code,
    message = case p_code
      when 'ACCOUNT_NOT_ALLOWED'        then 'this is the PINTAR Administrator''s act'
      when 'ACCOUNT_SELF'               then 'an administrator does not suspend their own account'
      when 'ACCOUNT_UNKNOWN'            then 'no such person'
      when 'ACCOUNT_CATEGORY_INVALID'   then 'the category is one of the listed ones'
      when 'ACCOUNT_NOTE_REQUIRED'      then 'the note or reason is 10 to 300 characters'
      when 'ACCOUNT_ALREADY_SUSPENDED'  then 'this account is already suspended or closed'
      when 'ACCOUNT_NOT_SUSPENDED'      then 'this account is not suspended or closed'
      when 'ACCOUNT_CONFIRM_REQUIRED'   then 'the request needs its one confirmation'
      when 'ACCOUNT_LEARNER_VIA_SCHOOL' then 'a learner''s request is made through the school with the family'
      when 'ACCOUNT_REQUEST_OPEN'       then 'this request has already been made and is in hand'
      when 'ACCOUNT_REQUEST_INVALID'    then 'this is not an open request to delete personal data'
      when 'ACCOUNT_NOT_CLOSED'         then 'personal data is deleted only from a closed account'
      when 'ACCOUNT_PLATFORM_ROLE'      then 'a person holding a platform role does not close their own account'
      when 'ACCOUNT_REOPEN_VIA_REQUEST' then 'a closed account is reopened only from its request, after identity verification'
      -- L1-F4 (Sharon §3a.3)
      when 'ACCOUNT_LIVE_ATTACHMENT'    then 'this person gained an enrolment, a role or another attachment since the closure'
      -- L1-F4 (Sharon, result review of 3a63a2b2): a deleted person is terminal
      when 'ACCOUNT_ANONYMISED'         then 'this person''s personal data was deleted; the account is not reopened'
      -- Z8-8 (Sharon (c)): the message names no school
      when 'ACCOUNT_LAST_SCHOOL_ADMIN'  then 'the only usable school administrator does not close their own account; appoint another first'
      else 'the account could not be changed' end;
end $$;

-- ═══════════════════════════════════════════════════════════ «usable», the one definition (B0), strengthened
-- Z8-8 (Sharon (c)): the person can sign in now: an account with a sign-in, not locked (akun_kunci writes banned_until;
-- a ban that has ended does not count)
create or replace function public.admin_akun_dapat_masuk(p_person uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.accounts ac join auth.users u on u.id = ac.auth_user_id
                  where ac.person_id = p_person and (u.banned_until is null or u.banned_until <= now()))
$$;
revoke all on function public.admin_akun_dapat_masuk(uuid) from public, anon, authenticated;

create or replace function public.admin_dapat_dipakai(p_role public.app_role, p_institution uuid)
returns setof public.role_assignments
language sql stable security definer set search_path = public, pg_temp as $$
  select ra.*
    from public.role_assignments ra
    join public.persons p on p.id = ra.person_id
   where ra.role = p_role
     and ((p_role = 'SYSTEM_ADMIN' and p_institution is null)
          or (p_role = 'INSTITUTION_ADMIN' and ra.institution_id = p_institution
              and exists (select 1 from public.org_nodes o where o.id = ra.scope_node_id and o.kind = 'INSTITUTION')))
     and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
     and p.anonymized_at is null
     and not public.orang_ditangguhkan(ra.person_id)
     -- Z8-8 (Sharon (c)): a school administrator also has an account that is not locked now
     and (p_role <> 'INSTITUTION_ADMIN' or public.admin_akun_dapat_masuk(ra.person_id))
$$;

-- ═══════════════════════════════════════════════════════════ the one question and the one lock
-- Z8-8: is there a usable administrator of the school other than this person and this assignment (either may be null)?
create or replace function public.admin_sekolah_lain_ada(p_institution uuid, p_kecuali_orang uuid, p_kecuali_tugas uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admin_dapat_dipakai('INSTITUTION_ADMIN', p_institution) a
                  where (p_kecuali_orang is null or a.person_id <> p_kecuali_orang)
                    and (p_kecuali_tugas is null or a.id <> p_kecuali_tugas))
$$;
revoke all on function public.admin_sekolah_lain_ada(uuid, uuid, uuid) from public, anon, authenticated;

-- Z8-8 (Sharon (e)): the schools' administrator locks, one per school, in id order (so two callers never cycle)
create or replace function public.kunci_admin_sekolah(p_institutions uuid[])
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid;
begin
  for v in select distinct x from unnest(p_institutions) x where x is not null order by x loop
    perform pg_advisory_xact_lock(hashtextextended('institution_admin:' || v::text, 0));
  end loop;
end $$;
revoke all on function public.kunci_admin_sekolah(uuid[]) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the guard's locked question (B0), restated
create or replace function public.peran_terakhir_kode(p_assignment uuid, p_kunci boolean)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.role_assignments;
begin
  select * into r from public.role_assignments ra where ra.id = p_assignment;
  if r.id is null or r.revoked_at is not null then return null; end if;
  if r.role = 'SYSTEM_ADMIN' then
    if p_kunci then perform 1 from public.platform_environment for update; end if;
    if exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.id = r.id)
       and not exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.id <> r.id) then
      return 'ROLE_LAST_PLATFORM_ADMIN';
    end if;
  elsif r.role = 'INSTITUTION_ADMIN'
        and exists (select 1 from public.org_nodes o where o.id = r.scope_node_id and o.kind = 'INSTITUTION') then
    -- Z8-8 (Sharon (e)): the school's administrator lock, which minta_akun's closure takes too, before the count; the
    -- school row's lock below is B0's line, unchanged (A3-I1 reads it as written)
    if p_kunci then perform public.kunci_admin_sekolah(array[r.institution_id]); end if;
    if p_kunci then perform 1 from public.institutions i where i.id = r.institution_id for update; end if;
    -- Z8-8: the one question (admin_sekolah_lain_ada), excepting this assignment as before
    if exists (select 1 from public.admin_dapat_dipakai('INSTITUTION_ADMIN', r.institution_id) a where a.id = r.id)
       and not public.admin_sekolah_lain_ada(r.institution_id, null, r.id) then
      return 'ROLE_LAST_SCHOOL_ADMIN';
    end if;
  end if;
  return null;
end $$;

-- ═══════════════════════════════════════════════════════════ the closure, restated
create or replace function public.minta_akun(p_kind text, p_konfirmasi boolean)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare v_me uuid := public.current_person_id(); v_id uuid; v_n int; v_sekolah uuid[];
begin
  if v_me is null then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_kind is null or p_kind not in ('CLOSE', 'DELETE_PERSONAL_DATA') then perform public.akun_tolak('ACCOUNT_REQUEST_INVALID'); end if;
  if not coalesce(p_konfirmasi, false) then perform public.akun_tolak('ACCOUNT_CONFIRM_REQUIRED'); end if;
  perform 1 from public.persons where id = v_me for update;
  if exists (select 1 from public.enrollments e where e.person_id = v_me and e.status in ('PENDING', 'ACTIVE')) then
    perform public.akun_tolak('ACCOUNT_LEARNER_VIA_SCHOOL');
  end if;
  if exists (select 1 from public.account_requests r where r.person_id = v_me and r.kind = p_kind and r.status in ('RECEIVED', 'IN_PROGRESS')) then
    perform public.akun_tolak('ACCOUNT_REQUEST_OPEN');
  end if;
  if p_kind = 'CLOSE' then
    if public.orang_ditangguhkan(v_me) then perform public.akun_tolak('ACCOUNT_ALREADY_SUSPENDED'); end if;
    -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 5): reopening needs another live PINTAR Administrator, so a
    -- person holding a platform role does not close their own account (the last one would lock the platform out); the
    -- role is ended first, by another administrator
    if public.is_system_admin() then perform public.akun_tolak('ACCOUNT_PLATFORM_ROLE'); end if;
    -- Z8-8 (Sharon (b)(c)(e)): every school this person administers now keeps another usable administrator; decided
    -- under each school's administrator lock (after the person's lock), so two administrators closing at once cannot
    -- both pass
    select coalesce(array_agg(distinct ra.institution_id), '{}') into v_sekolah
      from public.role_assignments ra
     where ra.person_id = v_me and ra.role = 'INSTITUTION_ADMIN'
       and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
       and exists (select 1 from public.org_nodes o where o.id = ra.scope_node_id and o.kind = 'INSTITUTION');
    if cardinality(v_sekolah) > 0 then
      perform public.kunci_admin_sekolah(v_sekolah);
      if exists (select 1 from unnest(v_sekolah) s where not public.admin_sekolah_lain_ada(s, v_me, null)) then
        perform public.akun_tolak('ACCOUNT_LAST_SCHOOL_ADMIN');
      end if;
    end if;
    insert into public.account_requests (person_id, kind, status, decided_by, decided_at) values (v_me, 'CLOSE', 'DONE', v_me, now())
    returning id into v_id;
    -- L1-F4 (Sharon, 12 Nov): what is live at this instant, under the person's FOR UPDATE, is what the closure held
    insert into public.person_suspensions (person_id, category, started_by, dipegang_saat_tutup)
    values (v_me, 'CLOSED_AT_REQUEST', v_me, public.orang_dipegang(v_me));
    perform public.audit_write('account.closed_at_request', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id, 'reason_code', 'CLOSED_AT_REQUEST'));
    v_n := public.akun_kunci(v_me, true);
  else
    insert into public.account_requests (person_id, kind) values (v_me, 'DELETE_PERSONAL_DATA') returning id into v_id;
    perform public.audit_write('account.deletion_requested', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id));
  end if;
  return jsonb_build_object('ok', true, 'permintaan', v_id);
end $function$;

-- ═══════════════════════════════════════════════════════════ what stands
do $$
begin
  if position('kunci_admin_sekolah' in pg_get_functiondef('public.peran_terakhir_kode(uuid,boolean)'::regprocedure)) = 0
     or position('admin_sekolah_lain_ada' in pg_get_functiondef('public.minta_akun(text,boolean)'::regprocedure)) = 0 then
    raise exception 'Z8-8: the guard or the closure does not ask the one question under the one lock';
  end if;
  if not has_function_privilege('authenticated', 'public.minta_akun(text,boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.admin_sekolah_lain_ada(uuid,uuid,uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.kunci_admin_sekolah(uuid[])', 'execute')
     or has_function_privilege('authenticated', 'public.admin_akun_dapat_masuk(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.admin_dapat_dipakai(public.app_role,uuid)', 'execute') then
    raise exception 'Z8-8: the grants moved';
  end if;
end $$;

-- ADR-0021 (F06-S01): every function this migration creates is revoked from PUBLIC after its last create. CREATE OR
-- REPLACE keeps the restated functions' grants, and PUBLIC held none, so this changes nothing at runtime.
revoke execute on function public.akun_tolak(text) from public;
revoke execute on function public.admin_akun_dapat_masuk(uuid) from public;
revoke execute on function public.admin_dapat_dipakai(public.app_role, uuid) from public;
revoke execute on function public.admin_sekolah_lain_ada(uuid, uuid, uuid) from public;
revoke execute on function public.kunci_admin_sekolah(uuid[]) from public;
revoke execute on function public.peran_terakhir_kode(uuid, boolean) from public;
revoke execute on function public.minta_akun(text, boolean) from public;
