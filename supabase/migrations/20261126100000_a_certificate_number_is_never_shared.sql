-- ADM-18 (N8) and D-085 T4: A CERTIFICATE NUMBER IS NEVER SHARED, AND A CERTIFICATE CARRIES NO PHOTO.
--
-- certificate_prepare (20260914103000) numbered a school's certificates by counting them and adding one, with nothing
-- holding the count: two learners of one class finishing together read the same count, the second insert failed on
-- the unique number, and that learner's certificate waited for a later page load (release checklist ADM-18, N8). The
-- same session loaded twice could likewise insert twice and fail on one root per session. Now one preparation at a
-- time per school (a transaction-scoped advisory lock taken first), the count read under it, and a number already
-- taken is skipped. Nothing else of the numbering changes: the same format, the same sequence per school.
--
-- It also froze the person's photo into the certificate's identity snapshot, against D-085 T4 ("no student photo on
-- the card or certificate; a profile photo is permitted"). The snapshot now holds the name only. Certificates already
-- issued are untouched: their payloads are sealed (INV-05), and their snapshots are immutable (INV-30).
--
-- Everything else of the function is as it was: SECURITY DEFINER, search_path pinned, no client grant (§7).

create or replace function public.certificate_prepare(p_session uuid, p_key_version smallint)
returns table (certificate_id uuid, canonical_payload jsonb, already_sealed boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_e record; v_s public.assessment_sessions; v_person public.persons; v_snap uuid;
  v_cert public.certificates; v_num text; v_token text; v_iso text; v_payload jsonb;
  v_release uuid; v_sha text; v_def uuid; v_defver integer; v_slug text; v_snaphash text;
  v_id uuid; v_photo_hash text; v_inst uuid; v_n bigint;
begin
  -- N8: one preparation at a time per school, held until this transaction ends. Two learners of one class finishing
  -- together read the same count and took the same number (one of them failed on the unique number and waited for a
  -- later page load); the same session loaded twice inserted twice. Under the lock the second waits, then sees the
  -- first's certificate and number.
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = p_session;
  perform pg_advisory_xact_lock(hashtextextended('pintar:certificate_prepare:' || coalesce(v_inst::text, ''), 0));
  select * into v_cert from public.certificates
   where session_id = p_session and supersedes_certificate_id is null;
  if v_cert.id is not null then
    certificate_id := v_cert.id; canonical_payload := v_cert.canonical_payload;
    already_sealed := v_cert.status <> 'ELIGIBLE';
    return next; return;
  end if;

  select * into v_e from public.certificate_eligibility(p_session);
  if not v_e.eligible then raise exception 'not eligible: %', v_e.reason; end if;

  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_person from public.persons where id = v_s.person_id;
  select i.slug into v_slug from public.institutions i where i.id = v_s.institution_id;
  select s.plp_release_id, s.assessment_definition_id, s.assessment_definition_version
    into v_release, v_def, v_defver
    from public.assessment_sessions s where s.id = p_session;
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

  -- D3a: opaque, high-entropy, and derived from nothing. 32 random bytes in
  -- base64url; not the certificate number, not the session id, not a sequence.
  v_token := replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
  v_token := replace(v_token, '=', '');
  -- the school's count plus one, as before, read under the lock; and never a number already taken (a removed row or
  -- an older format cannot make two certificates share one)
  v_n := coalesce((select count(*) from public.certificates c where c.institution_id = v_s.institution_id), 0) + 1;
  loop
    v_num := 'PINTAR/' || upper(coalesce(v_slug, 'NA')) || '/' || to_char(now(), 'YYYY') || '/' || lpad(v_n::text, 5, '0');
    exit when not exists (select 1 from public.certificates c where c.certificate_number = v_num);
    v_n := v_n + 1;
  end loop;
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
    certificate_number, verification_token, status, issued_at_iso, canonical_payload)
  values (p_session, v_s.person_id, v_s.institution_id, v_snap, v_num, v_token,
          'ELIGIBLE', v_iso, v_payload)
  returning id into v_id;

  perform public.audit_write('certificate.prepared', 'certificates', v_id::text, v_s.institution_id,
    jsonb_build_object('certificate_id', v_id, 'session_id', p_session, 'number', v_num));
  certificate_id := v_id; canonical_payload := v_payload; already_sealed := false;
  return next;
end $$;

revoke all on function public.certificate_prepare(uuid, smallint) from public, anon, authenticated;
