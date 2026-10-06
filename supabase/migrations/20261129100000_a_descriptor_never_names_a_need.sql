-- D-121(a)(b), Q10 ALTERNATIVE 4: MASTERY AND THE PERFORMANCE DESCRIPTOR ARE SEPARATE.
--
-- «Mastery remains binary and uses the school's configured mastery threshold. PINTAR performance descriptors remain a
-- fixed cross-school scale: Cukup ≥70%, Baik ≥80%, Sangat Baik ≥90%. There is no PINTAR performance descriptor below
-- 70%. Therefore a learner may legitimately achieve the school's mastery threshold and receive a certificate without a
-- performance-label line. Do not redefine descriptor meanings according to each school's threshold.» (D-121(a))
--
-- The descriptor (predikat) is read from the bands of the scoring version an attempt was started under
-- (certificate_eligibility, 20261102100000), so the ruling is a new scoring version, prospective by construction:
--   1. pintar-scoring/2: pintar-scoring/1's rules, copied, with the descriptors Sangat Baik ≥ 0.90, Baik ≥ 0.80 and
--      Cukup ≥ 0.70 and no band below. pintar-scoring/1 is superseded by it. An attempt started before this migration
--      keeps pintar-scoring/1 and its «Perlu Pendampingan»; issued certificates are sealed and not touched (INV-30).
--   2. A published version's descriptors are part of it (INV-29): predikat_bands joins the immutable columns. Until now
--      they could be edited in place.
--   3. publish_scoring_policy carries the superseded version's descriptors forward, and the column default that named
--      «Perlu Pendampingan» is dropped: a later version can no longer bring the band back by omission.
--   4. finalize_session stamps the result with the scoring version its session was started under, not whichever
--      version is current when the learner finishes: the session's rules decide its result. recompute_result keeps the
--      current version: a recomputation is a correction under a named newer version (ADR-0007 §3).
--
-- D-121(b): the school's threshold is not printed, and the evidence is already kept: the threshold on the attempt
-- (assessment_sessions.pass_mark, sealed), the score (assessment_results.mastery), the mastery result, the descriptor
-- (null when none) and the version in the certificate's signed payload. Nothing is added to the payload.
--
-- ENGINE: pintar-engine/1 → pintar-engine/2 (D-060(b): finalization semantics changed, point 4).
-- METRIC CATALOGUE: unchanged; no calc_* body, metric source view or readiness rule is touched here.

-- 2. the descriptors are part of a published version
create or replace function public.enforce_scoring_policy_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a scoring policy version is never deleted: historical results resolve to it (INV-29)';
  end if;
  if tg_op = 'UPDATE' then
    if new.version <> old.version or new.passing_rules is distinct from old.passing_rules
       or new.safety_critical is distinct from old.safety_critical
       or new.weighting is distinct from old.weighting
       or new.partial_credit is distinct from old.partial_credit
       or new.timeout_policy is distinct from old.timeout_policy
       or new.late_sync_policy is distinct from old.late_sync_policy
       or new.effective_from is distinct from old.effective_from
       or new.predikat_bands is distinct from old.predikat_bands then
      raise exception 'a published scoring policy is immutable; publish a new version (INV-29, doc 08)';
    end if;
    if old.superseded_by is not null and new.superseded_by is distinct from old.superseded_by then
      raise exception 'a superseded policy version is already closed';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_scoring_policy_write() from public, anon, authenticated;

-- 3. the next publication carries the descriptors forward; no default names a band
create or replace function public.publish_scoring_policy(
  p_version text, p_passing_rules jsonb, p_safety_critical jsonb, p_weighting jsonb,
  p_partial_credit jsonb, p_timeout_policy jsonb, p_late_sync_policy jsonb, p_note text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_prev text; v_actor uuid; v_bands jsonb;
begin
  if not public.is_system_admin() then
    raise exception 'publishing a scoring policy requires SYSTEM_ADMIN';
  end if;
  v_actor := public.current_person_id();
  select p.version, p.predikat_bands into v_prev, v_bands from public.scoring_policy p
   where p.superseded_by is null order by p.effective_from desc, p.version desc limit 1;
  if v_bands is null then
    raise exception 'a scoring policy carries its descriptors forward from the version it supersedes, and there is none (D-121)';
  end if;

  insert into public.scoring_policy (version, passing_rules, safety_critical, weighting,
    partial_credit, timeout_policy, late_sync_policy, note, published_by, predikat_bands)
  values (p_version, p_passing_rules, p_safety_critical, p_weighting,
          p_partial_credit, p_timeout_policy, p_late_sync_policy, p_note, v_actor, v_bands);

  update public.scoring_policy set superseded_by = p_version where version = v_prev;
  perform public.audit_write('scoring_policy.published', 'scoring_policy', p_version, null,
    jsonb_build_object('version', p_version, 'supersedes', v_prev, 'note', p_note));
  return p_version;
end $$;
revoke all on function public.publish_scoring_policy(text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.publish_scoring_policy(text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text) to authenticated;

alter table public.scoring_policy alter column predikat_bands drop default;

-- 1. pintar-scoring/2, published by the migration itself (no person: the ruling is the owner's, D-121)
insert into public.scoring_policy (version, passing_rules, safety_critical, weighting, partial_credit, timeout_policy,
  late_sync_policy, note, published_by, predikat_bands)
select 'pintar-scoring/2', p.passing_rules, p.safety_critical, p.weighting, p.partial_credit, p.timeout_policy,
       p.late_sync_policy,
       'D-121(a), Q10 Alternative 4: the rules of pintar-scoring/1; the descriptors are PINTAR''s fixed cross-school scale, '
         || 'Sangat Baik >= 0.90, Baik >= 0.80, Cukup >= 0.70, and none below 0.70. Mastery stays the school''s sealed mark.',
       null,
       jsonb_build_array(jsonb_build_object('min', 0.90, 'predikat', 'Sangat Baik'),
                         jsonb_build_object('min', 0.80, 'predikat', 'Baik'),
                         jsonb_build_object('min', 0.70, 'predikat', 'Cukup'))
  from public.scoring_policy p where p.version = 'pintar-scoring/1';
update public.scoring_policy set superseded_by = 'pintar-scoring/2' where version = 'pintar-scoring/1';
select public.audit_write('scoring_policy.published', 'scoring_policy', 'pintar-scoring/2', null,
  jsonb_build_object('version', 'pintar-scoring/2', 'supersedes', 'pintar-scoring/1', 'decision', 'D-121(a)'));

-- 4. a result is decided under its session's own version
create or replace function public.finalize_session(p_session uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;
revoke all on function public.finalize_session(uuid) from public, anon, authenticated;
grant execute on function public.finalize_session(uuid) to service_role;

-- the engine version (D-060(b))
create or replace function public.engine_version() returns text
language sql immutable parallel safe set search_path = public, pg_temp as $$ select 'pintar-engine/2'::text $$;
revoke all on function public.engine_version() from public, anon;
grant execute on function public.engine_version() to authenticated, service_role;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_bands jsonb;
begin
  if public.scoring_policy_version() <> 'pintar-scoring/2' then
    raise exception 'pintar-scoring/2 is not the current scoring version';
  end if;
  select p.predikat_bands into v_bands from public.scoring_policy p where p.version = 'pintar-scoring/2';
  if exists (select 1 from jsonb_array_elements(v_bands) b where (b ->> 'min')::numeric < 0.70) or jsonb_array_length(v_bands) <> 3 then
    raise exception 'pintar-scoring/2 names a descriptor below 0.70';
  end if;
  if not exists (select 1 from public.scoring_policy p where p.version = 'pintar-scoring/1'
                  and p.superseded_by = 'pintar-scoring/2'
                  and exists (select 1 from jsonb_array_elements(p.predikat_bands) b where b ->> 'predikat' = 'Perlu Pendampingan')) then
    raise exception 'pintar-scoring/1 is not kept as it was, superseded by pintar-scoring/2';
  end if;
  if (select column_default from information_schema.columns where table_schema = 'public' and table_name = 'scoring_policy'
       and column_name = 'predikat_bands') is not null then
    raise exception 'predikat_bands still has a default';
  end if;
  if public.engine_version() <> 'pintar-engine/2' then raise exception 'the engine version did not move'; end if;
end $$;
