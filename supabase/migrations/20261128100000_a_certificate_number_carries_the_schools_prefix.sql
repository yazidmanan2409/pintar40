-- ADM-18: A CERTIFICATE NUMBER CARRIES THE SCHOOL'S OWN PREFIX.
--
-- Studio's «Tata Letak Sertifikat» saves a certificate template per school, course or module with a number prefix
-- («Awalan nomor», save_certificate_template, 20260915160000), and the save is audited, but issuance never read it:
-- every number stayed PINTAR/<school>/<year>/<n> (release checklist ADM-18; a saved setting that changes nothing).
-- certificate_prepare now heads the number with the most specific template's prefix (the chapter's module, then its
-- course, then the whole school) and keeps PINTAR/<school> where none is saved: <prefix>/<year>/<n>, the prefix's own
-- shape (certificate_templates_prefix_shape) being that of a number's head. The sequence stays one per school, and a
-- number already taken is skipped (20261126100000). Certificates already issued keep their numbers (sealed, INV-05).
--
-- The template's layout is the printed sheet's, a screen's concern, and not changed here.

create or replace function public.certificate_prepare(p_session uuid, p_key_version smallint)
returns table (certificate_id uuid, canonical_payload jsonb, already_sealed boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_e record; v_s public.assessment_sessions; v_person public.persons; v_snap uuid;
  v_cert public.certificates; v_num text; v_token text; v_iso text; v_payload jsonb;
  v_release uuid; v_sha text; v_def uuid; v_defver integer; v_slug text; v_snaphash text;
  v_id uuid; v_photo_hash text; v_inst uuid; v_n bigint; v_head text; v_defmod uuid; v_defcourse uuid;
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
  -- the head of the number: the school's own prefix where it saved one in Studio («Awalan nomor»), the most specific
  -- template first (the chapter's module, then its course, then the whole school); otherwise PINTAR/<school> as before
  -- the chapter's module and course (a definition may name only its module; the course is then the module's)
  select d.module_id, coalesce(d.course_id, (select m.course_id from public.modules m where m.id = d.module_id))
    into v_defmod, v_defcourse from public.assessment_definitions d where d.id = v_def;
  select t.number_prefix into v_head from public.certificate_templates t
   where t.institution_id = v_s.institution_id
     and (t.module_id = v_defmod or t.course_id = v_defcourse or (t.module_id is null and t.course_id is null))
   order by (t.module_id is not null) desc, (t.course_id is not null) desc
   limit 1;
  v_head := coalesce(v_head, 'PINTAR/' || upper(coalesce(v_slug, 'NA')));
  -- the school's count plus one, read under the lock (one sequence per school, whatever the head); never a number
  -- already taken
  v_n := coalesce((select count(*) from public.certificates c where c.institution_id = v_s.institution_id), 0) + 1;
  loop
    v_num := v_head || '/' || to_char(now(), 'YYYY') || '/' || lpad(v_n::text, 5, '0');
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

-- verification: the number's head comes from the school's template, the rest of 20261126100000 stands
do $$
declare v_src text; v_def boolean; v_cfg text[];
begin
  select p.prosrc, p.prosecdef, p.proconfig into v_src, v_def, v_cfg from pg_proc p
   where p.oid = 'public.certificate_prepare(uuid, smallint)'::regprocedure;
  if v_src !~ 'certificate_templates' or v_src !~ 'number_prefix' then
    raise exception 'ADM-18: certificate_prepare does not read the school''s certificate template';
  end if;
  if v_src !~ 'pg_advisory_xact_lock' or v_src !~ 'exit when not exists' or v_src ~ 'v_person\.photo_path' then
    raise exception 'ADM-18 / D-085 T4: 20261126100000''s lock, skip or photo rule was lost';
  end if;
  if not v_def or not ('search_path=public, pg_temp' = any (v_cfg))
     or has_function_privilege('authenticated', 'public.certificate_prepare(uuid, smallint)', 'EXECUTE') then
    raise exception 'certificate_prepare lost SECURITY DEFINER, its pinned search_path, or became callable by a client';
  end if;
end $$;

