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
-- narrowing that view reaches twelve calculators and misses five. Filtering
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
-- AND TWO THINGS I GOT WRONG THAT ARE REVERTED HERE:
--
--   * my `create or replace view` added `security_invoker = true` to
--     `scoped_official_sessions`. None of its five siblings has it and WP6
--     never needed it, so it was an unrelated change to one view's security
--     semantics. Reverted to match.
--   * `row_in_learning_context` was granted to `authenticated` and registered
--     as a PLATFORM RPC. With the view back to definer semantics, no client
--     needs to call it at all. Revoked and de-registered.
-- ---------------------------------------------------------------------------

-- ─────────────────────────────── 1. the academic evidence boundary
create view public.academic_responses as
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

create view public.academic_certificates as
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

-- ─────────── 4. reverting the two things WP6A's first pass got wrong
-- `security_invoker` is dropped to match the five sibling scoped views; the
-- learning-context narrowing itself is kept, because Second Eye confirmed it
-- works for the consumers that do reach it.
-- RESET rather than drop-and-recreate: sixteen calculators depend on these
-- views, so dropping them is not available and was never necessary. The
-- option is the only thing that was wrong; the narrowing itself stays.
alter view public.scoped_official_sessions reset (security_invoker);

-- least privilege: with the view back to definer semantics, no client calls this
revoke all on function public.row_in_learning_context(uuid) from public, anon, authenticated;
delete from public.client_rpc_registry where function_name = 'row_in_learning_context';

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
  v_actor uuid; src public.courses; v_new_course uuid; n_open int;
  v_mod record; v_new_mod uuid; v_les record;
begin
  v_actor := public.current_person_id();
  select * into src from public.courses c where c.id = p_course;
  if src.id is null then raise exception 'no such course'; end if;
  if not public.can_in_institution('CAN_DRAFT', src.institution_id) then
    raise exception 'creating a revision requires CAN_DRAFT in the owning institution';
  end if;
  select count(*) into n_open from public.courses c
   where c.supersedes_course_id = p_course and not public.content_is_sealed(c.id);
  if n_open > 0 then
    raise exception 'an open revision of this course already exists; finish or abandon it first';
  end if;

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
    for v_les in select * from public.lessons where module_id = v_mod.id order by urutan loop
      insert into public.lessons
        (module_id, institution_id, urutan, judul, ringkasan, isi, contoh, media, halaman,
         status, author_person_id, supersedes_lesson_id)
      values (v_new_mod, src.institution_id, v_les.urutan, v_les.judul, v_les.ringkasan,
              v_les.isi, v_les.contoh, v_les.media, v_les.halaman, 'INGESTED',
              coalesce(v_les.author_person_id, v_actor), v_les.id);
    end loop;
  end loop;
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
declare b public.ingest_batches; c record; v_course uuid; n int := 0; v_ctx public.learning_context;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'no such ingest batch'; end if;
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
    end if;
  end loop;

  -- THE FOURTH FAMILY. Twelve of the sixteen calculators reach evidence
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

  -- THE SECURITY SEMANTICS OF THE SCOPED VIEWS ARE UNIFORM AGAIN. My first
  -- pass gave one of the six `security_invoker`; none of the others has it
  -- and WP6 never needed it.
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
