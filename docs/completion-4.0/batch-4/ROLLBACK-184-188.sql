-- ROLLBACK OF MIGRATIONS 184-188 (Batch 4), the Batch 4 promotion gate's recovery plan (condition 1).
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. It returns a database at 188 to staging's schema at 183 exactly
-- for every object 184-188 created or replaced: the four replaced functions are restored from the repository's own
-- pre-Batch-4 definitions (byte-identical to staging's, md5 of prosrc compared on 3 Nov), and the new functions, table,
-- constraint and registry rows are removed. Run as the database owner in one transaction, only on the owner's say.
--
-- It REFUSES (and changes nothing) where rolling back would lose or orphan data written after promotion:
--   * a transfer with no school year (made by the new by-name request): the old NOT NULL cannot hold it;
--   * a consumed card conversion: the account it converted stays an email account (valid at 183), but the
--     grant table holds its history, so it is kept for the owner to decide, not dropped.
-- Everything the new functions wrote elsewhere (audit rows, transfers, corrected emails, names, usernames, photos) is
-- valid under 183's schema and stays.
--
-- Tested locally on 3 Nov: applied at 188, then the four functions' md5(prosrc) equal staging's, the new objects are
-- gone, and `supabase migration up` re-applies 184-188 cleanly (Batch 4 report §6).

begin;

do $$
begin
  if exists (select 1 from public.transfers where to_academic_period_id is null) then
    raise exception 'rollback refused: a transfer has no school year (a by-name request); settle it first';
  end if;
  if exists (select 1 from public.card_conversions where consumed_at is not null) then
    raise exception 'rollback refused: card conversions were carried out; keep card_conversions and roll back the rest by hand';
  end if;
end $$;

-- 188: maintenance_list back to its unpaged form
drop function public.maintenance_list(integer, integer, uuid);
create or replace function public.maintenance_list()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_win jsonb; v_not jsonb;
begin
  -- an administrator's list: Admin platform, or a person holding Admin sekolah somewhere
  if public.current_person_id() is null
     or not (public.is_system_admin()
             or exists (select 1 from public.role_assignments ra
                         where ra.person_id = public.current_person_id() and ra.role = 'INSTITUTION_ADMIN'
                           and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  perform public.maintenance_record_edges();
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', w.id, 'jenis', w.kind, 'keadaan', public.maintenance_state(w, now()), 'platform', w.platform,
           'sekolah', (select coalesce(jsonb_agg(i.name order by i.name), '[]'::jsonb) from public.institutions i where i.id = any (w.institution_ids)),
           'mulai', w.starts_at, 'selesai', w.ends_at, 'diakhiri', w.ended_at, 'pesan', w.message, 'alasan', w.reason,
           'menguasai', public.maintenance_controls(w)) order by w.created_at desc), '[]'::jsonb)
    into v_win
    from (select * from public.maintenance_windows m
           where public.is_system_admin() or public.maintenance_controls(m)
              -- a platform-wide window reaches every school, so its admins see it (they cannot change it)
              or m.platform
           order by m.created_at desc limit 50) w;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', n.id, 'pesan', n.message, 'terbit', n.publish_at, 'sampai', n.expires_at, 'ditarik', n.withdrawn_at,
           'platform', n.platform, 'boleh', public.maintenance_may_act(n.platform, n.institution_ids))
           order by n.created_at desc), '[]'::jsonb)
    into v_not
    from (select * from public.broadcast_notices x
           where public.maintenance_may_act(x.platform, x.institution_ids)
           order by x.created_at desc limit 50) n;
  return jsonb_build_object('pemeliharaan', v_win, 'pengumuman', v_not);
end $$;
revoke all on function public.maintenance_list() from public, anon;
grant execute on function public.maintenance_list() to authenticated, service_role;
update public.client_rpc_registry set note = '#148: the windows and notices the caller may act on, newest first; records automatic '
   || 'edges as SYSTEM.' where function_name = 'maintenance_list';

-- 187: stuck sends
drop function public.email_send_stuck(integer);
delete from public.client_rpc_registry where function_name = 'email_send_stuck';

-- 186: transfers by name
create or replace function public.transfer_execute(p_transfer uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_new uuid;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then raise exception 'transfer not found'; end if;
  if t.status <> 'AUTHORIZED' then raise exception 'transfer is not AUTHORIZED'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized to execute';
  end if;
  -- receiving enrollment (new context; nothing is re-parented)
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (t.person_id, t.to_institution_id, t.to_academic_period_id, t.to_programme_id, 'ACTIVE') returning id into v_new;
  -- close the sending enrollment and its open memberships
  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = t.from_enrollment_id and valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;
  -- portable visibility for the receiving institution
  insert into public.portable_visibility (person_id, institution_id, transfer_id)
  values (t.person_id, t.to_institution_id, t.id)
  on conflict (person_id, institution_id) do update set transfer_id = excluded.transfer_id, granted_at = now();
  update public.transfers set status = 'EXECUTED', to_enrollment_id = v_new, executed_at = now() where id = p_transfer;
  return v_new;
end $$;
drop function public.cari_sekolah_tujuan(text);
drop function public.transfer_minta(uuid, uuid, text);
drop function public.pindah_masuk(uuid);
drop function public.transfer_terima(uuid, uuid, uuid);
delete from public.client_rpc_registry where function_name in ('cari_sekolah_tujuan', 'transfer_minta', 'pindah_masuk', 'transfer_terima');
alter table public.transfers drop constraint transfers_executed_has_period;
alter table public.transfers alter column to_academic_period_id set not null;

-- 185: the correction finder
drop function public.orang_berakun(text, integer, integer, uuid);
delete from public.client_rpc_registry where function_name = 'orang_berakun';

-- 184: the card conversion (the two auth.users guards back to their 183 bodies)
create or replace function public.auth_card_email_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_akun public.accounts; r public.card_reissues;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'CLASSROOM_CARD';
  if v_akun.id is null then
    return new;
  end if;
  select c.* into r from public.card_reissues c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and lower(coalesce(new.email, '')) = 'card-' || c.new_card_number || '@' || split_part(lower(coalesce(old.email, '')), '@', 2)
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_ADDRESS_REFUSED',
      message = 'a class card''s sign-in address changes only through a re-issue';
  end if;
  update public.card_reissues set consumed_at = clock_timestamp() where id = r.id;
  update public.accounts set card_number = r.new_card_number where id = v_akun.id;
  perform public.audit_write('account.card_reissued', 'persons', v_akun.person_id::text, r.institution_id,
    jsonb_build_object('person_id', v_akun.person_id, 'reason', r.reason,
                       'from', jsonb_build_object('card_number', r.old_card_number),
                       'to', jsonb_build_object('card_number', r.new_card_number),
                       'authorized_by', r.authorized_by, 'actor_role', r.authorized_role,
                       'authorized_at', r.created_at, 'reissue_id', r.id, 'outcome', 'CARD_REISSUED'));
  return new;
end $$;
create or replace function public.auth_email_correction_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_akun public.accounts; r public.email_corrections;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'EMAIL';
  if v_akun.id is null then
    return new;
  end if;
  select c.* into r from public.email_corrections c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and c.new_email = lower(btrim(coalesce(new.email, '')))
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_CHANGE_REFUSED',
      message = 'an email account''s address changes only through a governed correction (D-120 QN1)';
  end if;
  update public.email_corrections set consumed_at = clock_timestamp() where id = r.id;

  -- every outstanding code dies: a code sent to the old address must not open the account under the new one
  new.confirmation_token := '';
  new.recovery_token := '';
  new.email_change := '';
  new.email_change_token_new := '';
  new.email_change_token_current := '';
  new.reauthentication_token := '';
  delete from auth.one_time_tokens t where t.user_id = new.id;

  -- before activation, whatever was begun through the old address is undone
  if not r.activated then
    new.encrypted_password := '';
    update public.account_setup s set password_set_at = null, name_confirmed_at = null
     where s.account_id = v_akun.id and s.state = 'REQUIRED';
    update public.person_pins set reset_required = true where person_id = v_akun.person_id;
  end if;
  perform public.sesi_akhiri_orang(new.id, 'KREDENSIAL_DIGANTI');

  perform public.audit_write('identity.email_corrected', 'persons', v_akun.person_id::text, r.institution_id,
    jsonb_build_object('person_id', v_akun.person_id, 'reason', r.reason,
                       'from', jsonb_build_object('email', r.old_email),
                       'to', jsonb_build_object('email', r.new_email),
                       'activated', r.activated,
                       'authorized_by', r.authorized_by, 'actor_role', r.authorized_role,
                       'authorized_at', r.created_at, 'correction_id', r.id, 'outcome', 'EMAIL_CORRECTED'));
  return new;
end $$;
drop function public.authorize_card_conversion(uuid, text, text);
delete from public.client_rpc_registry where function_name = 'authorize_card_conversion';
drop table public.card_conversions;

delete from supabase_migrations.schema_migrations
 where version in ('20261217100000', '20261218100000', '20261219100000', '20261220100000', '20261221100000');

commit;
