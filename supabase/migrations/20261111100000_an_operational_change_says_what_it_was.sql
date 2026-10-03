-- D-093 T2 + T3 (owner ruling 3 Oct, D-097) -- AN OPERATIONAL CHANGE SAYS WHAT IT WAS.
--
-- The D-093 inventory (docs/coordination/design/D-093-OPERATIONAL-SWITCH-INVENTORY.md) left these writers audited but
-- incomplete. Each now records, in audit_log's summary (no audit_log change: it holds all of it), the change's
-- previous and new state, the role the actor acted under, the reason where D-097(a) asks for one -- a consequential
-- negative or reversal action -- and nothing when nothing changed.
--
--   S2  role revoke: revoke_role(p_assignment, p_reason) -- the reason is required, kept on the row
--       (role_assignments.revoked_reason, written once with the revocation) and in the audit. Granting stays a routine
--       positive act: no reason, but its audit gains the actor's role.
--   S7  structure deactivation: deactivate_school_node(p_node, p_reason) -- the reason is required
--       (STRUCTURE_REASON_REQUIRED), and the audit names every place the deactivation closed, not only the one chosen.
--   S15 certificate revoke: a revoked certificate is not revoked again. The second call is refused
--       (CERTIFICATE_ALREADY_REVOKED) and the guard keeps a revocation's time and reason as first recorded, whatever
--       the path, so a repeated revocation can neither overwrite nor obscure the first.
--   S5/S6 platform_config and feature_flags (inert, D-097(c)): their triggers record from and to, and write nothing for
--       a save that changes nothing. No reason: nothing in PINTAR writes them any more.
--   S3  T3 -- account activation and class-card issue are audited when the account EXISTS. authorize_account_activation
--       and authorize_new_person wrote 'account.activation_authorized' / 'account.new_person_authorized' at the
--       moment of intent, before Auth had created anything; a refused or failed createUser left a row saying an account
--       was activated when none was. They now write only the single-use grant (with the role it was authorized under);
--       handle_new_auth_user, the trigger that consumes the grant and inserts the account in Auth's own transaction,
--       writes 'account.activated' -- and, being in that transaction, cannot outlive a creation that failed.
--
-- The actor's role comes from one helper, audit_actor_role(institution): SYSTEM_ADMIN for an active platform admin,
-- otherwise the highest active role the person holds in that institution, null with no person (the database owner,
-- or Auth). Every writer here is gated on SYSTEM_ADMIN or INSTITUTION_ADMIN, so that is the role that answered.

create function public.audit_actor_role(p_institution uuid) returns text
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.current_person_id(); v_role text;
begin
  if v_person is null then return null; end if;
  if public.is_system_admin() then return 'SYSTEM_ADMIN'; end if;
  if p_institution is null then return null; end if;
  select ra.role::text into v_role from public.role_assignments ra
   where ra.person_id = v_person and ra.institution_id = p_institution and ra.revoked_at is null
     and now() >= ra.valid_from and now() < ra.valid_until
   order by public.role_rank(ra.role) desc
   limit 1;
  return v_role;
end $$;
revoke all on function public.audit_actor_role(uuid) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ S2 role revoke
alter table public.role_assignments add column revoked_reason text;
comment on column public.role_assignments.revoked_reason is
  'D-093 T2 (D-097(a)): why the assignment was revoked. Written once, with the revocation; the guard admits no change '
  'after it.';

-- the guard of 20261018100000, with one more rule: a reason is written only with the revocation itself
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
    if new.revoked_reason is distinct from old.revoked_reason and new.revoked_at is null then
      raise exception 'a revocation''s reason is written with the revocation, never on its own (D-093)';
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

-- the one human path to a revocation (signed-in clients hold SELECT only on role_assignments): it asks why
drop function public.revoke_role(uuid);
create function public.revoke_role(p_assignment uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select * into r from public.role_assignments where id = p_assignment;
  if r.id is null then raise exception 'assignment not found'; end if;
  if not (public.is_system_admin() or (r.scope_node_id is not null and public.has_scope('INSTITUTION_ADMIN', r.scope_node_id))) then
    raise exception 'not authorized to revoke';
  end if;
  if v_reason is null or length(v_reason) > 300 then
    raise exception using errcode = '22023', detail = 'ROLE_REASON_REQUIRED',
      message = 'a revocation states its reason, in at most 300 characters (D-097)';
  end if;
  update public.role_assignments
     set revoked_at = now(), revoked_by = public.current_person_id(), revoked_reason = v_reason
   where id = p_assignment;
end $$;
revoke all on function public.revoke_role(uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_role(uuid, text) to authenticated;

create or replace function public.role_assignments_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    perform public.audit_write('role.granted', 'role_assignments', new.id::text, new.institution_id,
      jsonb_build_object('person_id', new.person_id, 'role', new.role, 'scope_node_id', new.scope_node_id,
                         'valid_from', new.valid_from, 'valid_until', new.valid_until, 'revoked_at', new.revoked_at,
                         'from', null, 'to', jsonb_build_object('state', 'GRANTED', 'valid_until', new.valid_until),
                         'actor_role', public.audit_actor_role(new.institution_id)));
  elsif old.revoked_at is null and new.revoked_at is not null then
    perform public.audit_write('role.revoked', 'role_assignments', new.id::text, new.institution_id,
      jsonb_build_object('person_id', new.person_id, 'role', new.role, 'scope_node_id', new.scope_node_id,
                         'valid_until', new.valid_until, 'revoked_at', new.revoked_at, 'revoked_by', new.revoked_by,
                         'from', jsonb_build_object('state', case when old.valid_until <= new.revoked_at
                                                                  then 'EXPIRED' else 'ACTIVE' end,
                                                    'valid_until', old.valid_until),
                         'to', jsonb_build_object('state', 'REVOKED', 'revoked_at', new.revoked_at),
                         'reason', new.revoked_reason,
                         'actor_role', public.audit_actor_role(new.institution_id)));
  end if;
  return null;
end $$;
revoke all on function public.role_assignments_audit() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════ S7 structure deactivation
-- the refusals of 20261012100000, with the one this ticket adds
create or replace function public.structure_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR020',
    detail  = p_code,
    message = case p_code
      when 'STRUCTURE_NOT_ALLOWED'         then 'changing the school structure needs INSTITUTION_ADMIN at this school, or SYSTEM_ADMIN'
      when 'STRUCTURE_NOT_A_SCHOOL'        then 'only a school has a structure; this tenant is not a school'
      when 'STRUCTURE_NAME_INVALID'        then 'a structure name is 1 to 80 characters, without control characters'
      when 'STRUCTURE_NAME_TAKEN'          then 'an active sibling already has this name'
      when 'STRUCTURE_YEAR_INVALID'        then 'an academic year is written YYYY/YYYY+1'
      when 'STRUCTURE_YEAR_OUT_OF_RANGE'   then 'an academic year is the current one, the one before or the one after'
      when 'STRUCTURE_YEAR_MISMATCH'       then 'a Kelas carries its Tingkat''s academic year'
      when 'STRUCTURE_PARENT_INVALID'      then 'the parent is not the kind of node this call needs'
      when 'STRUCTURE_PARENT_INACTIVE'     then 'the parent has been deactivated'
      when 'STRUCTURE_PLACE_INACTIVE'      then 'the place has been deactivated; nobody is placed or granted a role there'
      when 'STRUCTURE_NODE_INVALID'        then 'only a Bagian, Tingkat or Kelas is changed here'
      when 'STRUCTURE_HAS_ACTIVE_CHILDREN' then 'deactivate the active children first'
      when 'STRUCTURE_HAS_MEMBERS'         then 'students are still placed here'
      when 'STRUCTURE_HAS_STAFF'           then 'a role is still scoped to this node'
      when 'STRUCTURE_REASON_REQUIRED'     then 'a deactivation states its reason, in at most 300 characters (D-097)'
      else 'the school structure could not be changed' end;
end $$;
revoke all on function public.structure_refuse(text) from public, anon, authenticated;

drop function public.deactivate_school_node(uuid);
create function public.deactivate_school_node(p_node uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare n public.org_nodes; v_reason text := nullif(btrim(coalesce(p_reason, '')), ''); v_closed jsonb;
begin
  n := public.structure_node(p_node);
  if v_reason is null or length(v_reason) > 300 then
    perform public.structure_refuse('STRUCTURE_REASON_REQUIRED');
  end if;
  perform public.structure_lock(n.institution_id);
  -- read again under the lock: a concurrent change to this school's
  -- structure has either committed or not begun
  select * into n from public.org_nodes o where o.id = n.id;
  if n.kind not in ('DEPARTMENT', 'COHORT', 'CLASS') then
    perform public.structure_refuse('STRUCTURE_NODE_INVALID');
  end if;
  if not n.is_active then return n.id; end if;   -- nothing changes, nothing is recorded
  -- an active Tingkat under a Bagian (through its hidden Reguler), or an
  -- active Kelas under a Tingkat
  if exists (select 1 from public.org_nodes c
              where c.jalur @> array[n.id] and c.id <> n.id and c.is_active
                and c.kind in ('COHORT', 'CLASS')) then
    perform public.structure_refuse('STRUCTURE_HAS_ACTIVE_CHILDREN');
  end if;
  if exists (select 1 from public.memberships m
              join public.org_nodes c on c.id = m.node_id
             where c.jalur @> array[n.id] and m.valid_to is null) then
    perform public.structure_refuse('STRUCTURE_HAS_MEMBERS');
  end if;
  if exists (select 1 from public.role_assignments ra
              join public.org_nodes c on c.id = ra.scope_node_id
             where c.jalur @> array[n.id] and ra.revoked_at is null and now() < ra.valid_until) then
    perform public.structure_refuse('STRUCTURE_HAS_STAFF');
  end if;
  -- a Bagian takes its hidden Reguler with it; nothing active is under either. Every place it closes is named.
  with closed as (
    update public.org_nodes set is_active = false
     where org_nodes.jalur @> array[n.id] and org_nodes.is_active
    returning org_nodes.id, org_nodes.kind, org_nodes.name)
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'kind', c.kind, 'name', c.name)
                            order by c.kind, c.name), '[]'::jsonb)
    into v_closed from closed c;
  perform public.audit_write('structure.deactivated', 'org_nodes', n.id::text, n.institution_id,
    jsonb_build_object('kind', n.kind, 'name', n.name,
                       'from', jsonb_build_object('is_active', true), 'to', jsonb_build_object('is_active', false),
                       'deactivated', v_closed, 'reason', v_reason,
                       'actor_role', public.audit_actor_role(n.institution_id)));
  return n.id;
end $$;
revoke all on function public.deactivate_school_node(uuid, text) from public, anon, authenticated;
grant execute on function public.deactivate_school_node(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ S15 certificate revoke
-- the guard of 20260914103000, with the revocation kept as first recorded
create or replace function public.enforce_certificate_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a certificate is never deleted; revocation keeps the row (doc 16 §2)';
  end if;
  if tg_op = 'INSERT' then return new; end if;

  if new.session_id <> old.session_id or new.person_id <> old.person_id
     or new.institution_id <> old.institution_id or new.snapshot_id <> old.snapshot_id
     or new.certificate_number <> old.certificate_number
     or new.verification_token <> old.verification_token
     or new.issued_at is distinct from old.issued_at
     or new.issued_at_iso is distinct from old.issued_at_iso
     or new.canonical_payload is distinct from old.canonical_payload then
    raise exception 'a certificate is immutable; a correction is a new chain-linked row (§8)';
  end if;
  if old.status <> 'ELIGIBLE' and (new.signature is distinct from old.signature
                                or new.key_version is distinct from old.key_version) then
    raise exception 'the signature of an issued certificate is immutable (INV-05)';
  end if;
  if not (
       (old.status = 'ELIGIBLE'   and new.status in ('ELIGIBLE','ISSUED'))
    or (old.status = 'ISSUED'     and new.status in ('ISSUED','REVOKED','SUPERSEDED'))
    or (old.status = 'REVOKED'    and new.status = 'REVOKED')
    or (old.status = 'SUPERSEDED' and new.status = 'SUPERSEDED')) then
    raise exception 'illegal certificate transition % -> % (doc 04 §7)', old.status, new.status;
  end if;
  -- D-093 T2: a revocation records when and why, and stands as first recorded
  if new.status = 'REVOKED' and old.status <> 'REVOKED'
     and (new.revoked_at is null or coalesce(btrim(new.revoked_reason), '') = '') then
    raise exception 'a revocation records when and why (D-093)';
  end if;
  if old.status = 'REVOKED' and (new.revoked_at is distinct from old.revoked_at
                                 or new.revoked_reason is distinct from old.revoked_reason) then
    raise exception 'a revocation stands as first recorded: its time and reason are not rewritten (D-093)';
  end if;
  return new;
end $$;
revoke all on function public.enforce_certificate_write() from public, anon, authenticated;

create or replace function public.revoke_certificate(p_certificate uuid, p_reason text) returns public.certificate_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cert public.certificates; v_reason text := nullif(btrim(coalesce(p_reason, '')), ''); v_at timestamptz;
begin
  select * into v_cert from public.certificates where id = p_certificate;
  if v_cert.id is null then raise exception 'unknown certificate %', p_certificate; end if;
  if not public.can_in_institution('CAN_PUBLISH', v_cert.institution_id) then
    raise exception 'revoking a certificate requires CAN_PUBLISH in that institution';
  end if;
  if v_reason is null then raise exception 'a revocation records why'; end if;
  if v_cert.status = 'REVOKED' then
    raise exception using detail = 'CERTIFICATE_ALREADY_REVOKED',
      message = 'this certificate is already revoked; the first revocation stands as recorded (D-093)';
  end if;
  update public.certificates set status = 'REVOKED', revoked_at = now(), revoked_reason = v_reason
   where id = p_certificate
  returning revoked_at into v_at;
  perform public.audit_write('certificate.revoked', 'certificates', p_certificate::text,
    v_cert.institution_id,
    jsonb_build_object('certificate_id', p_certificate, 'reason', v_reason,
                       'from', jsonb_build_object('status', v_cert.status),
                       'to', jsonb_build_object('status', 'REVOKED', 'revoked_at', v_at),
                       'actor_role', public.audit_actor_role(v_cert.institution_id)));
  return 'REVOKED';
end $$;
revoke all on function public.revoke_certificate(uuid, text) from public, anon;
grant execute on function public.revoke_certificate(uuid, text) to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ S5 / S6 the inert switches
create or replace function public.feature_flags_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and old.enabled is not distinct from new.enabled then return null; end if;
  perform public.audit_write('feature_flag.'||tg_op, 'feature_flags', new.key, new.institution_id,
    jsonb_build_object('enabled', new.enabled,
                       'from', case when tg_op = 'UPDATE' then jsonb_build_object('enabled', old.enabled) end,
                       'to', jsonb_build_object('enabled', new.enabled),
                       'actor_role', public.audit_actor_role(new.institution_id)));
  return null;
end $$;
revoke all on function public.feature_flags_audit() from public, anon, authenticated;

create or replace function public.platform_config_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.value is not distinct from new.value then return null; end if;
  perform public.audit_write('platform_config.updated', 'platform_config', new.key, null,
    jsonb_build_object('value', new.value,
                       'from', jsonb_build_object('value', old.value), 'to', jsonb_build_object('value', new.value),
                       'actor_role', public.audit_actor_role(null)));
  return null;
end $$;
revoke all on function public.platform_config_audit() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════ S3 / T3 account activation
alter table public.account_activation_grants add column authorized_role text;
comment on column public.account_activation_grants.authorized_role is
  'D-093 T3: the role the authorizing person acted under, recorded when the grant is written, so the audit row the '
  'Auth trigger writes when the account exists can say who authorized it and as what.';

-- 20261005120000's body, writing the grant only: the activation is audited when Auth creates the account
create or replace function public.authorize_account_activation(
  p_person uuid, p_kind text, p_email text, p_card_number text default null)
returns table (display_name text, institution_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_name text; v_inst uuid; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception 'activating an account requires CAN_PROVISION_PEOPLE in the person''s institution';
  end if;
  select p.display_name into v_name from public.persons p where p.id = p_person;
  if v_name is null then raise exception 'unknown person'; end if;
  if p_kind not in ('EMAIL', 'CLASSROOM_CARD') then
    raise exception 'an account is EMAIL or CLASSROOM_CARD, not %', p_kind;
  end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  if (p_kind = 'CLASSROOM_CARD') <> (p_card_number is not null)
     or (p_card_number is not null and p_card_number !~ '^[0-9]{10}$') then
    raise exception 'a classroom card account names its ten-digit card, and only a card account does';
  end if;
  if exists (select 1 from public.accounts a where a.person_id = p_person) then
    raise exception 'this person already has an account';
  end if;
  insert into public.account_activation_grants (email, person_id, kind, card_number, institution_id, authorized_by,
                                                authorized_role)
  values (v_email, p_person, p_kind::public.account_kind, p_card_number, v_inst, v_actor,
          public.audit_actor_role(v_inst));
  -- D-093 T3: no audit row here. This is an intention; 'account.activated' is written when the account exists.
  display_name := v_name; institution_id := v_inst; return next;
end $$;
revoke all on function public.authorize_account_activation(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.authorize_account_activation(uuid, text, text, text) to authenticated;

create or replace function public.authorize_new_person(p_display_name text, p_email text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_name text; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  if not public.is_system_admin() then
    raise exception 'creating a person outside an institution''s intake requires an active SYSTEM_ADMIN';
  end if;
  v_name := btrim(coalesce(p_display_name, ''));
  if v_name = '' or length(v_name) > 200 then raise exception 'a person needs a display name'; end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  insert into public.account_activation_grants (email, display_name, kind, authorized_by, authorized_role)
  values (v_email, v_name, 'EMAIL', v_actor, public.audit_actor_role(null));
  -- D-093 T3: no audit row here; the new person and their account are audited when Auth creates them
  return v_name;
end $$;
revoke all on function public.authorize_new_person(text, text) from public, anon, authenticated;
grant execute on function public.authorize_new_person(text, text) to authenticated;

-- 20261005120000's trigger, with the audit written where the account comes to exist
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_kind public.account_kind := 'EMAIL'; v_card text; v_env text;
        v_grant public.account_activation_grants; v_allowed boolean;
begin
  -- 1. an authorized activation: the live grant for this address, consumed once
  select g.* into v_grant from public.account_activation_grants g
   where g.email = lower(coalesce(new.email, '')) and g.consumed_at is null and g.expires_at > now()
   order by g.created_at desc limit 1
   for update;
  if v_grant.id is not null then
    update public.account_activation_grants
       set consumed_at = now(), consumed_by = new.id
     where id = v_grant.id;
    if v_grant.person_id is null then
      insert into public.persons (display_name) values (v_grant.display_name) returning id into v_person;
    else
      v_person := v_grant.person_id;
      if exists (select 1 from public.accounts a where a.person_id = v_person) then
        raise exception 'this person already has an account' using errcode = 'PR010';
      end if;
      -- an enrolment begins when the learner can attend (audited by enrollments_audit)
      update public.enrollments set status = 'ACTIVE' where person_id = v_person and status = 'PENDING';
    end if;
    insert into public.accounts (person_id, auth_user_id, kind, card_number)
    values (v_person, new.id, v_grant.kind, v_grant.card_number);
    -- D-093 T3: what happened, now that it has. Auth's transaction carries this row: a creation that fails takes it
    -- with it. The address itself is Auth's to hold, never logged here; the person who authorized it is named.
    perform public.audit_write('account.activated', 'persons', v_person::text, v_grant.institution_id,
      jsonb_build_object('person_id', v_person, 'kind', v_grant.kind, 'card_number', v_grant.card_number,
                         'new_person', v_grant.person_id is null,
                         'from', jsonb_build_object('account', null),
                         'to', jsonb_build_object('account', v_grant.kind),
                         'authorized_by', v_grant.authorized_by, 'actor_role', v_grant.authorized_role,
                         'authorized_at', v_grant.created_at, 'grant_id', v_grant.id,
                         'outcome', 'ACCOUNT_CREATED'));
    return new;
  end if;

  -- 2. anything else creates a person only where PINTAR creates its own
  --    (local fixtures, the synthetic seed off production) or on day zero.
  --    FAIL-CLOSED (NEW-1): every term is NULL-safe and the decision is
  --    `is not true`, so an input nobody set cannot admit a sign-up.
  select environment into v_env from public.platform_environment;
  v_allowed := coalesce(public.synthetic_fixtures_permitted(), false)
            or (coalesce(v_env, 'production') <> 'production'
                and coalesce(current_setting('app.seed_intent', true), '') = 'synthetic')
            or not exists (select 1 from public.role_assignments ra
                            where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                              and now() >= ra.valid_from and now() < ra.valid_until);
  if v_allowed is not true then
    raise exception 'PINTAR creates no identity from a sign-up: an institution provisions people and an administrator activates them'
      using errcode = 'PR010';
  end if;
  -- a seed writes auth.users directly and may name its person and account
  -- shape there; GoTrue never does at insert (NEW-2), so for it these are the
  -- defaults: a new person, an EMAIL account
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
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

update public.client_rpc_registry
   set note = 'Decides the activation of one provisioned person''s account and writes one single-use, minutes-long '
           || 'activation grant for the given address (a card account names its card), with the role it was '
           || 'authorized under; the service-role route then asks Auth to create the identity, which the Auth '
           || 'trigger links by consuming the grant and audits as account.activated once the account exists (D-093 T3).'
 where function_name = 'authorize_account_activation';
update public.client_rpc_registry
   set note = 'A SYSTEM_ADMIN authorizes a person no institution has provisioned yet (a school''s first '
           || 'administrator); writes an activation grant carrying the name, which the Auth trigger turns into the '
           || 'person when Auth creates the identity, and audits then (D-093 T3).'
 where function_name = 'authorize_new_person';
update public.client_rpc_registry set note = 'INV-18 audited revocation; states its reason (D-097)'
 where function_name = 'revoke_role';

-- ---------------------------------------------------------------------------
-- Verification: the shapes the remaining behaviour hangs on. The behaviour itself is F08-P10, F09-A02 and F04-T10's
-- (red on the writers before this migration, green after).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.revoke_role(uuid)') is not null
     or to_regprocedure('public.deactivate_school_node(uuid)') is not null then
    raise exception 'D-093 T2: a revocation or deactivation path without a reason still exists';
  end if;
  if not has_function_privilege('authenticated', 'public.revoke_role(uuid, text)', 'execute')
     or not has_function_privilege('authenticated', 'public.deactivate_school_node(uuid, text)', 'execute') then
    raise exception 'D-093 T2: the governed paths are no longer callable by a signed-in administrator';
  end if;
  if has_function_privilege('authenticated', 'public.audit_actor_role(uuid)', 'execute')
     or has_function_privilege('service_role', 'public.audit_actor_role(uuid)', 'execute') then
    raise exception 'D-093 T2: the actor-role helper is reachable from outside';
  end if;
  if pg_get_functiondef('public.authorize_account_activation(uuid,text,text,text)'::regprocedure) ~ 'audit_write'
     or pg_get_functiondef('public.authorize_new_person(text,text)'::regprocedure) ~ 'audit_write' then
    raise exception 'D-093 T3: an authorization still writes an audit row before any account exists';
  end if;
  if pg_get_functiondef('public.handle_new_auth_user()'::regprocedure) !~ 'account\.activated' then
    raise exception 'D-093 T3: the account''s creation is not audited where it happens';
  end if;
end $$;
