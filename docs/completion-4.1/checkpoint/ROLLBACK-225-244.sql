-- ROLLBACK OF MIGRATIONS 225-244 (4.1: B0, A1, C1w and its corrections, B1, L-1, L1-F2, L1-F4, F1-R1b, B2), the staging
-- checkpoint's recovery arrangement (STAGING-CHECKPOINT-BEFORE-A2A.md; Sharon, CHECKPOINT-RUNBOOK-c51e6d47…).
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. Run as the database owner (postgres) in one transaction, only on
-- the owner's say. It returns a database at 244 to staging's schema at 224 (20270113160000) for every object 225-244
-- created, replaced or changed, and removes their 20 rows from supabase_migrations.schema_migrations, so that
-- `supabase db push` would apply them again. The physical backup remains the recovery point for data. This script is
-- the schema's way back without a restore.
--
-- HOW IT WAS MADE. The schema part (PART 3) is the difference between a local database at 244 and one at 224, built
-- from this repository's own migrations, computed with migra. It was then reviewed by hand:
--   * views are never dropped (migra drops and recreates 15). Only the two that 234 changed go back, by create or
--     replace with their columns unchanged, because the calc_* functions written as SQL bodies are bound to those views;
--   * the cron schema's own objects are left to the extension's drop.
-- The statements are grouped by the migration that first defines the object they act on, last migration first.
-- Within a group, the order is the order migra gives for dependencies. An object that several migrations changed is
-- restored to its 224 text once, in the group of the first migration that changed it. Intermediate versions are not
-- replayed.
--
-- WHAT A ROLLBACK KEEPS AND LOSES, by design (each loss is counted in a notice before it happens):
--   * LOST: the ten tables 225-244 add, with their rows:
--     - accountability_events, accountability_store, accountability_write_failures (B1: the sign-in record);
--     - attempt_requests (A1);
--     - key_corrections, key_correction_notices, assessment_result_bases, certificate_reviews (C1w);
--     - item_draft_edits (C1w);
--     - orang_lampiran (L1-F4's attachment list).
--   * LOST: the columns 225-244 add to tables that stay:
--     - assessment_sessions: attempt_request_id, closure_*, frozen_*, unfrozen_*;
--     - courses.discarded_*;
--     - items: edited_at, edited_by_person_id, revision;
--     - item_options.rationale_withdrawn_by;
--     - person_suspensions.dipegang_saat_tutup;
--     - plp_releases: replaced_*, withdrawal_reason, withdrawn_*.
--     A sitting A1 held or closed keeps its 224 status. What A1 recorded about why is lost with the columns.
--   * LOST: pg_cron (227/231) with its two jobs and their run history. The script refuses to run if cron.job holds any
--     job not named pintar-*, because that job was not this checkpoint's.
--   * LOST: the auth.users trigger pintar_kunci_tetap_jaga (L1-F2). on_auth_user_created and 224's three guards stay,
--     restored to their 224 functions.
--   * RESTORED: 238 (F1-R1b) set item_options.rationale to null where a confirmed key correction withdrew it, and kept
--     the text on key_corrections.penjelasan_dihapus. 224 requires a rationale, so PART 1 writes each withdrawn text
--     back from that record before the record is dropped. If one cannot be found, the transaction stops before anything
--     changes. The restored text is the explanation as authored for the old key: 224's behaviour, which F1-R1b
--     corrected.
--   * KEPT, deliberately: auth.users.banned_until. 233 (L-1) rewrote the old lock value 'infinity' to
--     public.akun_terkunci_sampai() (2999-12-31 23:59:59 UTC), and accounts locked since hold that instant. It is not
--     turned back into 'infinity': that value made Auth fail every request for the user (the defect 233 corrected).
--     224's akun_kunci only ever writes the lock and clears it to null on reinstatement, so the instant reads as a lock
--     under 224 and is cleared the same way. A locked account stays locked and an unlocked one stays unlocked. This is
--     the one place the script is not a literal reverse, and it is named for Sharon's ruling.
--   * KEPT: every row 225-244's functions wrote into tables that stay, through columns 224 also has:
--     - the audit rows;
--     - role assignments renewed or revoked by B0;
--     - suspensions and closures;
--     - sittings' 224 status;
--     - results and certificates;
--     - persons anonymised by hapus_data_pribadi.
--     All of them are valid 224 rows. The 224 functions read them as 224 would.
--
-- TWO LINES REQUIRED BY SHARON (CHECKPOINT-EVIDENCE-d8db82bde8d7a47e9936a34fd21686ca11adb472.md):
--   1. THE DATABASE AND THE APP GO BACK TOGETHER. This script returns staging's DATABASE to 224. Staging's app deploys
--      from main, so a 244 app on a 224 database calls functions that no longer exist. A rollback is therefore paired
--      with reverting the merge on main (the app back to 224's commit), in this order:
--        (1) revert the merge on main and wait for the app's deploy at 224's commit;
--        (2) then run this script.
--      Between the two, a 224 app meets a 244 database, as at every 4.0 promotion the other way round. Both are the
--      owner's to decide.
--   2. WHAT A ROLLBACK RE-OPENS. Under 224's code:
--        * L1-F4: an anonymised person can be reopened again (L1F4-A2), the checkpoint's own synthetic L and E
--          included;
--        * L1-F2: a suspended person's new account is created open;
--        * L1-R2: password-write permits are not deleted when an account is locked.
--      While a rollback stands, nobody approves a reopen, or creates an account for a suspended or anonymised person,
--      on staging, until 244 is applied again.
--
-- TESTED LOCALLY (evidence/rollback/ROLLBACK-225-244-local-test.txt):
--   * on an empty copy at 244: migra afterwards finds no difference from 224, privileges included, and a catalogue
--     fingerprint is identical (functions with their ACLs, owners and comments; tables, columns, constraints, triggers,
--     policies, indexes, types, extensions, schemas and default privileges; object comments);
--   * on a seeded database at 244, with a confirmed key correction that withdrew a rationale: the same, and the
--     rationale is back;
--   * then `supabase migration up --local` applies 225-244 again, and the suites run green on the round-tripped
--     database.

begin;

-- ═══════════════════════════════════════════════════════════════════════════════════════ PART 0 · refuse, then count
do $$
declare n bigint; t text;
begin
  if (select count(*) from supabase_migrations.schema_migrations where version > '20270113160000') <> 20
     or not exists (select 1 from supabase_migrations.schema_migrations where version = '20270117200000') then
    raise exception 'rollback: this database is not at 244 (it must hold exactly the 20 migrations after 20270113160000)';
  end if;
  if to_regclass('cron.job') is not null then
    execute $q$select count(*) from cron.job where jobname is null or jobname not like 'pintar-%'$q$ into n;
    if n > 0 then
      raise exception 'rollback: cron.job holds % job(s) not named pintar-*; pg_cron is not this checkpoint''s alone, stop', n;
    end if;
  end if;
  foreach t in array array['accountability_events', 'accountability_store', 'accountability_write_failures',
                           'attempt_requests', 'key_corrections', 'key_correction_notices', 'assessment_result_bases',
                           'certificate_reviews', 'item_draft_edits', 'orang_lampiran'] loop
    execute format('select count(*) from public.%I', t) into n;
    raise notice 'rollback: % holds % row(s); they are dropped with it', t, n;
  end loop;
  raise notice 'rollback: % sitting(s) carry A1''s closure or hold record; those columns are dropped',
    (select count(*) from public.assessment_sessions where closure_kind is not null or frozen_at is not null);
  raise notice 'rollback: % option(s) carry a rationale F1-R1b withdrew; PART 1 writes each back',
    (select count(*) from public.item_options where rationale_withdrawn_by is not null);
end $$;

-- ═══════════════════════════════════════════════════════ PART 1 · the data 225-244 wrote, last migration first
-- 238 (F1-R1b): each withdrawn rationale and misconception code back from the correction's record. The sealed-content
-- guards are paused for this one statement only (224's guards and 238's are the table's user triggers).
alter table public.item_options disable trigger user;
update public.item_options o
   set rationale = x ->> 'rationale', misconception_code = x ->> 'misconception_code', rationale_withdrawn_by = null
  from public.key_corrections k, jsonb_array_elements(k.penjelasan_dihapus) x
 where o.rationale_withdrawn_by = k.id and x ->> 'label' = o.label;
alter table public.item_options enable trigger user;
do $$
begin
  if exists (select 1 from public.item_options where rationale is null or btrim(rationale) = '') then
    raise exception 'rollback: % option(s) have no rationale and none on record to write back; 224 refuses them, stop',
      (select count(*) from public.item_options where rationale is null or btrim(rationale) = '');
  end if;
end $$;

-- 239, 230, 229, 228, 226, 225: the RPC registry rows they declared, and the one they restated
delete from public.client_rpc_registry where function_name in (
  'ajukan_koreksi_kunci', 'akhiri_pengerjaan', 'akuntabilitas_baca', 'akuntabilitas_gagal_ringkas', 
  'akuntabilitas_sejak', 'buang_draf', 'catat_penolakan_peran', 'daftar_pengerjaan', 'hapus_soal_draf', 
  'hasil_belajar_sesi_saya', 'hasil_koreksi_saya', 'keadaan_terbitan', 'koreksi_kunci_antrean', 
  'koreksi_kunci_dampak', 'koreksi_kunci_terakhir', 'lanjutkan_pengerjaan', 'minta_percobaan', 
  'pemberitahuan_koreksi_kunci', 'pengerjaan_saya', 'peran_akan_berakhir', 'peran_pemegang_terakhir', 
  'percobaan_antrean', 'percobaan_saya', 'perpanjang_peran', 'pratinjau_koreksi_kunci', 'putuskan_percobaan', 
  'putuskan_tinjauan_sertifikat', 'revisi_soal', 'riwayat_hasil_sesi', 'riwayat_soal', 
  'sertifikat_saya_ditinjau', 'suntingan_draf', 'tambah_soal_draf', 'tambah_waktu_pengerjaan', 
  'tegaskan_koreksi_kunci', 'tinjauan_sertifikat_antrean', 'tinjauan_sertifikat_dikonfirmasi', 
  'tolak_koreksi_kunci', 'tutup_pengerjaan_ditahan', 'ubah_jadwal_penugasan', 'ubah_soal_draf', 
  'unggah_menimpa_suntingan');
update public.client_rpc_registry
   set exposure = 'STAFF', note = 'CAN_ASSIGN_LEARNING; bounded and audited, no silent extension',
       authorization_kind = 'CAPABILITY', authorization_requirement = 'CAN_ASSIGN_LEARNING'
 where function_name = 'extend_session_deadline';

-- 229, 228, 226: the record classes of the tables they add (dropped in PART 3)
delete from public.record_class_registry where table_name in ('assessment_result_bases', 'attempt_requests',
  'certificate_reviews', 'item_draft_edits', 'key_correction_notices', 'key_corrections');

-- 228: an edited VALIDATED draft goes back to STRUCTURED (the draft editor's transition)
delete from public.content_status_transitions where from_status = 'VALIDATED' and to_status = 'STRUCTURED';

-- 231 and 227: the scheduled jobs go with the extension (PART 3, 227). 230 and 237's rows go with their tables.

-- ═══════════════════════════════════════════════════════ PART 2 · the migration history
delete from supabase_migrations.schema_migrations where version in (
  '20270113170000', '20270114100000', '20270114110000', '20270115100000', '20270115110000', '20270116100000', 
  '20270116110000', '20270116120000', '20270116130000', '20270117100000', '20270117110000', '20270117120000', 
  '20270117130000', '20270117140000', '20270117150000', '20270117160000', '20270117170000', '20270117180000', 
  '20270117190000', '20270117200000');

-- ═══════════════════════════════════════════════════════ PART 3 · the schema, last migration first
set local check_function_bodies = off;

-- ==============================================================================================================
-- 244 · 20270117200000_an_anonymised_person_is_never_reopened: 3 statement(s)

CREATE OR REPLACE FUNCTION public.aktifkan_kembali_akun(p_person uuid, p_alasan text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid := public.current_person_id(); v_alasan text := btrim(coalesce(p_alasan, '')); v_s public.person_suspensions;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  select * into v_s from public.person_suspensions s where s.person_id = p_person and s.ended_at is null for update;
  if v_s.id is null then perform public.akun_tolak('ACCOUNT_NOT_SUSPENDED'); end if;
  -- CORRECTED IN PLACE (undeployed; owner ruling 2): a closure at the person's request is undone only from their
  -- request to reopen, after identity verification (buka_kembali_akun); this lifts a suspension
  if v_s.category = 'CLOSED_AT_REQUEST' then perform public.akun_tolak('ACCOUNT_REOPEN_VIA_REQUEST'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED'); end if;
  update public.person_suspensions set ended_at = now(), ended_by = v_actor, end_reason = v_alasan where id = v_s.id;
  perform public.akun_kunci(p_person, false);
  perform public.audit_write(case when v_s.category = 'CLOSED_AT_REQUEST' then 'account.reopened' else 'account.reactivated' end,
    'persons', p_person::text, null,
    jsonb_build_object('person_id', p_person, 'reason', v_alasan, 'from', jsonb_build_object('category', v_s.category),
                       'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.buka_kembali_akun(p_request uuid, p_cara_verifikasi text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid := public.current_person_id(); v_cara text := btrim(coalesce(p_cara_verifikasi, ''));
        r public.account_requests; v_s public.person_suspensions; v_peran jsonb;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  select * into r from public.account_requests q where q.id = p_request for update;
  if r.id is null or r.kind <> 'REOPEN' or r.status not in ('RECEIVED', 'IN_PROGRESS') then perform public.akun_tolak('ACCOUNT_REQUEST_INVALID'); end if;
  if r.person_id = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  select * into v_s from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null for update;
  if v_s.id is null or v_s.category <> 'CLOSED_AT_REQUEST' then perform public.akun_tolak('ACCOUNT_NOT_CLOSED'); end if;
  if char_length(v_cara) < 10 or char_length(v_cara) > 300 then perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED'); end if;
  update public.person_suspensions set ended_at = now(), ended_by = v_actor, end_reason = v_cara where id = v_s.id;
  -- the owner (9 Nov): reopening restores signing in, never a former authority. Any school role still live from before
  -- the closure ends now, each through the role guard and its own role.revoked row; a school gives it again if it
  -- still applies. (A person holding a platform role cannot have closed their account: ACCOUNT_PLATFORM_ROLE.)
  select coalesce(jsonb_agg(jsonb_build_object('id', ra.id, 'role', ra.role, 'scope_node_id', ra.scope_node_id) order by ra.id), '[]')
    into v_peran from public.role_assignments ra
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  update public.role_assignments ra set revoked_at = now(), revoked_by = v_actor,
         revoked_reason = 'Akun dibuka kembali: peran dari sebelum akun ditutup tidak dipulihkan'
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  perform public.akun_kunci(r.person_id, false);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(), decision_note = v_cara where id = r.id;
  perform public.audit_write('account.reopened', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'reason', v_cara, 'identity_verified', true, 'roles_ended', v_peran,
                       'from', jsonb_build_object('category', v_s.category), 'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true);
end $function$
;

CREATE OR REPLACE FUNCTION public.minta_buka_kembali(p_identitas text, p_pesan text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id text := lower(btrim(coalesce(p_identitas, ''))); v_pesan text := btrim(coalesce(p_pesan, '')); v_person uuid; v_req uuid;
begin
  -- depends only on what was typed, never on an account
  if v_id = '' or char_length(v_id) > 254 or char_length(v_pesan) < 10 or char_length(v_pesan) > 500 then
    return jsonb_build_object('ok', false, 'kode', 'ACCOUNT_NOTE_REQUIRED');
  end if;
  select p.id into v_person from public.persons p where lower(p.pintar_id) = v_id;
  if v_person is null then
    select a.person_id into v_person from public.accounts a join auth.users u on u.id = a.auth_user_id
     where lower(u.email) = v_id and a.kind = 'EMAIL' limit 1;
  end if;
  -- CORRECTED IN PLACE (undeployed; Daisy at 435a2856, §2.4): what signing in takes, the username too (signin_resolve)
  if v_person is null then
    select pu.person_id into v_person from public.person_usernames pu where pu.username = v_id;
  end if;
  if v_person is not null
     and exists (select 1 from public.person_suspensions s where s.person_id = v_person and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST')
     and not exists (select 1 from public.account_requests q where q.person_id = v_person and q.kind = 'REOPEN' and q.status in ('RECEIVED', 'IN_PROGRESS')) then
    insert into public.account_requests (person_id, kind, pesan) values (v_person, 'REOPEN', v_pesan) returning id into v_req;
    perform public.audit_write('account.reopen_requested', 'persons', v_person::text, null,
      jsonb_build_object('person_id', v_person, 'request_id', v_req));
  end if;
  return jsonb_build_object('ok', true);
end $function$
;

-- ==============================================================================================================
-- 243 · 20270117190000_the_person_row_is_locked_before_the_account_rows: 3 statement(s)

CREATE OR REPLACE FUNCTION public.authorize_card_conversion(p_person uuid, p_email text, p_reason text)
 RETURNS TABLE(auth_user_id uuid, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
#variable_conflict use_column
declare
  v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'converting a class card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 10 and 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a conversion says why (10 to 500 characters)';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'not an email address';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to convert';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email)
     or exists (select 1 from public.card_conversions c where c.new_email = v_email
                   and c.consumed_at is null and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address is already an account''s';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_conversions c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.card_conversions (person_id, account_id, old_card_number, new_email, reason, institution_id,
                                       authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, v_email, btrim(p_reason), v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. 'account.card_converted_to_email' is written when Auth moves the address.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.authorize_card_reissue(p_person uuid, p_reason text, p_new_card text)
 RETURNS TABLE(auth_user_id uuid, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501', message = 're-issuing a card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if p_reason is null or p_reason not in ('HILANG', 'RUSAK') then
    raise exception using errcode = 'PR040', detail = 'REASON_INVALID', message = 'a re-issue says why: HILANG or RUSAK';
  end if;
  if p_new_card is null or p_new_card !~ '^[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'authorize_card_reissue: a ten-digit card number';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to re-issue';
  end if;
  -- CR-91 (D-145(a)): never a card for a person who holds a staff role (the account invariant should make this
  -- unreachable; it is refused here by name all the same)
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role (CR-91)';
  end if;
  if exists (select 1 from public.accounts a where a.card_number = p_new_card)
     or exists (select 1 from public.card_reissues r where r.new_card_number = p_new_card
                   and r.consumed_at is null and r.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'CARD_NUMBER_TAKEN', message = 'that card number is taken';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_reissues r where r.account_id = v_akun.id and r.consumed_at is null;
  insert into public.card_reissues (person_id, account_id, old_card_number, new_card_number, reason, institution_id,
                                    authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, p_new_card, p_reason, v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_akun.auth_user_id, 'CARD_REISSUE', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  -- D-093 T3: no audit row here. This is an intention; 'account.card_reissued' is written when Auth moves the card.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.authorize_email_correction(p_person uuid, p_email text, p_reason text)
 RETURNS TABLE(auth_user_id uuid, old_email text, activated boolean, pintar_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_lama text;
        v_baru text := lower(btrim(coalesce(p_email, ''))); v_alasan text := btrim(coalesce(p_reason, ''));
        v_aktif boolean; v_id text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'correcting an email requires CAN_PROVISION_PEOPLE in the person''s school, or the platform administrator';
  end if;
  select a.* into v_akun from public.accounts a
   where a.person_id = p_person and a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
   for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_ACCOUNT_NOT_FOUND', message = 'this person has no email account';
  end if;
  -- activated: anything but a set-up still REQUIRED (an account without a set-up row was never activated by the wizard
  -- and is treated as the credential channel it is)
  v_aktif := not exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED');
  if v_aktif and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'after activation an email is corrected by the platform administrator only (D-120 QN1)';
  end if;
  if v_alasan = '' or length(v_alasan) > 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a correction states its reason (1 to 500 characters)';
  end if;
  if v_baru !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_baru) > 254 or v_baru ~ '^card-[0-9]{10}@' then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'that is not an email address a person can be given';
  end if;
  select lower(u.email) into v_lama from auth.users u where u.id = v_akun.auth_user_id;
  if v_baru = v_lama then
    raise exception using errcode = 'PR040', detail = 'EMAIL_UNCHANGED', message = 'that is already the person''s email';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_baru)
     or exists (select 1 from public.email_corrections c where c.new_email = v_baru and c.consumed_at is null
                   and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id)
     or exists (select 1 from public.account_activation_grants g where g.email = v_baru and g.consumed_at is null
                   and g.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address belongs to another account';
  end if;
  select p.pintar_id into v_id from public.persons p where p.id = p_person;
  delete from public.email_corrections c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.email_corrections (person_id, account_id, old_email, new_email, activated, reason, institution_id,
                                        authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_lama, v_baru, v_aktif, v_alasan, v_inst, v_actor, public.audit_actor_role(v_inst),
          clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. This is an intention; 'identity.email_corrected' is written when Auth moves it.
  auth_user_id := v_akun.auth_user_id; old_email := v_lama; activated := v_aktif; pintar_id := v_id; return next;
end;
$function$
;

-- ==============================================================================================================
-- 242 · 20270117180000_the_teachers_marker_counts_the_answers_in_its_view: 0 statement(s)

-- ==============================================================================================================
-- 241 · 20270117170000_a_closure_records_what_it_held: 6 statement(s)

drop trigger if exists "_l1f4_dipegang_saat_tutup_sekali" on "public"."person_suspensions";

alter table "public"."person_suspensions" drop constraint "person_suspensions_dipegang_hanya_tutup";

drop function if exists "public"."dipegang_saat_tutup_jaga"();

drop function if exists "public"."orang_dipegang"(p_person uuid);

alter table "public"."person_suspensions" drop column "dipegang_saat_tutup";

CREATE OR REPLACE FUNCTION public.minta_akun(p_kind text, p_konfirmasi boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid := public.current_person_id(); v_id uuid; v_n int;
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
    insert into public.account_requests (person_id, kind, status, decided_by, decided_at) values (v_me, 'CLOSE', 'DONE', v_me, now())
    returning id into v_id;
    insert into public.person_suspensions (person_id, category, started_by) values (v_me, 'CLOSED_AT_REQUEST', v_me);
    perform public.audit_write('account.closed_at_request', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id, 'reason_code', 'CLOSED_AT_REQUEST'));
    v_n := public.akun_kunci(v_me, true);
  else
    insert into public.account_requests (person_id, kind) values (v_me, 'DELETE_PERSONAL_DATA') returning id into v_id;
    perform public.audit_write('account.deletion_requested', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id));
  end if;
  return jsonb_build_object('ok', true, 'permintaan', v_id);
end $function$
;

-- ==============================================================================================================
-- 240 · 20270117160000_a_suspension_covers_the_accounts_made_after_it: 4 statement(s)

drop trigger if exists "pintar_kunci_tetap_jaga" on "auth"."users";

drop trigger if exists "_l1f2_accounts_terkunci" on "public"."accounts";

drop function if exists "public"."akun_baru_terkunci"();

drop function if exists "public"."kunci_tetap_jaga"();

-- ==============================================================================================================
-- 239 · 20270117150000_a_printed_report_is_owned_by_the_schools_whose_evidence_it_shows: 4 statement(s)

drop function if exists "public"."akuntabilitas_gagal_ringkas"();

drop function if exists "public"."hasil_belajar_sekolah"(p_person uuid);

drop function if exists "public"."hasil_belajar_sesi_orang"(p_person uuid);

drop function if exists "public"."hasil_belajar_sesi_saya"();

-- ==============================================================================================================
-- 238 · 20270117140000_a_key_correction_withdraws_the_explanations_it_makes_stale: 10 statement(s)

drop trigger if exists "_f1r1b_item_options_alasan" on "public"."item_options";

drop trigger if exists "_f1r1b_items_penjelasan_terutang" on "public"."items";

alter table "public"."item_options" drop constraint "item_options_rationale_inv03";

alter table "public"."item_options" drop constraint "item_options_rationale_withdrawn_by_fkey";

drop function if exists "public"."alasan_ditarik_jaga"();

drop function if exists "public"."penjelasan_terutang_jaga"();

alter table "public"."item_options" drop column "rationale_withdrawn_by";

alter table "public"."item_options" alter column "rationale" set not null;

alter table "public"."item_options" add constraint "item_options_rationale_check" CHECK ((btrim(rationale) <> ''::text)) not valid;

alter table "public"."item_options" validate constraint "item_options_rationale_check";

-- ==============================================================================================================
-- 237 · 20270117130000_an_anonymised_person_is_given_nothing_new: 45 statement(s)

drop trigger if exists "_l1f4_account_activation_grants_person_id" on "public"."account_activation_grants";

drop trigger if exists "_l1f4_account_requests_person_id" on "public"."account_requests";

drop trigger if exists "_l1f4_accounts_person_id" on "public"."accounts";

drop trigger if exists "_l1f4_assessment_sessions_person_id" on "public"."assessment_sessions";

drop trigger if exists "_l1f4_attempt_requests_person_id" on "public"."attempt_requests";

drop trigger if exists "_l1f4_card_conversions_person_id" on "public"."card_conversions";

drop trigger if exists "_l1f4_card_reissues_person_id" on "public"."card_reissues";

drop trigger if exists "_l1f4_certificate_identity_snapshots_person_id" on "public"."certificate_identity_snapshots";

drop trigger if exists "_l1f4_certificates_person_id" on "public"."certificates";

drop trigger if exists "_l1f4_email_corrections_person_id" on "public"."email_corrections";

drop trigger if exists "_l1f4_enrollments_person_id" on "public"."enrollments";

drop trigger if exists "_l1f4_evaluation_evaluators_person_id" on "public"."evaluation_evaluators";

drop trigger if exists "_l1f4_evaluation_personas_person_id" on "public"."evaluation_personas";

drop trigger if exists "_l1f4_feedback_cycles_subject_person_id" on "public"."feedback_cycles";

drop trigger if exists "_l1f4_feedback_opportunities_person_id" on "public"."feedback_opportunities";

drop trigger if exists "_l1f4_institutional_identities_person_id" on "public"."institutional_identities";

drop trigger if exists "_l1f4_lesson_progress_person_id" on "public"."lesson_progress";

drop trigger if exists "_l1f4_lesson_review_requests_person_id" on "public"."lesson_review_requests";

drop trigger if exists "_l1f4_management_decisions_subject_person_id" on "public"."management_decisions";

drop trigger if exists "_l1f4_memberships_enrollment_id" on "public"."memberships";

drop trigger if exists "_l1f4_password_recovery_grants_auth_user_id" on "public"."password_recovery_grants";

drop trigger if exists "_l1f4_password_write_permits_auth_user_id" on "public"."password_write_permits";

drop trigger if exists "_l1f4_person_pins_person_id" on "public"."person_pins";

drop trigger if exists "_l1f4_person_pins_retired_person_id" on "public"."person_pins_retired";

drop trigger if exists "_l1f4_person_tour_state_person_id" on "public"."person_tour_state";

drop trigger if exists "_l1f4_person_usernames_person_id" on "public"."person_usernames";

drop trigger if exists "_l1f4_platform_bootstrap_person_id" on "public"."platform_bootstrap";

drop trigger if exists "_l1f4_portable_visibility_person_id" on "public"."portable_visibility";

drop trigger if exists "_l1f4_role_assignments_person_id" on "public"."role_assignments";

drop trigger if exists "_l1f4_support_reports_reporter_person_id" on "public"."support_reports";

drop trigger if exists "_l1f4_transfers_person_id" on "public"."transfers";

alter table "public"."orang_lampiran" drop constraint "orang_lampiran_alasan_check";

alter table "public"."orang_lampiran" drop constraint "orang_lampiran_kelas_check";

alter table "public"."orang_lampiran" drop constraint "orang_lampiran_lewat_check";

drop function if exists "public"."orang_dianonimkan"(p_person uuid);

drop function if exists "public"."orang_lampiran_jaga"();

alter table "public"."orang_lampiran" drop constraint "orang_lampiran_pkey";

drop index if exists "public"."orang_lampiran_pkey";

drop table "public"."orang_lampiran";

CREATE OR REPLACE FUNCTION public.akun_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
      -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 5 on 6faef690)
      when 'ACCOUNT_PLATFORM_ROLE'      then 'a person holding a platform role does not close their own account'
      -- owner ruling 2 (9 Nov)
      when 'ACCOUNT_REOPEN_VIA_REQUEST' then 'a closed account is reopened only from its request, after identity verification'
      else 'the account could not be changed' end;
end $function$
;

CREATE OR REPLACE FUNCTION public.daftarkan_kembali(p_person uuid, p_institution uuid, p_kind text, p_reason text, p_kelas uuid, p_enrollment uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_reason text := nullif(btrim(coalesce(p_reason, '')), ''); old record; v_period uuid; v_prog uuid;
        v_kelas uuid; k record; v_new uuid; v_status public.enrollment_status; v_corrects uuid;
begin
  if p_person is null or p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    raise exception using errcode = '42501',
      message = 're-enrolling a learner needs INSTITUTION_ADMIN of the school they come back to';
  end if;
  if p_kind is null or p_kind not in ('CORRECTION', 'RETURN') then
    raise exception using errcode = 'PR070', detail = 'ENROL_KIND_INVALID',
      message = 'a re-enrolment is a correction of a mistaken ending or a return';
  end if;
  if v_reason is null or char_length(v_reason) > 300 then
    raise exception using errcode = 'PR070', detail = 'ENROL_REASON_REQUIRED', message = 'a reason of at most 300 characters is required';
  end if;
  -- the person's row serialises this against a transfer, a new number or another re-enrolment of them
  perform 1 from public.persons where persons.id = p_person for update;
  -- recorded at this school: its number, or an enrolment there (both kinds need an earlier enrolment here anyway)
  if not exists (select 1 from public.institutional_identities ii
                  where ii.person_id = p_person and ii.institution_id = p_institution)
     and not exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution) then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_THIS_SCHOOL', message = 'this person is not recorded at this school';
  end if;
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = 'PR070', detail = 'PLACE_STAFF', message = 'a person holding a staff role is not enrolled as a learner';
  end if;

  if p_kind = 'CORRECTION' then
    select e.id, e.status, e.academic_period_id, e.programme_id, e.created_at, ap.ends_on into old
      from public.enrollments e left join public.academic_periods ap on ap.id = e.academic_period_id
     where e.id = p_enrollment and e.person_id = p_person and e.institution_id = p_institution;
    if old.id is null then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_CORRECTABLE', message = 'no such enrolment of this learner at this school';
    end if;
    if old.status <> 'ENDED' then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_ENDED', message = 'this enrolment has not ended; there is nothing to correct';
    end if;
    -- CORRECTED IN PLACE (undeployed; Sharon F5): a correction reopens the ending's own year, so it is offered only
    -- while that year runs; after it the learner comes back as a RETURN, into a Kelas of the year they return to
    if old.ends_on is not null and old.ends_on < public.hari_sekolah(p_institution) then
      raise exception using errcode = 'PR070', detail = 'ENROL_YEAR_CLOSED',
        message = 'the school year of this ending has closed; the learner comes back as a return';
    end if;
  end if;
  if exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id <> p_institution
               and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR070', detail = 'PLACE_ELSEWHERE',
      message = 'this learner is enrolled at another school; they come back through a transfer';
  end if;
  if exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
               and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR070', detail = 'ENROL_ALREADY_LIVE', message = 'this learner is already enrolled at this school';
  end if;

  if p_kind = 'CORRECTION' then
    -- only an ending this function recorded, not yet corrected, and still the person's latest enrolment here
    if not exists (select 1 from public.audit_log a where a.target_table = 'enrollments' and a.target_id = old.id::text
                     and a.action = 'enrollment.ended_with_reason')
       or exists (select 1 from public.audit_log a where a.action = 'enrollment.reopened' and a.summary ->> 'corrects' = old.id::text)
       or exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
                    and e.id <> old.id and e.created_at > old.created_at) then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_CORRECTABLE',
        message = 'only the latest ending recorded with a reason at this school, not yet corrected, can be corrected';
    end if;
    v_period := old.academic_period_id; v_prog := old.programme_id; v_corrects := old.id;
    -- the same Kelas, where it is still active
    select m.node_id into v_kelas from public.memberships m join public.org_nodes n on n.id = m.node_id
     where m.enrollment_id = old.id and m.close_reason = 'ENROLLMENT_ENDED' and n.kind = 'CLASS' and n.is_active
     order by m.valid_to desc nulls last limit 1;
    if p_kelas is not null then v_kelas := p_kelas; end if;
  else
    if not public.murid_sudah_keluar(p_person, p_institution) then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_DEPARTED',
        message = 'this person has never been enrolled at this school; they are placed, not re-enrolled';
    end if;
    if p_kelas is null then
      raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a returning learner is placed in an active Kelas';
    end if;
    v_kelas := p_kelas;
    -- the year of the chosen Kelas; its programme below. CORRECTED IN PLACE (Sharon F4): the fallback programme is
    -- that of their latest enrolment here that was not cancelled
    select e.programme_id into v_prog from public.enrollments e
     where e.person_id = p_person and e.institution_id = p_institution and e.status <> 'CANCELLED'
     order by e.created_at desc limit 1;
  end if;

  if v_kelas is not null then
    select n.id, n.kind, n.is_active, n.institution_id, n.academic_period_id, n.member_kind, n.jalur into k
      from public.org_nodes n where n.id = v_kelas;
    if k.id is null or k.kind <> 'CLASS' or not k.is_active or k.institution_id <> p_institution
       or coalesce(k.member_kind, 'LEARNER') <> 'LEARNER'
       or (p_kind = 'CORRECTION' and k.academic_period_id is distinct from v_period) then
      raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a learner is placed in an active Kelas of this school';
    end if;
    if p_kind = 'RETURN' then v_period := k.academic_period_id; end if;
    -- CORRECTED IN PLACE (undeployed; Sharon F4): the learner's programme is the one the Kelas sits under, where it
    -- sits under one (a return, or a correction into a Kelas the administrator chose)
    if p_kind = 'RETURN' or p_kelas is not null then
      v_prog := coalesce((select p.id from public.org_nodes p where p.id = any(k.jalur) and p.kind = 'PROGRAMME'
                           order by array_position(k.jalur, p.id) desc limit 1), v_prog);
    end if;
  end if;
  if v_period is null then
    raise exception using errcode = 'PR070', detail = 'PLACE_NO_YEAR', message = 'the school has no academic year for this Kelas';
  end if;

  -- ACTIVE once the person has activated an account, as an imported learner becomes; PENDING until then
  v_status := case when exists (select 1 from public.accounts a where a.person_id = p_person
                                  and not exists (select 1 from public.account_setup st
                                                   where st.account_id = a.id and st.state = 'REQUIRED'))
                   then 'ACTIVE' else 'PENDING' end;
  begin
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_person, p_institution, v_period, v_prog, v_status) returning id into v_new;
  exception when unique_violation then
    raise exception using errcode = 'PR070', detail = 'ENROL_ALREADY_LIVE', message = 'this learner is already enrolled at this school';
  end;
  if v_kelas is not null then
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_new, v_kelas, v_period);
  end if;

  perform public.audit_write('enrollment.reopened', 'enrollments', v_new::text, p_institution,
    jsonb_build_object('person_id', p_person, 'kind', p_kind, 'reason', v_reason, 'corrects', v_corrects, 'node_id', v_kelas,
                       'academic_period_id', v_period));
  return v_new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.import_row_problems(p_institution uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_bad jsonb := '[]'::jsonb; v_name text; v_node uuid; v_role text; v_person uuid;
        v_kind public.org_kind; v_active boolean;
begin
  v_name := btrim(coalesce(p_payload ->> 'display_name', ''));
  begin v_node := nullif(p_payload ->> 'node_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('node_id is not a uuid'::text); end;
  begin v_person := nullif(p_payload ->> 'person_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('person_id is not a uuid'::text); end;
  v_role := nullif(p_payload ->> 'role', '');

  if v_name = '' or length(v_name) > 200 then
    v_bad := v_bad || to_jsonb('display_name is missing or too long'::text);
  end if;

  -- An existing person may be named only if this caller can already see them;
  -- otherwise a uuid probe becomes an existence oracle. NO MATCHING IS DONE:
  -- PINTAR never decides on its own that two people at two schools are one
  -- person, and this is the line where that temptation would live.
  if v_person is not null then
    if not exists (select 1 from public.persons p where p.id = v_person)
       or not public.person_visible_to_me(v_person) then
      v_bad := v_bad || to_jsonb('person_id is not a person you may name'::text);
    elsif exists (select 1 from public.institutional_identities ii
                   where ii.person_id = v_person and ii.institution_id = p_institution) then
      v_bad := v_bad || to_jsonb('this person already holds an institutional identity here'::text);
    end if;
  end if;

  if v_node is not null then
    select n.kind, n.is_active into v_kind, v_active from public.org_nodes n
     where n.id = v_node and n.institution_id = p_institution;
    if v_kind is null then
      v_bad := v_bad || to_jsonb('node_id is not an organizational node of this institution'::text);
    elsif not public.can_on_node('CAN_PROVISION_PEOPLE', v_node) then
      v_bad := v_bad || to_jsonb('node_id is outside your provisioning scope'::text);
    elsif (v_role is null or v_role = 'STUDENT')
          and (v_kind not in ('CLASS', 'COHORT') or not v_active) then
      -- M5a. A learner is placed through a membership, and a membership
      -- exists only in a Kelas or a Tingkat. Said here, before anything is
      -- provisioned, instead of by a database sentence at provisioning.
      v_bad := v_bad || to_jsonb('a learner is placed in an active Kelas or Tingkat'::text);
    end if;
  end if;

  if v_role is not null then
    if not exists (select 1 from unnest(enum_range(null::public.app_role)) e where e::text = v_role) then
      v_bad := v_bad || to_jsonb('role is not a role this platform has'::text);
    elsif v_role in ('SYSTEM_ADMIN', 'INSTITUTION_ADMIN') then
      v_bad := v_bad || to_jsonb('this role is not granted by bulk provisioning'::text);
    elsif v_role <> 'STUDENT' then
      -- BOB-10 (M5b, interim). Recording a staff row takes the learner's path
      -- first: a row with a place is enrolled there and made a member before
      -- its role is granted. In a Kelas that turns a teacher into a student of
      -- the class; in a Bagian the membership is refused at recording with
      -- the database's own words. Until the intake has a staff path, a staff
      -- row is refused here, before anything exists, with a reason.
      v_bad := v_bad || to_jsonb('a staff row is not recorded by the bulk intake yet'::text);
    elsif v_node is null then
      v_bad := v_bad || to_jsonb('a role needs an organizational node to be scoped to'::text);
    end if;
  end if;
  return v_bad;
end $function$
;

CREATE OR REPLACE FUNCTION public.murid_keluar(p_sekolah uuid)
 RETURNS TABLE(person_id uuid, display_name text, institutional_id text, enrollment_id uuid, end_reason text, ended_at timestamp with time zone, reason_code text, bisa_dikoreksi boolean, di_sekolah_lain boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if p_sekolah is null or not public.has_scope('INSTITUTION_ADMIN', p_sekolah) then
    raise exception using errcode = '42501', message = 'the learners who left a school are its INSTITUTION_ADMIN''s to read';
  end if;
  return query
  select p.id, p.display_name, ii.institutional_id, e.id, e.end_reason::text, e.valid_to,
         (select a.summary ->> 'reason_code' from public.audit_log a where a.target_table = 'enrollments'
           and a.target_id = e.id::text and a.action = 'enrollment.ended_with_reason' order by a.at desc limit 1),
         exists (select 1 from public.audit_log a where a.target_table = 'enrollments' and a.target_id = e.id::text
                   and a.action = 'enrollment.ended_with_reason')
           and not exists (select 1 from public.audit_log a where a.action = 'enrollment.reopened' and a.summary ->> 'corrects' = e.id::text)
           -- CORRECTED IN PLACE (undeployed; Sharon F5): only while the ending's school year runs
           and coalesce((select ap.ends_on from public.academic_periods ap where ap.id = e.academic_period_id)
                          >= public.hari_sekolah(p_sekolah), true),
         exists (select 1 from public.enrollments x where x.person_id = p.id and x.institution_id <> p_sekolah
                   and x.status in ('PENDING', 'ACTIVE'))
    from public.persons p
    join lateral (select e2.* from public.enrollments e2 where e2.person_id = p.id and e2.institution_id = p_sekolah
                   order by e2.created_at desc limit 1) e on true
    left join public.institutional_identities ii on ii.person_id = p.id and ii.institution_id = p_sekolah
   where public.murid_sudah_keluar(p.id, p_sekolah)
     and not public.memegang_peran_staf(p.id)
   order by e.valid_to desc nulls last, p.display_name
   limit 200;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sertifikat_koreksi_siapkan(p_certificate uuid, p_reason text, p_key_version smallint)
 RETURNS TABLE(certificate_id uuid, canonical_payload jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor uuid; v_c public.certificates; v_person public.persons; v_alasan text := btrim(coalesce(p_reason, ''));
  v_nama text; k record; v_seq integer; v_num text; v_token text; v_iso text; v_payload jsonb; v_snap uuid;
  v_snaphash text; v_id uuid; v_pending public.certificates;
begin
  v_actor := public.current_person_id();
  select * into v_c from public.certificates where id = p_certificate for update;
  if v_actor is null or v_c.id is null or not public.can_in_institution('CAN_PUBLISH', v_c.institution_id) then
    perform public.sertifikat_koreksi_tolak('CERT_NOT_ALLOWED');
  end if;
  if v_c.status <> 'ISSUED' then perform public.sertifikat_koreksi_tolak('CERT_NOT_ISSUED'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.sertifikat_koreksi_tolak('CERT_REASON_REQUIRED'); end if;
  if p_key_version is null or p_key_version < 1 then perform public.sertifikat_koreksi_tolak('CERT_KEY_INVALID'); end if;
  select s.name_as_issued into v_nama from public.certificate_identity_snapshots s where s.id = v_c.snapshot_id;
  select * into k from public.sertifikat_koreksi_kini(p_certificate);
  if not (v_nama is distinct from k.nama or v_c.institution_as_issued is distinct from k.sekolah
          or v_c.course_title_as_issued is distinct from k.kursus or v_c.course_subject_as_issued is distinct from k.mapel) then
    perform public.sertifikat_koreksi_tolak('CERT_NOTHING_CHANGED');
  end if;

  -- the holder's sequence, as at issuance (certificate_prepare): one preparation at a time per holder
  insert into public.certificate_number_counters (person_id) values (v_c.person_id) on conflict (person_id) do nothing;
  select cn.last_sequence into v_seq from public.certificate_number_counters cn where cn.person_id = v_c.person_id for update;

  -- a replacement already prepared for this key and the same reason is the one to sign (a second press, or a retry
  -- after the signature failed): nothing new is numbered. CORRECTED IN PLACE (Sharon §14): there is at most one
  -- pending replacement per certificate; another reason, actor or key re-prepares that one in place, its number and
  -- token kept, below
  select * into v_pending from public.certificates n
   where n.supersedes_certificate_id = v_c.id and n.status = 'ELIGIBLE'
   order by n.created_at desc limit 1;
  if v_pending.id is not null and (v_pending.canonical_payload ->> 'key_version')::smallint = p_key_version
     and v_pending.correction_reason = v_alasan and v_pending.corrected_by_person_id = v_actor
     and (select sn.name_as_issued from public.certificate_identity_snapshots sn where sn.id = v_pending.snapshot_id) is not distinct from k.nama
     and v_pending.institution_as_issued is not distinct from k.sekolah and v_pending.course_title_as_issued is not distinct from k.kursus
     and v_pending.course_subject_as_issued is not distinct from k.mapel then
    certificate_id := v_pending.id; canonical_payload := v_pending.canonical_payload; return next; return;
  end if;

  select * into v_person from public.persons where id = v_c.person_id;
  v_snaphash := encode(extensions.digest(coalesce(v_person.display_name, '') || '|' || '' || '|' || '', 'sha256'), 'hex');
  insert into public.certificate_identity_snapshots
    (person_id, institution_id, name_as_issued, photo_path, photo_content_hash, snapshot_hash)
  values (v_c.person_id, v_c.institution_id, v_person.display_name, null, null, v_snaphash)
  returning id into v_snap;

  if v_pending.id is not null then
    -- the pending replacement keeps its number and token (Sharon §14)
    v_num := v_pending.certificate_number; v_token := v_pending.verification_token;
  else
    v_token := replace(replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', '');
    loop
      v_seq := v_seq + 1;
      if v_seq > 99999 then
        raise exception 'this holder has reached the last certificate number of the five-digit sequence (D-080(2))';
      end if;
      v_num := v_person.pintar_id || '/' || lpad(v_seq::text, 5, '0');
      exit when not exists (select 1 from public.certificates x where x.certificate_number = v_num);
    end loop;
    update public.certificate_number_counters set last_sequence = v_seq, updated_at = now() where person_id = v_c.person_id;
  end if;
  v_iso := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  -- the original's sealed payload, with only what a replacement is: its number, its holder's snapshot, its date and
  -- the key that will sign it. The result, the release, the definition and the scoring policy are the original's.
  v_payload := jsonb_build_object(
    'certificate_number', v_num,
    'identity_snapshot_hash', v_snaphash,
    'result', v_c.canonical_payload -> 'result',
    'issued_at', v_iso,
    'plp_release_id', v_c.canonical_payload -> 'plp_release_id',
    'release_content_sha256', v_c.canonical_payload -> 'release_content_sha256',
    'assessment_definition_id', v_c.canonical_payload -> 'assessment_definition_id',
    'assessment_definition_version', v_c.canonical_payload -> 'assessment_definition_version',
    'scoring_policy_version', v_c.canonical_payload -> 'scoring_policy_version',
    'key_version', p_key_version);

  if v_pending.id is not null then
    update public.certificates
       set snapshot_id = v_snap, issued_at_iso = v_iso, canonical_payload = v_payload, institution_as_issued = k.sekolah,
           course_subject_as_issued = k.mapel, course_title_as_issued = k.kursus, correction_reason = v_alasan,
           corrected_by_person_id = v_actor
     where id = v_pending.id
    returning id into v_id;
  else
    insert into public.certificates (session_id, person_id, institution_id, snapshot_id,
      certificate_number, verification_token, status, issued_at_iso, canonical_payload,
      institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued,
      supersedes_certificate_id, correction_reason, corrected_by_person_id)
    values (v_c.session_id, v_c.person_id, v_c.institution_id, v_snap, v_num, v_token, 'ELIGIBLE', v_iso, v_payload,
            k.sekolah, k.mapel, k.kursus, coalesce(v_c.language_as_issued, 'id'), v_c.id, v_alasan, v_actor)
    returning id into v_id;
  end if;
  perform public.audit_write('certificate.correction_prepared', 'certificates', v_id::text, v_c.institution_id,
    jsonb_build_object('certificate_id', v_id, 'supersedes', v_c.id, 'number', v_num, 'reason', v_alasan,
                       'actor_role', public.audit_actor_role(v_c.institution_id)));
  certificate_id := v_id; canonical_payload := v_payload;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.sertifikat_koreksi_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception using
    errcode = 'PR120',
    detail  = p_code,
    message = case p_code
      when 'CERT_NOT_ALLOWED'       then 'correcting a certificate requires CAN_PUBLISH in its school'
      when 'CERT_NOT_ISSUED'        then 'only an issued certificate is corrected; a revoked or replaced one stays as it is'
      when 'CERT_REASON_REQUIRED'   then 'a correction records why, in 10 to 300 characters'
      when 'CERT_NOTHING_CHANGED'   then 'the name, the school and the course read now are what the certificate already says'
      when 'CERT_KEY_INVALID'       then 'a replacement names the key version that will sign it'
      when 'CERT_REPLACEMENT_INVALID' then 'this is not a prepared replacement waiting for its signature'
      else 'the certificate could not be corrected' end;
end $function$
;

-- ==============================================================================================================
-- 236 · 20270117120000_a_corrected_answer_is_not_explained_by_the_sealed_key: 1 statement(s)

CREATE OR REPLACE FUNCTION public.session_review(p_session uuid)
 RETURNS TABLE(posisi smallint, stem text, is_safety_critical boolean, jawaban_teks text, benar boolean, alasan text, arah text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_s public.assessment_sessions;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.mode = 'PRE_TEST' then
    raise exception 'a pre-test reveals no rationale: it maps what to read next, not what was wrong';
  end if;
  if v_s.status <> 'FINALIZED' then
    raise exception 'the review opens once the attempt is scored';
  end if;
  return query
    select f.posisi, i.stem, f.is_safety_critical,
           o.body,
           public.grade_response(f.item_id, f.value) = 1,
           o.rationale,
           i.arah_berpikir
      from public.session_final_responses(p_session) f
      join public.items i on i.id = f.item_id
      left join public.item_options o on o.item_id = f.item_id
                                     and o.label = (f.value ->> 'pilihan')
     order by f.is_safety_critical desc, f.posisi;
end $function$
;

-- ==============================================================================================================
-- 235 · 20270117110000_a_locked_account_is_given_no_password_by_a_grant_or_an_activation: 2 statement(s)

CREATE OR REPLACE FUNCTION public.password_write_permit(p_auth_user uuid, p_purpose text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if p_purpose is distinct from 'ACTIVATION' then
    raise exception using errcode = '22023', message = 'password_write_permit: not a known purpose';
  end if;
  if not exists (select 1 from public.accounts a join public.account_setup s on s.account_id = a.id
                  where a.auth_user_id = p_auth_user and a.kind = 'EMAIL' and s.state = 'REQUIRED'
                    and not public.adalah_persona(a.person_id)) then
    raise exception using errcode = 'PR040', detail = 'SETUP_NOT_REQUIRED',
      message = 'a password is set at activation only while the set-up is required';
  end if;
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (p_auth_user, p_purpose, clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
end $function$
;

CREATE OR REPLACE FUNCTION public.recovery_grant_permit(p_token_hash text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_user uuid;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  select g.auth_user_id into v_user from public.password_recovery_grants g
   where g.token_hash = p_token_hash and g.expires_at > clock_timestamp();
  if v_user is null then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_user, 'RECOVERY', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  return v_user;
end $function$
;

-- ==============================================================================================================
-- 234 · 20270117100000_every_view_of_a_corrected_answer_marks_it_by_the_key_in_force: 4 statement(s)

-- the two views 234 changed go back first: 234's functions they read are dropped below

create or replace view "public"."service_cohort_misconceptions" as  WITH x AS (
         SELECT s.institution_id,
            s.cohort_node_id,
            s.class_node_id,
            s.person_id,
            o.misconception_code,
            mt.label,
            mt.remediation
           FROM ((((academic_responses r
             JOIN assessment_sessions s ON ((s.id = r.session_id)))
             JOIN presented_items p ON ((p.id = r.presented_item_id)))
             JOIN item_options o ON (((o.item_id = p.item_id) AND (o.label = (r.value ->> 'pilihan'::text)) AND (NOT o.is_correct))))
             JOIN misconception_taxonomy mt ON (((mt.code = o.misconception_code) AND (mt.institution_id = o.institution_id))))
          WHERE ((o.misconception_code IS NOT NULL) AND (NOT ditarik_dikecualikan(s.learning_assignment_id)))
        ), per_class AS (
         SELECT x_1.institution_id,
            x_1.class_node_id,
            x_1.misconception_code,
            count(DISTINCT x_1.person_id) AS learners
           FROM x x_1
          GROUP BY x_1.institution_id, x_1.class_node_id, x_1.misconception_code
        ), class_total AS (
         SELECT x_1.institution_id,
            x_1.class_node_id,
            count(DISTINCT x_1.person_id) AS learners
           FROM x x_1
          GROUP BY x_1.institution_id, x_1.class_node_id
        )
 SELECT x.institution_id,
    x.cohort_node_id,
    x.class_node_id,
    x.misconception_code,
    x.label,
    x.remediation,
    (count(*))::integer AS occurrences,
    (max(pc.learners))::integer AS learners,
    (max(ct.learners))::integer AS class_learners
   FROM ((x
     LEFT JOIN per_class pc ON (((pc.institution_id = x.institution_id) AND (NOT (pc.class_node_id IS DISTINCT FROM x.class_node_id)) AND (pc.misconception_code = x.misconception_code))))
     LEFT JOIN class_total ct ON (((ct.institution_id = x.institution_id) AND (NOT (ct.class_node_id IS DISTINCT FROM x.class_node_id)))))
  GROUP BY x.institution_id, x.cohort_node_id, x.class_node_id, x.misconception_code, x.label, x.remediation;

create or replace view "public"."service_item_statistics" as  SELECT i.id AS item_id,
    i.institution_id,
    i.lesson_id,
    i.bank_type,
    i.item_type,
    (count(*))::integer AS evidence_count,
    (count(*) FILTER (WHERE o.is_correct))::integer AS correct_count,
        CASE
            WHEN (count(*) = 0) THEN NULL::numeric
            ELSE round(((count(*) FILTER (WHERE o.is_correct))::numeric / (count(*))::numeric), 4)
        END AS correctness_rate,
    (avg(EXTRACT(epoch FROM (r.received_at - p.presented_at))))::numeric(10,3) AS mean_response_seconds,
    min(p."position") AS first_position,
    max(p."position") AS last_position
   FROM (((items i
     JOIN presented_items p ON ((p.item_id = i.id)))
     JOIN academic_responses r ON (((r.presented_item_id = p.id) AND (NOT sesi_ditarik_dikecualikan(r.session_id)))))
     LEFT JOIN item_options o ON (((o.item_id = i.id) AND (o.label = (r.value ->> 'pilihan'::text)))))
  GROUP BY i.id, i.institution_id, i.lesson_id, i.bank_type, i.item_type;

drop function if exists "public"."kunci_berlaku_sesi"(p_session uuid);

CREATE OR REPLACE FUNCTION public.reading_map(p_session uuid)
 RETURNS TABLE(peringkat smallint, tingkat text, kode text, pernyataan text, modul text, pelajaran text, halaman text, alasan text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
  with graded as (
    select f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0 else public.grade_response(f.item_id, f.value) end as score
      from public.session_final_responses(p_session) f
  ),
  per_objective as (
    select lo.id as objective_id, lo.code, lo.statement, lo.is_core,
           l.id as lesson_id, l.title as lesson_title, l.page_citation,
           m.title as module_title, m.ordinal as module_ordinal, l.ordinal as lesson_ordinal,
           count(*)::integer as total,
           sum(g.score)::integer as benar,
           bool_or(g.is_safety_critical and g.score = 0) as safety_missed
      from graded g
      join public.items i on i.id = g.item_id
      join public.learning_objectives lo on lo.id = any (i.objective_ids)
      join public.lessons l on l.id = lo.lesson_id
      join public.modules m on m.id = l.module_id
     group by lo.id, lo.code, lo.statement, lo.is_core, l.id, l.title, l.page_citation,
              m.title, m.ordinal, l.ordinal
  ),
  ranked as (
    select po.*,
           case when po.safety_missed                         then 1
                when po.benar::numeric / po.total < 0.5       then 2
                when po.benar::numeric / po.total < 0.8       then 3
                else                                               4 end as tier
      from per_objective po
  )
  select row_number() over (order by r.tier, r.module_ordinal, r.lesson_ordinal,
                                     r.code collate "C")::smallint,
         case r.tier when 1 then 'PERLU_SEGERA' when 2 then 'WAJIB'
                     when 3 then 'DISARANKAN'  else 'KUAT' end,
         r.code, r.statement, r.module_title, r.lesson_title, r.page_citation,
         coalesce(
           (select string_agg(distinct mt.remediation, ' ') from graded g2
              join public.items i2 on i2.id = g2.item_id
              join public.item_options o2 on o2.item_id = g2.item_id
                                         and o2.label = (g2.value ->> 'pilihan')
                                         and not o2.is_correct
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code and mt.institution_id = o2.institution_id
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $function$
;

CREATE OR REPLACE FUNCTION public.session_misconceptions(p_session uuid)
 RETURNS TABLE(item_id uuid, misconception_code text, label text, remediation text, lesson_id uuid, page_citation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select f.item_id, o.misconception_code, mt.label, mt.remediation, i.lesson_id, i.page_citation
    from public.session_final_responses(p_session) f
    join public.items i on i.id = f.item_id
    join public.item_options o on o.item_id = f.item_id
                             and o.label = (f.value ->> 'pilihan')
                             and not o.is_correct
    join public.misconception_taxonomy mt on mt.code = o.misconception_code and mt.institution_id = o.institution_id
   where o.misconception_code is not null
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_question_evidence(p_assignment uuid, p_class uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_aa record; v_out jsonb;
begin
  if public.current_person_id() is null or p_assignment is null or p_class is null then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  select aa.id, aa.node_id, aa.institution_id into v_aa
    from public.assessment_assignments aa where aa.id = p_assignment;
  -- the assignment was set for THIS class, and the reader teaches it
  if v_aa.id is null or v_aa.node_id <> p_class or not exists (
       select 1 from public.role_assignments ra join public.org_nodes n on n.id = p_class
        where ra.person_id = public.current_person_id() and ra.role = 'EDUCATOR'
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
          and ra.scope_node_id is not null and n.jalur @> array[ra.scope_node_id]) then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  -- D-069(b) (C-12): in a professional-learning place the answers are the participant's own. Its facilitator reads
  -- enrolment, progress, completion and the result in the professional-learning record, never answers question by
  -- question; fail closed, so a place that is not plainly academic is refused the same way.
  if not exists (select 1 from public.org_nodes n where n.id = p_class and n.learning_context = 'ACADEMIC') then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;

  with sit as (            -- the class's sittings of this assignment that were handed in
    select s.id, s.person_id
      from public.assessment_sessions s
     where s.assessment_assignment_id = p_assignment
       and s.class_node_id = p_class
       and s.institution_id = v_aa.institution_id
       and s.status in ('SUBMITTED', 'FINALIZED')
  ),
  jawab as (               -- each sitting's final answer to each question it presented
    select st.person_id, p.item_id, p.position, f.value,
           case when f.value is null then null else public.grade_response(p.item_id, f.value) end as nilai
      from sit st
      join public.presented_items p on p.session_id = st.id
      left join lateral (select r.value from public.responses r
                          where r.presented_item_id = p.id and r.is_final
                          order by r.client_seq desc nulls last limit 1) f on true
  ),
  soal as (
    select j.item_id,
           min(j.position) as urutan,
           count(*) filter (where j.value is not null) as menjawab,
           count(*) filter (where j.nilai >= 1) as tepat,
           count(*) as disajikan
      from jawab j group by j.item_id
  )
  select jsonb_build_object(
    'sittings', (select count(*) from sit),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_id', q.item_id,
               'stem', i.stem,
               'stimulus', i.stimulus,
               'options', (select coalesce(jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body, 'is_key', o.is_correct)
                                                     order by o.label), '[]'::jsonb)
                             from public.item_options o where o.item_id = q.item_id),
               'presented', q.disajikan, 'answered', q.menjawab, 'right', q.tepat)
             order by q.urutan, q.item_id)
        from soal q join public.items i on i.id = q.item_id), '[]'::jsonb),
    'learners', coalesce((
      select jsonb_agg(jsonb_build_object(
               'person_id', l.person_id, 'name', pr.display_name,
               'answers', l.answers) order by pr.display_name, l.person_id)
        from (select j.person_id,
                     jsonb_agg(jsonb_build_object('item_id', j.item_id,
                                                  'chosen', j.value ->> 'pilihan',
                                                  'right', coalesce(j.nilai >= 1, false))
                               order by j.position) as answers
                from jawab j group by j.person_id) l
        join public.persons pr on pr.id = l.person_id), '[]'::jsonb))
  into v_out;
  return v_out;
end $function$
;

-- ==============================================================================================================
-- 233 · 20270116130000_a_locked_account_is_locked_until_a_date_auth_can_read: 3 statement(s)

drop function if exists "public"."akun_terkunci_sampai"();

CREATE OR REPLACE FUNCTION public.akun_kunci(p_person uuid, p_kunci boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a record; n int := 0;
begin
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null loop
    update auth.users set banned_until = case when p_kunci then 'infinity'::timestamptz else null end where id = a.auth_user_id;
    if p_kunci then n := n + public.sesi_akhiri_orang(a.auth_user_id, 'DITANGGUHKAN'); end if;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.recovery_attempt(p_typed_id text, p_pin text)
 RETURNS TABLE(outcome text, wait_seconds integer, person_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_id text := public.pintar_id_canonical(p_typed_id);
  v_nu timestamptz := clock_timestamp();
  r public.recovery_ladder%rowtype;
  v_person uuid; v_ok boolean;
begin
  if v_id is null then
    outcome := 'MALFORMED'; wait_seconds := null; person_id := null; return next; return;
  end if;
  insert into public.recovery_ladder (typed_id) values (v_id) on conflict do nothing;
  select * into r from public.recovery_ladder l where l.typed_id = v_id for update;
  -- the time is read once the row is held: an attempt that queued behind
  -- another is judged at the moment it is taken, not when it arrived
  v_nu := clock_timestamp();

  -- 30 clean days: levels 1-2 (and a partial count) return to 0; never a suspension
  if r.level < 3 and r.last_failure_at is not null and r.last_failure_at < v_nu - interval '30 days'
     and (r.locked_until is null or r.locked_until <= v_nu) then
    r.level := 0; r.failures := 0; r.locked_until := null;
  end if;

  if r.level = 3 then
    outcome := 'SUSPENDED'; wait_seconds := null; person_id := null; return next; return;
  end if;
  if r.locked_until is not null and r.locked_until > v_nu then
    outcome := 'LOCKED'; wait_seconds := greatest(1, ceil(extract(epoch from r.locked_until - v_nu)))::int;
    person_id := null; return next; return;
  end if;

  select p.id into v_person from public.persons p where p.pintar_id = v_id;
  v_ok := public.pin_matches(v_person, p_pin);   -- the same hashing work for a missing person

  if v_ok then
    update public.recovery_ladder
       set level = 0, failures = 0, locked_until = null, last_failure_at = null, updated_at = v_nu
     where typed_id = v_id;
    perform public.audit_write('identity.recovery_pin_ok', 'persons', v_person::text, null, '{}'::jsonb);
    outcome := 'OK'; wait_seconds := null; person_id := v_person; return next; return;
  end if;

  r.failures := r.failures + 1;
  if r.failures < 3 then
    update public.recovery_ladder set level = r.level, failures = r.failures, locked_until = null,
           last_failure_at = v_nu, updated_at = v_nu where typed_id = v_id;
    perform public.audit_write('identity.recovery_pin_wrong', 'recovery_ladder', v_id, null,
      jsonb_build_object('level', r.level, 'failures', r.failures));
    outcome := 'WRONG'; wait_seconds := null; person_id := null; return next; return;
  end if;

  if r.level < 2 then
    update public.recovery_ladder
       set level = r.level + 1, failures = 0, last_failure_at = v_nu, updated_at = v_nu,
           locked_until = v_nu + case r.level when 0 then interval '1 hour' else interval '4 hours' end
     where typed_id = v_id;
    perform public.audit_write('identity.recovery_locked', 'recovery_ladder', v_id, null,
      jsonb_build_object('level', r.level + 1, 'hours', case r.level when 0 then 1 else 4 end));
    outcome := 'LOCKED';
    wait_seconds := case r.level when 0 then 3600 else 14400 end;
    person_id := null; return next; return;
  end if;

  -- level 2, a third wrong: suspended; the current PIN is never usable again
  update public.recovery_ladder
     set level = 3, failures = 0, locked_until = null, last_failure_at = v_nu, suspended_at = v_nu, updated_at = v_nu
   where typed_id = v_id;
  update public.person_pins pp set reset_required = true where pp.person_id = v_person;
  perform public.audit_write('identity.recovery_suspended', 'recovery_ladder', v_id, null, '{}'::jsonb);
  outcome := 'SUSPENDED'; wait_seconds := null; person_id := null; return next;
end $function$
;

-- ==============================================================================================================
-- 232 · 20270116120000_a_school_reads_only_its_own_school_of_a_sign_in_record: 0 statement(s)

-- ==============================================================================================================
-- 231 · 20270116110000_every_scheduled_job_is_declared_once_installed_by_one_installer_and_checked: 3 statement(s)

drop function if exists "public"."pintar_jadwal_daftar"();

drop function if exists "public"."pintar_jadwal_pasang"();

drop function if exists "public"."pintar_periksa_kesehatan"();

-- ==============================================================================================================
-- 230 · 20270116100000_a_sign_in_a_sign_out_and_a_print_are_kept_on_the_record_for_twelve_months: 39 statement(s)

drop trigger if exists "accountability_events_guard" on "public"."accountability_events";

drop trigger if exists "accountability_events_no_truncate" on "public"."accountability_events";

drop trigger if exists "akuntabilitas_bukan_sumber_metrik" on "public"."metric_sources";

alter table "public"."accountability_events" drop constraint "accountability_events_hash";

alter table "public"."accountability_events" drop constraint "accountability_events_kind";

alter table "public"."accountability_events" drop constraint "accountability_events_method";

alter table "public"."accountability_events" drop constraint "accountability_events_origin";

alter table "public"."accountability_events" drop constraint "accountability_events_outcome";

alter table "public"."accountability_events" drop constraint "accountability_events_person";

alter table "public"."accountability_events" drop constraint "accountability_events_print";

alter table "public"."accountability_events" drop constraint "accountability_events_print_one_school";

alter table "public"."accountability_store" drop constraint "accountability_store_singleton_check";

alter table "public"."accountability_write_failures" drop constraint "accountability_write_failures_kind_check";

alter table "public"."accountability_write_failures" drop constraint "accountability_write_failures_n_check";

drop function if exists "public"."accountability_events_guard"();

drop function if exists "public"."akuntabilitas_baca"(p_sekolah uuid, p_jenis text, p_cari text, p_dari date, p_sampai date, p_halaman integer, p_ukuran integer);

drop function if exists "public"."akuntabilitas_buang_lama"(p_batas integer);

drop function if exists "public"."akuntabilitas_bukan_sumber_metrik"();

drop function if exists "public"."akuntabilitas_catat"(p_kind text, p_method text, p_outcome text, p_auth_user uuid, p_pengenal text, p_identifier_hash text, p_origin text, p_resource jsonb);

drop function if exists "public"."akuntabilitas_gagal_hitung"(p_kind text);

drop function if exists "public"."akuntabilitas_sejak"(p_sekolah uuid);

drop function if exists "public"."akuntabilitas_sekolah_orang"(p_person uuid, p_at timestamp with time zone);

drop function if exists "public"."akuntabilitas_tolak"(p_code text);

drop function if exists "public"."assert_accountability_is_not_evidence"();

alter table "public"."accountability_events" drop constraint "accountability_events_pkey";

alter table "public"."accountability_store" drop constraint "accountability_store_pkey";

alter table "public"."accountability_write_failures" drop constraint "accountability_write_failures_pkey";

drop index if exists "public"."accountability_events_at";

drop index if exists "public"."accountability_events_person";

drop index if exists "public"."accountability_events_pkey";

drop index if exists "public"."accountability_events_print_ref";

drop index if exists "public"."accountability_events_schools";

drop index if exists "public"."accountability_store_pkey";

drop index if exists "public"."accountability_write_failures_pkey";

drop table "public"."accountability_events";

drop table "public"."accountability_store";

drop table "public"."accountability_write_failures";

CREATE OR REPLACE FUNCTION public.certificate_prepare(p_session uuid, p_key_version smallint)
 RETURNS TABLE(certificate_id uuid, canonical_payload jsonb, already_sealed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_e record; v_s public.assessment_sessions; v_person public.persons; v_snap uuid;
  v_cert public.certificates; v_num text; v_token text; v_iso text; v_payload jsonb;
  v_release uuid; v_sha text; v_def uuid; v_defver integer; v_snaphash text;
  v_id uuid; v_photo_hash text; v_seq integer; v_inst_name text; v_subject text; v_title text;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'not eligible: unknown session'; end if;

  -- BOB-48 (6): one preparation at a time per holder, held until this transaction ends: the holder's sequence row,
  -- locked. Two sittings of one learner finishing together wait for each other and take consecutive numbers; the same
  -- session loaded twice waits, then sees the first's certificate (it replaces 20261126100000's per-school lock: a
  -- session belongs to one person, so the same-session race still serialises).
  insert into public.certificate_number_counters (person_id) values (v_s.person_id) on conflict (person_id) do nothing;
  select c.last_sequence into v_seq from public.certificate_number_counters c where c.person_id = v_s.person_id for update;

  select * into v_cert from public.certificates
   where session_id = p_session and supersedes_certificate_id is null;
  if v_cert.id is not null then
    certificate_id := v_cert.id; canonical_payload := v_cert.canonical_payload;
    already_sealed := v_cert.status <> 'ELIGIBLE';
    return next; return;
  end if;

  select * into v_e from public.certificate_eligibility(p_session);
  if not v_e.eligible then raise exception 'not eligible: %', v_e.reason; end if;

  select * into v_person from public.persons where id = v_s.person_id;
  v_release := v_s.plp_release_id; v_def := v_s.assessment_definition_id; v_defver := v_s.assessment_definition_version;
  select r.content_sha256 into v_sha from public.plp_releases r where r.id = v_release;

  -- INV-30: what the certificate presents, frozen now: the name only. D-085 T4: no student photo on the card or the
  -- certificate (a profile photo is permitted, and stays out of here). The hash keeps its shape, with the photo's
  -- two parts empty, as it always was for a person without one.
  v_photo_hash := null;
  v_snaphash := encode(extensions.digest(
    coalesce(v_person.display_name,'') || '|' || '' || '|' || coalesce(v_photo_hash,''), 'sha256'), 'hex');
  insert into public.certificate_identity_snapshots
    (person_id, institution_id, name_as_issued, photo_path, photo_content_hash, snapshot_hash)
  values (v_s.person_id, v_s.institution_id, v_person.display_name,
          null, v_photo_hash, v_snaphash)
  returning id into v_snap;

  -- CR-02: the school's name, the course its own release teaches, and one language, as they are now
  select i.name into v_inst_name from public.institutions i where i.id = v_s.institution_id;
  select co.subject, co.title into v_subject, v_title
    from public.plp_releases r join public.courses co on co.id = r.course_id where r.id = v_release;

  -- D3a: opaque, high-entropy, and derived from nothing. 32 random bytes in
  -- base64url; not the certificate number, not the session id, not a sequence.
  v_token := replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
  v_token := replace(v_token, '=', '');

  -- CR-01, D-080(2)(9): <PINTAR ID>/<the holder's next number>, five digits; past 99999 the sequence is refused rather
  -- than padded into a number already taken. The unique index stays the backstop: a number already taken is skipped.
  loop
    v_seq := v_seq + 1;
    if v_seq > 99999 then
      raise exception 'this holder has reached the last certificate number of the five-digit sequence (D-080(2))';
    end if;
    v_num := v_person.pintar_id || '/' || lpad(v_seq::text, 5, '0');
    exit when not exists (select 1 from public.certificates c where c.certificate_number = v_num);
  end loop;
  update public.certificate_number_counters set last_sequence = v_seq, updated_at = now() where person_id = v_s.person_id;
  v_iso := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  -- §7's canonical payload. Key order is fixed by construction, so the same
  -- inputs always serialise the same way.
  v_payload := jsonb_build_object(
    'certificate_number', v_num,
    'identity_snapshot_hash', v_snaphash,
    'result', jsonb_build_object('score', v_e.mastery, 'predikat', v_e.predikat,
                                 'passed', v_e.passed, 'safety_gate', true),
    'issued_at', v_iso,
    'plp_release_id', v_release,
    'release_content_sha256', v_sha,
    'assessment_definition_id', v_def,
    'assessment_definition_version', v_defver,
    'scoring_policy_version', v_s.scoring_policy_version,
    -- §7 puts key_version INSIDE the signed payload, so it has to be known
    -- before the payload exists. The caller names the key it will sign with;
    -- the payload is then final at prepare time and never mutated, which is
    -- what the immutability trigger requires.
    'key_version', p_key_version);

  if p_key_version is null or p_key_version < 1 then
    raise exception 'a certificate payload names the key version that will sign it (INV-05, INV-07)';
  end if;
  insert into public.certificates (session_id, person_id, institution_id, snapshot_id,
    certificate_number, verification_token, status, issued_at_iso, canonical_payload,
    institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued)
  values (p_session, v_s.person_id, v_s.institution_id, v_snap, v_num, v_token,
          'ELIGIBLE', v_iso, v_payload, v_inst_name, v_subject, v_title, 'id')
  returning id into v_id;

  perform public.audit_write('certificate.prepared', 'certificates', v_id::text, v_s.institution_id,
    jsonb_build_object('certificate_id', v_id, 'session_id', p_session, 'number', v_num));
  certificate_id := v_id; canonical_payload := v_payload; already_sealed := false;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.hapus_data_pribadi(p_request uuid, p_catatan text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid := public.current_person_id(); r public.account_requests; v_pid text; a record; v_foto boolean; v_lama text;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  select * into r from public.account_requests q where q.id = p_request for update;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 2): a request already carried out answers with its person and
  -- writes nothing, so the route's second press removes a photo file the first could not
  if r.id is not null and r.kind = 'DELETE_PERSONAL_DATA' and r.status = 'DONE'
     and exists (select 1 from public.persons p where p.id = r.person_id and p.anonymized_at is not null) then
    return jsonb_build_object('ok', true, 'orang', r.person_id, 'sudah', true);
  end if;
  if r.id is null or r.kind <> 'DELETE_PERSONAL_DATA' or r.status not in ('RECEIVED', 'IN_PROGRESS') then
    perform public.akun_tolak('ACCOUNT_REQUEST_INVALID');
  end if;
  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST') then
    perform public.akun_tolak('ACCOUNT_NOT_CLOSED');
  end if;
  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;
  update public.persons set display_name = v_pid, photo_path = null, anonymized_at = now() where id = r.person_id;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 1 on 6faef690): a class card's address (card-<number>@…) is not
  -- personal data and its own guard refuses any change, so only the email accounts are retired
  for a in select ac.id, ac.auth_user_id from public.accounts ac
            where ac.person_id = r.person_id and ac.auth_user_id is not null and ac.kind = 'EMAIL' loop
    perform set_config('pintar.anonimkan_email', a.id::text, true);
    select lower(u.email) into v_lama from auth.users u where u.id = a.auth_user_id;
    update auth.users set email = 'anonim-' || a.auth_user_id::text || '@pintar.invalid', email_change = '',
                          raw_user_meta_data = '{}'::jsonb where id = a.auth_user_id;
    -- GoTrue keeps the address again in the identity; it is not synced by the update above
    update auth.identities set identity_data = jsonb_build_object('sub', a.auth_user_id::text,
                                                                  'email', 'anonim-' || a.auth_user_id::text || '@pintar.invalid')
     where user_id = a.auth_user_id;
    -- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22): GoTrue's own copies of the address. Its audit log
    -- keeps the event and loses the address; a one-time token (recovery, confirmation) is removed, since it is useless
    -- for an address that no longer exists.
    update auth.audit_log_entries x
       set payload = ((x.payload::jsonb - 'actor_username' - 'actor_name')
                   || case when jsonb_typeof(x.payload::jsonb -> 'traits') = 'object'
                           then jsonb_build_object('traits', (x.payload::jsonb -> 'traits') - 'user_email' - 'email')
                           else '{}'::jsonb end)::json,
           -- CORRECTED IN PLACE (undeployed; Sharon's re-verification at 435a2856): GoTrue's record of where each event
           -- came from is the person's too; the IP goes, the event stays
           ip_address = ''
     where x.payload ->> 'actor_id' = a.auth_user_id::text or x.payload -> 'traits' ->> 'user_id' = a.auth_user_id::text
        -- (same correction) an entry naming the address under neither id, a failed sign-in, is found by the address
        -- itself, read before it was replaced
        or lower(x.payload -> 'traits' ->> 'user_email') = v_lama or lower(x.payload ->> 'actor_username') = v_lama;
    -- a session left behind keeps the device's IP and browser; the account is closed, so none is needed
    delete from auth.refresh_tokens t where t.user_id = a.auth_user_id::text;
    delete from auth.sessions s where s.user_id = a.auth_user_id;
    delete from auth.one_time_tokens t where t.user_id = a.auth_user_id;
  end loop;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 3): the name and email where else PINTAR copied them. Each address
  -- becomes an address of no one, unique per row; a name becomes the PINTAR ID; an import row keeps no payload. The audit
  -- log keeps its history of corrections (INV-18), as the person is told.
  update public.account_activation_grants g
     set email = 'anonim-' || g.id::text || '@pintar.invalid',
         display_name = case when g.display_name is null then null else v_pid end
   where g.person_id = r.person_id
      or g.consumed_by in (select ac.auth_user_id from public.accounts ac where ac.person_id = r.person_id);
  update public.email_corrections c
     set old_email = 'anonim-' || c.id::text || '-lama@pintar.invalid', new_email = 'anonim-' || c.id::text || '@pintar.invalid'
   where c.person_id = r.person_id;
  update public.card_conversions c set new_email = 'anonim-' || c.id::text || '@pintar.invalid' where c.person_id = r.person_id;
  update public.import_rows ir set payload = '{}'::jsonb where ir.person_id = r.person_id;
  -- what the person wrote with a request to reopen (owner ruling 2) is theirs too
  update public.account_requests q set pesan = null where q.person_id = r.person_id and q.pesan is not null;
  perform set_config('pintar.identity_correction', 'on', true);
  update public.person_usernames un set username = 'anonim.' || lower(v_pid) where un.person_id = r.person_id;
  perform set_config('pintar.identity_correction', '', true);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(),
         decision_note = nullif(btrim(coalesce(p_catatan, '')), '') where id = r.id;
  perform public.audit_write('account.personal_data_deleted', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'removed', jsonb_build_array('name', 'sign_in_email', 'username', 'copies')
                         || case when v_foto then jsonb_build_array('photo') else '[]'::jsonb end,
                       'kept', jsonb_build_array('results', 'certificates_as_issued', 'audit_log'),
                       'actor_role', public.audit_actor_role(null)));
  -- the person, so the server route that called this removes every file in their photo folder from storage
  -- (Sharon §16 finding 2: a database cannot delete a stored file; storage.protect_delete refuses it)
  return jsonb_build_object('ok', true, 'orang', r.person_id);
end $function$
;

-- ==============================================================================================================
-- 229 · 20270115110000_a_wrong_key_is_corrected_by_two_people_and_kept_on_the_record: 109 statement(s)

drop trigger if exists "assessment_result_bases_append_only" on "public"."assessment_result_bases";

drop trigger if exists "assessment_results_key_correction" on "public"."assessment_results";

drop trigger if exists "certificate_reviews_append_only" on "public"."certificate_reviews";

drop trigger if exists "key_correction_notices_append_only" on "public"."key_correction_notices";

drop trigger if exists "key_corrections_guard" on "public"."key_corrections";

drop trigger if exists "key_corrections_tenant_immutable" on "public"."key_corrections";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_basis_check";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_institution_id_fkey";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_key_correction_id_fkey";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_result_id_fkey";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_session_id_fkey";

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_supersedes_result_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_certificate_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_decided_by_person_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_decision_check";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_decision_shape";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_institution_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_key_correction_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_opened_by_result_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_previous_result_id_fkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_session_id_fkey";

alter table "public"."key_correction_notices" drop constraint "key_correction_notices_institution_id_fkey";

alter table "public"."key_correction_notices" drop constraint "key_correction_notices_key_correction_id_fkey";

alter table "public"."key_correction_notices" drop constraint "key_correction_notices_key_correction_id_institution_id_key";

alter table "public"."key_corrections" drop constraint "key_corrections_asked_item_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_corrected_course_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_corrected_item_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_corrected_release_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_course_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_decided_by_person_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_decision_shape";

alter table "public"."key_corrections" drop constraint "key_corrections_head_course_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_independent";

alter table "public"."key_corrections" drop constraint "key_corrections_institution_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_item_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_key_changes";

alter table "public"."key_corrections" drop constraint "key_corrections_line_root_course_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_proposed_by_person_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_reason_check";

alter table "public"."key_corrections" drop constraint "key_corrections_release_id_fkey";

alter table "public"."key_corrections" drop constraint "key_corrections_status_check";

drop function if exists "public"."ajukan_koreksi_kunci"(p_item uuid, p_kunci text[], p_alasan text);

drop function if exists "public"."boleh_putuskan_tinjauan"(p_certificate uuid);

drop function if exists "public"."c1w_tambahan_saja"();

drop function if exists "public"."evaluate_session_kunci"(p_session uuid, p_peta jsonb);

drop function if exists "public"."grade_kunci"(p_item uuid, p_value jsonb, p_kunci text[]);

drop function if exists "public"."hasil_koreksi_ringkas"(p_session uuid);

drop function if exists "public"."hasil_koreksi_saya"(p_session uuid);

drop function if exists "public"."hasil_murid_id"(p_session uuid);

drop function if exists "public"."hasil_terkini_id"(p_session uuid);

drop function if exists "public"."hitung_ulang_koreksi_kunci"(p_session uuid, p_correction uuid);

drop function if exists "public"."key_corrections_guard"();

drop function if exists "public"."koreksi_kunci_antrean"(p_institution uuid);

drop function if exists "public"."koreksi_kunci_berwenang"(p_table text, p_row jsonb);

drop function if exists "public"."koreksi_kunci_dampak"(p_correction uuid);

drop function if exists "public"."koreksi_kunci_hitung"(p_correction uuid);

drop function if exists "public"."koreksi_kunci_hitung_untuk"(p_item uuid, p_kunci text[]);

drop function if exists "public"."koreksi_kunci_pindah"(p_assignment uuid, p_to_release uuid, p_correction uuid);

drop function if exists "public"."koreksi_kunci_saat_selesai"();

drop function if exists "public"."koreksi_kunci_terakhir"(p_items uuid[]);

drop function if exists "public"."koreksi_pemilik"(p_person uuid, p_institution uuid);

drop function if exists "public"."koreksi_penegas"(p_person uuid, p_institution uuid);

drop function if exists "public"."koreksi_tolak"(p_code text);

drop function if exists "public"."kursus_akar"(p_course uuid);

drop function if exists "public"."nilai_jawaban_berlaku"(p_session uuid, p_item uuid, p_value jsonb);

drop function if exists "public"."orang_admin_platform"(p_person uuid);

drop function if exists "public"."pemberitahuan_koreksi_kunci"(p_institution uuid);

drop function if exists "public"."peran_tenant_punya"(p_person uuid, p_capability text, p_institution uuid);

drop function if exists "public"."pratinjau_koreksi_kunci"(p_item uuid, p_kunci text[]);

drop function if exists "public"."putuskan_tinjauan_sertifikat"(p_review uuid, p_keputusan text, p_alasan text);

drop function if exists "public"."riwayat_hasil_sesi"(p_session uuid);

drop function if exists "public"."sertifikat_ditinjau"(p_certificate uuid);

drop function if exists "public"."sertifikat_layak_dengan"(p_session uuid, p_mastery numeric, p_gate boolean);

drop function if exists "public"."sertifikat_saya_ditinjau"(p_session uuid);

drop function if exists "public"."sertifikat_sesi_kini"(p_session uuid);

drop function if exists "public"."sesi_peta_kunci"(p_session uuid, p_hipotesis jsonb);

drop function if exists "public"."sesi_terdampak"(p_session uuid, p_item uuid);

drop function if exists "public"."soal_anak_sah"(p_item uuid);

drop function if exists "public"."soal_leluhur_sah"(p_item uuid);

drop function if exists "public"."soal_ujung"(p_item uuid);

drop function if exists "public"."tegaskan_koreksi_kunci"(p_correction uuid);

drop function if exists "public"."tenant_platform"(p_institution uuid);

drop function if exists "public"."tinjauan_sertifikat_antrean"(p_institution uuid);

drop function if exists "public"."tinjauan_sertifikat_dikonfirmasi"(p_institution uuid);

drop function if exists "public"."tolak_koreksi_kunci"(p_correction uuid, p_alasan text);

alter table "public"."assessment_result_bases" drop constraint "assessment_result_bases_pkey";

alter table "public"."certificate_reviews" drop constraint "certificate_reviews_pkey";

alter table "public"."key_correction_notices" drop constraint "key_correction_notices_pkey";

alter table "public"."key_corrections" drop constraint "key_corrections_pkey";

drop index if exists "public"."assessment_result_bases_pkey";

drop index if exists "public"."assessment_result_bases_session_idx";

drop index if exists "public"."certificate_reviews_institution_idx";

drop index if exists "public"."certificate_reviews_one_open";

drop index if exists "public"."certificate_reviews_pkey";

drop index if exists "public"."key_correction_notices_key_correction_id_institution_id_key";

drop index if exists "public"."key_correction_notices_pkey";

drop index if exists "public"."key_corrections_institution_idx";

drop index if exists "public"."key_corrections_line_idx";

drop index if exists "public"."key_corrections_one_pending";

drop index if exists "public"."key_corrections_pkey";

drop table "public"."assessment_result_bases";

drop table "public"."certificate_reviews";

drop table "public"."key_correction_notices";

drop table "public"."key_corrections";

CREATE OR REPLACE FUNCTION public.certificate_eligibility(p_session uuid)
 RETURNS TABLE(eligible boolean, reason text, mastery numeric, predikat text, passed boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_mode public.assessment_mode; v_certifies boolean; v_min numeric;
        v_mastery numeric; v_gate boolean; v_official boolean; v_bands jsonb; v_pred text;
begin
  select s.mode, s.pass_mark into v_mode, v_min from public.assessment_sessions s where s.id = p_session;
  if v_mode is null then
    eligible := false; reason := 'unknown session'; return next; return;
  end if;
  select m.certifies into v_certifies from public.mode_policy m where m.mode = v_mode;
  if not coalesce(v_certifies, false) then
    eligible := false; reason := format('mode %s does not certify (§8: only formal stages)', v_mode);
    return next; return;
  end if;

  -- INV-20 structurally: the eligibility read goes through official_*, so
  -- SYNTHETIC, PREVIEW and PUBLIC_DEMO evidence is invisible here by
  -- construction rather than by a filter somebody remembered.
  select true into v_official from public.official_sessions o where o.id = p_session;
  if not coalesce(v_official, false) then
    eligible := false; reason := 'this session''s evidence is not OFFICIAL and can never reach ELIGIBLE (INV-20)';
    return next; return;
  end if;

  select r.mastery, r.safety_gate_passed into v_mastery, v_gate
    from public.official_results r where r.session_id = p_session and r.supersedes_result_id is null;
  if v_mastery is null then
    eligible := false; reason := 'this session has no official result yet'; return next; return;
  end if;

  select p.predikat_bands into v_bands from public.scoring_policy p
    join public.assessment_sessions s on s.scoring_policy_version = p.version where s.id = p_session;
  select b ->> 'predikat' into v_pred
    from jsonb_array_elements(v_bands) b
   where v_mastery >= (b ->> 'min')::numeric
   order by (b ->> 'min')::numeric desc limit 1;

  -- D-088(b): one determination, from the mark sealed on this attempt -- the same rule session_outcome gives
  passed := case when v_min is null then null else (v_gate and v_mastery >= v_min) end;
  mastery := v_mastery; predikat := v_pred;
  if v_min is null then
    eligible := false; reason := 'no pass mark is sealed on this attempt; nothing is certified against an invented one';
  elsif not v_gate then
    eligible := false; reason := 'the safety gate did not pass (INV-10)';
  elsif not passed then
    eligible := false; reason := format('mastery %s is below the %s mark', v_mastery, v_min);
  else
    eligible := true; reason := 'eligible';
  end if;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.excluded_items_for_post_test(p_person uuid, p_learning_assignment uuid)
 RETURNS TABLE(item_id uuid, reason text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with seen as (
    select distinct p.item_id, i.parallel_group
      from public.presented_items p
      join public.assessment_sessions s on s.id = p.session_id
      join public.items i on i.id = p.item_id
     where s.person_id = p_person
       and s.learning_assignment_id = p_learning_assignment
       and s.mode = 'PRE_TEST'
  )
  select seen.item_id, 'presented in this learner''s pre-test' from seen
  union
  select sib.id, 'parallel sibling of an item presented in this learner''s pre-test'
    from public.items sib join seen on sib.parallel_group = seen.parallel_group
   where sib.parallel_group is not null and sib.id <> seen.item_id
$function$
;

CREATE OR REPLACE FUNCTION public.learning_delta(p_learning_assignment uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_person uuid; v_pre numeric; v_post numeric; v_pre_at timestamptz; v_post_at timestamptz;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no person in this session'; end if;

  select r.mastery, r.computed_at into v_pre, v_pre_at
    from public.assessment_sessions s
    join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
   where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     and s.mode = 'PRE_TEST' and s.status = 'FINALIZED'
   order by r.computed_at desc limit 1;

  select r.mastery, r.computed_at into v_post, v_post_at
    from public.assessment_sessions s
    join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
   where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     and s.mode = 'POST_TEST' and s.status = 'FINALIZED'
   order by r.computed_at desc limit 1;

  if v_pre is null or v_post is null then
    return jsonb_build_object(
      'status', case when v_pre is null and v_post is null then 'BELUM_ADA'
                     when v_post is null then 'BARU_PEMETAAN'
                     else 'BARU_PENGUASAAN' end,
      'awal', v_pre, 'akhir', v_post, 'selisih', null);
  end if;
  return jsonb_build_object('status', 'LENGKAP', 'awal', v_pre, 'akhir', v_post,
                            'selisih', round(v_post - v_pre, 4),
                            'awal_pada', v_pre_at, 'akhir_pada', v_post_at);
end $function$
;

CREATE OR REPLACE FUNCTION public.session_outcome(p_session uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_s public.assessment_sessions; v_r public.assessment_results;
        v_min numeric; v_out jsonb;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_r from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_r.id is null then return null; end if;

  v_out := jsonb_build_object(
    'penguasaan',  v_r.mastery,
    'per_domain',  v_r.per_domain,
    'ringkasan',   v_r.delta_inputs);

  if v_s.mode = 'PRE_TEST' then
    -- diagnostic only. No verdict, no gate banner, nothing to render as a mark.
    return v_out || jsonb_build_object('diagnostik', true);
  end if;

  -- D-088(b): the mark sealed on this attempt, and no other. None sealed: no verdict, never a guessed one.
  v_min := v_s.pass_mark;
  return v_out || jsonb_build_object(
    'diagnostik', false,
    'gerbang_keselamatan', v_r.safety_gate_passed,
    -- INV-10: the gate is independent of the score and can refuse alone.
    'lulus', case when v_min is null then null
                  else (v_r.safety_gate_passed and v_r.mastery >= v_min) end,
    'ambang', v_min);
end $function$
;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_token text)
 RETURNS TABLE(pass boolean, predikat text, institution text, date text, validity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_c public.certificates; v_inst text;
begin
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  -- an unknown token yields no row at all: no existence oracle, no distinguishable error
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;   -- not yet issued is not public
  select i.name into v_inst from public.institutions i where i.id = v_c.institution_id;
  pass       := (v_c.canonical_payload -> 'result' ->> 'passed')::boolean;
  predikat   := v_c.canonical_payload -> 'result' ->> 'predikat';
  -- CR-02: the school's name as issued; a certificate issued before the seal reads it as before
  institution:= coalesce(v_c.institution_as_issued, v_inst);
  -- D-199 (owner, 10 Nov): the issuing school's issue day, on its own clock (WIB when the school keeps none)
  date       := to_char((v_c.issued_at_iso::timestamptz) at time zone coalesce(
                  (select i.zona_waktu from public.institutions i where i.id = v_c.institution_id), 'Asia/Jakarta'), 'YYYY-MM-DD');
  validity   := case v_c.status when 'ISSUED' then 'BERLAKU'
                                when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN' end;
  return next;
end $function$
;

-- ==============================================================================================================
-- 228 · 20270115100000_a_question_is_written_in_the_app_and_revised_in_its_line: 79 statement(s)

drop trigger if exists "courses_lineage_one_owner" on "public"."courses";

drop trigger if exists "item_draft_edits_append_only" on "public"."item_draft_edits";

drop trigger if exists "item_options_c1w_revision" on "public"."item_options";

drop trigger if exists "items_c1w_revision" on "public"."items";

drop trigger if exists "items_lineage_one_owner" on "public"."items";

drop trigger if exists "lessons_lineage_one_owner" on "public"."lessons";

drop trigger if exists "modules_lineage_one_owner" on "public"."modules";

drop trigger if exists "plp_releases_c1w_marks" on "public"."plp_releases";

alter table "public"."courses" drop constraint "courses_discard_shape";

alter table "public"."courses" drop constraint "courses_discarded_by_person_id_fkey";

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_action_check";

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_by_person_id_fkey";

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_changed_check";

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_institution_id_fkey";

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_note_check";

alter table "public"."items" drop constraint "items_edit_shape";

alter table "public"."items" drop constraint "items_edited_by_person_id_fkey";

alter table "public"."items" drop constraint "items_revision_check";

alter table "public"."plp_releases" drop constraint "plp_releases_marks_need_superseded";

alter table "public"."plp_releases" drop constraint "plp_releases_replaced_by_release_id_fkey";

alter table "public"."plp_releases" drop constraint "plp_releases_replaced_shape";

alter table "public"."plp_releases" drop constraint "plp_releases_withdrawn_by_person_id_fkey";

alter table "public"."plp_releases" drop constraint "plp_releases_withdrawn_shape";

drop function if exists "public"."buang_draf"(p_course uuid, p_catatan text);

drop function if exists "public"."draf_boleh_tulis"(p_institution uuid);

drop function if exists "public"."draf_jalur_status"(p_to content_status);

drop function if exists "public"."draf_kembali_periksa"(p_course uuid);

drop function if exists "public"."draf_kunci"(p_course uuid);

drop function if exists "public"."garis_satu_pemilik"();

drop function if exists "public"."hapus_soal_draf"(p_item uuid, p_revisi integer);

drop function if exists "public"."item_draft_edits_append_only"();

drop function if exists "public"."keadaan_terbitan"(p_learning_assignment uuid);

drop function if exists "public"."kursus_kepala"(p_course uuid);

drop function if exists "public"."kursus_penerus"(p_course uuid, p_actor uuid);

drop function if exists "public"."package_identity_item"(b ingest_batches, i jsonb);

drop function if exists "public"."package_identity_problems"(b ingest_batches);

drop function if exists "public"."plp_releases_c1w_jaga"();

drop function if exists "public"."revisi_soal"(p_item uuid, p_ringkasan text);

drop function if exists "public"."riwayat_soal"(p_item uuid);

drop function if exists "public"."riwayat_soal_koreksi"(p_item uuid);

drop function if exists "public"."salin_kursus_revisi"(p_course uuid, p_new_course uuid, p_actor uuid, p_satu_penulis boolean);

drop function if exists "public"."soal_beda"(p_old_item uuid, p_new jsonb);

drop function if exists "public"."soal_beda_versi"(p_old uuid, p_new uuid);

drop function if exists "public"."soal_dari_identitas"(p_value text);

drop function if exists "public"."soal_draf_masalah"(p_course uuid, p_institution uuid, p_type item_type, p_soal jsonb);

drop function if exists "public"."soal_kunci"(p_item uuid);

drop function if exists "public"."soal_kursus"(p_item uuid);

drop function if exists "public"."soal_revisi_naik"();

drop function if exists "public"."soal_sidik_isi"(p_item uuid);

drop function if exists "public"."soal_tolak"(p_code text);

drop function if exists "public"."soal_tulis_pilihan"(p_item uuid, p_institution uuid, p_soal jsonb);

drop function if exists "public"."suntingan_draf"(p_course uuid);

drop function if exists "public"."tambah_soal_draf"(p_lesson uuid, p_soal jsonb);

drop function if exists "public"."terbitan_gantikan_pendahulu"(p_release uuid);

drop function if exists "public"."ubah_soal_draf"(p_item uuid, p_revisi integer, p_soal jsonb);

drop function if exists "public"."unggah_menimpa_suntingan"(p_batch uuid);

alter table "public"."item_draft_edits" drop constraint "item_draft_edits_pkey";

drop index if exists "public"."item_draft_edits_course_idx";

drop index if exists "public"."item_draft_edits_item_idx";

drop index if exists "public"."item_draft_edits_pkey";

drop table "public"."item_draft_edits";

alter table "public"."courses" drop column "discarded_at";

alter table "public"."courses" drop column "discarded_by_person_id";

alter table "public"."items" drop column "edited_at";

alter table "public"."items" drop column "edited_by_person_id";

alter table "public"."items" drop column "revision";

alter table "public"."plp_releases" drop column "replaced_at";

alter table "public"."plp_releases" drop column "replaced_by_release_id";

alter table "public"."plp_releases" drop column "withdrawal_reason";

alter table "public"."plp_releases" drop column "withdrawn_at";

alter table "public"."plp_releases" drop column "withdrawn_by_person_id";

CREATE OR REPLACE FUNCTION public.create_course_revision(p_course uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  src record; v_actor uuid; v_new_course uuid; n_open int;
  v_mod record; v_new_mod uuid; v_les record; v_new_les uuid;
  v_lo record; v_it record; v_new_item uuid; v_def record; v_version int;
  v_obj uuid[]; v_pg uuid;
  -- old id -> new id, for the two columns that are not reachable by walking
  -- the tree: objective_ids (an array on items) and parallel_group.
  v_lo_map jsonb := '{}'::jsonb;
  v_pg_map jsonb := '{}'::jsonb;
  n_mod int := 0; n_les int := 0; n_lo int := 0; n_item int := 0; n_opt int := 0; n_def int := 0;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'a revision requires an authenticated actor'; end if;

  select * into src from public.courses where id = p_course;
  if src.id is null then raise exception 'unknown course %', p_course; end if;

  if not public.can_in_institution('CAN_DRAFT', src.institution_id) then
    raise exception 'revising a course requires CAN_DRAFT in the owning institution';
  end if;

  -- An unsealed course is edited directly; a revision of it would produce two
  -- editable successors of the same thing and mean nothing.
  if not public.content_is_sealed(p_course) then
    raise exception 'this course is not sealed; edit it directly rather than revising it';
  end if;

  -- Two divergent open successors is a state with no correct resolution.
  --
  -- "Open" means still editable, which is the same question `content_is_sealed`
  -- already answers -- NOT "its course row has not reached PUBLISHED". A course
  -- row never reaches PUBLISHED in this system: publication is a property of a
  -- RELEASE, and the course stays at APPROVED/FROZEN behind it. Asking the
  -- course's status would have made the FIRST revision of any course the last
  -- one it could ever have, permanently, which is not a rule anyone stated.
  select count(*) into n_open from public.courses c
   where c.supersedes_course_id = p_course
     and not public.content_is_sealed(c.id);
  if n_open > 0 then
    raise exception 'an open revision of this course already exists; finish or abandon it first';
  end if;

  -- The successor inherits `learning_context` from what it supersedes
  -- (20260928100000) and, since D-085 M10 (20261105100000), each question's
  -- cycle_role. Everything else is the function 20260915120000 wrote.
  insert into public.courses
    (institution_id, subject, stage, grade_label, title, status,
     author_person_id, supersedes_course_id, learning_context)
  values (src.institution_id, src.subject, src.stage, src.grade_label, src.title, 'INGESTED',
          v_actor, p_course, src.learning_context)
  returning id into v_new_course;

  for v_mod in select * from public.modules where course_id = p_course order by ordinal loop
    insert into public.modules
      (course_id, institution_id, ordinal, title, status, author_person_id, supersedes_module_id)
    values (v_new_course, src.institution_id, v_mod.ordinal, v_mod.title, 'INGESTED',
            coalesce(v_mod.author_person_id, v_actor), v_mod.id)
    returning id into v_new_mod;
    n_mod := n_mod + 1;

    for v_les in select * from public.lessons where module_id = v_mod.id order by ordinal loop
      insert into public.lessons
        (module_id, institution_id, ordinal, title, summary, body_markdown, worked_examples,
         media, source_version_id, page_citation, status, author_person_id, supersedes_lesson_id)
      values (v_new_mod, src.institution_id, v_les.ordinal, v_les.title, v_les.summary,
              v_les.body_markdown, v_les.worked_examples, v_les.media, v_les.source_version_id,
              v_les.page_citation, 'INGESTED', coalesce(v_les.author_person_id, v_actor), v_les.id)
      returning id into v_new_les;
      n_les := n_les + 1;

      for v_lo in select * from public.learning_objectives where lesson_id = v_les.id order by code loop
        insert into public.learning_objectives
          (lesson_id, institution_id, code, statement, bloom, is_core,
           supersedes_learning_objective_id)
        values (v_new_les, src.institution_id, v_lo.code, v_lo.statement, v_lo.bloom, v_lo.is_core,
                v_lo.id)
        returning id into v_pg;
        v_lo_map := v_lo_map || jsonb_build_object(v_lo.id::text, v_pg);
        n_lo := n_lo + 1;
      end loop;
    end loop;
  end loop;

  -- Items come after every objective exists, because an item names its
  -- objectives by id and the copy must name the COPIES.
  for v_it in
    select i.* from public.items i
      join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course
     order by i.created_at, i.id
  loop
    select array_agg(coalesce((v_lo_map ->> o::text)::uuid, o) order by ord)
      into v_obj
      from unnest(v_it.objective_ids) with ordinality as t(o, ord);

    if v_it.parallel_group is not null then
      if not (v_pg_map ? v_it.parallel_group::text) then
        v_pg_map := v_pg_map || jsonb_build_object(v_it.parallel_group::text, gen_random_uuid());
      end if;
      v_pg := (v_pg_map ->> v_it.parallel_group::text)::uuid;
    else
      v_pg := null;
    end if;

    insert into public.items
      (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk, arah_berpikir,
       objective_ids, is_safety_critical, parallel_group, predicted_difficulty,
       -- empirical_difficulty, empirical_discrimination and empirical_evidence_count are
       -- DELIBERATELY ABSENT. The copy has no evidence of its own and must not
       -- claim another item's. Asserted in the terminal block.
       -- D-085 M10: cycle_role is copied, so a corrected chapter keeps its Pemetaan Awal and
       -- Uji Penguasaan questions (D-008); without it both tests drew from one pool
       source_version_id, page_citation, status, author_person_id, supersedes_item_id, cycle_role)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           coalesce(v_it.author_person_id, v_actor), v_it.id, v_it.cycle_role
    returning id into v_new_item;
    n_item := n_item + 1;

    insert into public.item_options
      (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,
           o.misconception_code
      from public.item_options o where o.item_id = v_it.id order by o.label;
  end loop;

  select count(*) into n_opt from public.item_options io
    join public.items i on i.id = io.item_id
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = v_new_course;

  -- Assessment definitions follow the content they measure. An ad-hoc
  -- instrument is not taught content, never enters a release, and is not
  -- copied (ADR-0011).
  for v_def in
    select d.* from public.assessment_definitions d
     where not d.is_ad_hoc
       and (d.course_id = p_course
         or d.module_id in (select id from public.modules where course_id = p_course))
  loop
    -- (institution_id, title, mode, version) is unique, and the copy keeps the
    -- instrument's name. A copy is therefore the next version of that named
    -- instrument -- which is what it is.
    select coalesce(max(version), 0) + 1 into v_version
      from public.assessment_definitions
     where institution_id = src.institution_id and title = v_def.title and mode = v_def.mode;

    insert into public.assessment_definitions
      (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
       difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
       shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
       author_person_id, status, is_ad_hoc)
    values (src.institution_id,
            case when v_def.course_id is not null then v_new_course else null end,
            case when v_def.module_id is not null
                 then (select m2.id from public.modules m2
                        where m2.course_id = v_new_course and m2.supersedes_module_id = v_def.module_id)
                 else null end,
            v_def.title, v_def.mode, v_def.bank_type, v_version, v_def.item_count,
            v_def.difficulty_mix, v_def.safety_critical_minimum, v_def.passing_rules,
            v_def.hesitation_window_seconds, v_def.shuffle_policy, v_def.allows_pause,
            v_def.offline_tolerant, v_def.late_sync_grace_seconds, v_def.attempt_limit,
            coalesce(v_def.author_person_id, v_actor), 'INGESTED', false);
    n_def := n_def + 1;
  end loop;

  perform public.audit_write('COURSE_REVISION_CREATED', 'courses', v_new_course::text,
    src.institution_id,
    jsonb_build_object('source_course_id', p_course, 'new_course_id', v_new_course,
                       'modules', n_mod, 'lessons', n_les, 'learning_objectives', n_lo,
                       'items', n_item, 'item_options', n_opt, 'assessment_definitions', n_def,
                       'empirical_values_copied', 0));
  return v_new_course;
end $function$
;

CREATE OR REPLACE FUNCTION public.enforce_content_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_institution uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'INGESTED' then
      raise exception 'content rows are created at INGESTED, not % (%.%)',
        new.status, tg_table_schema, tg_table_name;
    end if;
    if new.author_person_id is null then
      new.author_person_id := public.current_person_id();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- (1) is the transition legal? The graph alone decides, and it knows
    -- nothing about roles.
    -- W1.6 (Batch 1, D-145(c)): IN_REVIEW -> VALIDATION_FAILED is a reviewer sending the package back to its author,
    -- and is legal ONLY inside kembalikan_paket(), which checks CAN_REVIEW, that the reviewer is not the author, and
    -- that a reason is given, and records the outcome. That function marks its own transaction; for any other
    -- statement (an author's plain UPDATE under CAN_DRAFT, say) the edge is as if it were not in the allow-list.
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status)
       or (old.status = 'IN_REVIEW' and new.status = 'VALIDATION_FAILED'
           and coalesce(current_setting('pintar.kirim_balik', true), '') <> 'ya') then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

    -- (2) may THIS caller make a legal transition? Asked only once the edge is
    -- known to be legal, and asked about the institution that owns the row as
    -- it stands -- never the one the same statement is trying to write.
    v_institution := (to_jsonb(old) ->> 'institution_id')::uuid;

    if new.status = 'APPROVED' then
      -- ADDED IN 0057. Academic sign-off is a capability, not a spare field.
      -- Without this an EDUCATOR passes the UPDATE policy on CAN_DRAFT and
      -- approves by naming a colleague as reviewer.
      if not public.can_in_institution('CAN_REVIEW', v_institution) then
        raise exception 'approving content requires CAN_REVIEW in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id is null then
        raise exception 'APPROVED requires a reviewer (%.%)', tg_table_schema, tg_table_name;
      end if;
      if new.author_person_id is null then
        raise exception 'APPROVED requires a known author to separate from the reviewer (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id = new.author_person_id then
        raise exception 'the reviewer may not be the author (%.%)', tg_table_schema, tg_table_name;
      end if;
      -- and the reviewer of record is the caller, so "approve" cannot be
      -- performed on someone else's behalf by naming them
      if new.reviewed_by_person_id is distinct from coalesce(public.current_person_id(),
                                                             new.reviewed_by_person_id) then
        raise exception 'the recorded reviewer is the caller, not a named third party (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'FROZEN' then
      if not public.can_in_institution('CAN_FREEZE_RELEASE', v_institution) then
        raise exception 'sealing content requires CAN_FREEZE_RELEASE in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'PUBLISHED' then
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32) (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'SUPERSEDED' then
      -- ADDED IN 0057. Withdrawal is the same authority as publication; the
      -- row is never deleted and the chain stays intact.
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'withdrawing published content requires CAN_PUBLISH in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.lesson_package_materialise(p_batch uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
  v_mode public.assessment_mode; v_n int; v_title text; v_version int;
begin
  select * into b from public.ingest_batches where id = p_batch;
  -- D-063 M5: the package's definitions first, the importing owner's own; then its options can name only them (M2).
  -- A definition already held with a different text is refused here too, so a concurrent import cannot slip one in
  -- between the check and this write.
  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation)
  select public.package_text(x, 'code'), b.institution_id, public.package_text(x, 'label'),
         public.package_text(x, 'description'), public.package_text(x, 'remediation')
    from jsonb_array_elements(case when jsonb_typeof(b.raw_payload -> 'misconceptions') = 'array'
                                   then b.raw_payload -> 'misconceptions' else '[]'::jsonb end) x
  on conflict (institution_id, code) do nothing;
  if exists (select 1 from jsonb_array_elements(case when jsonb_typeof(b.raw_payload -> 'misconceptions') = 'array'
                                                     then b.raw_payload -> 'misconceptions' else '[]'::jsonb end) x
               join public.misconception_taxonomy t on t.institution_id = b.institution_id and t.code = public.package_text(x, 'code')
              where btrim(t.label) is distinct from public.package_text(x, 'label')
                 or btrim(t.description) is distinct from public.package_text(x, 'description')
                 or btrim(t.remediation) is distinct from public.package_text(x, 'remediation')) then
    raise exception using errcode = 'PR040', detail = 'MISCONCEPTION_DEFINITION_DIFFERS',
      message = 'a misconception this school already holds arrived with a different text';
  end if;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    -- D-085 M10: a correction is a new course in the line of the one it corrects (supersedes_course_id is set
    -- here, at insert, as the lineage pointer requires); package_revision_problems has checked it
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, learning_context,
                                supersedes_course_id)
    values (b.institution_id, public.package_text(c, 'subject'), public.package_text(c, 'stage'),
            public.package_text(c, 'grade_label'), public.package_text(c, 'title'), b.confirmed_by_person_id,
            coalesce(public.package_context(c), 'ACADEMIC'::public.learning_context), b.revises_course_id)
    returning id into v_course;
    if b.revises_course_id is not null then
      insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary, written_by_person_id)
      values (v_course, b.institution_id, b.revises_course_id, btrim(b.change_summary), b.confirmed_by_person_id);
      perform public.audit_write('COURSE_CORRECTION_UPLOADED', 'courses', v_course::text, b.institution_id,
        jsonb_build_object('corrects', b.revises_course_id, 'batch', b.id, 'summary', btrim(b.change_summary)));
    end if;
    v_courses := v_courses || v_course;
    v_groups := '{}'::jsonb;
    mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      mi := mi + 1;
      insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
      values (v_course, b.institution_id, coalesce(public.package_text(m, 'ordinal'), mi::text)::smallint,
              public.package_text(m, 'title'), b.confirmed_by_person_id)
      returning id into v_module;
      li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        li := li + 1;
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'jenis', public.package_media_kind(public.package_media_name(public.package_text(x, 'file'))),
                 'path', format('pelajaran/%s/%s/%s', b.institution_id, b.id, public.package_media_name(public.package_text(x, 'file'))),
                 'nama', public.package_text(x, 'file'),
                 'transcript', public.package_text(x, 'transcript')))), '[]'::jsonb)
          into v_media from jsonb_array_elements(public.package_array(l, 'media')) x;
        insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, media, author_person_id)
        values (v_module, b.institution_id, coalesce(public.package_text(l, 'ordinal'), li::text)::smallint,
                public.package_text(l, 'title'), public.package_text(l, 'summary'),
                public.package_text(l, 'body_markdown'), v_media, b.confirmed_by_person_id)
        returning id into v_lesson;
        v_obj := null;
        if jsonb_typeof(l -> 'objective') = 'object' then
          insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
          values (v_lesson, b.institution_id, format('B%sP%s', mi, li),
                  public.package_text(l -> 'objective', 'statement'),
                  coalesce(public.package_text(l -> 'objective', 'bloom'), 'UNDERSTAND')::public.bloom_level, true)
          returning id into v_obj;
        end if;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          v_use := public.package_text(i, 'use');
          v_g := lower(public.package_text(i, 'parallel_group'));
          v_group := null;
          if v_g is not null then
            if not (v_groups ? v_g) then v_groups := v_groups || jsonb_build_object(v_g, gen_random_uuid()); end if;
            v_group := (v_groups ->> v_g)::uuid;
          end if;
          insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk,
                                    objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id)
          values (v_lesson, b.institution_id,
                  coalesce(public.package_text(i, 'item_type'), 'MCQ_SINGLE')::public.item_type,
                  case when v_use is null then 'PRACTICE' else 'TEST' end::public.bank_type,
                  public.package_text(i, 'stem'), public.package_text(i, 'stimulus'), public.package_text(i, 'petunjuk'),
                  case when v_obj is null then '{}'::uuid[] else array[v_obj] end, v_group,
                  public.package_text(i, 'difficulty')::numeric, v_use::public.assessment_mode, b.confirmed_by_person_id)
          returning id into v_item;
          for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop
            insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
            values (v_item, b.institution_id, upper(public.package_text(o, 'label')), public.package_text(o, 'body'),
                    coalesce((o ->> 'is_correct')::boolean, false), public.package_text(o, 'rationale'),
                    public.package_text(o, 'misconception_code'));
          end loop;
        end loop;
      end loop;
    end loop;
    -- D-008 (BOB-04): the course's pre-test and post-test, made here -- before
    -- the course can be sealed, so they are reviewed with it and frozen with it
    -- -- from the questions marked for each. Every marked question is drawn.
    foreach v_mode in array array['PRE_TEST', 'POST_TEST']::public.assessment_mode[] loop
      select count(*) into v_n from public.items it
        join public.lessons ls on ls.id = it.lesson_id join public.modules ms on ms.id = ls.module_id
       where ms.course_id = v_course and it.cycle_role = v_mode;
      continue when v_n = 0;
      v_title := case v_mode when 'PRE_TEST' then 'Pemetaan awal — ' else 'Cek penguasaan — ' end
                 || public.package_text(c, 'title');
      select coalesce(max(ad.version), 0) + 1 into v_version from public.assessment_definitions ad
       where ad.institution_id = b.institution_id and ad.title = v_title and ad.mode = v_mode;
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, version,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
        shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, author_person_id)
      values (b.institution_id, v_course, v_title, v_mode, 'TEST', v_version,
        v_n, '{}'::jsonb, 0,
        case v_mode when 'POST_TEST' then '{"mastery_min":0.6}'::jsonb else '{}'::jsonb end, 25,
        'ITEMS_AND_OPTIONS', v_mode = 'POST_TEST', true, 120,
        case v_mode when 'PRE_TEST' then 1 else 2 end, b.confirmed_by_person_id);
    end loop;
  end loop;
  return v_courses;
end $function$
;

CREATE OR REPLACE FUNCTION public.package_revision_problems(b ingest_batches)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare t public.courses; v jsonb := '[]'::jsonb;
begin
  if b.revises_course_id is null then return v; end if;
  select * into t from public.courses where id = b.revises_course_id;
  if t.id is null or t.institution_id is distinct from b.institution_id then
    return jsonb_build_array(jsonb_build_object('code', 'REVISION_COURSE_UNKNOWN'));
  end if;
  -- W1.6 (Batch 1): a draft a reviewer sent back is corrected in its line too, exactly as a released course is
  if not public.content_is_sealed(t.id) and not public.paket_dikembalikan(t.id) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_RELEASED'));
  end if;
  if exists (select 1 from public.courses x where x.supersedes_course_id = t.id) then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_NOT_LATEST'));
  end if;
  if jsonb_typeof(b.raw_payload -> 'courses') <> 'array' or jsonb_array_length(b.raw_payload -> 'courses') <> 1 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_ONE_COURSE'));
  end if;
  if char_length(btrim(coalesce(b.change_summary, ''))) not between 10 and 1000 then
    v := v || jsonb_build_array(jsonb_build_object('code', 'REVISION_SUMMARY_MISSING'));
  end if;
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.publish_release(p_release uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare r record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  -- a second click publishes nothing twice: no second update, no second audit row
  if r.status = 'PUBLISHED' then return p_release; end if;
  if r.status <> 'FROZEN' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;

  -- The readiness gate is the trigger's, not a second copy here: this update
  -- passes through enforce_release_publish_readiness exactly as a direct one
  -- would, and the trigger now refuses with the same PR040 code.
  update public.plp_releases set status = 'PUBLISHED' where id = p_release;

  perform public.audit_write('RELEASE_PUBLISHED', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'assigns_nothing', true));
  return p_release;
end $function$
;

CREATE OR REPLACE FUNCTION public.release_starts_new_sessions(p_release uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (select 1 from public.plp_releases r
                  where r.id = p_release
                    and r.status in ('PUBLISHED', 'SUPERSEDED'))
$function$
;

CREATE OR REPLACE FUNCTION public.studio_home()
 RETURNS TABLE(bucket text, institution_id uuid, count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with mine as (
    select i.id, i.name from public.institutions i
     where public.can_in_institution('CAN_DRAFT', i.id)
        or public.can_in_institution('CAN_REVIEW', i.id)
        or public.can_in_institution('CAN_ASSIGN_LEARNING', i.id)
        or public.can_in_institution('CAN_FREEZE_RELEASE', i.id)
        or public.can_in_institution('CAN_PUBLISH', i.id)
  )
  select 'ACTION_REQUIRED', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and c.status in ('INGESTED','STRUCTURED','VALIDATED','VALIDATION_FAILED')
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'AWAITING_MY_REVIEW', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW', m.id)
     and c.status = 'IN_REVIEW'
     and c.author_person_id is distinct from public.current_person_id()
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'RELEASE_STEP', t.institution_id, count(*)::int
    from public.studio_langkah_terbitan() t join mine m on m.id = t.institution_id
   group by t.institution_id having count(*) > 0
  union all
  select 'BLOCKED', m.id, count(distinct f.course_id)::int
    from mine m join public.mcq_quality_findings f on f.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and f.severity = 'ERROR' and f.acknowledged_at is null
     and not exists (select 1 from public.courses n where n.supersedes_course_id = f.course_id)
   group by m.id having count(*) > 0
  union all
  select 'QUESTION_HEALTH', m.id, count(*)::int
    from mine m join public.question_health q on q.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', m.id)
     and q.state = 'SIGNAL_RAISED'
   group by m.id having count(*) > 0
  union all
  select 'DISTRIBUTED_CANONICAL', d.institution_id, count(*)::int
    from public.release_distributions d
   where d.status = 'ACTIVE'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
   group by d.institution_id having count(*) > 0
$function$
;

CREATE OR REPLACE FUNCTION public.withdraw_release(p_release uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare r record;
begin
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null or public.current_person_id() is null
     or not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    perform public.release_refuse('RELEASE_PUBLISH_NOT_ALLOWED');
  end if;
  if p_reason is null or btrim(p_reason) = '' then perform public.release_refuse('RELEASE_REASON_REQUIRED'); end if;
  if r.status <> 'PUBLISHED' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;

  -- SUPERSEDED, never deleted: the chain stays intact and every session,
  -- result and certificate already bound to this release stays bound to it.
  update public.plp_releases set status = 'SUPERSEDED' where id = p_release;

  perform public.audit_write('RELEASE_WITHDRAWN', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'reason', p_reason, 'evidence_untouched', true));
  return p_release;
end $function$
;

-- ==============================================================================================================
-- 227 · 20270114110000_an_abandoned_sitting_is_closed_on_a_schedule: 2 statement(s)

drop function if exists "public"."pengerjaan_jadwal_pasang"();

drop extension if exists "pg_cron";

-- ==============================================================================================================
-- 226 · 20270114100000_a_sitting_is_managed_where_it_was_given: 80 statement(s)

drop trigger if exists "assessment_sessions_a1_state" on "public"."assessment_sessions";

drop trigger if exists "attempt_requests_guard" on "public"."attempt_requests";

drop trigger if exists "attempt_requests_tenant_immutable" on "public"."attempt_requests";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_attempt_request_fkey";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_closure_by_person_id_fkey";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_closure_kind_check";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_closure_shape";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_frozen_cause_check";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_frozen_shape";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_frozen_suspension_id_fkey";

alter table "public"."assessment_sessions" drop constraint "assessment_sessions_unfrozen_by_person_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_assessment_assignment_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_decided_by_person_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_decision_reason_check";

alter table "public"."attempt_requests" drop constraint "attempt_requests_decision_shape";

alter table "public"."attempt_requests" drop constraint "attempt_requests_independent";

alter table "public"."attempt_requests" drop constraint "attempt_requests_institution_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_not_the_learner";

alter table "public"."attempt_requests" drop constraint "attempt_requests_person_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_reason_check";

alter table "public"."attempt_requests" drop constraint "attempt_requests_requested_by_person_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_session_id_fkey";

alter table "public"."attempt_requests" drop constraint "attempt_requests_status_check";

drop function if exists "public"."akhiri_pengerjaan"(p_session uuid, p_cara text, p_alasan text);

drop function if exists "public"."attempt_requests_guard"();

drop function if exists "public"."boleh_kelola_pengerjaan"(p_session uuid);

drop function if exists "public"."boleh_putuskan_percobaan"(p_session uuid);

drop function if exists "public"."daftar_pengerjaan"(p_kelas uuid, p_assessment_assignment uuid);

drop function if exists "public"."lanjutkan_pengerjaan"(p_session uuid, p_catatan text);

drop function if exists "public"."minta_percobaan"(p_session uuid, p_alasan text);

drop function if exists "public"."pengerjaan_ditahan"(s assessment_sessions);

drop function if exists "public"."pengerjaan_ditahan_periksa"(p_session uuid);

drop function if exists "public"."pengerjaan_gerbang"(p_session uuid, p_untuk text);

drop function if exists "public"."pengerjaan_jaga"();

drop function if exists "public"."pengerjaan_putus_tenggat"(p_session uuid, p_nilai boolean);

drop function if exists "public"."pengerjaan_saya"(p_session uuid);

drop function if exists "public"."pengerjaan_tahan_orang"(p_person uuid, p_suspension uuid);

drop function if exists "public"."pengerjaan_tenggat_efektif"(p_session uuid);

drop function if exists "public"."pengerjaan_tolak"(p_code text);

drop function if exists "public"."pengerjaan_tutup_terjadwal"(p_batas integer);

drop function if exists "public"."percobaan_antrean"(p_institution uuid);

drop function if exists "public"."percobaan_izin_jumlah"(p_person uuid, p_assessment_assignment uuid);

drop function if exists "public"."percobaan_saya"(p_assessment_assignment uuid);

drop function if exists "public"."percobaan_tandai"(p_session uuid);

drop function if exists "public"."percobaan_terpakai"(p_person uuid, p_assessment_assignment uuid);

drop function if exists "public"."putuskan_percobaan"(p_permintaan uuid, p_setuju boolean, p_alasan text);

drop function if exists "public"."tambah_waktu_pengerjaan"(p_session uuid, p_menit integer, p_alasan text);

drop function if exists "public"."tutup_pengerjaan_ditahan"(p_session uuid, p_alasan text);

drop function if exists "public"."ubah_jadwal_penugasan"(p_la uuid, p_dari timestamp with time zone, p_sampai timestamp with time zone, p_alasan text);

alter table "public"."attempt_requests" drop constraint "attempt_requests_pkey";

drop index if exists "public"."assessment_sessions_deadline_unscored_idx";

drop index if exists "public"."assessment_sessions_open_deadline_idx";

drop index if exists "public"."attempt_requests_institution_idx";

drop index if exists "public"."attempt_requests_one_pending";

drop index if exists "public"."attempt_requests_pkey";

drop table "public"."attempt_requests";

alter table "public"."assessment_sessions" drop column "attempt_request_id";

alter table "public"."assessment_sessions" drop column "closure_at";

alter table "public"."assessment_sessions" drop column "closure_by_person_id";

alter table "public"."assessment_sessions" drop column "closure_deadline";

alter table "public"."assessment_sessions" drop column "closure_kind";

alter table "public"."assessment_sessions" drop column "closure_reason";

alter table "public"."assessment_sessions" drop column "frozen_at";

alter table "public"."assessment_sessions" drop column "frozen_cause";

alter table "public"."assessment_sessions" drop column "frozen_remaining_seconds";

alter table "public"."assessment_sessions" drop column "frozen_suspension_id";

alter table "public"."assessment_sessions" drop column "unfrozen_at";

alter table "public"."assessment_sessions" drop column "unfrozen_by_person_id";

CREATE OR REPLACE FUNCTION public.enforce_response_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_session uuid; v_inst uuid; v_status public.session_status;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a response is evidence: append a new client_seq, never rewrite one (INV-28)';
  end if;
  select p.session_id, p.institution_id into v_session, v_inst
    from public.presented_items p where p.id = new.presented_item_id;
  if v_session is null then
    raise exception 'unknown presented item %', new.presented_item_id;
  end if;
  new.session_id := v_session;
  new.institution_id := v_inst;

  select s.status into v_status from public.assessment_sessions s where s.id = v_session;
  if v_status in ('FINALIZED','TERMINATED') then
    raise exception 'the session is % and accepts no further responses', v_status
      using errcode = 'PR002';
  end if;

  new.value_digest := public.content_digest(new.value::text);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.extend_session_deadline(p_session uuid, p_minutes integer, p_reason text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  -- SI-D01 (Sharon, finding A): an academic sitting's deadline is extended over its place; a professional-learning one
  -- by the platform
  if not (case when public.release_is_professional(v_s.plp_release_id)
               then public.is_system_admin()   -- SI-D01 (finding 1): a professional-learning sitting is the platform's
               else public.boleh_atas_sesi(v_s.id, 'CAN_ASSIGN_LEARNING') end) then
    raise exception 'extending a deadline requires CAN_ASSIGN_LEARNING over the class (or Angkatan) the sitting was given in';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'an extension records why (doc 04 §5: no silent extension)';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 120 then
    raise exception 'an extension is between 1 and 120 minutes, not %', p_minutes;
  end if;
  if v_s.deadline_extended_count >= 3 then
    raise exception 'this session has already been extended % times; a fourth is an assignment decision, not an extension',
      v_s.deadline_extended_count;
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then
    raise exception 'a % session has no deadline to extend', v_s.status;
  end if;

  v_old := v_s.authoritative_deadline;
  v_new := coalesce(v_old, now()) + make_interval(mins => p_minutes);
  update public.assessment_sessions
     set authoritative_deadline = v_new,
         deadline_extended_count = deadline_extended_count + 1
   where id = p_session;

  perform public.audit_write('assessment_session.deadline_extended', 'assessment_sessions',
    p_session::text, v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'old_deadline', v_old, 'new_deadline', v_new,
                       'minutes', p_minutes, 'reason', p_reason, 'actor', v_actor));
  return v_new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_session(p_session uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_s public.assessment_sessions; v_e record; v_id uuid; v_grace integer; v_closes timestamptz;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;

  select r.id into v_id from public.assessment_results r
   where r.session_id = p_session and r.supersedes_result_id is null;
  if v_id is not null then return v_id; end if;

  perform public.session_enforce_deadline(p_session);
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.status not in ('SUBMITTED','EXPIRED') then
    raise exception 'a session is scored from SUBMITTED or EXPIRED, not % (doc 04 §5)', v_s.status;
  end if;

  -- I-R1: answers still travelling inside the governed late-sync window are
  -- part of this paper. Only the finishing learner's verified manifest (which
  -- proves nothing of theirs is still travelling) may close it early.
  if v_s.status = 'EXPIRED' and v_s.authoritative_deadline is not null then
    select coalesce(d.late_sync_grace_seconds, 0) into v_grace
      from public.assessment_definitions d where d.id = v_s.assessment_definition_id;
    v_closes := v_s.authoritative_deadline + make_interval(secs => v_grace);
    if now() <= v_closes
       and current_setting('pintar.manifest_verified', true) is distinct from p_session::text then
      raise exception 'the late-sync window for this session is still open; answers may still arrive'
        using errcode = 'PR007', detail = v_closes::text;
    end if;
  end if;

  select * into v_e from public.evaluate_session(p_session);

  -- D-121(a): the scoring version the session was started under, never a newer one published meanwhile
  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), coalesce(v_s.scoring_policy_version, public.scoring_policy_version()), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct))
  returning id into v_id;

  update public.assessment_sessions set status = 'FINALIZED' where id = p_session;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.may_start_assessment(p_assessment_assignment uuid)
 RETURNS TABLE(ok boolean, reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_aa public.assessment_assignments; v_d public.assessment_definitions;
  v_person uuid; v_enrol uuid; v_attempts integer;
begin
  v_person := public.current_person_id();
  if v_person is null then ok := false; reason := 'NO_PERSON'; return next; return; end if;
  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  if v_aa.id is null then ok := false; reason := 'UNKNOWN_ASSIGNMENT'; return next; return; end if;
  if v_aa.status <> 'OPEN' then
    ok := false; reason := 'ASSIGNMENT_' || v_aa.status::text; return next; return;
  end if;
  if (v_aa.opens_at is not null and now() < v_aa.opens_at)
     or (v_aa.closes_at is not null and now() >= v_aa.closes_at) then
    ok := false; reason := 'OUTSIDE_WINDOW'; return next; return;
  end if;
  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id
     and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;
  if v_enrol is null then ok := false; reason := 'NO_ACTIVE_ENROLMENT'; return next; return; end if;
  -- ACTIVE membership under the assigned node: PUBLISH is not ASSIGN, and an
  -- assignment reaches a learner only through the class or cohort they are in.
  if not exists (select 1 from public.memberships m
                   join public.org_nodes n on n.id = m.node_id
                  where m.enrollment_id = v_enrol and m.valid_to is null
                    and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id])) then
    ok := false; reason := 'NO_ACTIVE_MEMBERSHIP'; return next; return;
  end if;
  select * into v_d from public.assessment_definitions where id = v_aa.assessment_definition_id;
  if v_d.attempt_limit is not null then
    select count(*) into v_attempts from public.assessment_sessions s
     where s.person_id = v_person
       -- owner ruling 1 (20270113140000): the same assessment under any assignment, not this assignment alone
       and (s.assessment_assignment_id = p_assessment_assignment
            or (s.assessment_definition_id = v_d.id and s.assessment_definition_version = v_d.version
                -- owner ruling (10 Nov): another assignment counts within one school and one school year
                and s.institution_id = v_aa.institution_id
                and exists (select 1 from public.assessment_assignments a2 where a2.id = s.assessment_assignment_id
                              and a2.academic_period_id is not distinct from v_aa.academic_period_id)))
       -- Sharon F2 and addendum (20270113140000): an ending by the school's own act is not an attempt
       and coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION');
    if v_attempts >= v_d.attempt_limit then
      ok := false; reason := 'ATTEMPT_LIMIT_REACHED'; return next; return;
    end if;
  end if;
  -- ADDED IN 20261229100000 (W6.10, D-186; ADM-15). The Uji Penguasaan of a chapter given with a Pemetaan Awal waits
  -- for that Pemetaan Awal to be finished. The screens held this order; a direct call did not.
  if v_aa.learning_assignment_id is not null and v_d.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_assignments a
                   join public.assessment_definitions d on d.id = a.assessment_definition_id
                  where a.learning_assignment_id = v_aa.learning_assignment_id and d.mode = 'PRE_TEST')
     and not exists (select 1 from public.assessment_sessions s
                      where s.person_id = v_person and s.learning_assignment_id = v_aa.learning_assignment_id
                        and s.mode = 'PRE_TEST' and s.status = 'FINALIZED') then
    ok := false; reason := 'PRE_TEST_NOT_FINALIZED'; return next; return;
  end if;
  ok := true; reason := 'OK'; return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.pause_session(p_session uuid)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ok boolean; v_reason text; v_allows boolean;
begin
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(p_session) c;
  if not v_ok then raise exception 'cannot pause: %', v_reason; end if;
  select d.allows_pause into v_allows
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = p_session;
  if not v_allows then raise exception 'this assessment does not allow pausing'; end if;
  update public.assessment_sessions set status = 'PAUSED' where id = p_session;
  return 'PAUSED';
end $function$
;

CREATE OR REPLACE FUNCTION public.record_answer(p_presented_item uuid, p_client_seq integer, p_jawaban jsonb, p_client_asserted_at timestamp with time zone DEFAULT now(), p_receipt_mode receipt_mode DEFAULT 'LIVE'::receipt_mode)
 RETURNS TABLE(response_id uuid, outcome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid; v_item uuid; v_type public.item_type;
  v_ok boolean; v_reason text; v_value jsonb; v_label text; v_labels text[];
  v_deadline timestamptz; v_grace integer; v_mode public.receipt_mode; v_scorable boolean;
  v_rid uuid; v_out text;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;

  select s.authoritative_deadline, coalesce(d.late_sync_grace_seconds, 0)
    into v_deadline, v_grace
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = v_session;

  if v_deadline is null or now() <= v_deadline then
    v_mode := case when p_receipt_mode = 'REPLAYED' then 'REPLAYED' else 'LIVE' end;
    v_scorable := true;
  elsif now() <= v_deadline + make_interval(secs => v_grace) then
    v_mode := 'LATE_SYNC';
    v_scorable := true;
  else
    v_mode := 'LATE_SYNC';
    v_scorable := false;
  end if;

  if v_scorable and (v_deadline is null or now() <= v_deadline) then
    select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
    if not v_ok then
      raise exception 'this session accepts no further answers: %', v_reason
        using errcode = 'PR002', detail = v_reason;
    end if;
  else
    if (select s.status from public.assessment_sessions s where s.id = v_session) = 'TERMINATED' then
      raise exception 'this session was ended and accepts no submission' using errcode = 'PR002';
    end if;
    if not public.session_is_mine(v_session) then
      raise exception 'this session belongs to someone else' using errcode = 'PR002';
    end if;
  end if;

  if (select s.status from public.assessment_sessions s where s.id = v_session) = 'CREATED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_session;
  end if;

  select i.item_type into v_type from public.items i where i.id = v_item;

  if v_type = 'MCQ_SINGLE' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'number' then
      raise exception 'MCQ_SINGLE expects {"posisi": n}';
    end if;
    select d.label into v_label from public.option_display_order(v_session, v_item) d
     where d.display_position = (p_jawaban ->> 'posisi')::integer;
    if v_label is null then raise exception 'no option at display position %', p_jawaban ->> 'posisi'; end if;
    v_value := jsonb_build_object('pilihan', v_label);

  elsif v_type = 'MCQ_MULTI' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'array' then
      raise exception 'MCQ_MULTI expects {"posisi": [n, ...]}';
    end if;
    select array_agg(d.label order by d.label collate "C") into v_labels
      from public.option_display_order(v_session, v_item) d
     where d.display_position in (
       select x::integer from jsonb_array_elements_text(p_jawaban -> 'posisi') x);
    if coalesce(array_length(v_labels, 1), 0)
       <> (select count(distinct x) from jsonb_array_elements_text(p_jawaban -> 'posisi') x) then
      raise exception 'one or more display positions do not exist on this item';
    end if;
    v_value := jsonb_build_object('pilihan', to_jsonb(coalesce(v_labels, '{}'::text[])));

  else
    raise exception 'item type % has no learner answer path in this phase (OD-8)', v_type;
  end if;

  select r.response_id, r.outcome into v_rid, v_out
    from public.submit_response(p_presented_item, p_client_seq, v_value,
                                p_client_asserted_at, v_mode, v_scorable) r;

  response_id := v_rid;
  outcome := case when v_scorable then v_out else v_out || '+retained_unscored' end;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.resume_session(p_session uuid)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ok boolean; v_reason text;
begin
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(p_session) c;
  if not v_ok then raise exception 'cannot resume: %', v_reason; end if;
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  return 'IN_PROGRESS';
end $function$
;

CREATE OR REPLACE FUNCTION public.role_capabilities(r app_role)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case r
    when 'SYSTEM_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT','CAN_PROVISION_PEOPLE']
    -- PROVISIONING IS INSTITUTIONAL ADMINISTRATION, which is this role's job.
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_PROVISION_PEOPLE']
    -- NOT HERE. WP4 calls a head of department Management; Management is
    -- academic judgement and provisioning is not, so neither they nor a dean
    -- gains it by being senior.
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    when 'DEAN' then array['CAN_VIEW_LEARNER_ROSTER']
    when 'STUDENT' then array[]::text[]
  end
$function$
;

CREATE OR REPLACE FUNCTION public.session_enforce_deadline(p_session uuid)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v public.assessment_sessions;
begin
  select * into v from public.assessment_sessions where id = p_session;
  if v.id is null then raise exception 'unknown session %', p_session; end if;
  if v.authoritative_deadline is not null
     and now() >= v.authoritative_deadline
     and v.status in ('CREATED','IN_PROGRESS','PAUSED') then
    update public.assessment_sessions set status = 'EXPIRED' where id = p_session;
    return 'EXPIRED';
  end if;
  return v.status;
end $function$
;

CREATE OR REPLACE FUNCTION public.start_learning_session(p_assessment_assignment uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
begin
  v_person := public.current_person_id();
  -- SI-D02 (System Integrity, 9 Nov): one start at a time per learner and assessment assignment. The attempt limit is
  -- counted below (may_start_assessment) and the sitting inserted after it; without this lock two concurrent starts
  -- both counted the attempts before either sitting existed and both inserted (proven: attempt limit 1, a second start
  -- completed in 0.07 s while the first was held). Held to the end of the transaction, so the second start counts the
  -- first sitting and is refused. Taken before any check, by the same key the count uses.
  if v_person is not null then
    perform pg_advisory_xact_lock(hashtextextended('start_learning_session:' || v_person::text || ':' || p_assessment_assignment::text, 0));
  end if;
  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): a share lock on the assessment assignment, so
  -- «Akhiri penugasan» (which locks it for update before it counts open sittings) never misses a start under way
  perform 1 from public.assessment_assignments where id = p_assessment_assignment for share;
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until then that refusal ended the Quick Assessment flow
  -- before a learner could answer anything. Everything else about the session
  -- is unchanged: same opener, same assembler, same provenance guard, same
  -- evidence derivation.
  if v_aa.learning_assignment_id is null and not coalesce(v_d.is_ad_hoc, false) then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  if v_aa.learning_assignment_id is not null then
    select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
    if v_la.status <> 'ACTIVE' then
      raise exception 'the learning assignment is % and assigns nothing', v_la.status;
    end if;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  -- owner decision 5 (9 Nov): the sitting records the Angkatan that applies NOW, at the sitting. A learner PINTAR
  -- places is a member of a Kelas, never of the COHORT node, so the class's own Angkatan (the nearest COHORT above it
  -- in the structure as it stands at this moment) is the learner's. Recorded once, immutable (INV-33): a later move
  -- of the class or the learner never rewrites it.
  -- With a class, its Angkatan is the one recorded, whatever other membership the learner holds; open_assessment_session
  -- checks it again where it is written (Sharon's finding 3).
  if v_class is not null then
    v_cohort := null;
    select n.id into v_cohort
      from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = v_class
     order by array_position(k.jalur, n.id) desc limit 1;
  end if;

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
    -- ADDED IN 0102. An ACTIVE assignment is not a licence to write evidence
    -- over content that can still be edited. The ad-hoc arm below has asked
    -- this question since 0063; this arm never did, so a school could answer
    -- its own unfinished chapter and the session's release binding -- the
    -- frozen answer to "what did this learner see" -- pinned nothing. Same
    -- rule, one predicate, both arms.
    if not public.release_starts_new_sessions(v_release) then
      raise exception
        'this assignment is over material that cannot begin a new attempt: the chapter it binds has not been published';
    end if;
  else
    -- ADDED IN 0062, CORRECTED IN 0063, NARROWED CORRECTLY IN 0064. An ad-hoc
    -- paper binds a module or a course, not a release, so the release is
    -- resolved from the content the definition is bound to: this school's own
    -- release of that course, or -- for canonical content -- one it holds an
    -- ACTIVE grant for.
    --
    -- `status in ('PUBLISHED','SUPERSEDED')` is "sealed, AND was published",
    -- which is exactly what the session binding needs and nothing more. Sealed,
    -- because `enforce_taught_content_immutable` only fires on a sealed course
    -- and an unsealed release therefore pins nothing (that was F1). Published,
    -- because doc 08 puts publication upstream of use -- so FROZEN, the one
    -- sealed status that was never published, stays refused.
    --
    -- SUPERSEDED is admitted deliberately. Release status gates new sessions
    -- nowhere else in this system, correction is never automatic here
    -- (ADR-0016), and the audited lever for "stop using this" is withdrawing the
    -- DISTRIBUTION, which `release_is_distributed_to` already enforces below.
    --
    -- That predicate is the same one the session guard re-applies immediately
    -- afterwards, so a grant withdrawn between launch and start refuses here
    -- rather than producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status in ('PUBLISHED', 'SUPERSEDED')
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.assemble_session(v_session);
  return v_session;
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_session(p_session uuid)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_status public.session_status;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  v_status := public.session_enforce_deadline(p_session);
  if v_status = 'FINALIZED' then return v_status; end if;  -- already scored; nothing to submit
  if v_status = 'EXPIRED'   then return v_status; end if;  -- finalize scores what was answered
  if v_status = 'SUBMITTED' then return v_status; end if;
  if v_status = 'TERMINATED' then
    raise exception using errcode = 'PR003', detail = 'SESSION_ENDED_BY_SCHOOL', message = 'this session was ended and accepts no submission';
  end if;
  if v_status = 'PAUSED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  end if;
  update public.assessment_sessions set status = 'SUBMITTED' where id = p_session;
  return 'SUBMITTED';
end $function$
;

CREATE OR REPLACE FUNCTION public.tangguhkan_akun(p_person uuid, p_kategori text, p_catatan text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid := public.current_person_id(); v_note text := nullif(btrim(coalesce(p_catatan, '')), ''); v_n int;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  perform 1 from public.persons where id = p_person for update;
  if not found then perform public.akun_tolak('ACCOUNT_UNKNOWN'); end if;
  if p_kategori is null or p_kategori not in ('SECURITY', 'ADMINISTRATIVE', 'OTHER') then
    perform public.akun_tolak('ACCOUNT_CATEGORY_INVALID');
  end if;
  if (p_kategori = 'OTHER' and (v_note is null or char_length(v_note) < 10)) or char_length(coalesce(v_note, '')) > 300 then
    perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED');
  end if;
  if public.orang_ditangguhkan(p_person) then perform public.akun_tolak('ACCOUNT_ALREADY_SUSPENDED'); end if;
  insert into public.person_suspensions (person_id, category, note, started_by) values (p_person, p_kategori, v_note, v_actor);
  v_n := public.akun_kunci(p_person, true);
  perform public.audit_write('account.suspended', 'persons', p_person::text, null,
    jsonb_build_object('person_id', p_person, 'reason_code', p_kategori, 'reason', v_note, 'sessions_ended', v_n,
                       'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true, 'sesi_diakhiri', v_n);
end $function$
;

-- ==============================================================================================================
-- 225 · 20270113170000_the_last_administrator_is_never_removed: 10 statement(s)

drop function if exists "public"."admin_dapat_dipakai"(p_role app_role, p_institution uuid);

drop function if exists "public"."catat_penolakan_peran"(p_assignment uuid, p_kode text);

drop function if exists "public"."operator_appoint_platform_admin"(p_pintar_id text, p_valid_until timestamp with time zone, p_reason text, p_operator_ref text);

drop function if exists "public"."peran_akan_berakhir"(p_institution uuid, p_hari integer);

drop function if exists "public"."peran_pemegang_terakhir"(p_assignment uuid);

drop function if exists "public"."peran_terakhir_kode"(p_assignment uuid, p_kunci boolean);

drop function if exists "public"."peran_tolak"(p_code text);

drop function if exists "public"."perpanjang_peran"(p_assignment uuid, p_valid_until timestamp with time zone, p_alasan text);

CREATE OR REPLACE FUNCTION public.refuse_duplicate_active_grant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform pg_advisory_xact_lock(hashtextextended(
    'pintar.grant:' || new.person_id::text || ':' || new.role::text || ':' || coalesce(new.scope_node_id::text, '-'), 0));
  if exists (
    select 1 from public.role_assignments ra
     where ra.person_id = new.person_id and ra.role = new.role
       and ra.scope_node_id is not distinct from new.scope_node_id
       and ra.revoked_at is null and ra.valid_until > now()
  ) then
    raise exception 'GRANT_ALREADY_ACTIVE'
      using errcode = '23505', detail = 'GRANT_ALREADY_ACTIVE',
            hint = 'this person already holds this role here; revoke it first to grant it again';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.role_assignments_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end $function$
;

-- 242's comment on the teacher's per-question evidence goes back to 224's
comment on function public.teacher_question_evidence(uuid, uuid) is 'D-088(k), D-085 M5: for the class''s teacher, the class''s handed-in sittings of one assessment, question by question (answered, right, options and key) and learner by learner (submitted option, right). Never a running sitting, times, integrity or anomaly data, or Question Health. Teaching evidence, not surveillance. C-12 (D-069(b)): an academic place only; a professional-learning place is refused, its answers being the participant''s own.';

-- ═══════════════════════════════════════════════════════ PART 4 · what 224 is, checked before the commit
do $$
begin
  if (select count(*) from supabase_migrations.schema_migrations) <> 224
     or (select max(version) from supabase_migrations.schema_migrations) <> '20270113160000' then
    raise exception 'rollback: the history does not read 224 / 20270113160000';
  end if;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then raise exception 'rollback: pg_cron is still installed'; end if;
  if exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'pintar_kunci_tetap_jaga') then
    raise exception 'rollback: auth.users still carries pintar_kunci_tetap_jaga';
  end if;
  if exists (select 1 from pg_trigger where tgname like '\_l1f4\_%' or tgname like '\_l1f2\_%') then
    raise exception 'rollback: an L1-F2 or L1-F4 guard is still present';
  end if;
  raise notice 'rollback: the database reads 224 (20270113160000)';
end $$;

commit;
