-- ---------------------------------------------------------------------------
-- W2.22 (owner, 9 Nov: INCLUDE a minimal governed remedy in 4.0). AN ERRONEOUS CERTIFICATE IS CORRECTED BY ITS
-- REPLACEMENT, NEVER REWRITTEN.
--
-- «An authorized person must be able to correct, supersede or revoke an erroneous issued certificate without silently
--  rewriting its sealed history. Preserve the original, the reason, the actor, and any replacement relationship. Reuse
--  existing certificate mechanisms. Avoid a new subsystem.»
--
-- What already existed and is reused unchanged:
--   * revocation (revoke_certificate, the Konfigurasi · Sertifikat screen, W2.5);
--   * the chain: certificates.supersedes_certificate_id and the SUPERSEDED status, with ISSUED → SUPERSEDED the only way
--     in (enforce_certificate_write); certificates_one_root_per_session keeps the session's original as its root;
--   * the seal: the database prepares everything deterministic, the application signs with its keyring (INV-05), and
--     the learner's page already shows a superseded certificate under «Digantikan» with its replacement's own check;
--   * the holder's number sequence (certificate_number_counters, never reused) and the identity snapshot (INV-30).
--
-- New, and only this:
--   * two columns on the replacement, written once at its preparation: correction_reason and corrected_by_person_id;
--   * sertifikat_koreksi_pratinjau(certificate): what a replacement would carry, beside what was sealed (name, school,
--     course), read-only, for CAN_PUBLISH in the certificate's school (the authority that revokes it);
--   * sertifikat_koreksi_siapkan(certificate, reason, key_version): the replacement prepared as ELIGIBLE (not public):
--     a new snapshot of the holder's current name, the school's and the course's names now, the same result, release,
--     definition and scoring policy as the original's sealed payload, a new number from the holder's sequence and a new
--     token. Refused unless the original is ISSUED, a reason of 10–300 characters is given, and something would change;
--   * sertifikat_koreksi_segel(replacement, key_version, signature): service only, called by the server after signing:
--     in one transaction the replacement is sealed ISSUED and the original becomes SUPERSEDED. Its payload, snapshot,
--     number and token are untouched, and the public check answers «DIGANTIKAN» for it; one certificate.superseded audit
--     row names the reason, the actor and the replacement.
--   * one sealed replacement per certificate (certificates_one_sealed_replacement).
-- ---------------------------------------------------------------------------

alter table public.certificates
  add column correction_reason text check (correction_reason is null or char_length(btrim(correction_reason)) between 10 and 300),
  add column corrected_by_person_id uuid references public.persons(id),
  add constraint certificate_correction_is_a_replacement
    check ((correction_reason is null) = (corrected_by_person_id is null)
       and (correction_reason is null or supersedes_certificate_id is not null));

-- a certificate is replaced at most once (a further correction replaces the replacement)
create unique index certificates_one_sealed_replacement
  on public.certificates (supersedes_certificate_id) where supersedes_certificate_id is not null and status <> 'ELIGIBLE';

-- the correction's reason and actor are part of the replacement, as immutable as the rest (20261201100000's rule
-- otherwise unchanged)
create or replace function public.enforce_certificate_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a certificate is never deleted; revocation keeps the row (doc 16 §2)';
  end if;
  if tg_op = 'INSERT' then return new; end if;

  -- CORRECTED IN PLACE (undeployed; Sharon §14 on 6faef690, Low): a replacement prepared and not yet sealed (ELIGIBLE,
  -- unsigned, not public: verify_certificate answers nothing for it) is re-prepared in place when the administrator
  -- presses again with another reason or after the name changed again, so abandoned preparations never use up the
  -- holder's numbers. What identifies it stays: its session, holder, school, number, token and the certificate it
  -- replaces. Once sealed, every rule below holds.
  if old.status = 'ELIGIBLE' and new.status = 'ELIGIBLE' and old.supersedes_certificate_id is not null
     and old.signature is null and new.signature is null then
    if new.session_id <> old.session_id or new.person_id <> old.person_id or new.institution_id <> old.institution_id
       or new.certificate_number <> old.certificate_number or new.verification_token <> old.verification_token
       or new.supersedes_certificate_id is distinct from old.supersedes_certificate_id then
      raise exception 'a certificate is immutable; a correction is a new chain-linked row (§8)';
    end if;
    return new;
  end if;

  if new.session_id <> old.session_id or new.person_id <> old.person_id
     or new.institution_id <> old.institution_id or new.snapshot_id <> old.snapshot_id
     or new.certificate_number <> old.certificate_number
     or new.verification_token <> old.verification_token
     or new.issued_at is distinct from old.issued_at
     or new.issued_at_iso is distinct from old.issued_at_iso
     or new.canonical_payload is distinct from old.canonical_payload
     -- CR-02: what the certificate was issued under is part of it
     or new.institution_as_issued is distinct from old.institution_as_issued
     or new.course_subject_as_issued is distinct from old.course_subject_as_issued
     or new.course_title_as_issued is distinct from old.course_title_as_issued
     or new.language_as_issued is distinct from old.language_as_issued
     -- W2.22: the replacement relationship, its reason and its actor
     or new.supersedes_certificate_id is distinct from old.supersedes_certificate_id
     or new.correction_reason is distinct from old.correction_reason
     or new.corrected_by_person_id is distinct from old.corrected_by_person_id then
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
      else 'the certificate could not be corrected' end;
end $$;
revoke all on function public.sertifikat_koreksi_tolak(text) from public, anon, authenticated;

-- what a replacement would carry now, read from the records as they stand (no data before authorization)
create or replace function public.sertifikat_koreksi_kini(p_certificate uuid)
returns table (nama text, sekolah text, mapel text, kursus text)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.display_name, i.name, co.subject, co.title
    from public.certificates c
    join public.persons p on p.id = c.person_id
    join public.institutions i on i.id = c.institution_id
    join public.assessment_sessions s on s.id = c.session_id
    left join public.plp_releases r on r.id = s.plp_release_id
    left join public.courses co on co.id = r.course_id
   where c.id = p_certificate
$$;
revoke all on function public.sertifikat_koreksi_kini(uuid) from public, anon, authenticated;

create or replace function public.sertifikat_koreksi_pratinjau(p_certificate uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_c public.certificates; v_nama text; k record;
begin
  select * into v_c from public.certificates where id = p_certificate;
  if v_c.id is null or public.current_person_id() is null or not public.can_in_institution('CAN_PUBLISH', v_c.institution_id) then
    perform public.sertifikat_koreksi_tolak('CERT_NOT_ALLOWED');
  end if;
  select s.name_as_issued into v_nama from public.certificate_identity_snapshots s where s.id = v_c.snapshot_id;
  select * into k from public.sertifikat_koreksi_kini(p_certificate);
  return jsonb_build_object(
    'status', v_c.status, 'nomor', v_c.certificate_number,
    'nama_tercetak', v_nama, 'nama_kini', k.nama,
    'sekolah_tercetak', v_c.institution_as_issued, 'sekolah_kini', k.sekolah,
    'kursus_tercetak', v_c.course_title_as_issued, 'kursus_kini', k.kursus,
    'berubah', v_nama is distinct from k.nama or v_c.institution_as_issued is distinct from k.sekolah
               or v_c.course_title_as_issued is distinct from k.kursus or v_c.course_subject_as_issued is distinct from k.mapel,
    'pengganti', (select jsonb_build_object('id', n.id, 'nomor', n.certificate_number, 'status', n.status)
                    from public.certificates n where n.supersedes_certificate_id = v_c.id and n.status <> 'ELIGIBLE'));
end $$;
revoke all on function public.sertifikat_koreksi_pratinjau(uuid) from public, anon, authenticated;
grant execute on function public.sertifikat_koreksi_pratinjau(uuid) to authenticated;

create or replace function public.sertifikat_koreksi_siapkan(p_certificate uuid, p_reason text, p_key_version smallint)
returns table (certificate_id uuid, canonical_payload jsonb)
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;
revoke all on function public.sertifikat_koreksi_siapkan(uuid, text, smallint) from public, anon, authenticated;
grant execute on function public.sertifikat_koreksi_siapkan(uuid, text, smallint) to authenticated;

-- service only: the server has signed the replacement's payload; seal it and supersede the original, together
create or replace function public.sertifikat_koreksi_segel(p_replacement uuid, p_key_version smallint, p_signature text)
returns public.certificate_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n public.certificates; v_o public.certificates; v_namalama text; v_namabaru text;
begin
  select * into v_n from public.certificates where id = p_replacement for update;
  if v_n.id is null or v_n.supersedes_certificate_id is null or v_n.correction_reason is null then
    perform public.sertifikat_koreksi_tolak('CERT_REPLACEMENT_INVALID');
  end if;
  if v_n.status <> 'ELIGIBLE' then return v_n.status; end if;
  select * into v_o from public.certificates where id = v_n.supersedes_certificate_id for update;
  if v_o.status <> 'ISSUED' then perform public.sertifikat_koreksi_tolak('CERT_NOT_ISSUED'); end if;
  if public.certificate_seal(p_replacement, p_key_version, p_signature) <> 'ISSUED' then
    perform public.sertifikat_koreksi_tolak('CERT_REPLACEMENT_INVALID');
  end if;
  update public.certificates set status = 'SUPERSEDED' where id = v_o.id;
  select s.name_as_issued into v_namalama from public.certificate_identity_snapshots s where s.id = v_o.snapshot_id;
  select s.name_as_issued into v_namabaru from public.certificate_identity_snapshots s where s.id = v_n.snapshot_id;
  perform public.audit_write('certificate.superseded', 'certificates', v_o.id::text, v_o.institution_id,
    jsonb_build_object('certificate_id', v_o.id, 'number', v_o.certificate_number,
                       'replacement_id', v_n.id, 'replacement_number', v_n.certificate_number,
                       'reason', v_n.correction_reason, 'actor', v_n.corrected_by_person_id,
                       'changed', jsonb_strip_nulls(jsonb_build_object(
                         'name', case when v_namalama is distinct from v_namabaru then true end,
                         'school', case when v_o.institution_as_issued is distinct from v_n.institution_as_issued then true end,
                         'course', case when v_o.course_title_as_issued is distinct from v_n.course_title_as_issued
                                          or v_o.course_subject_as_issued is distinct from v_n.course_subject_as_issued then true end)),
                       'from', jsonb_build_object('status', 'ISSUED'), 'to', jsonb_build_object('status', 'SUPERSEDED')));
  return 'ISSUED';
end $$;
revoke all on function public.sertifikat_koreksi_segel(uuid, smallint, text) from public, anon, authenticated;
grant execute on function public.sertifikat_koreksi_segel(uuid, smallint, text) to service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('sertifikat_koreksi_pratinjau', 'STAFF',
   'W2.22: what a replacement of an issued certificate would carry (the holder''s name, the school and the course read '
   || 'now) beside what was sealed, and any replacement already sealed. CAN_PUBLISH in the certificate''s school.',
   'CAPABILITY', 'CAN_PUBLISH'),
  ('sertifikat_koreksi_siapkan', 'STAFF',
   'W2.22: prepares the replacement of an ISSUED certificate (ELIGIBLE, not public): a new snapshot, number and token, '
   || 'the original''s result, release and definition, the reason (10-300) and the actor. Refused when nothing would '
   || 'change. The server signs it and seals it with sertifikat_koreksi_segel (service only), which supersedes the '
   || 'original in the same transaction. Refusals PR120 with a code in DETAIL.',
   'CAPABILITY', 'CAN_PUBLISH')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('anon', 'public.sertifikat_koreksi_siapkan(uuid, text, smallint)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.sertifikat_koreksi_pratinjau(uuid)'::regprocedure, 'execute') then
    raise exception 'W2.22: an anonymous caller can correct a certificate';
  end if;
  if has_function_privilege('authenticated', 'public.sertifikat_koreksi_segel(uuid, smallint, text)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.sertifikat_koreksi_kini(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.sertifikat_koreksi_tolak(text)'::regprocedure, 'execute') then
    raise exception 'W2.22: the seal or an internal helper is callable by a client';
  end if;
end $$;
