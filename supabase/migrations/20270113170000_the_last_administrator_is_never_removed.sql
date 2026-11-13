-- ---------------------------------------------------------------------------
-- B0 · ADMINISTRATOR LOCK-OUT PROTECTION (docs/completion-4.1/batches/B0-COMPLETION.md; pre-build review, blockers 1
-- and 2). Every role assignment ends on a date and nothing refused the revocation of the last holder, so the platform's
-- last administrator, or a school's only one, could be removed. The database half:
--
-- (1) THE LAST-HOLDER RULE LIVES IN role_assignments_guard, on the UPDATE that writes revoked_at, so every revoking path
--     passes it (revoke_role, akhiri_tugas_staf, ubah_peran, buka_kembali_akun, and any later one); no function carries
--     a check of its own.
--       * the last usable live SYSTEM_ADMIN role: refused for everyone (ROLE_LAST_PLATFORM_ADMIN);
--       * a school's last usable live INSTITUTION_ADMIN role at the school's own node: refused
--         (ROLE_LAST_SCHOOL_ADMIN), unless the actor is an active platform admin (is_system_admin()).
--     «Last» is decided under a lock: FOR UPDATE on the school's row (institutions), or on the platform's row
--     (platform_environment) for SYSTEM_ADMIN, before counting, so two administrators revoking each other cannot both
--     succeed. Only USABLE holders count (admin_dapat_dipakai, the one definition the guard, the renewal and the
--     operator path read): a live role (not revoked, inside valid_from/valid_until) whose holder is neither suspended
--     or closed (person_suspensions) nor anonymised (persons.anonymized_at).
--     Expiry is untouched: the end date stays mandatory and is enforced for the last holder too.
-- (2) RENEWAL, perpanjang_peran(assignment, new end, reason): one transaction; a new assignment with the later end
--     date through the guard (so whoever may grant the role today may renew it), then the old one revoked; audited
--     role.renewed with the reason beside the per-row role.granted / role.revoked. It leaves exactly one live
--     assignment: the one-standing-grant rule admits the new row only beside the very assignment being renewed.
-- (3) THE ONLY SELF-GRANT: the sole usable platform admin renews their own SYSTEM_ADMIN role, with a reason. The guard
--     admits it only inside a renewal of the actor's own live SYSTEM_ADMIN assignment while no other usable platform
--     admin exists (decided under the platform's lock). Every other self-grant stays refused (INV-16).
-- (4) OPERATOR RECOVERY, operator_appoint_platform_admin(pintar_id, valid_until, reason, operator_ref): no signed-in
--     actor (service level, as operator_found_school); names one existing person as platform admin while no usable
--     platform admin exists; audited role.platform_admin_recovered. An unknown person, or a platform that has a usable
--     admin, is refused and nothing is written.
-- (5) THE EXPIRY READ, peran_akan_berakhir(school, days): roles ending within N calendar days on the school's clock;
--     without a school the caller's own roles and, for a platform admin, the platform's; with a school that school's
--     roles for its admins (staf_boleh, as peran_orang). peran_pemegang_terakhir(assignment) says whether a role is the
--     last usable admin role of its school or of the platform, for the screen's warning.
-- A refusal raises, so its transaction keeps nothing; catat_penolakan_peran(assignment, code) records it afterwards
-- (role.revocation_refused / role.renewal_refused), and only a refusal that is true for the caller now.
-- Refusals are PR160 with the code in DETAIL.
-- ---------------------------------------------------------------------------

create or replace function public.peran_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR160',
    detail  = p_code,
    message = case p_code
      when 'ROLE_LAST_PLATFORM_ADMIN'   then 'the platform''s last usable administrator role is not revoked; appoint a second platform admin first'
      when 'ROLE_LAST_SCHOOL_ADMIN'     then 'a school''s last usable administrator role is revoked only by a platform admin'
      when 'ROLE_RENEW_NOT_ALLOWED'     then 'renewing a role needs the authority to grant it'
      when 'ROLE_RENEW_NOT_LIVE'        then 'only a live role is renewed; an ended one is granted again'
      when 'ROLE_RENEW_SELF'            then 'nobody renews their own role, except the platform''s only usable administrator'
      when 'ROLE_RENEW_UNTIL_INVALID'   then 'a renewal ends after today and after the role''s current end'
      when 'ROLE_RENEW_REASON_REQUIRED' then 'the reason is 10 to 300 characters'
      when 'ROLE_READ_NOT_ALLOWED'      then 'this is read by the holder, the school''s administrators or a platform admin'
      when 'ROLE_EXPIRY_DAYS_INVALID'   then 'the number of days is 1 to 366'
      when 'ROLE_REFUSAL_NOT_FOUND'     then 'no such refusal stands for this caller now'
      when 'OPERATOR_NOT_OPERATOR'      then 'this is an operator action, not a signed-in one'
      when 'OPERATOR_REASON_REQUIRED'   then 'the reason is 10 to 300 characters'
      when 'OPERATOR_REF_REQUIRED'      then 'an appointment says which operator run made it'
      when 'OPERATOR_UNTIL_INVALID'     then 'the role ends after today'
      when 'OPERATOR_PERSON_UNKNOWN'    then 'no such person'
      when 'OPERATOR_ADMIN_EXISTS'      then 'this PINTAR has a usable platform admin, who appoints the next one'
      when 'OPERATOR_PERSON_UNUSABLE'   then 'a suspended, closed or anonymised person is not appointed'
      else 'the role could not be changed' end;
end $$;
revoke all on function public.peran_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ «usable admin», the one definition
-- The usable administrator assignments of the platform (SYSTEM_ADMIN, p_institution null) or of one school
-- (INSTITUTION_ADMIN at the school's own node): live now, and held by a person who is neither suspended or closed nor
-- anonymised. The guard, the renewal, the operator path and the reads all count from here.
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
$$;
revoke all on function public.admin_dapat_dipakai(public.app_role, uuid) from public, anon, authenticated;

-- Is this assignment the last usable administrator role of the platform or of its school? The code of the refusal its
-- revocation would meet, or null. With p_kunci the school's row (or the platform's) is locked FOR UPDATE before the
-- count, so a concurrent revocation has either committed or not begun; the guard asks with the lock, the reads without.
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
    if p_kunci then perform 1 from public.institutions i where i.id = r.institution_id for update; end if;
    if exists (select 1 from public.admin_dapat_dipakai('INSTITUTION_ADMIN', r.institution_id) a where a.id = r.id)
       and not exists (select 1 from public.admin_dapat_dipakai('INSTITUTION_ADMIN', r.institution_id) a where a.id <> r.id) then
      return 'ROLE_LAST_SCHOOL_ADMIN';
    end if;
  end if;
  return null;
end $$;
revoke all on function public.peran_terakhir_kode(uuid, boolean) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the guard
-- 20261122100000's guard with three additions, each marked B0; every other line is as it was.
create or replace function public.role_assignments_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_env text; v_target_inst uuid; v_kode text;
begin
  if tg_op = 'DELETE' then raise exception 'role assignments are revoked, never deleted (audit)'; end if;
  if tg_op = 'UPDATE' then
    if new.person_id <> old.person_id or new.role <> old.role or new.scope_node_id is distinct from old.scope_node_id
       or new.institution_id is distinct from old.institution_id or new.valid_from <> old.valid_from
       or new.valid_until <> old.valid_until or new.granted_by is distinct from old.granted_by then
      raise exception 'a role assignment is immutable; revoke and grant a new one';
    end if;
    if old.revoked_at is not null then raise exception 'assignment already revoked'; end if;
    if new.revoked_reason is distinct from old.revoked_reason and new.revoked_at is null then
      raise exception 'a revocation''s reason is written with the revocation, never on its own (D-093)';
    end if;
    -- B0 (1): THE LAST-HOLDER RULE, for every path that revokes. The platform's last usable administrator role is
    -- revoked by nobody; a school's last usable one only by an active platform admin. Decided under the lock on the
    -- platform's row or the school's (peran_terakhir_kode).
    if new.revoked_at is not null
       and (old.role = 'SYSTEM_ADMIN' or (old.role = 'INSTITUTION_ADMIN' and not public.is_system_admin())) then
      v_kode := public.peran_terakhir_kode(old.id, true);
      if v_kode is not null then perform public.peran_tolak(v_kode); end if;
    end if;
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

    -- B0 (4): OPERATOR RECOVERY. The marker only operator_appoint_platform_admin sets, naming this very person; the
    -- role SYSTEM_ADMIN at the platform and no other; and, under the platform's lock, no usable platform admin.
    if coalesce(current_setting('pintar.operator_admin', true), '') = new.person_id::text
       and new.role = 'SYSTEM_ADMIN' and new.scope_node_id is null then
      perform 1 from public.platform_environment for update;
      if not exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null)) then
        return new;
      end if;
    end if;

    select environment into v_env from public.platform_environment;
    if v_env = 'production' or current_setting('app.seed_intent', true) is distinct from 'synthetic' then
      raise exception 'role assignments require an authenticated grantor (INV-16)';
    end if;
    return new;
  end if;
  if v_actor is null then raise exception 'grantor has no person (INV-16)'; end if;
  if v_actor = new.person_id then
    -- B0 (3): THE ONLY SELF-GRANT. Inside a renewal (the marker only perpanjang_peran sets) of the actor's own live
    -- SYSTEM_ADMIN assignment, while, under the platform's lock, no other usable platform admin exists.
    if new.role = 'SYSTEM_ADMIN' and new.scope_node_id is null
       and exists (select 1 from public.role_assignments o
                    where o.id::text = coalesce(current_setting('pintar.peran_perpanjang', true), '')
                      and o.person_id = v_actor and o.role = 'SYSTEM_ADMIN' and o.revoked_at is null
                      and now() >= o.valid_from and now() < o.valid_until) then
      perform 1 from public.platform_environment for update;
      if exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.person_id = v_actor)
         and not exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.person_id <> v_actor) then
        new.granted_by := v_actor;
        return new;
      end if;
    end if;
    raise exception 'self-grant is never allowed (INV-16)';
  end if;
  new.granted_by := v_actor;
  if new.role = 'SYSTEM_ADMIN' or new.scope_node_id is null then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % (INV-16)', new.role;
    end if;
  elsif new.role = 'INSTITUTION_ADMIN'
        and not exists (select 1 from public.org_nodes o where o.id = new.scope_node_id and o.kind = 'INSTITUTION') then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % below a school''s own node; an INSTITUTION_ADMIN appoints another at the school itself (INV-16, D-101)', new.role;
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

-- One standing grant per person, role and place (20261013100000), unchanged but for the renewal: the new assignment
-- stands for an instant beside the very assignment it renews, which is revoked in the same transaction.
create or replace function public.refuse_duplicate_active_grant() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(
    'pintar.grant:' || new.person_id::text || ':' || new.role::text || ':' || coalesce(new.scope_node_id::text, '-'), 0));
  if exists (
    select 1 from public.role_assignments ra
     where ra.person_id = new.person_id and ra.role = new.role
       and ra.scope_node_id is not distinct from new.scope_node_id
       and ra.revoked_at is null and ra.valid_until > now()
       -- B0 (2): the assignment being renewed (perpanjang_peran's marker), and no other
       and ra.id::text is distinct from coalesce(current_setting('pintar.peran_perpanjang', true), '')
  ) then
    raise exception 'GRANT_ALREADY_ACTIVE'
      using errcode = '23505', detail = 'GRANT_ALREADY_ACTIVE',
            hint = 'this person already holds this role here; revoke it first to grant it again';
  end if;
  return new;
end $$;
revoke all on function public.refuse_duplicate_active_grant() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (2) (3) the renewal
create or replace function public.perpanjang_peran(p_assignment uuid, p_valid_until timestamptz, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_alasan text := btrim(coalesce(p_alasan, ''));
        r public.role_assignments; v_baru uuid; v_sendiri boolean;
begin
  if v_actor is null then perform public.peran_tolak('ROLE_RENEW_NOT_ALLOWED'); end if;
  select * into r from public.role_assignments ra where ra.id = p_assignment;
  if r.id is null
     or not (public.is_system_admin() or (r.scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', r.scope_node_id))) then
    perform public.peran_tolak('ROLE_RENEW_NOT_ALLOWED');
  end if;
  -- the row the last-holder rule locks, taken before anything is written, then the assignment itself: two renewals,
  -- or a renewal and a revocation, of one role serialise here
  if r.role = 'SYSTEM_ADMIN' then
    perform 1 from public.platform_environment for update;
  elsif r.role = 'INSTITUTION_ADMIN' then
    perform 1 from public.institutions i where i.id = r.institution_id for update;
  end if;
  select * into r from public.role_assignments ra where ra.id = p_assignment for update;
  if r.revoked_at is not null or now() < r.valid_from or now() >= r.valid_until then
    perform public.peran_tolak('ROLE_RENEW_NOT_LIVE');
  end if;
  v_sendiri := r.person_id = v_actor;
  -- the only self-grant: the platform's only usable administrator, their own SYSTEM_ADMIN role (the guard decides again)
  if v_sendiri and (r.role <> 'SYSTEM_ADMIN'
                    or exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.person_id <> v_actor)) then
    perform public.peran_tolak('ROLE_RENEW_SELF');
  end if;
  if p_valid_until is null or p_valid_until <= now() or p_valid_until <= r.valid_until then
    perform public.peran_tolak('ROLE_RENEW_UNTIL_INVALID');
  end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.peran_tolak('ROLE_RENEW_REASON_REQUIRED'); end if;

  -- the new assignment through the guard, as the signed-in actor (whoever may grant this role may renew it), then the
  -- old one revoked: both stamped now(), one instant, no gap and no overlap
  perform set_config('pintar.peran_perpanjang', r.id::text, true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
  values (r.person_id, r.role, r.scope_node_id, p_valid_until)
  returning id into v_baru;
  update public.role_assignments set revoked_at = now(), revoked_by = v_actor, revoked_reason = v_alasan where id = r.id;
  perform set_config('pintar.peran_perpanjang', '', true);

  perform public.audit_write('role.renewed', 'role_assignments', v_baru::text, r.institution_id,
    jsonb_build_object('person_id', r.person_id, 'role', r.role, 'scope_node_id', r.scope_node_id, 'reason', v_alasan,
                       'from', jsonb_build_object('assignment', r.id, 'valid_until', r.valid_until),
                       'to', jsonb_build_object('assignment', v_baru, 'valid_until', p_valid_until),
                       'self', v_sendiri, 'actor_role', public.audit_actor_role(r.institution_id)));
  return jsonb_build_object('ok', true, 'id', v_baru, 'sampai', p_valid_until, 'sendiri', v_sendiri);
end $$;
revoke all on function public.perpanjang_peran(uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.perpanjang_peran(uuid, timestamptz, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ a refusal, recorded
-- The guard's refusal aborts its transaction, so the refusal is recorded by the screen's next call: only one that is
-- true for this caller now (they may revoke the assignment and it is the last usable administrator role; or it is
-- their own role and its renewal is refused), so nothing else can be written here.
create or replace function public.catat_penolakan_peran(p_assignment uuid, p_kode text)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); r public.role_assignments; v_kode text; v_aksi text;
begin
  if v_actor is null then perform public.peran_tolak('ROLE_REFUSAL_NOT_FOUND'); end if;
  select * into r from public.role_assignments ra where ra.id = p_assignment;
  if r.id is null or r.revoked_at is not null then perform public.peran_tolak('ROLE_REFUSAL_NOT_FOUND'); end if;
  if p_kode in ('ROLE_LAST_PLATFORM_ADMIN', 'ROLE_LAST_SCHOOL_ADMIN') then
    v_kode := public.peran_terakhir_kode(r.id, false);
    if v_kode is distinct from p_kode
       or (v_kode = 'ROLE_LAST_PLATFORM_ADMIN' and not public.is_system_admin())
       or (v_kode = 'ROLE_LAST_SCHOOL_ADMIN'
           and (public.is_system_admin() or not public.has_scope('INSTITUTION_ADMIN', r.scope_node_id))) then
      perform public.peran_tolak('ROLE_REFUSAL_NOT_FOUND');
    end if;
    v_aksi := 'role.revocation_refused';
  elsif p_kode = 'ROLE_RENEW_SELF' then
    if r.person_id <> v_actor or now() < r.valid_from or now() >= r.valid_until
       or not (public.is_system_admin() or (r.scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', r.scope_node_id)))
       or (r.role = 'SYSTEM_ADMIN'
           and not exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a where a.person_id <> v_actor)) then
      perform public.peran_tolak('ROLE_REFUSAL_NOT_FOUND');
    end if;
    v_aksi := 'role.renewal_refused';
  else
    perform public.peran_tolak('ROLE_REFUSAL_NOT_FOUND');
  end if;
  return public.audit_write(v_aksi, 'role_assignments', r.id::text, r.institution_id,
    jsonb_build_object('person_id', r.person_id, 'role', r.role, 'scope_node_id', r.scope_node_id, 'valid_until', r.valid_until,
                       'refusal', p_kode, 'actor_role', public.audit_actor_role(r.institution_id)));
end $$;
revoke all on function public.catat_penolakan_peran(uuid, text) from public, anon, authenticated;
grant execute on function public.catat_penolakan_peran(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (4) the operator's recovery
-- The only caller is the operator's dispatched step (no signed-in actor, as operator_found_school). An unknown person
-- is refused before anything else is asked, so the step's controlled red writes nothing wherever it runs.
create or replace function public.operator_appoint_platform_admin(
  p_pintar_id text, p_valid_until timestamptz, p_reason text, p_operator_ref text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_claims jsonb; v_role text; v_person uuid; v_id uuid;
        v_reason text := btrim(coalesce(p_reason, '')); v_ref text := btrim(coalesce(p_operator_ref, ''));
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.peran_tolak('OPERATOR_NOT_OPERATOR');
  end if;
  if char_length(v_reason) < 10 or char_length(v_reason) > 300 then perform public.peran_tolak('OPERATOR_REASON_REQUIRED'); end if;
  if char_length(v_ref) not between 8 and 300 then perform public.peran_tolak('OPERATOR_REF_REQUIRED'); end if;
  if p_valid_until is null or p_valid_until <= now() then perform public.peran_tolak('OPERATOR_UNTIL_INVALID'); end if;

  select p.id into v_person from public.persons p where p.pintar_id = public.pintar_id_canonical(p_pintar_id);
  if v_person is null then perform public.peran_tolak('OPERATOR_PERSON_UNKNOWN'); end if;

  -- the platform's row, locked before the count (the same lock the last-holder rule and the self-renewal take)
  perform 1 from public.platform_environment for update;
  if exists (select 1 from public.admin_dapat_dipakai('SYSTEM_ADMIN', null)) then
    perform public.peran_tolak('OPERATOR_ADMIN_EXISTS');
  end if;
  if public.orang_ditangguhkan(v_person)
     or exists (select 1 from public.persons p where p.id = v_person and p.anonymized_at is not null) then
    perform public.peran_tolak('OPERATOR_PERSON_UNUSABLE');
  end if;

  perform set_config('pintar.operator_admin', v_person::text, true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (v_person, 'SYSTEM_ADMIN', null, now(), p_valid_until)
  returning id into v_id;
  perform set_config('pintar.operator_admin', '', true);

  perform public.audit_write('role.platform_admin_recovered', 'role_assignments', v_id::text, null,
    jsonb_build_object('person_id', v_person, 'role', 'SYSTEM_ADMIN', 'valid_until', p_valid_until, 'reason', v_reason,
                       'operator_ref', v_ref, 'step', 'operator_appoint_platform_admin/1'));
  return v_id;
end $$;
revoke all on function public.operator_appoint_platform_admin(text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.operator_appoint_platform_admin(text, timestamptz, text, text) to service_role;

-- ═══════════════════════════════════════════════════════════ (5) the reads
-- Roles ending within p_hari calendar days, counted on the school's clock (the platform's roles on WIB, zona_sekolah's
-- own fallback). Without a school: the caller's own roles and, for a platform admin, the platform's. With a school:
-- that school's roles, for its administrators (staf_boleh, as peran_orang).
create or replace function public.peran_akan_berakhir(p_institution uuid, p_hari integer)
returns table (id uuid, person_id uuid, nama text, role public.app_role, scope_node_id uuid, tempat text,
               institution_id uuid, valid_until timestamptz, zona text, sisa_hari integer, milik_sendiri boolean,
               pemegang_terakhir boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v_sys boolean := public.is_system_admin();
begin
  if v_me is null then perform public.peran_tolak('ROLE_READ_NOT_ALLOWED'); end if;
  if p_hari is null or p_hari < 1 or p_hari > 366 then perform public.peran_tolak('ROLE_EXPIRY_DAYS_INVALID'); end if;
  if p_institution is not null and not public.staf_boleh(p_institution) then
    perform public.peran_tolak('ROLE_READ_NOT_ALLOWED');
  end if;
  return query
    select x.id, x.person_id, p.display_name, x.role, x.scope_node_id, n.name, x.institution_id, x.valid_until, x.zona,
           x.sisa, x.person_id = v_me, public.peran_terakhir_kode(x.id, false) is not null
      from (select ra.*, z.zona,
                   ((ra.valid_until at time zone z.zona)::date - (now() at time zone z.zona)::date) as sisa
              from public.role_assignments ra
              cross join lateral (select public.zona_sekolah(ra.institution_id) as zona) z
             where ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
               and case when p_institution is null
                        then ra.person_id = v_me or (v_sys and ra.role = 'SYSTEM_ADMIN')
                        else ra.institution_id = p_institution and ra.role <> 'SYSTEM_ADMIN' end) x
      join public.persons p on p.id = x.person_id
      left join public.org_nodes n on n.id = x.scope_node_id
     where x.sisa <= p_hari
     order by x.valid_until, p.display_name, x.id;
end $$;
revoke all on function public.peran_akan_berakhir(uuid, integer) from public, anon, authenticated;
grant execute on function public.peran_akan_berakhir(uuid, integer) to authenticated;

-- Is this the last usable administrator role of its school, or of the platform? For whoever may revoke it (as
-- revoke_role decides), so the screen can say what its revocation would leave.
create or replace function public.peran_pemegang_terakhir(p_assignment uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.role_assignments;
begin
  select * into r from public.role_assignments ra where ra.id = p_assignment;
  if public.current_person_id() is null or r.id is null
     or not (public.is_system_admin() or (r.scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', r.scope_node_id))) then
    perform public.peran_tolak('ROLE_READ_NOT_ALLOWED');
  end if;
  return public.peran_terakhir_kode(r.id, false) is not null;
end $$;
revoke all on function public.peran_pemegang_terakhir(uuid) from public, anon, authenticated;
grant execute on function public.peran_pemegang_terakhir(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the declarations
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('perpanjang_peran', 'STAFF',
   'B0: renews a live role in one transaction: a new assignment with a later end date through the role_assignments '
   || 'guard (whoever may grant the role may renew it), then the old one revoked; a 10-300 reason; audited role.renewed. '
   || 'Never one''s own, except the platform''s only usable administrator renewing their SYSTEM_ADMIN role. Refusals PR160.',
   'DELEGATED', 'role_assignments'),
  ('catat_penolakan_peran', 'STAFF',
   'B0: records a last-holder refusal (role.revocation_refused) or a refused self-renewal (role.renewal_refused) after '
   || 'the refused transaction, and only one that stands for the caller now: they may revoke the assignment and it is '
   || 'the last usable administrator role, or it is their own role. Anything else is refused ROLE_REFUSAL_NOT_FOUND.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('peran_akan_berakhir', 'STAFF',
   'B0: roles ending within N calendar days (1-366) on the school''s clock. Without a school the caller''s own roles '
   || 'and, for a platform admin, the platform''s; with a school that school''s roles, for INSTITUTION_ADMIN of the '
   || 'school. Each row says whether it is the caller''s own and whether it is the last usable administrator role.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('peran_pemegang_terakhir', 'STAFF',
   'B0: whether one assignment is the last usable administrator role of its school or of the platform, for whoever '
   || 'may revoke it (SYSTEM_ADMIN, or INSTITUTION_ADMIN over its place).',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('authenticated', 'public.admin_dapat_dipakai(public.app_role, uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.peran_terakhir_kode(uuid, boolean)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.peran_tolak(text)'::regprocedure, 'execute') then
    raise exception 'B0: an internal helper is callable by a client';
  end if;
  if has_function_privilege('authenticated', 'public.operator_appoint_platform_admin(text, timestamptz, text, text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.operator_appoint_platform_admin(text, timestamptz, text, text)'::regprocedure, 'execute') then
    raise exception 'B0: a platform admin is recovered only by the operator''s connection';
  end if;
  if has_function_privilege('anon', 'public.perpanjang_peran(uuid, timestamptz, text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.catat_penolakan_peran(uuid, text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.peran_akan_berakhir(uuid, integer)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.peran_pemegang_terakhir(uuid)'::regprocedure, 'execute') then
    raise exception 'B0: an anonymous caller can renew or read roles';
  end if;
  if position('peran_terakhir_kode' in pg_get_functiondef('public.role_assignments_guard()'::regprocedure)) = 0 then
    raise exception 'B0: the last-holder rule is not in the guard';
  end if;
  raise notice 'B0 verified: the last usable administrator is never revoked; a role is renewed in one act; the operator recovers a platform with none';
end $$;
