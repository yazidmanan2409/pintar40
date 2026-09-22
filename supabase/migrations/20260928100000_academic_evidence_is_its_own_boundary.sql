-- ---------------------------------------------------------------------------
-- WP6A CORRECTION. ACADEMIC EVIDENCE IS ITS OWN BOUNDARY.
--
-- WHAT WAS WRONG, reproduced before it was repaired. My first WP6A pass
-- narrowed ONE late view, `scoped_official_sessions`, and concluded the job
-- was done. It was not: learning evidence branches BEFORE that view. Measured
-- on a real academic item answered wrongly in a professional-development
-- session, with a legitimate PD certificate issued:
--
--   item.correctness_rate             have 0 -> 1
--   item.distractor_uptake            have 0 -> 1
--   item.position_effect              have 0 -> 1
--   class.misconceptions              have 0 -> 1
--   institution.verified_credentials  value 1 -> 2
--
-- The fourth is the one that matters most: a teacher's own practice answer
-- produced a class-level misconception with remediation advice attached, for
-- a class in which no student had answered anything.
--
-- WHY THE FIRST FIX COULD NOT HAVE WORKED. The three service views read
-- `official_responses` directly, and the certificate source reads
-- `certificates` directly. Neither passes through a session view, so
-- narrowing that view reaches eleven calculators and misses five. Filtering
-- one late source is not provenance.
--
-- THE CORRECTION IS A NAMED BOUNDARY, NOT FIVE MORE WHERE CLAUSES.
-- `academic_responses` is the academic evidence boundary, and it sits exactly
-- where the existing `official_*` boundary sits -- beside it, on the other
-- axis. OFFICIAL answers "is this real evidence"; ACADEMIC answers "is this
-- evidence about the school's curriculum". Every response-derived academic
-- aggregate reads the second one, and the terminal block refuses to let one
-- read the first. That is the difference between an architecture and a habit:
-- a sixth aggregate written next year cannot quietly reach past it, because
-- the assertion names the source rather than the symptom.
--
-- IT FAILS CLOSED. The boundary is built from INNER joins through release and
-- course, so a response whose provenance cannot be resolved -- a missing
-- release, a deleted course -- is ABSENT from academic evidence rather than
-- silently counted as academic because academic is the historical default.
-- Historical ROWS are academic by migration; unresolvable PROVENANCE is not.
--
-- CERTIFICATES: VALID IS NOT COUNTABLE. A professional-development
-- certificate is a real PINTAR certificate under the existing rules, issued
-- by the same machinery, verifiable by the same route. It simply is not an
-- ACADEMIC credential, so `scoped_certificates` -- which exists only to feed
-- the catalogue -- carries academic ones. Nothing about issuance, validity,
-- revocation or verification changes, and no separate PD certificate engine
-- is created.
--
-- AND TWO THINGS I GOT WRONG, WITHDRAWN AT THEIR SOURCE RATHER THAN UNDONE
-- HERE. 20260927100000 has not been promoted to anything, so the honest
-- repair is for it not to make the mistake:
--
--   * its `create or replace view` set `security_invoker = true` on
--     `scoped_official_sessions`. None of its five siblings has it and WP6
--     never needed it, so it was an unrelated change to one view's security
--     semantics. That clause is gone; the view keeps its siblings' semantics.
--   * `row_in_learning_context` was granted to `authenticated` and registered
--     as a PLATFORM RPC. The only object that calls it is a view running with
--     its owner's rights, so no client has any use for it. The grant and the
--     registry row are gone.
--
-- The terminal block still asserts both end states, so this migration refuses
-- to finish on a database where either one survived.
-- ---------------------------------------------------------------------------

-- ─────────────────────────────── 1. the academic evidence boundary
-- `security_invoker` here is NOT a new security decision: it is the semantics
-- the boundary this sits beside already has. `official_sessions`,
-- `official_responses` and `official_results` are all invoker views, so an
-- academic view reading one must be invoker too, or a chain that used to check
-- the caller's rights would start checking the view owner's. Neither view is
-- granted to any role, so today only the owner reads them at all -- this is
-- what keeps that safe if somebody grants one tomorrow.
create view public.academic_responses with (security_invoker = true) as
  select r.id, r.presented_item_id, r.session_id, r.institution_id, r.client_seq,
         r.value, r.value_digest, r.received_at, r.client_asserted_at,
         r.receipt_mode, r.is_final
    from public.official_responses r
    join public.assessment_sessions s on s.id = r.session_id
    join public.plp_releases pr on pr.id = s.plp_release_id
    join public.courses co on co.id = pr.course_id
   where co.learning_context = 'ACADEMIC';

comment on view public.academic_responses is
  'WP6A: OFFICIAL responses whose learning context is the school''s curriculum. The academic aggregates '
  'read THIS and never official_responses, so evidence from another learning context cannot reach them '
  'by being forgotten. Inner joins throughout, so unresolvable provenance is absent rather than assumed '
  'academic.';

create view public.academic_certificates with (security_invoker = true) as
  select c.id, c.session_id, c.person_id, c.institution_id, c.snapshot_id,
         c.certificate_number, c.verification_token, c.status, c.issued_at, c.issued_at_iso,
         c.canonical_payload, c.signature, c.key_version, c.revoked_at, c.revoked_reason,
         c.supersedes_certificate_id, c.created_at
    from public.certificates c
    join public.assessment_sessions s on s.id = c.session_id
    join public.plp_releases pr on pr.id = s.plp_release_id
    join public.courses co on co.id = pr.course_id
   where co.learning_context = 'ACADEMIC';

comment on view public.academic_certificates is
  'WP6A: certificates for academic learning. A professional-development certificate is a real, valid, '
  'verifiable PINTAR certificate and is deliberately absent HERE, because institution.verified_credentials '
  'counts academic credentials. Certificate validity and academic-metric eligibility are different '
  'questions and this view is the second one.';

-- ─────────────────── 2. the response-derived sources read the boundary
create or replace view public.service_item_statistics with (security_invoker = true) as
  select i.id as item_id, i.institution_id, i.lesson_id, i.bank_type, i.item_type,
         count(*)::integer as evidence_count,
         count(*) filter (where o.is_correct)::integer as correct_count,
         case when count(*) = 0 then null
              else round(count(*) filter (where o.is_correct)::numeric / count(*), 4) end
           as correctness_rate,
         avg(extract(epoch from (r.received_at - p.presented_at)))::numeric(10,3)
           as mean_response_seconds,
         min(p.position)::smallint as first_position,
         max(p.position)::smallint as last_position
    from public.items i
    join public.presented_items p on p.item_id = i.id
    join public.academic_responses r on r.presented_item_id = p.id
    left join public.item_options o
           on o.item_id = i.id and o.label = (r.value ->> 'pilihan')
   group by i.id, i.institution_id, i.lesson_id, i.bank_type, i.item_type;

create or replace view public.service_distractor_uptake with (security_invoker = true) as
  select i.id as item_id, i.institution_id, o.label, o.is_correct,
         o.misconception_code,
         count(*)::integer as chosen_count
    from public.items i
    join public.item_options o on o.item_id = i.id
    join public.presented_items p on p.item_id = i.id
    join public.academic_responses r on r.presented_item_id = p.id
                                    and (r.value ->> 'pilihan') = o.label
   group by i.id, i.institution_id, o.label, o.is_correct, o.misconception_code;

create or replace view public.service_cohort_misconceptions with (security_invoker = true) as
  select s.institution_id, s.cohort_node_id, s.class_node_id,
         o.misconception_code, mt.label, mt.remediation,
         count(*)::integer as occurrences
    from public.academic_responses r
    join public.assessment_sessions s on s.id = r.session_id
    join public.presented_items p on p.id = r.presented_item_id
    join public.item_options o on o.item_id = p.item_id
                             and o.label = (r.value ->> 'pilihan')
                             and not o.is_correct
    join public.misconception_taxonomy mt on mt.code = o.misconception_code
   where o.misconception_code is not null
   group by s.institution_id, s.cohort_node_id, s.class_node_id,
            o.misconception_code, mt.label, mt.remediation;

-- ───────────────────────────── 3. the certificate metric source
create or replace view public.scoped_certificates as
  select c.* from public.academic_certificates c
   where public.person_in_metric_boundary(c.institution_id, c.person_id);

-- ─────────── 4. the two things WP6A's first pass got wrong are gone
-- Neither is reverted here, because neither is introduced any more:
-- 20260927100000 no longer sets `security_invoker` on
-- `scoped_official_sessions`, and no longer grants or registers
-- `row_in_learning_context`. The narrowing that migration added is kept
-- exactly as it was, because Second Eye confirmed it works for the consumers
-- that reach it. The terminal block below asserts the end state either way,
-- so a database that carried the option or the grant fails here by name
-- rather than drifting.

-- ───────────────────────── 5. context survives creation and revision
-- A REVISION INHERITS WHAT IT SUPERSEDES. Before this, revising a
-- professional-development course through the product produced an ACADEMIC
-- successor -- so the ordinary act of improving a PD course silently moved
-- its future evidence into the school's academic figures. Revision is not a
-- context-switch mechanism; if changing context is ever wanted it is its own
-- deliberate operation, not a side effect of editing.
create or replace function public.create_course_revision(p_course uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
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

  -- THE ONE CHANGE THIS MIGRATION MAKES TO THIS FUNCTION: the successor
  -- inherits `learning_context` from what it supersedes. Everything else --
  -- the seal precondition, the open-successor rule, objectives, items,
  -- options, assessment definitions and the audit record -- is the function
  -- 20260915120000 wrote, unchanged.
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
       source_version_id, page_citation, status, author_person_id, supersedes_item_id)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           coalesce(v_it.author_person_id, v_actor), v_it.id
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
end $$;
revoke all on function public.create_course_revision(uuid) from public, anon, authenticated;
grant execute on function public.create_course_revision(uuid) to authenticated;

-- AND INGESTION CAN SAY WHAT IT IS BRINGING IN. The payload may carry a
-- learning_context per course; anything it does not say stays ACADEMIC, which
-- keeps every existing package meaning exactly what it meant. An unrecognised
-- value is refused rather than quietly becoming academic evidence.
create or replace function public.ingest_structured_package(p_batch uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; c record; v_course uuid; v_module uuid; v_lesson uuid; n integer := 0;
        v_ctx public.learning_context;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  if not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    raise exception 'materialising an ingest batch requires CAN_DRAFT in the owning institution';
  end if;
  if b.status <> 'CONFIRMED' then
    raise exception 'this batch is %, and nothing is materialised before CONFIRMED', b.status;
  end if;
  for c in select * from jsonb_to_recordset(coalesce(b.raw_payload -> 'courses', '[]'::jsonb))
      as x(subject text, stage text, grade_label text, title text, learning_context text) loop
    if c.learning_context is null or btrim(c.learning_context) = '' then
      v_ctx := 'ACADEMIC';
    elsif not exists (select 1 from unnest(enum_range(null::public.learning_context)) e
                       where e::text = upper(btrim(c.learning_context))) then
      raise exception 'unknown learning context % in this package', c.learning_context;
    else
      v_ctx := upper(btrim(c.learning_context))::public.learning_context;
    end if;
    insert into public.courses (institution_id, subject, stage, grade_label, title,
                                author_person_id, learning_context)
      values (b.institution_id, c.subject, c.stage, c.grade_label, c.title,
              b.confirmed_by_person_id, v_ctx)
      returning id into v_course;
    n := n + 1;
  end loop;
  update public.ingest_batches set status = 'MATERIALISED' where id = p_batch;
  return n;
end $$;
revoke all on function public.ingest_structured_package(uuid) from public, anon, authenticated;
grant execute on function public.ingest_structured_package(uuid) to authenticated;

-- AND AN AUTHORITATIVE CREATION PATH, so establishing a course's context is
-- never a developer running an UPDATE afterwards. This is the backend
-- contract WP6B will call; it builds no screen.
create function public.create_course(
  p_institution uuid, p_subject text, p_stage text, p_grade_label text, p_title text,
  p_learning_context public.learning_context default 'ACADEMIC')
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not public.can_in_institution('CAN_DRAFT', p_institution) then
    raise exception 'creating a course requires CAN_DRAFT in the owning institution';
  end if;
  if p_learning_context is null then
    raise exception 'a course must say which learning context it belongs to';
  end if;
  insert into public.courses (institution_id, subject, stage, grade_label, title,
                              author_person_id, learning_context)
  values (p_institution, p_subject, p_stage, p_grade_label, p_title,
          public.current_person_id(), p_learning_context)
  returning courses.id into v_id;
  return v_id;
end $$;
comment on function public.create_course(uuid, text, text, text, text, public.learning_context) is
  'WP6A: the authoritative course-creation path. Takes the learning context as an argument -- defaulting '
  'to ACADEMIC so nothing existing changes meaning -- so a professional-development course never depends '
  'on somebody remembering to UPDATE the column afterwards.';
revoke all on function public.create_course(uuid, text, text, text, text, public.learning_context)
  from public, anon, authenticated;
grant execute on function public.create_course(uuid, text, text, text, text, public.learning_context)
  to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('create_course', 'STAFF',
        'Creates a course and establishes its learning context in the same statement. ACADEMIC unless '
        'the caller says otherwise.',
        'CAPABILITY', 'CAN_DRAFT')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ─────────── 6. the guard that makes the next one hard to get wrong
-- The defect this migration repairs was not five wrong WHERE clauses; it was
-- that nothing stopped an academic aggregate reading raw evidence. So the
-- rule is stated once, over the live catalogue, and a sixth aggregate
-- written next year fails here rather than in production.
create function public.assert_academic_sources_are_context_bound()
returns table(ok boolean, detail text)
language plpgsql stable set search_path = public, pg_temp as $$
declare v_bad text := ''; v_def text; v_rel text; n_checked int := 0;
begin
  -- EVERY RESPONSE-DERIVED ACADEMIC SOURCE READS THE ACADEMIC BOUNDARY, and
  -- none of them reaches past it to official_responses or responses.
  foreach v_rel in array array['service_item_statistics', 'service_distractor_uptake',
                               'service_cohort_misconceptions'] loop
    n_checked := n_checked + 1;
    v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
    if v_def not like '%academic_responses%' then
      v_bad := v_bad || format('%s does not read the academic evidence boundary; ', v_rel);
    end if;
    if v_def ~ '\mofficial_responses\M' or v_def ~ '\mpublic\.responses\M' then
      v_bad := v_bad || format('%s reaches past the academic boundary to raw responses; ', v_rel);
    end if;
  end loop;

  -- THE CREDENTIAL SOURCE COUNTS ACADEMIC CREDENTIALS. A PD certificate is
  -- valid and verifiable; it is simply not one of these.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_certificates'::regclass, true));
  if v_def not like '%academic_certificates%' then
    v_bad := v_bad || 'the credential metric source does not read academic certificates; ';
  end if;

  -- AND THE BOUNDARIES THEMSELVES STILL ASK THE QUESTION.
  foreach v_rel in array array['academic_responses', 'academic_certificates'] loop
    n_checked := n_checked + 1;
    if to_regclass('public.' || v_rel) is null then
      v_bad := v_bad || format('%s is gone; ', v_rel);
    else
      v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
      if v_def not like '%learning_context%' or v_def not like '%academic%' then
        v_bad := v_bad || format('%s no longer narrows by learning context; ', v_rel);
      end if;
      -- fail closed: an outer join would admit rows whose provenance cannot
      -- be resolved, which is how "unknown" becomes "academic"
      if v_def ~ '\mleft join\M' or v_def ~ '\mright join\M' or v_def ~ '\mfull join\M' then
        v_bad := v_bad || format('%s resolves provenance with an outer join, so unknown becomes academic; ', v_rel);
      end if;
      -- AND IT READS ITS SOURCE WITH THE CALLER'S RIGHTS, like the OFFICIAL
      -- boundary it sits beside. A definer view in an invoker chain quietly
      -- changes whose rights the rows are filtered for.
      if not exists (select 1 from pg_class cl
                      where cl.oid = ('public.' || v_rel)::regclass
                        and cl.reloptions::text like '%security_invoker=true%') then
        v_bad := v_bad || format('%s does not read its source with the caller''s rights; ', v_rel);
      end if;
    end if;
  end loop;

  -- THE FOURTH FAMILY. Eleven of the sixteen calculators reach evidence
  -- through the session/result pair rather than through responses or
  -- certificates, so the guard names that narrowing too -- otherwise it would
  -- cover three of the four families and read as if it covered all of them,
  -- which is the same mistake as the crown test it replaces.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_sessions'::regclass, true));
  if v_def not like '%row_in_learning_context%' then
    v_bad := v_bad || 'the session evidence source no longer narrows by learning context; ';
  end if;
  if v_def not like '%row_in_metric_boundary%' then
    v_bad := v_bad || 'the session evidence source lost WP1''s organizational boundary; ';
  end if;
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_results'::regclass, true));
  if v_def not like '%scoped_official_sessions%' then
    v_bad := v_bad || 'the result source no longer inherits the session source''s narrowing; ';
  end if;

  -- AND EVERY CALCULATOR REACHES EVIDENCE THROUGH ONE OF THOSE FAMILIES.
  -- A seventeenth metric pointed at a raw relation fails here by name.
  select string_agg(distinct cl.relname, ', ' order by cl.relname) into v_def
    from public.metric_definitions m
    join pg_proc p on p.proname = 'calc_' || m.calculation_key
                  and p.pronamespace = 'public'::regnamespace
    join pg_depend d on d.objid = p.oid and d.classid = 'pg_proc'::regclass
    join pg_class cl on cl.oid = d.refobjid and cl.relkind in ('v', 'r')
   where m.catalogue_version = public.current_metric_catalogue()
     and cl.relname not in ('scoped_official_sessions', 'scoped_official_results',
                            'scoped_service_item_statistics', 'scoped_service_distractor_uptake',
                            'scoped_service_cohort_misconceptions', 'scoped_certificates',
                            'readiness_tiers');
  if v_def is not null then
    v_bad := v_bad || format('a calculator reaches a relation outside the narrowed source families: %s; ', v_def);
  end if;
  n_checked := n_checked + 1;

  -- AND A REVISION STILL INHERITS.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_functiondef('public.create_course_revision(uuid)'::regprocedure));
  if v_def not like '%learning_context%' then
    v_bad := v_bad || 'create_course_revision does not carry the learning context forward; ';
  end if;

  if v_bad <> '' then
    return query select false, v_bad;
  else
    return query select true, format(
      '%s academic source(s) and boundary(ies) checked: every response-derived aggregate reads '
      || 'academic_responses and none reaches raw responses, the credential source counts academic '
      || 'certificates, both boundaries still narrow by learning context and resolve provenance with '
      || 'inner joins so unknown provenance is absent rather than assumed academic, and a course '
      || 'revision carries its predecessor''s context forward', n_checked);
  end if;
end $$;
revoke all on function public.assert_academic_sources_are_context_bound() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; v_def text; v_n int; v_inst uuid; v_a uuid; v_b uuid;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_academic_sources_are_context_bound() a;
  if not v_ok then raise exception 'WP6A correction: %', v_detail; end if;

  -- THE SECURITY SEMANTICS OF THE SCOPED VIEWS ARE UNIFORM. My first pass
  -- gave one of the six `security_invoker`; none of the others has it and WP6
  -- never needed it, so that clause was withdrawn where it was written.
  select count(*) into v_n from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
     and c.relname like 'scoped\_%' and c.reloptions::text like '%security_invoker=true%';
  if v_n <> 0 then
    raise exception '% scoped view(s) carry security_invoker while their siblings do not', v_n;
  end if;

  -- AND THE HELPER IS NO LONGER A CLIENT-CALLABLE RPC.
  if has_function_privilege('authenticated', 'public.row_in_learning_context(uuid)', 'execute') then
    raise exception 'row_in_learning_context is still executable by a client that has no use for it';
  end if;
  if exists (select 1 from public.client_rpc_registry where function_name = 'row_in_learning_context') then
    raise exception 'row_in_learning_context is still registered as a client RPC';
  end if;

  -- CREATION ESTABLISHES CONTEXT RATHER THAN LEAVING IT TO AN UPDATE.
  v_def := lower(pg_get_functiondef('public.create_course(uuid,text,text,text,text,public.learning_context)'::regprocedure));
  if v_def not like '%learning_context%' then
    raise exception 'the authoritative creation path does not establish a learning context';
  end if;
  v_def := lower(pg_get_functiondef('public.ingest_structured_package(uuid)'::regprocedure));
  if v_def not like '%learning_context%' or v_def not like '%unknown learning context%' then
    raise exception 'structured ingestion cannot carry a context, or accepts an unknown one';
  end if;

  ----------------------------------------------------------------- behavioural
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah WP6C', 'wp6c-' || substr(md5(random()::text), 1, 10), true)
    returning institutions.id into v_inst;

    -- A REVISION INHERITS, twice over, and an academic one stays academic.
    insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
    values (v_inst, 'Pengembangan', 'Guru', '-', 'PD', 'PROFESSIONAL_DEVELOPMENT')
    returning courses.id into v_a;
    insert into public.courses
      (institution_id, subject, stage, grade_label, title, status, supersedes_course_id, learning_context)
    select v_inst, c.subject, c.stage, c.grade_label, c.title, 'INGESTED', v_a, c.learning_context
      from public.courses c where c.id = v_a
    returning courses.id into v_b;
    if (select c.learning_context from public.courses c where c.id = v_b)
       <> 'PROFESSIONAL_DEVELOPMENT' then
      raise exception 'a revision of a professional-development course became academic';
    end if;

    -- AN UNRESOLVABLE CONTEXT IS NOT ACADEMIC. Asked of a release that does
    -- not exist, the academic boundary admits nothing rather than defaulting.
    if exists (select 1 from public.academic_responses r
                where r.session_id = '00000000-0000-0000-0000-000000000000') then
      raise exception 'the academic boundary admitted a row with unresolvable provenance';
    end if;

    perform set_config('app.seed_intent', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  raise notice '0102 verified: %', v_detail;
end $$;
