-- CI-1 · A NOW-FAILING RESULT IS NEVER CONFIRMED, AND NEVER READ AS VALID (ruling 97; L-67, Sharon's AUDIT79-J7-1.md).
--
-- Spec: docs/post-4.1/ci-1/CI-1-SPEC.md (d152e9ef on claude/bob-41-master-plan) with Sharon's binding pre-build review
-- (§6, CI-1-PREBUILD-d99fa8d3.md). Red first: selftest/ci1.test.ts (docs/post-4.1/ci-1/RED-429b7dcc.txt).
--
-- L-67: after an answer-key correction recalculates a certified result to a fail, the school could press «Konfirmasi
-- berlaku» and the public check then read «Berlaku · Lulus», although the result in force contradicts it.
--
--   (1) ONE RULE ON THE RESULT IN FORCE. sertifikat_hasil_lulus(session): the certifying rule's parts, as
--       certificate_eligibility asks them at issue (the sitting certifies, OFFICIAL evidence, a sealed mark, the gate,
--       mastery at or above the mark), on the result in force, hasil_murid_id, never the newest row (hasil_terkini_id) and
--       never mastery alone. «The sitting certifies» is its CAPTURED bersertifikasi (D2-R, sealed at the start), not today's
--       mode_policy.certifies (Bob 13:23Z): a policy toggle never changes the standing of a certificate already issued.
--   (2) S-1. putuskan_tinjauan_sertifikat refuses CONFIRMED while that rule fails, PR190 CERT_REVIEW_RESULT_NO_LONGER_PASSES,
--       and writes nothing. Lock order (Sharon §6 (c)): the review FOR UPDATE, then the sitting's row (A2A order; the
--       recalculation, hitung_ulang_koreksi_kunci, writes under it), and only then the result in force is read. REVOKED is
--       unchanged.
--   (3) S-2. ONE helper, sertifikat_dipersoalkan(certificate): a review is open, OR the certificate is ISSUED and its result
--       in force fails. Read by every reader that states validity: verify_certificate (public), sertifikat_saya_ditinjau
--       (the learner: the certificate page, the card and its print, the A4 sheet through the card's data),
--       tinjauan_sertifikat_dikonfirmasi (the staff «dikonfirmasi» note) and sertifikat_dipersoalkan_sekolah (new: the staff
--       list's questioned set, read under sertifikat_sekolah's own rule). The states (Sharon §6 (a)): REVOKED -> DICABUT;
--       SUPERSEDED -> DIGANTIKAN; ISSUED with the helper true -> DITINJAU; otherwise BERLAKU. DICABUT never comes from the
--       result alone: a row wrongly CONFIRMED has no revocation, and DITINJAU is the true statement until the school revokes.
--
-- What it keeps (ruling 97 §2): it writes no record, only the new staff read's client_rpc_registry row (its exposure
-- class, F04-T14, metadata as every client RPC has); every certificate, review, result and audit row stays as it is, the
-- sealed payload as issued. The correction procedures are unchanged but that CONFIRMED is no longer possible on a now-failing
-- result. The public boundary is unchanged: verify_certificate's OUT columns and types (predikat still null), no new public
-- field, the recalculated result never stated publicly; assert_public_surface() is asserted below.

begin;

-- ═══════════════════════════════════════════════════════════ (1) the certifying rule on the result in force
create or replace function public.sertifikat_hasil_lulus(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  -- the certifying rule's parts, as certificate_eligibility asks them at issue, on the result in force: the sitting's
  -- CAPTURED purpose (bersertifikasi, sealed at its start; Bob 13:23Z: a later mode_policy toggle never changes the
  -- standing of a certificate issued under the old policy), OFFICIAL evidence, a sealed mark, the gate, mastery at the mark
  select coalesce((select s.bersertifikasi
                          and exists (select 1 from public.official_sessions o where o.id = s.id)
                          and s.pass_mark is not null and r.mastery is not null
                          and coalesce(r.safety_gate_passed, false) and r.mastery >= s.pass_mark
                     from public.assessment_sessions s
                     left join public.assessment_results r on r.id = public.hasil_murid_id(p_session)
                    where s.id = p_session), false)
$$;
revoke all on function public.sertifikat_hasil_lulus(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (3) the one helper
create or replace function public.sertifikat_dipersoalkan(p_certificate uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select public.sertifikat_ditinjau(c.id)
                          or (c.status = 'ISSUED' and not public.sertifikat_hasil_lulus(c.session_id))
                     from public.certificates c where c.id = p_certificate), false)
$$;
revoke all on function public.sertifikat_dipersoalkan(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (2) S-1: the refusal's code
create or replace function public.koreksi_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  raise exception using
    errcode = 'PR190',
    detail  = p_code,
    message = case p_code
      when 'CORRECTION_NOT_ALLOWED'          then 'a key correction is proposed by the content''s owner: CAN_PUBLISH through a role of the owning school (the platform library: its own tenant)'
      when 'CORRECTION_UNKNOWN'              then 'this key correction or question is not known'
      when 'CORRECTION_ITEM_NOT_PUBLISHED'   then 'only a question of published material has its key corrected'
      when 'CORRECTION_NOT_IN_HEAD'          then 'this question was changed in a newer version of the package; that version''s question is the one corrected'
      when 'CORRECTION_OPEN_REVISION'        then 'an unfinished revision of this package is open: finish it (submit, review, lock, publish) or discard it (buang_draf), then propose or confirm the key correction again'
      when 'CORRECTION_KEY_INVALID'          then 'the new key names options of this question: exactly one for a single-answer question, at least one otherwise'
      when 'CORRECTION_KEY_UNCHANGED'        then 'the new key is the key the question already has'
      when 'CORRECTION_REASON_REQUIRED'      then 'the reason is 10 to 300 characters'
      when 'CORRECTION_PENDING'              then 'a correction of this question is already waiting for its second person'
      when 'CORRECTION_ALREADY_DECIDED'      then 'this correction has already been confirmed or declined'
      when 'CORRECTION_OWN_PROPOSAL'         then 'the person who proposed a correction does not confirm or decline it'
      when 'CORRECTION_CONFIRM_NOT_ALLOWED'  then 'a correction is confirmed by another person holding CAN_PUBLISH or CAN_REVIEW over this content in its own tenant'
      when 'CORRECTION_PROPOSER_LAPSED'      then 'the person who proposed this correction no longer owns the content; it is proposed again'
      when 'CORRECTION_STALE'                then 'the question changed after this correction was proposed; it is proposed again'
      when 'CORRECTION_NOT_READY'            then 'the corrected revision could not be published as it stands'
      when 'CORRECTION_SITTING_NOT_AFFECTED' then 'this sitting did not present the corrected question; it is not recalculated'
      when 'CORRECTION_CONCURRENT'           then 'another correction recalculated this sitting at the same moment; nothing was written, try again'
      when 'RESULT_NOT_VISIBLE'              then 'this sitting''s results are read by its own learner and by those who may see them'
      when 'CERT_REVIEW_UNKNOWN'             then 'this certificate review is not known'
      when 'CERT_REVIEW_NOT_ALLOWED'         then 'a certificate review is decided by the issuing school''s CAN_PUBLISH (a Professional Development certificate: the platform admin)'
      when 'CERT_REVIEW_DECIDED'             then 'this certificate review has already been decided'
      when 'CERT_REVIEW_DECISION_INVALID'    then 'a certificate review is decided CONFIRMED or REVOKED'
      when 'CERT_REVIEW_REASON_REQUIRED'     then 'the decision records why, in 10 to 300 characters'
      when 'CERT_REVIEW_RESULT_NO_LONGER_PASSES' then 'the result now in force no longer passes, so this certificate cannot be confirmed as valid; it can be revoked'
      else 'the correction could not be saved' end;
end $function$;
revoke all on function public.koreksi_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (2) S-1: the decision
create or replace function public.putuskan_tinjauan_sertifikat(p_review uuid, p_keputusan text, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_me uuid := public.current_person_id(); v public.certificate_reviews; c public.certificates;
        v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  select * into v from public.certificate_reviews where id = p_review for update;
  if v.id is null then perform public.koreksi_tolak('CERT_REVIEW_UNKNOWN'); end if;
  if v_me is null or not public.boleh_putuskan_tinjauan(v.certificate_id) then perform public.koreksi_tolak('CERT_REVIEW_NOT_ALLOWED'); end if;
  if v.decision is not null then perform public.koreksi_tolak('CERT_REVIEW_DECIDED'); end if;
  if p_keputusan is null or p_keputusan not in ('CONFIRMED', 'REVOKED') then perform public.koreksi_tolak('CERT_REVIEW_DECISION_INVALID'); end if;
  if char_length(v_alasan) not between 10 and 300 then perform public.koreksi_tolak('CERT_REVIEW_REASON_REQUIRED'); end if;
  select * into c from public.certificates where id = v.certificate_id;
  if p_keputusan = 'REVOKED' and c.status = 'ISSUED' then
    perform public.revoke_certificate(c.id, v_alasan);
  end if;
  update public.certificate_reviews set decision = p_keputusan, decided_at = now(), decided_by_person_id = v_me, reason = v_alasan
   where id = p_review;
  perform public.audit_write('certificate.review_decided', 'certificates', c.id::text, c.institution_id,
    jsonb_build_object('certificate_id', c.id, 'review', p_review, 'decision', p_keputusan, 'reason', v_alasan,
                       'key_correction', v.key_correction_id,
                       'from', jsonb_build_object('status', c.status, 'under_review', true),
                       'to', jsonb_build_object('status', case when p_keputusan = 'REVOKED' then 'REVOKED' else c.status::text end, 'under_review', false)));
  -- CI-1 S-1 (ruling 97; Sharon §6 (c)): a CONFIRMED decision needs the result in force to pass. The review is locked first
  -- (above), then the sitting's row (A2A order), and only then is the result in force read, so a recalculation running now
  -- (hitung_ulang_koreksi_kunci writes under that lock) is waited for, not missed. A refusal raises, so the decision and its
  -- audit row above are undone with it: nothing is written. Placed after those writes because A2A-L01 ranks persons (which
  -- the review's decided_by_person_id and revoke_certificate take) before assessment_sessions.
  if p_keputusan = 'CONFIRMED' then
    perform 1 from public.assessment_sessions s where s.id = v.session_id for update;
    if not public.sertifikat_hasil_lulus(v.session_id) then perform public.koreksi_tolak('CERT_REVIEW_RESULT_NO_LONGER_PASSES'); end if;
  end if;
  return jsonb_build_object('ok', true, 'tinjauan', p_review, 'keputusan', p_keputusan,
                            'status', (select x.status from public.certificates x where x.id = c.id));
end $function$;
revoke all on function public.putuskan_tinjauan_sertifikat(uuid, text, text) from public, anon;
grant execute on function public.putuskan_tinjauan_sertifikat(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) S-2: the public read
create or replace function public.verify_certificate(p_token text)
returns table(pass boolean, predikat text, institution text, date text, validity text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_c public.certificates; v_inst text;
begin
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  -- an unknown token yields no row at all: no existence oracle, no distinguishable error
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;   -- not yet issued is not public
  select i.name into v_inst from public.institutions i where i.id = v_c.institution_id;
  -- as issued (the sealed payload), never the recalculated result: a token holder gets no personal result
  pass       := (v_c.canonical_payload -> 'result' ->> 'passed')::boolean;
  -- D2-R (R-c, rev. 4): the band is not public. The column stays (the contract is unchanged; null was already allowed,
  -- below 70%); the band stays in the sealed payload, certificate_eligibility and the internal reports
  predikat   := null;
  -- CR-02: the school's name as issued; a certificate issued before the seal reads it as before
  institution:= coalesce(v_c.institution_as_issued, v_inst);
  -- D-199 (owner, 10 Nov): the issuing school's issue day, on its own clock (WIB when the school keeps none)
  date       := to_char((v_c.issued_at_iso::timestamptz) at time zone coalesce(
                  (select i.zona_waktu from public.institutions i where i.id = v_c.institution_id), 'Asia/Jakarta'), 'YYYY-MM-DD');
  -- CI-1 S-2 (Sharon §6 (a)): DICABUT only from a revocation; an issued certificate whose review is open or whose result in
  -- force no longer passes is DITINJAU, never BERLAKU
  validity   := case v_c.status when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN'
                                when 'ISSUED' then case when public.sertifikat_dipersoalkan(v_c.id) then 'DITINJAU' else 'BERLAKU' end end;
  return next;
end $function$;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (3) S-2: the learner's own read
create or replace function public.sertifikat_saya_ditinjau(p_session uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $function$
begin
  if not public.session_is_mine(p_session) then perform public.koreksi_tolak('RESULT_NOT_VISIBLE'); end if;
  -- CI-1 S-2: the certificate page, the card and its print read it under review while the helper says so
  return coalesce(public.sertifikat_dipersoalkan(public.sertifikat_sesi_kini(p_session)), false);
end $function$;
revoke all on function public.sertifikat_saya_ditinjau(uuid) from public, anon;
grant execute on function public.sertifikat_saya_ditinjau(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) S-2: the staff reads
create or replace function public.tinjauan_sertifikat_dikonfirmasi(p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null or not (public.peran_tenant_punya(v_me, 'CAN_PUBLISH', p_institution) or public.is_system_admin()) then
    perform public.koreksi_tolak('CERT_REVIEW_NOT_ALLOWED');
  end if;
  -- CI-1 S-2: «dikonfirmasi» is said only of a certificate the helper does not question
  return coalesce((select jsonb_agg(jsonb_build_object('sertifikat', x.certificate_id, 'alasan', x.reason, 'pada', x.decided_at))
      from (select distinct on (v.certificate_id) v.certificate_id, v.reason, v.decided_at, v.decision
              from public.certificate_reviews v
             where v.institution_id = p_institution and v.decision is not null and public.boleh_putuskan_tinjauan(v.certificate_id)
             order by v.certificate_id, v.decided_at desc) x
     where x.decision = 'CONFIRMED' and not public.sertifikat_dipersoalkan(x.certificate_id)), '[]'::jsonb);
end $function$;
revoke all on function public.tinjauan_sertifikat_dikonfirmasi(uuid) from public, anon;
grant execute on function public.tinjauan_sertifikat_dikonfirmasi(uuid) to authenticated;

-- The staff list's questioned set (Konfigurasi «Sertifikat»): the issued certificates the helper questions, read under
-- sertifikat_sekolah's own rule (the school's CAN_PUBLISH; every school, the platform admin)
create or replace function public.sertifikat_dipersoalkan_sekolah(p_sekolah uuid)
returns setof uuid language plpgsql stable security definer set search_path = public, pg_temp as $function$
begin
  if public.current_person_id() is null
     or (p_sekolah is null and not public.is_system_admin())
     or (p_sekolah is not null and not public.can_in_institution('CAN_PUBLISH', p_sekolah)) then
    raise exception using errcode = '42501', detail = 'DITOLAK',
      message = 'reading a school''s certificates requires CAN_PUBLISH in that school';
  end if;
  return query
    select c.id from public.certificates c
     where c.status = 'ISSUED' and (p_sekolah is null or c.institution_id = p_sekolah)
       and public.sertifikat_dipersoalkan(c.id);
end $function$;
revoke all on function public.sertifikat_dipersoalkan_sekolah(uuid) from public, anon;
grant execute on function public.sertifikat_dipersoalkan_sekolah(uuid) to authenticated;
-- its exposure class, as every client RPC has (F04-T14): the one row this migration writes, metadata, no record
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('sertifikat_dipersoalkan_sekolah', 'STAFF',
   'CI-1 S-2: the ids of one school''s issued certificates (every school for Admin platform with no school) that the one '
   'validity helper questions (a review open, or the result in force no longer passes), so the list reads them «Sedang '
   'ditinjau», never «Berlaku»; only for whom sertifikat_sekolah accepts (CAN_PUBLISH in that school). Ids only. Read only.',
   'CAPABILITY', 'CAN_PUBLISH')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ═══════════════════════════════════════════════════════════ what stands
do $$
declare v_ok boolean; v_detail text;
begin
  if pg_get_function_result('public.verify_certificate(text)'::regprocedure)
     <> 'TABLE(pass boolean, predikat text, institution text, date text, validity text)' then
    raise exception 'CI-1: verify_certificate''s OUT columns changed';
  end if;
  if has_function_privilege('anon', 'public.sertifikat_dipersoalkan(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.sertifikat_dipersoalkan(uuid)', 'execute')
     or has_function_privilege('anon', 'public.sertifikat_dipersoalkan_sekolah(uuid)', 'execute') then
    raise exception 'CI-1: the helper or the staff read is reachable by a caller it is not for';
  end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if not v_ok then raise exception 'CI-1: assert_public_surface fails: %', v_detail; end if;
end $$;

commit;
