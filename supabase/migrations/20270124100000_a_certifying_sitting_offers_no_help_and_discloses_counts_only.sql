-- D2-R · A CERTIFYING SITTING OFFERS NO HELP AND DISCLOSES COUNTS ONLY; THE PUBLIC READ DROPS THE BAND; THE ATTEMPT
-- ORDINAL IS FIXED AT THE START (ruling 89; D2-CERTIFICATE-CONDITIONS-SPEC.md §6.1 R-c, R-d, R-f, R-h and rev. 4, §7).
--
-- Build map: docs/completion-4.1/d2r/D2R-BUILD-MAP.md. Red first: selftest/db/fable39.sql and selftest/d2r.test.ts
-- (docs/completion-4.1/d2r/RED-055738ba.txt).
--
--   (1) THE CAPTURE. Three columns on assessment_sessions, written once, when the sitting starts, by a trigger (the
--       pass mark's precedent, seal_session_pass_mark, 20261102100000) and never changed after:
--         bantuan_diizinkan  the mode's allows_assistance at the start (R-d);
--         bersertifikasi     the mode's certifies at the start: the result's governed purpose (R-h: «the mode's certifies
--                            policy, not its display name»);
--         percobaan_ke       the attempt ordinal: the lineage count at the start, plus one (R-f; percobaan_terpakai,
--                            20270114100000, across versions, ruling 46). The start path holds ruling 46's lock
--                            (start_learning_session:garis) when it inserts, so the count is taken under it.
--       Every existing sitting is given what its mode said before this migration, so a sitting open now keeps the help
--       it started with (§6.2 «open sittings keep their captured policy»), and its ordinal by the same lineage rule, in
--       creation order.
--   (2) THE POLICY. POST_TEST and STANDALONE allow no help (R-d), audited as BOB-50's change was. The lint gains
--       «certifies ⇒ not allows_assistance».
--   (3) HELP. open_assistance, assistance_state and session_state read the sitting's capture, never the live row: a
--       sitting that may not have help is refused at every level by a direct call, is never «due», and gives the player
--       no window. assessment_orientation, read before any sitting exists, promises no help on a mode that offers none.
--   (4) THE LEARNER'S RESULT (R-h). A certifying sitting (bersertifikasi):
--         session_review       refuses (counts only);
--         reading_map          gives only the sections to read again, as revisit-advice (BACA_LAGI), with no reason
--                              drawn from the wrong options and no strength verdict (no KUAT). There is no approved
--                              evidence threshold in 4.1 (Sharon, rev. 4), so every section line is revisit-advice;
--         session_outcome      carries the decision, the sealed counts, the revisit list (baca_lagi, by objective code:
--                              those below the sealed mark and the gate's, tujuan_gerbang_kode allowed by rev. 4) and the
--                              ordinal; never per_domain (no mastery verdict per objective, 74a);
--         hasil_koreksi_saya   carries no correction reason.
--       Pemetaan Awal, Uji Cepat and practice are unchanged (each pinned). Staff reads are unchanged.
--   (5) THE PUBLIC READ (R-c, rev. 4). verify_certificate returns predikat null for every certificate. Its OUT columns,
--       assert_public_surface(), certificate_eligibility, the sealed payload and the snapshot are unchanged.
--   (6) STAFF (R-f). daftar_pengerjaan, the teacher's sittings read, gains percobaan_ke, the shown sitting's ordinal.
--       Its result type changes, so it is dropped and created; its grant is restated as it was.
--
-- R-e (extra time) needs no change here: extend_session_deadline already records it on the sitting and its audit row,
-- and the teacher's sittings read shows it (diperpanjang); D2R-E01 proves it is on no public surface or payload.
--
-- METRIC CATALOGUE AND ENGINE: no scoring changes (D-060). Every redefined function is its live body
-- (pg_get_functiondef at 308) with the change marked «D2-R».

-- ═══════════════════════════════════════════════════════════════════════════════════ (1) the capture
alter table public.assessment_sessions
  add column bantuan_diizinkan boolean,
  add column bersertifikasi boolean,
  add column percobaan_ke smallint;

comment on column public.assessment_sessions.bantuan_diizinkan is
  'D2-R (R-d): whether this sitting may offer help, copied from mode_policy.allows_assistance when it started. Immutable; '
  'open_assistance, assistance_state and session_state read it and never the live policy row.';
comment on column public.assessment_sessions.bersertifikasi is
  'D2-R (R-h): whether this sitting''s result certifies, copied from mode_policy.certifies when it started. Immutable; '
  'a certifying result discloses counts only to its learner (session_review, reading_map, session_outcome, hasil_koreksi_saya).';
comment on column public.assessment_sessions.percobaan_ke is
  'D2-R (R-f): the attempt ordinal, the lineage count (percobaan_terpakai) when the sitting started, plus one; null for a '
  'sitting with no assignment. Immutable; on the learner''s result and the teacher''s sittings read, on no public surface.';

-- History: every existing sitting is given what its mode said before this migration, and its ordinal in creation order
-- by the same lineage rule. The rows' own guards re-judge transitions on any update, so they are paused for this write.
alter table public.assessment_sessions disable trigger assessment_sessions_provenance;
alter table public.assessment_sessions disable trigger assessment_sessions_status;
alter table public.assessment_sessions disable trigger assessment_sessions_a1_state;
update public.assessment_sessions s
   set bantuan_diizinkan = m.allows_assistance, bersertifikasi = m.certifies
  from public.mode_policy m where m.mode = s.mode;
update public.assessment_sessions s
   set percobaan_ke = (
     select count(*) + 1
       from public.assessment_assignments aa
       join public.assessment_definitions d on d.id = aa.assessment_definition_id
       join public.assessment_sessions x
         on x.person_id = s.person_id
        and (x.assessment_assignment_id = aa.id
             or (x.assessment_definition_id in (select y.id from public.assessment_definitions y
                                                  where y.lineage_root_definition_id = d.lineage_root_definition_id)
                 and x.institution_id = aa.institution_id
                 and exists (select 1 from public.assessment_assignments a2 where a2.id = x.assessment_assignment_id
                               and a2.academic_period_id is not distinct from aa.academic_period_id)))
        and coalesce(x.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION')
        and (x.created_at, x.id) < (s.created_at, s.id)
      where aa.id = s.assessment_assignment_id)
 where s.assessment_assignment_id is not null and s.person_id is not null;
alter table public.assessment_sessions enable trigger assessment_sessions_a1_state;
alter table public.assessment_sessions enable trigger assessment_sessions_status;
alter table public.assessment_sessions enable trigger assessment_sessions_provenance;

do $d2r$
begin
  if exists (select 1 from public.assessment_sessions where bantuan_diizinkan is null or bersertifikasi is null) then
    raise exception 'D2-R: a sitting whose mode has no policy row was left without its capture; this migration refuses to apply';
  end if;
end $d2r$;
alter table public.assessment_sessions alter column bantuan_diizinkan set not null;
alter table public.assessment_sessions alter column bersertifikasi set not null;

-- The seal. On insert it writes the capture from the policy row and the lineage count (whatever the writer passed);
-- on update it refuses any change to it.
create or replace function public.tangkap_kebijakan_sesi() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if new.bantuan_diizinkan is distinct from old.bantuan_diizinkan or new.bersertifikasi is distinct from old.bersertifikasi
       or new.percobaan_ke is distinct from old.percobaan_ke then
      raise exception using errcode = 'PR080', detail = 'SITTING_POLICY_SEALED',
        message = 'a sitting''s help, its result''s purpose and its attempt number are fixed when it starts and never change';
    end if;
    return new;
  end if;
  select m.allows_assistance, m.certifies into new.bantuan_diizinkan, new.bersertifikasi
    from public.mode_policy m where m.mode = new.mode;
  if new.bantuan_diizinkan is null or new.bersertifikasi is null then
    raise exception 'mode % has no policy row; a sitting is not started on an assumed policy', new.mode;
  end if;
  new.percobaan_ke := case when new.assessment_assignment_id is not null and new.person_id is not null
                           then public.percobaan_terpakai(new.person_id, new.assessment_assignment_id) + 1 end;
  return new;
end $$;
revoke all on function public.tangkap_kebijakan_sesi() from public, anon, authenticated, service_role;

create trigger assessment_sessions_the_policy_is_captured
  before insert or update on public.assessment_sessions
  for each row execute function public.tangkap_kebijakan_sesi();

-- ═══════════════════════════════════════════════════════════════════════════════════ (2) the policy and its lint
update public.mode_policy
   set allows_assistance = false,
       note = coalesce(note, '') || case when coalesce(note, '') = '' then '' else '; ' end
              || 'a certifying sitting offers no help (D2-R, ruling 89)'
 where mode in ('POST_TEST', 'STANDALONE');

select public.audit_write('mode_policy.changed', 'mode_policy', m.mode::text, null,
  jsonb_build_object('allows_assistance', jsonb_build_object('from', true, 'to', false), 'decision', 'D2-R R-d', 'ruling', 89))
  from unnest(array['POST_TEST', 'STANDALONE']) m(mode);

CREATE OR REPLACE FUNCTION public.assert_mode_policy_complete()
 RETURNS TABLE(ok boolean, detail text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare bad text; problems text[] := '{}'; n int;
begin
  select string_agg(e.enumlabel::text, ', ' order by e.enumsortorder) into bad
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'assessment_mode'
     and not exists (select 1 from public.mode_policy m where m.mode::text = e.enumlabel::text);
  if bad is not null then problems := problems || ('mode(s) with no policy row: ' || bad); end if;

  -- a mode that certifies must be a formal stage: practice never certifies,
  -- a diagnostic pre-test is a starting point, not an achievement (§8), and a
  -- single Uji Cepat shows the class's understanding now (D-082(d))
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.certifies and m.mode::text in ('PRE_TEST','PRACTICE','PUBLIC_DEMO','QUICK');
  if bad is not null then problems := problems || ('mode(s) certifying that must not: ' || bad); end if;

  -- EXAM tier is reachable only from EXAM and PAPER
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.max_bank_tier = 'EXAM' and m.mode::text not in ('EXAM','PAPER');
  if bad is not null then problems := problems || ('mode(s) reaching the EXAM bank tier (INV-12): ' || bad); end if;

  -- an exam offers no assistance
  if exists (select 1 from public.mode_policy where mode::text = 'EXAM' and allows_assistance) then
    problems := problems || 'EXAM allows assistance'::text;
  end if;

  -- D2-R (R-d): a certifying mode offers no help at any level
  select string_agg(m.mode::text, ', ' order by m.mode::text) into bad from public.mode_policy m
   where m.certifies and m.allows_assistance;
  if bad is not null then problems := problems || ('certifying mode(s) allowing assistance: ' || bad); end if;

  select count(*) into n from public.mode_policy;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format('%s mode(s), every enum label carries a policy; no non-formal mode certifies (a single Uji Cepat included); the EXAM tier is reachable only from EXAM and PAPER; no certifying mode allows assistance', n)
                 else array_to_string(problems, '; ') end;
  return next;
end $function$;

-- ═══════════════════════════════════════════════════════════════════════════════════ (3) help
CREATE OR REPLACE FUNCTION public.open_assistance(p_presented_item uuid, p_level smallint)
 RETURNS TABLE(level smallint, kode text, isi text, stage text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid; v_item uuid; v_state record; v_text text; v_kode text; v_stage text;
  v_mode public.assessment_mode; v_allows boolean;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;

  -- ADDED IN 0040: the mode decides whether assistance exists at all.
  -- D2-R (R-d): as the sitting captured it when it started, never the live policy row
  select s.mode, s.bantuan_diizinkan into v_mode, v_allows from public.assessment_sessions s where s.id = v_session;
  if v_allows is null then
    raise exception 'mode % has no policy row; assistance is refused rather than assumed', v_mode;
  end if;
  if not v_allows then
    raise exception 'this assessment offers no assistance';
  end if;

  select * into v_state from public.assistance_state(p_presented_item);
  if not v_state.due then
    raise exception 'assistance is not available yet on this question';
  end if;
  if p_level is null or p_level < 1 or p_level > 3 then
    raise exception 'assistance has three levels; % is not one of them', p_level;
  end if;
  if p_level > v_state.highest_open + 1 then
    raise exception 'assistance arrives a step at a time: open level % first', v_state.highest_open + 1;
  end if;

  select a.kode into v_kode from public.assistance_levels a where a.level = p_level;
  v_stage := v_state.stage;

  if p_level = 1 then
    select i.arah_berpikir into v_text from public.items i where i.id = v_item;
  elsif p_level = 2 then
    select i.petunjuk into v_text from public.items i where i.id = v_item;
  else
    select (l.worked_examples -> 0 ->> 'judul') || ' — ' ||
           coalesce((select string_agg(x, ' ') from jsonb_array_elements_text(
                       l.worked_examples -> 0 -> 'langkah') x), '')
      into v_text
      from public.items i join public.lessons l on l.id = i.lesson_id
     where i.id = v_item;
  end if;

  if v_text is null or btrim(v_text) = '' then
    raise exception 'this question has no assistance at level % yet', p_level;
  end if;
  if public.hint_reveals_answer_shape(v_text) then
    raise exception 'assistance at level % would narrow to the answer and is refused (INV-02)', p_level;
  end if;

  insert into public.assistance_grants (presented_item_id, session_id, level)
  values (p_presented_item, v_session, p_level) on conflict do nothing;
  insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind, level)
  values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000',
          case p_level when 3 then 'WORKED_EXAMPLE_OPENED'::telemetry.assistance_kind
                       else 'HINT_OPENED'::telemetry.assistance_kind end, p_level);

  level := p_level; kode := v_kode; isi := v_text; stage := v_stage;
  return next;
end $function$;

CREATE OR REPLACE FUNCTION public.assistance_state(p_presented_item uuid)
 RETURNS TABLE(window_seconds integer, dwell_seconds numeric, due boolean, stage text, answered boolean, highest_open smallint, next_level smallint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid; v_item uuid; v_window integer; v_first timestamptz;
  v_dwell numeric; v_answered boolean; v_stage text; v_open smallint;
  v_offered boolean; v_ok boolean; v_reason text;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
  if not v_ok then raise exception 'this session is not open for assistance: %', v_reason; end if;

  -- D2-R (R-d): a sitting that may not have help (its capture) has no window, so it is never due
  select case when s.bantuan_diizinkan then d.hesitation_window_seconds end into v_window
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = v_session;
  if v_window is null then
    -- no window configured is not "use a default"; it is "this assessment
    -- offers no assistance"
    window_seconds := null; dwell_seconds := null; due := false;
    stage := null; answered := false; highest_open := 0; next_level := null;
    return next; return;
  end if;

  select v.first_viewed_at into v_first from public.presented_item_views v
   where v.presented_item_id = p_presented_item;
  if v_first is null then
    v_first := public.note_item_view(p_presented_item);
  end if;
  v_dwell := extract(epoch from (now() - v_first));
  v_answered := exists (select 1 from public.responses r where r.presented_item_id = p_presented_item);

  select c.stage into v_stage
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id join public.courses c on c.id = m.course_id
   where i.id = v_item;

  select coalesce(max(a.level) filter (where a.level > 0), 0)::smallint,
         bool_or(a.level = 0)
    into v_open, v_offered
    from public.assistance_grants a where a.presented_item_id = p_presented_item;
  v_offered := coalesce(v_offered, false);

  window_seconds := v_window;
  dwell_seconds  := round(v_dwell, 3);
  -- §6: the window is inactivity with no selection yet. An answered item is
  -- not hesitating, and the trigger never fires before the configured window.
  due            := (not v_answered) and v_dwell >= v_window;
  stage          := v_stage;
  answered       := v_answered;
  highest_open   := v_open;
  next_level     := case when due and v_open < 3 then (v_open + 1)::smallint else null end;

  if due and not v_offered then
    -- hesitation_threshold_reached + assistance_offered, once per delivered item
    insert into public.assistance_grants (presented_item_id, session_id, level)
    values (p_presented_item, v_session, 0);
    insert into telemetry.hesitation_events (session_id, presented_item_id, institution_id,
                                             window_seconds, dwell_seconds)
    values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000', v_window, v_dwell);
    insert into telemetry.assistance_events (session_id, presented_item_id, institution_id, kind)
    values (v_session, p_presented_item, '00000000-0000-0000-0000-000000000000', 'OFFERED');
  end if;
  return next;
end $function$;

CREATE OR REPLACE FUNCTION public.session_state(p_session uuid)
 RETURNS TABLE(status session_status, mode assessment_mode, allows_pause boolean, authoritative_deadline timestamp with time zone, started_at timestamp with time zone, submitted_at timestamp with time zone, item_count integer, answered_count integer, hesitation_window_seconds integer, stage text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
    select s.status, s.mode, d.allows_pause,
           case when s.authoritative_deadline is null then null else public.pengerjaan_tenggat_efektif(s.id) end,
           s.started_at, s.submitted_at,
           (select count(*)::integer from public.presented_items p where p.session_id = s.id),
           (select count(distinct r.presented_item_id)::integer from public.responses r
             where r.session_id = s.id),
           -- D2-R (R-d): the player schedules help only from this, so a sitting that may not have help gives none
           case when s.bantuan_diizinkan then d.hesitation_window_seconds end,
           (select c.stage from public.presented_items p
              join public.items i on i.id = p.item_id
              join public.lessons l on l.id = i.lesson_id
              join public.modules m on m.id = l.module_id
              join public.courses c on c.id = m.course_id
             where p.session_id = s.id limit 1)
      from public.assessment_sessions s
      join public.assessment_definitions d on d.id = s.assessment_definition_id
     where s.id = p_session;
end $function$;

CREATE OR REPLACE FUNCTION public.assessment_orientation(p_assessment_assignment uuid)
 RETURNS TABLE(mode assessment_mode, title text, item_count smallint, allows_pause boolean, hesitation_window_seconds integer, opens_at timestamp with time zone, closes_at timestamp with time zone, attempt_limit smallint, attempts_used integer, tolak_pemeliharaan text, tolak_cakupan text, tolak_mulai timestamp with time zone, tolak_selesai timestamp with time zone, tolak_kelas text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- D2-R (R-d): read before any sitting exists, so from the policy row the sitting will capture: no help is promised
  -- on a mode that offers none
  select d.mode, d.title, d.item_count, d.allows_pause,
         case when (select m.allows_assistance from public.mode_policy m where m.mode = d.mode) then d.hesitation_window_seconds end,
         aa.opens_at, aa.closes_at, d.attempt_limit,
         (select count(*)::integer from public.assessment_sessions s
           where s.assessment_assignment_id = aa.id
             and s.person_id = public.current_person_id()),
         t.kode, t.cakupan, t.mulai, w.ends_at,
         case when cardinality(w.node_ids) > 0 then
           (select array_agg(n.name order by n.name) from public.org_nodes n where n.id = any (w.node_ids)) end
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    cross join lateral (select e.ok, e.reason from public.may_start_assessment(aa.id) e) m
    -- A2b: a maintenance refusal (judged last by may_start, so every other check has passed) is read once, with its
    -- window and scope, on the learner's class under the assignment and the deadline a start would get
    left join lateral (
      select r.* from public.maintenance_mulai_tolak(public.current_person_id(),
        coalesce((select mm.node_id from public.enrollments e join public.memberships mm on mm.enrollment_id = e.id
                    join public.org_nodes nn on nn.id = mm.node_id
                   where e.person_id = public.current_person_id() and e.institution_id = aa.institution_id
                     and e.status = 'ACTIVE' and mm.valid_to is null and nn.kind = 'CLASS'
                     and (nn.id = aa.node_id or nn.jalur @> array[aa.node_id])
                   order by mm.valid_from desc limit 1), aa.node_id)) r
      where m.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START')) t on true
    left join public.maintenance_windows w on w.id = t.jendela
   where aa.id = p_assessment_assignment
     and public.current_person_id() is not null
     and (m.ok or m.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START'))
$function$;

-- ═══════════════════════════════════════════════════════════════════════════════════ (4) the learner's result
-- The sections a certifying result advises reading again, by objective code: those whose mastery in the result is below
-- the mark sealed on the sitting, and the objectives of the must-be-right questions it missed (K-01, rev. 4). Read from
-- the learner's own result row; no per-objective figure leaves it. Internal: session_outcome and reading_map call it.
create or replace function public.bagian_baca_lagi(p_session uuid) returns text[]
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(distinct k order by k), '{}')
    from (
      select e.key as k
        from public.assessment_sessions s
        join public.assessment_results r on r.id = public.hasil_murid_id(s.id)
        cross join lateral jsonb_each(coalesce(r.per_domain, '{}'::jsonb)) e
       where s.id = p_session and s.pass_mark is not null
         and jsonb_typeof(e.value -> 'penguasaan') = 'number' and (e.value ->> 'penguasaan')::numeric < s.pass_mark
      union
      select lo.code
        from public.assessment_results r
        join public.learning_objectives lo on lo.id = any (public.tujuan_gerbang_terlewat(r.id))
       where r.id = public.hasil_murid_id(p_session)
    ) x
$$;
revoke all on function public.bagian_baca_lagi(uuid) from public, anon, authenticated, service_role;

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
  -- D2-R (R-h): a certifying result, as the sitting captured it, discloses counts only: no per-question mark, key or
  -- explanation reaches its learner by any route
  if v_s.bersertifikasi then
    raise exception using errcode = 'PR081', detail = 'RESULT_COUNTS_ONLY',
      message = 'a certifying result discloses counts only: the answer key and each question''s mark are not shown';
  end if;
  return query
    -- Z D-1: every chosen option, in label order (one for a single answer, so it reads as before)
    select f.posisi, i.stem, f.is_safety_critical,
           (select string_agg(o.body, ' · ' order by o.label collate "C")
              from public.item_options o
             where o.item_id = f.item_id and o.label = any (public.pilihan_dipilih(f.value))),
           public.nilai_jawaban_berlaku(p_session, f.item_id, f.value) = 1,
           case when public.nilai_jawaban_berlaku(p_session, f.item_id, f.value)
                     is distinct from public.grade_response(f.item_id, f.value)
                then null   -- F-1 (Sharon): a mark the key correction changed is not explained by the sealed key
                else (select string_agg(x.rationale, ' · ' order by x.urut)
                        from (select o.rationale, min(o.label collate "C") as urut
                                from public.item_options o
                               where o.item_id = f.item_id and o.label = any (public.pilihan_dipilih(f.value))
                                 and o.rationale is not null
                               group by o.rationale) x) end,
           i.arah_berpikir
      from public.session_final_responses(p_session) f
      join public.items i on i.id = f.item_id
     order by f.is_safety_critical desc, f.posisi;
end $function$;

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
  -- D2-R (R-h, 74a, 74b; rev. 4): a certifying result advises what to read again and nothing more: the sections of
  -- bagian_baca_lagi only, each as revisit-advice, in the chapter's order, with no reason drawn from the wrong options
  -- and no strength verdict. No evidence threshold is approved in 4.1, so every section line is revisit-advice.
  if (select s.bersertifikasi from public.assessment_sessions s where s.id = p_session) then
    return query
      select row_number() over (order by m.ordinal, l.ordinal, lo.code collate "C")::smallint,
             'BACA_LAGI'::text, lo.code, lo.statement, m.title, l.title, l.page_citation, null::text
        from public.learning_objectives lo
        join public.lessons l on l.id = lo.lesson_id
        join public.modules m on m.id = l.module_id
       where lo.code = any (public.bagian_baca_lagi(p_session))
         and lo.id in (select o from public.session_final_responses(p_session) f
                         join public.items i on i.id = f.item_id cross join unnest(i.objective_ids) o)
       order by 1;
    return;
  end if;
  return query
  with graded as (
    select f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0 else public.nilai_jawaban_berlaku(p_session, f.item_id, f.value) end as score,
           kb.kunci   -- F-1 (O41-21): the key in force, where a governed correction recorded one
      from public.session_final_responses(p_session) f
      left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id
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
                                         and o2.label = any (public.pilihan_dipilih(g2.value))   -- Z D-1: every chosen option
                                         and not coalesce(o2.label = any (g2.kunci), o2.is_correct)
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code and mt.institution_id = o2.institution_id
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $function$;

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
   where id = public.hasil_murid_id(p_session);   -- C1w (O41-21): a governed correction is the learner's result
  if v_r.id is null then return null; end if;

  v_out := jsonb_build_object(
    'penguasaan',  v_r.mastery,
    'per_domain',  v_r.per_domain,
    'ringkasan',   v_r.delta_inputs) || public.hasil_koreksi_ringkas(p_session)
    -- D2-R (R-f, R-h): the attempt ordinal fixed at the start, and the result's governed purpose as captured
    || jsonb_build_object('percobaan_ke', v_s.percobaan_ke, 'bersertifikasi', v_s.bersertifikasi);
  -- D2-R (R-h, 74a): a certifying result carries no mastery figure per objective; what to read again comes as codes
  if v_s.bersertifikasi then
    v_out := (v_out - 'per_domain') || jsonb_build_object('baca_lagi', to_jsonb(public.bagian_baca_lagi(p_session)));
  end if;

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
    'ambang', v_min,
    -- Z K-01 (Sharon's Q1): the objectives of the must-be-right items this result missed, from this same result row
    -- (graded by the key that row was computed with); [] when its gate passed. Never on a pre-test (returned above).
    'tujuan_gerbang', to_jsonb(public.tujuan_gerbang_terlewat(v_r.id)),
    -- CORRECTED IN PLACE (undeployed; Z3-A): the same objectives' codes, which is how the learner's own reading map and
    -- per_domain name them (a learner cannot read learning_objectives by id), so «Pelajari lagi» can list them
    'tujuan_gerbang_kode', coalesce((select to_jsonb(array_agg(lo.code order by lo.code collate "C"))
                                       from public.learning_objectives lo
                                      where lo.id = any (public.tujuan_gerbang_terlewat(v_r.id))), '[]'::jsonb));
end $function$;

CREATE OR REPLACE FUNCTION public.hasil_koreksi_saya(p_session uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_asli public.assessment_results; v_kini public.assessment_results; s public.assessment_sessions; v_k public.key_corrections;
begin
  if not public.session_is_mine(p_session) then perform public.koreksi_tolak('RESULT_NOT_VISIBLE'); end if;
  select * into s from public.assessment_sessions where id = p_session;
  select * into v_asli from public.assessment_results where session_id = p_session and supersedes_result_id is null;
  select * into v_kini from public.assessment_results where id = public.hasil_murid_id(p_session);
  select k.* into v_k from public.assessment_result_bases b join public.key_corrections k on k.id = b.key_correction_id where b.result_id = v_kini.id;
  -- D2-R (R-h): a correction's reason can name a question and its key, so a certifying result carries none (staff read it)
  return case when s.bersertifikasi then jsonb_build_object('dikoreksi', v_k.id is not null, 'pada', v_kini.computed_at)
              else jsonb_build_object('dikoreksi', v_k.id is not null, 'alasan', v_k.reason, 'pada', v_kini.computed_at) end
    || jsonb_build_object(
    'asli', case when v_asli.id is not null then jsonb_build_object('penguasaan', v_asli.mastery,
              'lulus', case when s.mode = 'POST_TEST' and s.pass_mark is not null then v_asli.safety_gate_passed and v_asli.mastery >= s.pass_mark end) end,
    'terkini', case when v_kini.id is not null then jsonb_build_object('penguasaan', v_kini.mastery,
              'lulus', case when s.mode = 'POST_TEST' and s.pass_mark is not null then v_kini.safety_gate_passed and v_kini.mastery >= s.pass_mark end) end,
    'sertifikat_ditinjau', coalesce(public.sertifikat_ditinjau(public.sertifikat_sesi_kini(p_session)), false));
end $function$;

-- ═══════════════════════════════════════════════════════════════════════════════════ (5) the public read
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
  -- D2-R (R-c, rev. 4): the band is not public. The column stays (the contract is unchanged; null was already allowed,
  -- below 70%); the band stays in the sealed payload, certificate_eligibility and the internal reports
  predikat   := null;
  -- CR-02: the school's name as issued; a certificate issued before the seal reads it as before
  institution:= coalesce(v_c.institution_as_issued, v_inst);
  -- D-199 (owner, 10 Nov): the issuing school's issue day, on its own clock (WIB when the school keeps none)
  date       := to_char((v_c.issued_at_iso::timestamptz) at time zone coalesce(
                  (select i.zona_waktu from public.institutions i where i.id = v_c.institution_id), 'Asia/Jakarta'), 'YYYY-MM-DD');
  validity   := case v_c.status when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN'
                                when 'ISSUED' then case when public.sertifikat_ditinjau(v_c.id) then 'DITINJAU' else 'BERLAKU' end end;
  return next;
end $function$;

-- ═══════════════════════════════════════════════════════════════════════════════════ (6) staff: the ordinal
drop function public.daftar_pengerjaan(uuid, uuid);
CREATE OR REPLACE FUNCTION public.daftar_pengerjaan(p_kelas uuid, p_assessment_assignment uuid)
 RETURNS TABLE(person_id uuid, nama text, sesi_id uuid, jumlah_sesi integer, keadaan text, status session_status, mulai timestamp with time zone, tenggat timestamp with time zone, sisa_detik integer, diperpanjang integer, ditahan_sejak timestamp with time zone, sisa_ditahan_detik integer, murid_aktif boolean, berakhir_pada timestamp with time zone, dihitung boolean, percobaan_terpakai integer, batas_percobaan integer, percobaan_diizinkan boolean, izin_belum_dipakai boolean, permintaan_id uuid, permintaan_status text, permintaan_pada timestamp with time zone, permintaan_alasan text, permintaan_oleh_saya boolean, keputusan_pada timestamp with time zone, keputusan_alasan text, mode_asesmen text, lanjut_diminta_pada timestamp with time zone, izin_berlaku_sampai timestamp with time zone, percobaan_ke integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid := public.current_person_id(); aa public.assessment_assignments; v_batas integer;
begin
  select * into aa from public.assessment_assignments x where x.id = p_assessment_assignment;
  if v_me is null or aa.id is null
     or not exists (select 1 from public.org_nodes n where n.id = p_kelas and (n.id = aa.node_id or n.jalur @> array[aa.node_id]))
     or exists (select 1 from public.learning_assignments la where la.id = aa.learning_assignment_id and public.release_is_professional(la.plp_release_id))
     or not public.can_on_node('CAN_MANAGE_SITTINGS', p_kelas) then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = aa.assessment_definition_id;
  return query
    with murid as (
      select e.person_id as pid from public.memberships m join public.enrollments e on e.id = m.enrollment_id
       where m.node_id = p_kelas and m.valid_to is null and e.status = 'ACTIVE'
      union
      select s.person_id from public.assessment_sessions s
       where s.assessment_assignment_id = aa.id and coalesce(s.class_node_id, s.cohort_node_id) = p_kelas
    )
    select m.pid, p.display_name, s.id,
           (select count(*)::integer from public.assessment_sessions x where x.person_id = m.pid and x.assessment_assignment_id = aa.id
               and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas),
           case when s.id is null then 'NOT_STARTED'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and s.frozen_at is not null and s.unfrozen_at is null then 'FROZEN'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and public.pengerjaan_dilindungi(s.id) then 'HELD_STOP'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and t.tenggat is not null and t.tenggat <= now() then 'ENDED_BY_DEADLINE'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then 'OPEN'
                when s.closure_kind = 'TEACHER_SCORED' then 'ENDED_SCORED'
                when s.closure_kind = 'TEACHER_NOT_COUNTED' then 'ENDED_NOT_COUNTED'
                when s.closure_kind in ('DEADLINE', 'WINDOW_CLOSED') then 'ENDED_BY_DEADLINE'
                when s.status in ('SUBMITTED', 'FINALIZED') then 'HANDED_IN'
                when s.status = 'EXPIRED' then 'EXPIRED_UNSCORED'
                when s.status = 'TERMINATED' and s.termination_cause = 'ADMINISTRATIVE_TERMINATION' then 'ENDED_WITH_ASSIGNMENT'
                else 'ENDED_OTHER' end,
           s.status, coalesce(s.started_at, s.created_at), t.tenggat,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (s.frozen_at is not null and s.unfrozen_at is null) and t.tenggat is not null
                then greatest(0, floor(extract(epoch from (t.tenggat - now())))::integer) end,
           s.deadline_extended_count::integer,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_at end,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_remaining_seconds end,
           not public.orang_ditangguhkan(m.pid),
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then null
                else coalesce(s.closure_at, s.finalized_at, s.submitted_at) end,
           case when s.id is null then null
                else coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION') end,
           public.percobaan_terpakai(m.pid, aa.id), v_batas,
           s.attempt_request_id is not null,
           exists (select 1 from public.attempt_requests g where g.person_id = m.pid
                     and g.assessment_assignment_id in (select public.percobaan_penugasan_segaris(aa.id))
                     and g.status = 'APPROVED'
                     and not exists (select 1 from public.assessment_sessions x where x.attempt_request_id = g.id)),
           q.id, q.status, q.requested_at, q.reason, q.requested_by_person_id = v_me, q.decided_at, q.decision_reason,
           -- A3 (the screens): the sitting's mode; while it is open, the learner's request and the newest permission if it is
           -- still unused and inside its 10 minutes (an expired one returns the row to its plain state, Daisy §1)
           s.mode::text,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then s.lanjut_diminta_pada end,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
             (select case when z.dipakai_pada is null and z.berlaku_sampai > now() then z.berlaku_sampai end
                from public.pengerjaan_izin_lanjut z where z.session_id = s.id and z.person_id = s.person_id
               order by z.dibuat_pada desc, z.id desc limit 1) end,
           -- D2-R (R-f): the shown sitting's attempt ordinal, fixed when it started
           s.percobaan_ke::integer
      from murid m
      join public.persons p on p.id = m.pid
      left join lateral (select x.* from public.assessment_sessions x
                          where x.person_id = m.pid and x.assessment_assignment_id = aa.id
                            and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas
                          -- the latest; at one instant, the open one, then the granted one
                          order by x.created_at desc, (x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) desc,
                                   (x.attempt_request_id is not null) desc, x.id desc limit 1) s on true
      left join lateral (select public.pengerjaan_tenggat_efektif(s.id) as tenggat) t on true
      left join lateral (select g.* from public.attempt_requests g
                          where g.person_id = m.pid and g.assessment_assignment_id = aa.id
                          order by g.requested_at desc, g.id desc limit 1) q on true
     order by p.display_name, m.pid;
end
$function$;

revoke all on function public.daftar_pengerjaan(uuid, uuid) from public, anon, authenticated;
grant execute on function public.daftar_pengerjaan(uuid, uuid) to authenticated;
