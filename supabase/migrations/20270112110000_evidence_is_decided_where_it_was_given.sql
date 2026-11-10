-- ---------------------------------------------------------------------------
-- SYSTEM INTEGRITY GATE · SI-D01 completed after Sharon's review of 16de2ec7 (9 Nov) and the owner's ruling D5.
--
-- 20270112100000 moved four evidence rows to R6's axis. Sharon found the rest of the same defect, and the owner ruled:
--
--   1. evidence_class_overrides (HIGH, a WRITE). Its read and insert policies and the enforce_evidence_override trigger
--      asked can_in_institution('CAN_REVIEW_INTEGRITY'): a Kepala departemen of IPA could insert an override that takes
--      a Matematika Kelas 5D sitting out of official evidence, and so out of every report and calculator. Audited, but
--      decided by someone with no authority over that class. Now: CAN_REVIEW_INTEGRITY over the sitting's place.
--   2. lesson_progress's «or was» gave a former teacher everything the learner read afterwards anywhere in the school
--      (the row has no class). Now: a learning assignment OF THAT RELEASE on a node the caller holds CAN_ASSIGN_LEARNING
--      over, which the learner is or was a member of (at the node or below it). A former teacher keeps what they taught.
--   3. A sitting recorded with a cohort and no class could never be reviewed. Every rule here anchors on the sitting's
--      PLACE: coalesce(class_node_id, cohort_node_id), both recorded at the sitting. Fail closed when neither exists.
--   4. assessment_sessions follows (Sharon's item 1): CAN_REVIEW_INTEGRITY or CAN_ASSIGN_LEARNING over the place, not
--      anywhere in the school. The teacher's pages read their own class's sittings, which keep their place.
--   5. D5 (owner, 9 Nov: APPROVED, least privilege). «A School Administrator is not automatically an examiner.» Answers
--      and the questions shown are read over the place by a holder of BOTH CAN_REVIEW_INTEGRITY and
--      CAN_VIEW_LEARNER_RESULT (the Kepala departemen; SYSTEM_ADMIN), so the Admin sekolah, who holds the first and not
--      the second (R6), no longer reads them by role. The Admin keeps observations, sittings and reclassification
--      (integrity review). For a legitimate investigation, jawaban_untuk_pemeriksaan opens ONE sitting's answers, with
--      a required reason, only while that sitting has an observation still undecided, audited on every open; a refusal
--      writes nothing. It is not an answer browser: one sitting per call, no listing.
--
-- The professional-learning branches are unchanged throughout.
-- ---------------------------------------------------------------------------

-- the place a sitting is RECLASSIFIED over: its Kelas, else its Angkatan, else the school's root. Reading fails closed
-- without a place (R6); a decision to WEAKEN evidence with no organizational home is the school's as a whole, so only
-- a holder scoped at the root (the Admin sekolah, the platform) may take it, never a department's head (F02-T17)
create or replace function public.sesi_tempat_koreksi(p_session uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.class_node_id, s.cohort_node_id,
                  (select o.id from public.org_nodes o where o.institution_id = s.institution_id and o.kind = 'INSTITUTION'))
    from public.assessment_sessions s where s.id = p_session
$$;
revoke all on function public.sesi_tempat_koreksi(uuid) from public, anon, authenticated;
grant execute on function public.sesi_tempat_koreksi(uuid) to authenticated;

-- the organizational place a sitting was given in: its Kelas, else its recorded Angkatan (never invented)
create or replace function public.sesi_tempat(p_session uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.class_node_id, s.cohort_node_id) from public.assessment_sessions s where s.id = p_session
$$;
revoke all on function public.sesi_tempat(uuid) from public, anon, authenticated;
grant execute on function public.sesi_tempat(uuid) to authenticated;

-- ── 4. the sitting row
drop policy assessment_sessions_select on public.assessment_sessions;
create policy assessment_sessions_select on public.assessment_sessions for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_audience(coalesce(class_node_id, cohort_node_id))
               && array['FACILITATOR', 'HEAD', 'DEAN', 'ADMIN', 'PLATFORM']
          else coalesce(class_node_id, cohort_node_id) is not null
               and (public.can_on_node('CAN_REVIEW_INTEGRITY', coalesce(class_node_id, cohort_node_id))
                    or public.can_on_node('CAN_ASSIGN_LEARNING', coalesce(class_node_id, cohort_node_id))) end);

-- ── 3 and 5. answers and the questions shown
drop policy responses_select on public.responses;
create policy responses_select on public.responses for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = responses.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else coalesce(s.class_node_id, s.cohort_node_id) is not null
                               and public.can_on_node('CAN_REVIEW_INTEGRITY', coalesce(s.class_node_id, s.cohort_node_id))
                               and public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id)) end)));

drop policy presented_items_select on public.presented_items;
create policy presented_items_select on public.presented_items for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = presented_items.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else coalesce(s.class_node_id, s.cohort_node_id) is not null
                               and public.can_on_node('CAN_REVIEW_INTEGRITY', coalesce(s.class_node_id, s.cohort_node_id))
                               and public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id)) end)));

-- ── 3. observations (the Admin sekolah keeps them: integrity review)
drop policy integrity_signals_select on public.integrity_signals;
create policy integrity_signals_select on public.integrity_signals for select to authenticated using (
  case when public.session_is_professional(session_id)
       then public.is_system_admin()
       else public.sesi_tempat(session_id) is not null
            and public.can_on_node('CAN_REVIEW_INTEGRITY', public.sesi_tempat(session_id)) end);

-- ── 1. reclassification: read, write and the trigger, over the sitting's place
drop policy evidence_class_overrides_select on public.evidence_class_overrides;
create policy evidence_class_overrides_select on public.evidence_class_overrides for select to authenticated using (
  case when public.session_is_professional(session_id)
       then public.is_system_admin()
       else public.sesi_tempat_koreksi(session_id) is not null
            and public.can_on_node('CAN_REVIEW_INTEGRITY', public.sesi_tempat_koreksi(session_id)) end);

drop policy evidence_class_overrides_insert on public.evidence_class_overrides;
create policy evidence_class_overrides_insert on public.evidence_class_overrides for insert to authenticated with check (
  case when public.session_is_professional(session_id)
       then public.is_system_admin()
       else public.sesi_tempat_koreksi(session_id) is not null
            and public.can_on_node('CAN_REVIEW_INTEGRITY', public.sesi_tempat_koreksi(session_id)) end);

create or replace function public.enforce_evidence_override()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_current public.evidence_class; v_actor uuid; v_tempat uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'an evidence reclassification is append-only: file another override';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  v_tempat := public.sesi_tempat_koreksi(new.session_id);
  new.institution_id := v_inst;

  v_actor := public.current_person_id();
  if v_actor is null then
    raise exception 'reclassifying evidence is a human act and needs a known person';
  end if;
  -- SI-D01: over the place the sitting was given in, not anywhere in the school (a professional-learning sitting:
  -- the platform, as its observations)
  if public.session_is_professional(new.session_id) then
    if not public.is_system_admin() then
      raise exception using errcode = '42501', message = 'reclassifying a professional-learning sitting is the platform''s';
    end if;
  elsif v_tempat is null or not public.can_on_node('CAN_REVIEW_INTEGRITY', v_tempat) then
    raise exception using errcode = '42501',
      message = 'reclassifying evidence requires CAN_REVIEW_INTEGRITY over the class (or Angkatan, or for a sitting with neither the school) it was given in';
  end if;
  new.decided_by_person_id := v_actor;

  v_current := public.effective_evidence_class(new.session_id);
  new.from_class := v_current;

  if public.evidence_class_min(v_current, new.to_class) <> new.to_class then
    raise exception 'an override may only reduce eligibility: % -> % would promote it',
      v_current, new.to_class;
  end if;

  perform public.audit_write('EVIDENCE_RECLASSIFIED', 'assessment_sessions',
    new.session_id::text, v_inst,
    jsonb_build_object('from_class', v_current, 'to_class', new.to_class, 'reason', new.reason));
  return new;
end $$;
revoke all on function public.enforce_evidence_override() from public, anon, authenticated;

-- ── 2. lesson progress: what the caller's place was assigned, for a learner who is or was there
drop policy lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_progress_readable(person_id, plp_release_id, institution_id)
          else exists (select 1 from public.learning_assignments la
                        where la.plp_release_id = lesson_progress.plp_release_id
                          and la.institution_id = lesson_progress.institution_id
                          and public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id)
                          and exists (select 1 from public.memberships m
                                        join public.enrollments e on e.id = m.enrollment_id
                                        join public.org_nodes n on n.id = m.node_id
                                       where e.person_id = lesson_progress.person_id
                                         and e.institution_id = lesson_progress.institution_id
                                         and n.jalur @> array[la.node_id])) end);

-- ── 3. the waiting list decides over the sitting's place (its Kelas, else its Angkatan)
create or replace function public.integrity_signals_awaiting_review()
returns table (signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category,
               observed_at timestamptz, may_refer boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.session_id, s.institution_id, s.category, s.observed_at,
         (not public.session_is_professional(s.session_id)
          and coalesce(ses.class_node_id, ses.cohort_node_id) is not null
          and public.can_on_node('CAN_REVIEW_INTEGRITY', coalesce(ses.class_node_id, ses.cohort_node_id)))
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where public.current_person_id() is not null
     -- the LIST keeps its approved contract (FD-7, DG-32; F21-I01): every holder of CAN_REVIEW_INTEGRITY in the school
     -- sees what waits, and only one standing over the sitting's place may refer it (may_refer). Whether the list
     -- should show no more than the table now gives is put to Sharon, not changed here.
     and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
     and not public.integrity_signal_decided(s.id)
   order by s.observed_at desc, s.id
   limit 200
$$;
revoke all on function public.integrity_signals_awaiting_review() from public, anon, authenticated;
grant execute on function public.integrity_signals_awaiting_review() to authenticated;

-- ── 5. D5: one sitting's answers, for an investigation of an observation still undecided
create or replace function public.jawaban_untuk_pemeriksaan(p_session uuid, p_alasan text)
returns table (posisi integer, item_id uuid, jawaban jsonb, diterima_pada timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_tempat uuid; v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  if public.current_person_id() is null or p_session is null then
    raise exception using errcode = '42501', detail = 'INVESTIGATION_NOT_ALLOWED',
      message = 'an investigation requires CAN_REVIEW_INTEGRITY over the sitting it opens';
  end if;
  select s.institution_id, coalesce(s.class_node_id, s.cohort_node_id) into v_inst, v_tempat
    from public.assessment_sessions s where s.id = p_session;
  if v_tempat is null or public.session_is_professional(p_session)
     or not public.can_on_node('CAN_REVIEW_INTEGRITY', v_tempat) then
    raise exception using errcode = '42501', detail = 'INVESTIGATION_NOT_ALLOWED',
      message = 'an investigation requires CAN_REVIEW_INTEGRITY over the sitting it opens';
  end if;
  if length(v_alasan) < 10 or length(v_alasan) > 500 then
    raise exception using errcode = '22023', detail = 'INVESTIGATION_REASON',
      message = 'an investigation states its reason (10 to 500 characters)';
  end if;
  if not exists (select 1 from public.integrity_signals g
                  where g.session_id = p_session and not public.integrity_signal_decided(g.id)) then
    raise exception using errcode = '42501', detail = 'INVESTIGATION_NO_CASE',
      message = 'answers are opened only for a sitting with an integrity observation still undecided';
  end if;

  perform public.audit_write('integrity.answers_opened', 'assessment_sessions', p_session::text, v_inst,
    jsonb_build_object('reason', v_alasan));

  return query
    select pi.position::integer, pi.item_id, r.value, r.received_at
      from public.presented_items pi
      join public.responses r on r.presented_item_id = pi.id and r.is_final
     where pi.session_id = p_session
     order by pi.position;
end $$;
revoke all on function public.jawaban_untuk_pemeriksaan(uuid, text) from public, anon, authenticated;
grant execute on function public.jawaban_untuk_pemeriksaan(uuid, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('jawaban_untuk_pemeriksaan', 'STAFF', 'D5 (owner, 9 Nov): one sitting''s final answers for an integrity investigation, '
   || 'to CAN_REVIEW_INTEGRITY over the sitting''s place, with a reason, only while an observation on it is undecided; '
   || 'audited integrity.answers_opened on every open. Not a listing.', 'CAPABILITY', 'CAN_REVIEW_INTEGRITY'),
  ('sesi_tempat', 'STAFF', 'SI-D01: the place a sitting was given in (its Kelas, else its Angkatan), for row security.', null, null),
  ('sesi_tempat_koreksi', 'STAFF', 'SI-D01: the place a sitting is reclassified over (its Kelas, else its Angkatan, else the school''s root).', null, null);

do $$
declare v_tabel text; v_qual text;
begin
  foreach v_tabel in array array['assessment_sessions', 'responses', 'presented_items', 'integrity_signals',
                                 'lesson_progress', 'evidence_class_overrides'] loop
    select string_agg(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), ' ') into v_qual
      from pg_policies p where p.schemaname = 'public' and p.tablename = v_tabel;
    if v_qual is null or v_qual not like '%can_on_node%' or v_qual like '%can_in_institution%' then
      raise exception 'SI-D01: %''s policies are not on the sitting''s place: %', v_tabel, left(coalesce(v_qual, 'none'), 200);
    end if;
  end loop;
  if (select qual from pg_policies where schemaname = 'public' and tablename = 'responses') not like '%CAN_VIEW_LEARNER_RESULT%' then
    raise exception 'D5: answers are still read by integrity review alone';
  end if;
  if position('can_on_node(''CAN_REVIEW_INTEGRITY'', v_tempat)' in
              (select prosrc from pg_proc where oid = 'public.enforce_evidence_override()'::regprocedure)) = 0 then
    raise exception 'SI-D01: the reclassification trigger does not decide over the sitting''s place';
  end if;
  if position('coalesce(ses.class_node_id, ses.cohort_node_id)' in (select prosrc from pg_proc where oid = 'public.integrity_signals_awaiting_review()'::regprocedure)) = 0 then
    raise exception 'SI-D01: the integrity waiting list does not decide may_refer over the sitting''s place';
  end if;
  if has_function_privilege('anon', 'public.jawaban_untuk_pemeriksaan(uuid,text)', 'execute') then
    raise exception 'D5: the investigation function is executable by anon';
  end if;
end $$;
