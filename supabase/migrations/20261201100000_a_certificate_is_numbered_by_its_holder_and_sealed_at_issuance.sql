-- BOB-48, CR-02 and CR-01: A CERTIFICATE IS SEALED AT ISSUANCE, AND NUMBERED BY ITS HOLDER.
--
-- CR-02 (D-078(c), D-077(d), D-076(e)): «a historical certificate never silently changes meaning because the
-- application's current state changed. It covers the course, the school name and the language.» The holder's name was
-- already sealed (INV-30, certificate_identity_snapshots); the school's name was read live on the certificate page and
-- on the public check, and the course from the learner's current assignments. Now each certificate carries, from the
-- moment it is prepared:
--   institution_as_issued        the school's name then
--   course_subject_as_issued     the subject and the title of the course its own release teaches
--   course_title_as_issued
--   language_as_issued           the certificate's language, fixed at issuance: 'id' (Bahasa Indonesia; D-078(c),
--                                BOB-48 (3), unless Yazid rules otherwise)
-- and they are immutable (enforce_certificate_write). The learner's certificate (my_certificate) and the public check
-- (verify_certificate) read them. Certificates issued before this migration carry none (no backfill: D-076(e) forbids
-- inventing what was shown then), so for them the readers fall back to what they read before; staging's three are the
-- only such rows, production has none.
--
-- CR-01 (D-080(2)(9), D-120 Q1, already decided): the number is `<PINTAR ID>/<sequence>`, the holder's own PINTAR ID
-- and their own five-digit sequence, one indivisible value. The sequence is held per person
-- (certificate_number_counters), taken under the person's row lock, never reset, never reused (BOB-48 (6)); the global
-- unique index stays as the backstop. Studio's «Awalan nomor» is retired: save_certificate_template no longer takes a
-- prefix, and the column is kept as history only. Certificates already issued keep their numbers (INV-30).
--
-- The signed payload's shape is unchanged; only the number's value is formed differently, so existing signatures and
-- the payload contract stand. ENGINE: unchanged (no grading, assembly or finalization semantics). METRIC CATALOGUE:
-- unchanged (academic_certificates and scoped_certificates read neither the number nor the new columns).

-- ═══════════════════════════════════════════════════════════ the seal
alter table public.certificates
  add column institution_as_issued text,
  add column course_subject_as_issued text,
  add column course_title_as_issued text,
  add column language_as_issued text check (language_as_issued is null or language_as_issued in ('id', 'en'));

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
     or new.canonical_payload is distinct from old.canonical_payload
     -- CR-02: what the certificate was issued under is part of it
     or new.institution_as_issued is distinct from old.institution_as_issued
     or new.course_subject_as_issued is distinct from old.course_subject_as_issued
     or new.course_title_as_issued is distinct from old.course_title_as_issued
     or new.language_as_issued is distinct from old.language_as_issued then
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

-- ═══════════════════════════════════════════════════════════ the holder's sequence
create table public.certificate_number_counters (
  person_id     uuid primary key references public.persons(id),
  last_sequence integer not null default 0 check (last_sequence between 0 and 99999),
  updated_at    timestamptz not null default now()
);
comment on table public.certificate_number_counters is
  'BOB-48 (6), D-080(2): each holder''s certificate sequence, taken under the row lock in certificate_prepare. It only '
  'goes up: a number is never reused.';
alter table public.certificate_number_counters enable row level security;
revoke all on table public.certificate_number_counters from public, anon, authenticated;

create or replace function public.certificate_number_counter_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a certificate sequence is never deleted: a number would be reused (D-080(2))';
  end if;
  if new.person_id <> old.person_id or new.last_sequence <= old.last_sequence then
    raise exception 'a certificate sequence only goes up: a number is never reused (D-080(2))';
  end if;
  return new;
end $$;
revoke all on function public.certificate_number_counter_guard() from public, anon, authenticated;
create trigger certificate_number_counters_guard before update or delete on public.certificate_number_counters
  for each row execute function public.certificate_number_counter_guard();

-- ═══════════════════════════════════════════════════════════ preparation: the seal and the number
create or replace function public.certificate_prepare(p_session uuid, p_key_version smallint)
returns table (certificate_id uuid, canonical_payload jsonb, already_sealed boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;
revoke all on function public.certificate_prepare(uuid, smallint) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the learner's certificate reads the seal
drop function public.my_certificate(uuid);
create function public.my_certificate(p_session uuid)
returns table (certificate_id uuid, certificate_number text, verification_token text, status public.certificate_status,
               issued_at_iso text, predikat text, name_as_issued text, institution_as_issued text,
               course_subject_as_issued text, course_title_as_issued text, language_as_issued text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  -- a certificate issued before the seal (20261201100000) carries none: what it was read under before, the school's
  -- name and its own release's course, in Bahasa Indonesia
  return query
    select c.id, c.certificate_number, c.verification_token, c.status, c.issued_at_iso,
           c.canonical_payload -> 'result' ->> 'predikat', s.name_as_issued,
           coalesce(c.institution_as_issued, i.name),
           coalesce(c.course_subject_as_issued, co.subject),
           coalesce(c.course_title_as_issued, co.title),
           coalesce(c.language_as_issued, 'id')
      from public.certificates c
      join public.certificate_identity_snapshots s on s.id = c.snapshot_id
      join public.institutions i on i.id = c.institution_id
      join public.assessment_sessions ss on ss.id = c.session_id
      left join public.plp_releases r on r.id = ss.plp_release_id
      left join public.courses co on co.id = r.course_id
     where c.session_id = p_session and c.supersedes_certificate_id is null;
end $$;
revoke all on function public.my_certificate(uuid) from public, anon;
grant execute on function public.my_certificate(uuid) to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the public check reads the seal
create or replace function public.verify_certificate(p_token text)
returns table (pass boolean, predikat text, institution text, date text, validity text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
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
  date       := left(v_c.issued_at_iso, 10);
  validity   := case v_c.status when 'ISSUED' then 'BERLAKU'
                                when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN' end;
  return next;
end $$;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;
grant execute on function public.verify_certificate(text) to service_role;

-- ═══════════════════════════════════════════════════════════ «Awalan nomor» retired
alter table public.certificate_templates alter column number_prefix drop not null;
comment on column public.certificate_templates.number_prefix is
  'History only: «Awalan nomor» is retired (D-080(2), D-120 Q1). A certificate number is <PINTAR ID>/<sequence>.';

drop function public.save_certificate_template(uuid, uuid, uuid, text, text);
create function public.save_certificate_template(p_institution uuid, p_course uuid, p_module uuid, p_layout text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'saving a certificate template requires an authenticated actor'; end if;
  if not public.can_in_institution('CAN_PUBLISH', p_institution) then
    raise exception 'the certificate template manager requires CAN_PUBLISH in the owning institution';
  end if;
  if p_course is not null and not exists (
       select 1 from public.courses c where c.id = p_course and c.institution_id = p_institution) then
    raise exception 'that course belongs to another institution (INV-13)';
  end if;
  if p_module is not null and not exists (
       select 1 from public.modules m where m.id = p_module and m.institution_id = p_institution) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  insert into public.certificate_templates
    (institution_id, course_id, module_id, layout, created_by_person_id)
  values (p_institution, p_course, p_module, p_layout, v_actor)
  on conflict (institution_id, coalesce(course_id, module_id, institution_id)) do update
    set layout = excluded.layout, created_by_person_id = excluded.created_by_person_id
  returning id into v_id;

  perform public.audit_write('CERTIFICATE_TEMPLATE_SAVED', 'certificate_templates', v_id::text,
    p_institution,
    jsonb_build_object('course_id', p_course, 'module_id', p_module, 'layout', p_layout,
                       'identity_presentation', 'NAME_ONLY'));
  return v_id;
end $$;
revoke all on function public.save_certificate_template(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.save_certificate_template(uuid, uuid, uuid, text) to authenticated;
update public.client_rpc_registry
   set note = 'Layout per institution, course or module. CAN_PUBLISH only. The number prefix («Awalan nomor») is retired: '
           || 'a certificate number is <PINTAR ID>/<sequence> (D-080(2), D-120 Q1). Identity presentation is NAME_ONLY and '
           || 'is not a parameter, because OD-10 has not been answered.'
 where function_name = 'save_certificate_template';

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_src text; v_def boolean; v_cfg text[];
begin
  select p.prosrc, p.prosecdef, p.proconfig into v_src, v_def, v_cfg from pg_proc p
   where p.oid = 'public.certificate_prepare(uuid, smallint)'::regprocedure;
  if v_src ~ 'certificate_templates' or v_src ~ 'number_prefix' or v_src ~ 'pg_advisory_xact_lock' then
    raise exception 'CR-01: certificate_prepare still reads a number prefix or the per-school lock';
  end if;
  if v_src !~ 'certificate_number_counters' or v_src !~ 'for update' or v_src !~ 'pintar_id' or v_src !~ 'exit when not exists'
     or v_src !~ 'institution_as_issued' or v_src ~ 'v_person\.photo_path' then
    raise exception 'CR-01 / CR-02 / D-085 T4: the holder''s sequence, the seal, the skip or the photo rule is missing';
  end if;
  if not v_def or not ('search_path=public, pg_temp' = any (v_cfg))
     or has_function_privilege('authenticated', 'public.certificate_prepare(uuid, smallint)', 'EXECUTE') then
    raise exception 'certificate_prepare lost SECURITY DEFINER, its pinned search_path, or became callable by a client';
  end if;
  if to_regprocedure('public.save_certificate_template(uuid, uuid, uuid, text, text)') is not null then
    raise exception '«Awalan nomor» can still be saved';
  end if;
  if has_table_privilege('authenticated', 'public.certificate_number_counters', 'select') then
    raise exception 'a client can read the certificate sequences';
  end if;
end $$;
