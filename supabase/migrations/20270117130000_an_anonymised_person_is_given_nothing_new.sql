-- L1-F4 (owner, 12 Nov 2026; ANONYMISED-PERSON-IS-TERMINAL.md §0, §3a, §3b Option A, §3c): an anonymised person is
-- terminal for new identity attachments. A returning individual is a NEW person; their anonymised record and its
-- history are never reconnected.
--
--   * THE DEFECT: an import row may name an existing person by their PINTAR id. Neither import_row_problems nor
--     import_advance looked at anonymized_at: from another school that can see the person, or from the platform, the row
--     attached to the same persons.id (a new number, a pending enrolment, the history back under a live enrolment).
--     daftarkan_kembali and murid_keluar did not check either.
--   * ONE PREDICATE, SEVERAL TRIGGERS (Sharon §3a.1): orang_dianonimkan(person) takes FOR SHARE on the person's row
--     (hapus_data_pribadi holds it FOR UPDATE, so whichever comes second waits and sees the first) and reads
--     anonymized_at. A BEFORE INSERT trigger on every attaching (table, column) calls it and refuses. INSERT only:
--     an UPDATE that ends or closes an existing row is not an attachment.
--   * COMPLETENESS BY A REGISTRY AND A TEST: public.orang_lampiran classifies every foreign key to persons(id), and the
--     few attaching columns that reach a person another way, as DIJAGA (guarded) or BEBAS (exempt, with a reason). A
--     foreign key to persons(id) with no row fails the enumeration test (L1F4-E01), so a table added later cannot slip
--     past. The triggers are created from the registry.
--   * THE PATHS ANSWER AS FOR AN UNKNOWN ID (§3a.2): import_row_problems' finding, daftarkan_kembali's refusal and
--     murid_keluar's list are those of an id that names no one.
--   * THE DELETION REFUSES ON A LIVE ATTACHMENT (§3a.3): under its own lock on the person, hapus_data_pribadi refuses
--     ACCOUNT_LIVE_ATTACHMENT when the person GAINED a live enrolment, role, place, open transfer or evaluator grant after
--     their closure began. What they held at the closure is the closure's own state (closure ends no school role), kept
--     by the deletion as before (F38-A05).
--     Nothing is changed and the request stays open (the holding state: only the person and the school know which of
--     the two is the mistake).
--   * CERTIFICATES (§3a.4, §3b Option A): no new certificate for an anonymised person. certificate_prepare answers
--     "not eligible" before anything is written; a replacement (W2.22) is refused (CERT_HOLDER_DELETED); a key
--     correction records a newly earned certificate as earned but not issued (koreksi_kunci_hitung_untuk's row).
--   * UNCHANGED: how deletion is requested, decided or performed; every historical row; a governed key correction's
--     superseding result; a certificate review's decision and a revocation; B1's clearing of origin and hash.

-- ═══════════════════════════════════════════════════════════ (1) the predicate
create or replace function public.orang_dianonimkan(p_person uuid)
returns boolean language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v timestamptz;
begin
  if p_person is null then return false; end if;
  select p.anonymized_at into v from public.persons p where p.id = p_person for share;
  return v is not null;
end $$;
revoke all on function public.orang_dianonimkan(uuid) from public, anon, authenticated, service_role;
comment on function public.orang_dianonimkan(uuid) is
  'L1-F4: true for a person whose personal data was deleted (anonymized_at). Takes FOR SHARE on the person''s row, so it '
  'serialises with hapus_data_pribadi (FOR UPDATE). Read by the attachment guard only.';

-- ═══════════════════════════════════════════════════════════ (2) the registry
create table public.orang_lampiran (
  tabel   text not null,
  kolom   text not null,
  kelas   text not null check (kelas in ('DIJAGA', 'BEBAS')),
  lewat   text not null default 'person' check (lewat in ('person', 'enrollment', 'auth_user')),
  alasan  text not null check (char_length(btrim(alasan)) between 10 and 300),
  primary key (tabel, kolom)
);
alter table public.orang_lampiran enable row level security;
revoke all on table public.orang_lampiran from public, anon, authenticated, service_role;
comment on table public.orang_lampiran is
  'L1-F4: every foreign key to persons(id), and every attaching column that reaches a person another way, classified as '
  'DIJAGA (an insert attaching it to an anonymised person is refused) or BEBAS (with the reason it is not an attachment). '
  'Kept complete by L1F4-E01.';

insert into public.orang_lampiran (tabel, kolom, kelas, lewat, alasan)
select t, k, 'DIJAGA', l, a from (values
  -- standing in a school
  ('enrollments', 'person_id', 'person', 'standing: an enrolment at a school'),
  ('memberships', 'enrollment_id', 'enrollment', 'standing: a place in a class, through the person''s enrolment'),
  ('role_assignments', 'person_id', 'person', 'standing: a role'),
  ('institutional_identities', 'person_id', 'person', 'standing: a school''s number for the person'),
  ('transfers', 'person_id', 'person', 'standing: a move between schools'),
  ('portable_visibility', 'person_id', 'person', 'standing: a school''s sight of earlier records'),
  ('evaluation_evaluators', 'person_id', 'person', 'standing: the evaluator grant'),
  ('evaluation_personas', 'person_id', 'person', 'standing: an evaluation persona'),
  ('platform_bootstrap', 'person_id', 'person', 'standing: the platform''s first administrator'),
  -- ways to sign in, and credentials
  ('accounts', 'person_id', 'person', 'a way to sign in: an account, a class card included'),
  ('account_activation_grants', 'person_id', 'person', 'a way to sign in: an activation grant'),
  ('password_recovery_grants', 'auth_user_id', 'auth_user', 'a way to sign in: a recovery grant, through the account'),
  ('password_write_permits', 'auth_user_id', 'auth_user', 'a way to sign in: a password permit, through the account'),
  ('person_pins', 'person_id', 'person', 'a credential: a PIN'),
  ('person_pins_retired', 'person_id', 'person', 'a credential: a PIN''s replacement record'),
  ('person_usernames', 'person_id', 'person', 'a way to sign in: a username'),
  ('email_corrections', 'person_id', 'person', 'a way to sign in: an address correction'),
  ('card_reissues', 'person_id', 'person', 'a way to sign in: a card reissued'),
  ('card_conversions', 'person_id', 'person', 'a way to sign in: a card turned into an email account'),
  ('account_requests', 'person_id', 'person', 'a request about the account: a reopening would revive a deleted identity'),
  -- new evidence and new credentials of learning
  ('assessment_sessions', 'person_id', 'person', 'a new sitting'),
  ('lesson_progress', 'person_id', 'person', 'new learning evidence'),
  ('attempt_requests', 'person_id', 'person', 'a new attempt granted to the person'),
  ('lesson_review_requests', 'person_id', 'person', 'a request about the person''s learning'),
  ('certificates', 'person_id', 'person', 'a new credential: a certificate (§3a.4, §3b Option A)'),
  ('certificate_identity_snapshots', 'person_id', 'person', 'a new credential''s frozen identity'),
  -- records about the person
  ('feedback_opportunities', 'person_id', 'person', 'a new request for the person''s feedback'),
  ('feedback_cycles', 'subject_person_id', 'person', 'a new feedback cycle about the person'),
  ('management_decisions', 'subject_person_id', 'person', 'a new decision about the person'),
  ('person_tour_state', 'person_id', 'person', 'the person''s own screen state'),
  ('support_reports', 'reporter_person_id', 'person', 'a report made by the person')
) x(t, k, l, a);

insert into public.orang_lampiran (tabel, kolom, kelas, alasan) values
  ('assessment_results', 'person_id', 'BEBAS', 'bookkeeping of an existing sitting: a governed key correction supersedes the result (§3a.4)'),
  ('person_suspensions', 'person_id', 'BEBAS', 'a restriction: it narrows, and the closure the deletion needs is one'),
  ('import_rows', 'person_id', 'BEBAS', 'a request: import_row_problems answers it as an unknown id, and what it would attach is guarded'),
  ('certificate_number_counters', 'person_id', 'BEBAS', 'a holder''s number sequence, not a credential; certificate_prepare refuses before it'),
  ('audit_log', 'evaluation_actor_person_id', 'BEBAS', 'the audit log''s actor; an audit row adds no standing (§3a.4)'),
  ('item_draft_edits', 'by_person_id', 'BEBAS', 'the editor of a question draft: an act''s actor, who cannot sign in once anonymised');

-- every other foreign key to persons(id) is an act's actor: who authorised, decided, reviewed, authored, created or
-- ended something. An anonymised person cannot sign in, so cannot act; and copies carry their authors forward.
insert into public.orang_lampiran (tabel, kolom, kelas, alasan)
select c.conrelid::regclass::text, a.attname, 'BEBAS',
       'an act''s actor (' || a.attname || '): an anonymised person cannot sign in to act, and copies carry authors forward'
  from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
 where c.contype = 'f' and c.confrelid = 'public.persons'::regclass and cardinality(c.conkey) = 1
   and not exists (select 1 from public.orang_lampiran o where o.tabel = c.conrelid::regclass::text and o.kolom = a.attname)
   and a.attname ~ '(_by|_by_person_id|^author_person_id|^reviewer_person_id|^evaluator_person_id|^published_by|^issued_by_person_id)$';

-- ═══════════════════════════════════════════════════════════ (3) the guard
create or replace function public.orang_lampiran_jaga()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ref uuid := (to_jsonb(new) ->> tg_argv[0])::uuid; v_person uuid;
begin
  if v_ref is null then return new; end if;
  v_person := case tg_argv[1]
    when 'enrollment' then (select e.person_id from public.enrollments e where e.id = v_ref)
    when 'auth_user' then (select a.person_id from public.accounts a where a.auth_user_id = v_ref)
    else v_ref end;
  if public.orang_dianonimkan(v_person) then
    raise exception using errcode = 'PR040', detail = 'PERSON_UNKNOWN', message = 'no such person';
  end if;
  return new;
end $$;
revoke all on function public.orang_lampiran_jaga() from public, anon, authenticated, service_role;

do $$
declare r record;
begin
  for r in select * from public.orang_lampiran where kelas = 'DIJAGA' loop
    execute format('create trigger %I before insert on public.%I for each row execute function public.orang_lampiran_jaga(%L, %L)',
                   '_l1f4_' || r.tabel || '_' || r.kolom, r.tabel, r.kolom, r.lewat);
  end loop;
end $$;

-- the two refusal functions, in full with their new codes, so a reader of the source sees every code (AKUN-K01, W222-K01)
create or replace function public.akun_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
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
      else 'the account could not be changed' end;
end $$;
revoke all on function public.akun_tolak(text) from public, anon, authenticated;

create or replace function public.sertifikat_koreksi_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
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
      -- L1-F4 (§3a.4): INV-30 keeps name_as_issued; nothing new is issued to a deleted identity
      when 'CERT_HOLDER_DELETED'    then 'the holder''s personal data was deleted; nothing new is issued to them'
      else 'the certificate could not be corrected' end;
end $$;
revoke all on function public.sertifikat_koreksi_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (4) the paths answer as for an unknown id
do $$
declare v_def text; v_old text; v_new text;
begin
  -- the intake: an anonymised person is a person you may not name, the finding of an unknown id, word for word
  v_def := pg_get_functiondef('public.import_row_problems(uuid,jsonb)'::regprocedure);
  v_old := E'    if not exists (select 1 from public.persons p where p.id = v_person)\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: import_row_problems does not check the named person where it did'; end if;
  execute replace(v_def, v_old,
    E'    if not exists (select 1 from public.persons p where p.id = v_person and p.anonymized_at is null)   -- L1-F4: as unknown\n');

  -- a learner's return: the refusal of a person not recorded here, as for an id that names no one
  v_def := pg_get_functiondef('public.daftarkan_kembali(uuid,uuid,text,text,uuid,uuid)'::regprocedure);
  v_old := E'  perform 1 from public.persons where persons.id = p_person for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: daftarkan_kembali does not take the person''s row where it did'; end if;
  execute replace(v_def, v_old, v_old ||
    E'  -- L1-F4: an anonymised person is answered as an id that names no one\n'
    || E'  if exists (select 1 from public.persons where persons.id = p_person and persons.anonymized_at is not null) then\n'
    || E'    raise exception using errcode = ''PR070'', detail = ''PLACE_NOT_THIS_SCHOOL'', message = ''this person is not recorded at this school'';\n'
    || E'  end if;\n');

  -- the departed learners: an anonymised person is not offered
  v_def := pg_get_functiondef('public.murid_keluar(uuid)'::regprocedure);
  v_old := E'   where public.murid_sudah_keluar(p.id, p_sekolah)\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: murid_keluar does not choose its learners where it did'; end if;
  execute replace(v_def, v_old, v_old || E'     and p.anonymized_at is null   -- L1-F4\n');

  -- a certificate: one already issued is returned as before; a new one is not eligible, before it is written (§3b Option A)
  v_def := pg_get_functiondef('public.certificate_prepare(uuid,smallint)'::regprocedure);
  v_old := E'  select * into v_e from public.certificate_eligibility(p_session);\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: certificate_prepare does not ask eligibility where it did'; end if;
  execute replace(v_def, v_old,
    E'  -- L1-F4: no certificate for a person whose personal data was deleted\n'
    || E'  if exists (select 1 from public.persons p where p.id = v_s.person_id and p.anonymized_at is not null) then\n'
    || E'    raise exception ''not eligible: the holder''''s personal data was deleted'';\n'
    || E'  end if;\n' || v_old);

  -- a replacement (W2.22) would issue a new credential under the PINTAR ID; INV-30 keeps name_as_issued as it was
  v_def := pg_get_functiondef('public.sertifikat_koreksi_siapkan(uuid,text,smallint)'::regprocedure);
  v_old := E'  if v_c.status <> ''ISSUED'' then perform public.sertifikat_koreksi_tolak(''CERT_NOT_ISSUED''); end if;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: sertifikat_koreksi_siapkan does not check the status where it did'; end if;
  execute replace(v_def, v_old, v_old ||
    E'  if exists (select 1 from public.persons p where p.id = v_c.person_id and p.anonymized_at is not null) then\n'
    || E'    perform public.sertifikat_koreksi_tolak(''CERT_HOLDER_DELETED'');   -- L1-F4\n'
    || E'  end if;\n');
  -- a key correction: a certificate it newly earns for an anonymised person is earned but not issued (§3b Option A)
  v_def := pg_get_functiondef('public.koreksi_kunci_hitung_untuk(uuid,text[])'::regprocedure);
  v_old := E'''sertifikat_ditinjau'', v_berubah and v_cert is not null);';
  if position(v_old in v_def) = 0
     or position('v_daftar := v_daftar || jsonb_build_object(''sesi'', s.id,' in v_def) = 0 then
    raise exception 'L1-F4: koreksi_kunci_hitung_untuk does not list its sittings where it did';
  end if;
  v_def := replace(v_def, 'v_daftar := v_daftar || jsonb_build_object(''sesi'', s.id,', 'v_daftar := v_daftar || (jsonb_build_object(''sesi'', s.id,');
  execute replace(v_def, v_old,
    E'''sertifikat_ditinjau'', v_berubah and v_cert is not null)\n'
    || E'      -- L1-F4 (§3b Option A): newly earned for a person whose personal data was deleted: earned, not issued\n'
    || E'      || case when not exists (select 1 from public.certificates c where c.session_id = s.id)\n'
    || E'                   and public.sertifikat_layak_dengan(s.id, e.mastery, e.safety_gate_passed)\n'
    || E'                   and not public.sertifikat_layak_dengan(s.id, v_cur.mastery, v_cur.safety_gate_passed)\n'
    || E'                   and exists (select 1 from public.persons p where p.id = s.person_id and p.anonymized_at is not null)\n'
    || E'              then jsonb_build_object(''sertifikat_tidak_diterbitkan'', true) else ''{}''::jsonb end);');
  -- and the count beside sertifikat_baru_layak, which the confirmed correction's outcome keeps (its list it does not)
  v_def := pg_get_functiondef('public.koreksi_kunci_hitung_untuk(uuid,text[])'::regprocedure);
  v_old := E'''sertifikat_baru_layak'', n_baru,';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: koreksi_kunci_hitung_untuk does not count the newly earned where it did'; end if;
  execute replace(v_def, v_old, v_old
    || E' ''sertifikat_tidak_diterbitkan'', (select count(*)::int from jsonb_array_elements(v_daftar) x where x ? ''sertifikat_tidak_diterbitkan''),');
end $$;

-- ═══════════════════════════════════════════════════════════ (5) the deletion refuses on a live attachment
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure);
  v_old := E'  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: hapus_data_pribadi does not take the person''s row where it did'; end if;
  execute replace(v_def, v_old, v_old ||
    E'  -- L1-F4 (Sharon §3a.3): under this lock, a person who GAINED an attachment after their closure began (an enrolment,\n'
    || E'  -- a role, a place, a transfer or an evaluator grant created since) is not anonymised: the request stays open, nothing\n'
    || E'  -- is changed, and the platform administrator is told (ACCOUNT_LIVE_ATTACHMENT). What the person held at the closure\n'
    || E'  -- is the closure''s own state, kept by the deletion as before.\n'
    || E'  if exists (select 1 from public.person_suspensions x where x.person_id = r.person_id and x.ended_at is null\n'
    || E'               and x.category = ''CLOSED_AT_REQUEST''\n'
    || E'               and (exists (select 1 from public.enrollments e where e.person_id = r.person_id\n'
    || E'                              and e.status in (''PENDING'', ''ACTIVE'') and e.created_at > x.started_at)\n'
    || E'                    or exists (select 1 from public.role_assignments ra where ra.person_id = r.person_id and ra.revoked_at is null\n'
    || E'                                 and (ra.valid_until is null or ra.valid_until > now()) and ra.created_at > x.started_at)\n'
    || E'                    or exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id\n'
    || E'                                where e.person_id = r.person_id and m.valid_to is null and m.created_at > x.started_at)\n'
    || E'                    or exists (select 1 from public.transfers t where t.person_id = r.person_id\n'
    || E'                                 and t.status in (''REQUESTED'', ''AUTHORIZED'') and t.created_at > x.started_at)\n'
    || E'                    or exists (select 1 from public.evaluation_evaluators v where v.person_id = r.person_id\n'
    || E'                                 and v.revoked_at is null and v.granted_at > x.started_at))) then\n'
    || E'    perform public.akun_tolak(''ACCOUNT_LIVE_ATTACHMENT'');\n'
    || E'  end if;\n');
end $$;

-- ═══════════════════════════════════════════════════════════ (6) the migration's own check
do $$
declare n int;
begin
  select count(*) into n
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
   where c.contype = 'f' and c.confrelid = 'public.persons'::regclass
     and not exists (select 1 from public.orang_lampiran o where o.tabel = c.conrelid::regclass::text and o.kolom = a.attname);
  if n > 0 then raise exception 'L1-F4: % foreign key column(s) to persons are not classified', n; end if;
  select count(*) into n from public.orang_lampiran o
   where o.kelas = 'DIJAGA' and not exists (select 1 from pg_trigger t where t.tgname = '_l1f4_' || o.tabel || '_' || o.kolom);
  if n > 0 then raise exception 'L1-F4: % guarded column(s) have no trigger', n; end if;
end $$;
