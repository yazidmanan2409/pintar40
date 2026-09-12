-- 0031 — FABLE-03 §0, §2, §7: grading, mastery, the safety gate, finalize, the
-- reading map and the delta. The scoring half of the one engine (INV-26).
--
-- SCORING IS A PURE FUNCTION OF IMMUTABLE EVIDENCE, AND THAT IS THE WHOLE
-- DESIGN. evaluate_session() reads responses and item_options and computes a
-- score; it stores nothing and decides nothing about lifecycle. finalize_session()
-- is the only writer, and it writes what evaluate_session() returned. Three
-- things follow, and each is a requirement somewhere:
--
--   * INV-09's second, independent recomputation at certificate issuance is
--     simply calling evaluate_session() again and comparing it to the stored
--     result. Phase 4 needs no second scorer to do it -- which is also why
--     INV-26 stays satisfiable.
--   * Idempotent finalize (doc 07) is a fact about the table, not a lock:
--     assessment_results carries a partial unique index giving each session at
--     most one root result, so a duplicate finalize observes the existing row.
--   * A recomputation is a new linked row (INV-29), never an UPDATE, and it
--     carries its own engine and scoring-policy versions.
--
-- MISCONCEPTION EVIDENCE IS DERIVED, NOT STORED. doc 07 says a wrong response
-- is mapped through its option's misconception_code "at submission time -- not
-- deferred". Both inputs are immutable at that moment: the response is
-- append-only (INV-28) and the option is sealed with its release (INV-04). So
-- the mapping computed at submission and the mapping computed a year later are
-- the same value, and storing a copy would only create something that can
-- disagree with the evidence. doc 06 puts the same reasoning the other way
-- round: a derivation must never become "the" record.
--
-- THE PRE-TEST IS SCORED AND NEVER GRADED. §1 forbids pass/fail messaging on
-- the pre-test, and doc 06 records pretest_completed as "N/A (pre-test never
-- scores pass/fail)". Mastery is still computed for it, because the reading
-- map and the delta are built from it. The separation is in the payload
-- function, not in the arithmetic: session_outcome() returns no verdict for a
-- PRE_TEST session at all, so there is no field a screen could accidentally
-- render.
--
-- NO INVENTED PASS MARK. If a definition's passing_rules names no
-- mastery_min, the outcome reports mastery and the safety gate and says the
-- verdict is unknown. It does not fall back to 60, or 70, or any other number
-- nobody decided (doc 01, Lesson 6).

-- ---------------------------------------------------------------------------
-- 1. Grading, one item at a time. The registry's scorer_contract decides which
--    rule applies; there is no second scoring path per type.
-- ---------------------------------------------------------------------------
create function public.grade_response(p_item uuid, p_value jsonb) returns numeric
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_contract text; v_chosen text[]; v_correct text[];
begin
  select r.scorer_contract into v_contract
    from public.items i join public.item_type_registry r on r.item_type = i.item_type
   where i.id = p_item;
  if v_contract is null then raise exception 'unknown item %', p_item; end if;
  if p_value is null then return 0; end if;

  select array_agg(o.label order by o.label collate "C") into v_correct
    from public.item_options o where o.item_id = p_item and o.is_correct;

  if v_contract = 'exact_option' then
    if jsonb_typeof(p_value -> 'pilihan') <> 'string' then return 0; end if;
    return case when (p_value ->> 'pilihan') = any (coalesce(v_correct, '{}')) then 1 else 0 end;

  elsif v_contract = 'set_match' then
    if jsonb_typeof(p_value -> 'pilihan') <> 'array' then return 0; end if;
    -- distinct first, then order: an aggregate with DISTINCT cannot carry an
    -- ORDER BY expression that is not literally in its argument list
    v_chosen := array(select d.y from (
                        select distinct t.x as y
                          from jsonb_array_elements_text(p_value -> 'pilihan') t(x)) d
                       order by d.y collate "C");
    -- all of the correct set and none outside it; partial credit is not a
    -- rule anyone has defined, so it is not invented here
    return case when coalesce(v_chosen, '{}') = coalesce(v_correct, '{}') then 1 else 0 end;
  end if;

  raise exception 'scorer contract "%" has no implementation in this phase (OD-8)', v_contract;
end $$;
revoke all on function public.grade_response(uuid, jsonb) from public, anon, authenticated;

-- The answer that counts: the highest client_seq for each delivered item.
-- A learner changing their mind is append-only evidence (INV-28); the last
-- receipt is the one scoring reads.
create function public.session_final_responses(p_session uuid)
returns table (presented_item_id uuid, item_id uuid, posisi smallint, value jsonb,
               is_safety_critical boolean, received_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct on (p.id) p.id, p.item_id, p.position, r.value, i.is_safety_critical, r.received_at
    from public.presented_items p
    join public.items i on i.id = p.item_id
    left join public.responses r on r.presented_item_id = p.id
   where p.session_id = p_session
   order by p.id, r.client_seq desc nulls last
$$;
revoke all on function public.session_final_responses(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The evaluation. Pure: reads evidence, writes nothing.
-- ---------------------------------------------------------------------------
create function public.evaluate_session(p_session uuid)
returns table (item_total integer, answered integer, correct integer,
               mastery numeric, per_domain jsonb,
               safety_total integer, safety_correct integer, safety_gate_passed boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return query
  with graded as (
    select f.presented_item_id, f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0 else public.grade_response(f.item_id, f.value) end as score,
           (f.value is not null) as answered
      from public.session_final_responses(p_session) f
  ),
  domains as (
    select lo.code,
           count(*)::integer                                as total,
           sum(g.score)::integer                            as benar
      from graded g
      join public.items i on i.id = g.item_id
      join public.learning_objectives lo on lo.id = any (i.objective_ids)
     group by lo.code
  )
  select count(*)::integer,
         count(*) filter (where g.answered)::integer,
         coalesce(sum(g.score), 0)::integer,
         case when count(*) = 0 then null
              else round(coalesce(sum(g.score), 0)::numeric / count(*), 4) end,
         coalesce((select jsonb_object_agg(d.code, jsonb_build_object(
                            'benar', d.benar, 'total', d.total,
                            'penguasaan', round(d.benar::numeric / d.total, 4)))
                     from domains d), '{}'::jsonb),
         count(*) filter (where g.is_safety_critical)::integer,
         coalesce(sum(g.score) filter (where g.is_safety_critical), 0)::integer,
         -- INV-10: every safety-critical item delivered must be right. A paper
         -- with no safety-critical content passes the gate vacuously, which is
         -- what "where such content applies" means; it never fails silently.
         (count(*) filter (where g.is_safety_critical)
            = coalesce(sum(g.score) filter (where g.is_safety_critical), 0))
    from graded g;
end $$;
revoke all on function public.evaluate_session(uuid) from public, anon, authenticated;

-- Misconception evidence, derived from the option the learner actually chose.
create function public.session_misconceptions(p_session uuid)
returns table (item_id uuid, misconception_code text, label text, remediation text,
               lesson_id uuid, page_citation text)
language sql stable security definer set search_path = public, pg_temp as $$
  select f.item_id, o.misconception_code, mt.label, mt.remediation, i.lesson_id, i.page_citation
    from public.session_final_responses(p_session) f
    join public.items i on i.id = f.item_id
    join public.item_options o on o.item_id = f.item_id
                             and o.label = (f.value ->> 'pilihan')
                             and not o.is_correct
    join public.misconception_taxonomy mt on mt.code = o.misconception_code
   where o.misconception_code is not null
$$;
revoke all on function public.session_misconceptions(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Finalize. The only writer, idempotent by the table's own shape.
-- ---------------------------------------------------------------------------
create function public.finalize_session(p_session uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_s public.assessment_sessions; v_e record; v_id uuid;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;

  -- already scored: observe the existing root, never compute a second one
  select r.id into v_id from public.assessment_results r
   where r.session_id = p_session and r.supersedes_result_id is null;
  if v_id is not null then return v_id; end if;

  perform public.session_enforce_deadline(p_session);
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.status not in ('SUBMITTED','EXPIRED') then
    raise exception 'a session is scored from SUBMITTED or EXPIRED, not % (doc 04 §5)', v_s.status;
  end if;

  select * into v_e from public.evaluate_session(p_session);

  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,     -- last three derived by the trigger
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), public.scoring_policy_version(), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct))
  returning id into v_id;

  update public.assessment_sessions set status = 'FINALIZED' where id = p_session;
  return v_id;
end $$;
revoke all on function public.finalize_session(uuid) from public, anon;
grant execute on function public.finalize_session(uuid) to authenticated, service_role;

-- The learner's own finalize: same function, their own session only.
create function public.finish_my_session(p_session uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  perform public.submit_session(p_session);
  return public.finalize_session(p_session);
end $$;
revoke all on function public.finish_my_session(uuid) from public, anon;
grant execute on function public.finish_my_session(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. What the learner is shown. A PRE_TEST session gets no verdict field at
--    all, so §1's "no pass/fail messaging" is a property of the payload rather
--    than a rule a screen has to remember.
-- ---------------------------------------------------------------------------
create function public.session_outcome(p_session uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_s public.assessment_sessions; v_r public.assessment_results;
        v_d public.assessment_definitions; v_min numeric; v_out jsonb;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_d from public.assessment_definitions where id = v_s.assessment_definition_id;
  select * into v_r from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_r.id is null then return null; end if;

  v_out := jsonb_build_object(
    'penguasaan',  v_r.mastery,
    'per_domain',  v_r.per_domain,
    'ringkasan',   v_r.delta_inputs);

  if v_s.mode = 'PRE_TEST' then
    -- diagnostic only. No verdict, no gate banner, nothing to render as a mark.
    return v_out || jsonb_build_object('diagnostik', true);
  end if;

  v_min := nullif(v_d.passing_rules ->> 'mastery_min', '')::numeric;
  return v_out || jsonb_build_object(
    'diagnostik', false,
    'gerbang_keselamatan', v_r.safety_gate_passed,
    -- INV-10: the gate is independent of the score and can refuse alone.
    -- A definition that names no pass mark yields null, never a guessed one.
    'lulus', case when v_min is null then null
                  else (v_r.safety_gate_passed and v_r.mastery >= v_min) end,
    'ambang', v_min);
end $$;
revoke all on function public.session_outcome(uuid) from public, anon;
grant execute on function public.session_outcome(uuid) to authenticated, service_role;

-- §7's review accordion. Rationale is revealed here and nowhere else, and
-- never for a pre-test (§1 "No rationale reveal").
create function public.session_review(p_session uuid)
returns table (posisi smallint, stem text, is_safety_critical boolean,
               jawaban_teks text, benar boolean, alasan text, arah text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
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
  return query
    select f.posisi, i.stem, f.is_safety_critical,
           o.body,
           public.grade_response(f.item_id, f.value) = 1,
           o.rationale,
           i.arah_berpikir
      from public.session_final_responses(p_session) f
      join public.items i on i.id = f.item_id
      left join public.item_options o on o.item_id = f.item_id
                                     and o.label = (f.value ->> 'pilihan')
     order by f.is_safety_critical desc, f.posisi;
end $$;
revoke all on function public.session_review(uuid) from public, anon;
grant execute on function public.session_review(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Peta Bacaan Personal (§2). Recomputable, never stored (doc 06 cat. 5).
--
--    One card per competency domain -- a learning objective -- ordered
--    safety-missed, then wajib, then disarankan, then kuat. The order is a
--    derived rank rather than a stored label, so a recomputation over the same
--    evidence produces the same map, and nothing about it can drift out of
--    step with the responses it came from.
--
--    It carries a chapter/page reference and a plain-language reason. The
--    reason is the misconception taxonomy's own remediation text where the
--    learner's wrong option named one, and otherwise a statement of the
--    objective itself -- never a score, never a percentage, and never the word
--    for what they got wrong.
-- ---------------------------------------------------------------------------
create function public.reading_map(p_session uuid)
returns table (peringkat smallint, tingkat text, kode text, pernyataan text,
               modul text, pelajaran text, halaman text, alasan text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
  with graded as (
    select f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0 else public.grade_response(f.item_id, f.value) end as score
      from public.session_final_responses(p_session) f
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
                                         and o2.label = (g2.value ->> 'pilihan')
                                         and not o2.is_correct
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $$;
revoke all on function public.reading_map(uuid) from public, anon;
grant execute on function public.reading_map(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. The delta (§7). Computed on read from two FINALIZED sessions, never
--    stored as a running value (doc 07). A learner with only one of the two is
--    a single-attempt learner and is reported as such -- never as a delta of
--    zero, which would claim a measurement nobody made.
-- ---------------------------------------------------------------------------
create function public.learning_delta(p_learning_assignment uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_pre numeric; v_post numeric; v_pre_at timestamptz; v_post_at timestamptz;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no person in this session'; end if;

  select r.mastery, r.computed_at into v_pre, v_pre_at
    from public.assessment_sessions s
    join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
   where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     and s.mode = 'PRE_TEST' and s.status = 'FINALIZED'
   order by r.computed_at desc limit 1;

  select r.mastery, r.computed_at into v_post, v_post_at
    from public.assessment_sessions s
    join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
   where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     and s.mode = 'POST_TEST' and s.status = 'FINALIZED'
   order by r.computed_at desc limit 1;

  if v_pre is null or v_post is null then
    return jsonb_build_object(
      'status', case when v_pre is null and v_post is null then 'BELUM_ADA'
                     when v_post is null then 'BARU_PEMETAAN'
                     else 'BARU_PENGUASAAN' end,
      'awal', v_pre, 'akhir', v_post, 'selisih', null);
  end if;
  return jsonb_build_object('status', 'LENGKAP', 'awal', v_pre, 'akhir', v_post,
                            'selisih', round(v_post - v_pre, 4),
                            'awal_pada', v_pre_at, 'akhir_pada', v_post_at);
end $$;
revoke all on function public.learning_delta(uuid) from public, anon;
grant execute on function public.learning_delta(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v text;
begin
  for v in select unnest(array['grade_response','session_final_responses','evaluate_session',
                               'session_misconceptions','finalize_session','finish_my_session',
                               'session_outcome','session_review','reading_map','learning_delta'])
  loop
    if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                    where ns.nspname='public' and p.proname = v) then
      raise exception 'this migration did not create public.%()', v;
    end if;
  end loop;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without a pinned search_path: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;

  -- INV-01: nothing that reads an answer key is reachable by a client role.
  -- grade_response and evaluate_session read is_correct; they are internal.
  foreach v in array array['grade_response','evaluate_session','session_final_responses',
                           'session_misconceptions'] loop
    select string_agg(r.rolname, ', ') into bad from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace, unnest(array['anon','authenticated']) r(rolname)
     where ns.nspname='public' and p.proname = v
       and has_function_privilege(r.rolname, p.oid, 'EXECUTE');
    if bad is not null then
      raise exception '%() reads the answer key and is executable by %: %', v, bad, 'INV-01';
    end if;
  end loop;

  -- INV-26: one grader, one evaluator, one finalizer
  foreach v in array array['grade_response','evaluate_session','finalize_session'] loop
    select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = v;
    if n <> 1 then raise exception 'INV-26: % has % implementations, expected 1', v, n; end if;
  end loop;

  -- INV-09: finalize writes what the evaluator returned; it does not compute
  -- a score of its own, and it takes no score argument from anyone
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='finalize_session';
  if def not like '%evaluate_session%' then
    raise exception 'finalize_session does not call evaluate_session; there would be two scorers (INV-09/INV-26)';
  end if;
  if def ~* '\y(is_correct|item_options)\y' then
    raise exception 'finalize_session reads the answer key directly instead of calling the evaluator';
  end if;
  select pg_get_function_identity_arguments(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='finalize_session';
  if def <> 'p_session uuid' then
    raise exception 'finalize_session accepts more than a session id (%): a client-supplied score could enter (INV-09)', def;
  end if;

  -- the evaluator is pure: no INSERT, UPDATE or DELETE anywhere in it
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='evaluate_session';
  if def ~* '\y(insert\s+into|update\s+public\.|delete\s+from)\y' then
    raise exception 'evaluate_session writes; INV-09 needs it recomputable without side effects';
  end if;

  -- §1: a pre-test payload carries no verdict, and the review refuses one
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='session_outcome';
  if def not like '%PRE_TEST%' then
    raise exception 'session_outcome does not special-case the pre-test; a verdict could reach a diagnostic screen';
  end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='session_review';
  if def not like '%PRE_TEST%' or def not like '%rationale%' then
    raise exception 'session_review does not refuse a pre-test; §1 forbids revealing a rationale there';
  end if;

  -- §7: the delta is computed, not stored, and never defaults to zero
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='learning_delta';
  if def ~* '\y(insert\s+into|update\s+public\.)\y' then
    raise exception 'learning_delta stores a value; doc 07 requires it computed on read';
  end if;
  if def not like '%BARU_PEMETAAN%' then
    raise exception 'learning_delta has no single-attempt state; a lone pre-test would become a zero delta';
  end if;

  -- INV-11 holds: no function in public reaches telemetry
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind='f'
     and pg_get_functiondef(p.oid) ~* '\ytelemetry\.'
     and p.proname <> 'enforce_observation_write';
  if bad is not null then raise exception 'function(s) in public reference telemetry (INV-11): %', bad; end if;
end $$;
