-- ---------------------------------------------------------------------------
-- C1w · F-1 CORRECTION PASS: EVERY VIEW OF A CORRECTED ANSWER MARKS IT BY THE KEY IN FORCE
-- (docs/completion-4.1/C1W-F1-CORRECTION.md §4, §5, §8, §9; THE PLAN §7.7 F-1; owner decisions O41-21, O41-22).
--
-- THE DEFECT. A governed key correction (20270115110000) never changes the sealed question: the key in force for an
-- affected sitting is recorded in its corrected result's basis (assessment_result_bases.basis -> 'soal' -> item ->
-- 'kunci'), and the result, the learner's map score and review already read it (nilai_jawaban_berlaku). Several derived
-- views still marked the same answers by the SEALED key (item_options.is_correct, grade_response), and so contradicted
-- the result in force: a teacher saw a question marked wrong that the result counts right, and a learner could be sent
-- to remediate what they answered correctly.
--
-- THE ONE READER (design guidance 1). kunci_berlaku_sesi(session) is the only reader of a basis's key: for a sitting
-- whose learner's result (hasil_murid_id) is a governed correction, each question of that basis and the key it was
-- scored by; nothing for any other sitting. Called with no sitting it gives every governed sitting at once, so a
-- class-wide view joins it once, as a set (guidance 4), never once per answer. Every reader below takes the key from
-- it and falls back to EXACTLY its old sealed expression where it has no row (guidance 3): a sitting with no governed
-- correction reads byte for byte as before. nilai_jawaban_berlaku is re-expressed through it (one place).
--
-- WHICH ACCESSOR (guidance 2). hasil_murid_id: the key in force is recorded only on a governed correction's basis,
-- which is what hasil_murid_id resolves (the latest governed correction, else the sealed original). hasil_terkini_id
-- may point to an ordinary recalculation (D11), which records no basis and changes no key. Wherever a basis exists the
-- two name the same result (an ordinary recalculation after a correction is refused, PR011, and a correction after an
-- ordinary one supersedes it), so the key a teacher's figure reads and the key a learner's page reads are one key.
--
-- WHAT IS CORRECTED (the pass's table, rows 1-5; row 6 and the rest are recorded on the correction's page):
--   1 service_cohort_misconceptions (the source of the catalogue figure class.misconceptions): an answer is a
--     misconception when its option is not in the key in force. The view, its columns, the gate and the catalogue row
--     (definition, name, version MC-10, denominator) are unchanged (requirement 4).
--   2 teacher_question_evidence: each answer is marked by nilai_jawaban_berlaku, and each option's is_key is the key in
--     force; where the question's key in force is not its sealed key, each option also says was_key (the sealed key)
--     and the question says key_corrected, so the teacher still sees the original (the screen says so, in words kept in
--     src/lib/hle.ts). A question whose key is its sealed one reads exactly as before.
--   3 reading_map: the remediation join takes the chosen option as wrong by the key in force (its score was already).
--   4 session_misconceptions: the same rule as (1), for one sitting.
--   5 service_item_statistics: correct_count and correctness_rate (item.correctness_rate, «Bagian murid yang menjawab
--     soal ini dengan benar») count an answer correct by the key in force of its sitting. The four statistics defects
--     recorded for 4.5 (answer changes counted, MCQ_MULTI, timing, empirical_*) are NOT touched.
-- DECIDED, NOT CHANGED: service_distractor_uptake and its calculator item.distractor_uptake count which option was
-- chosen (no answer is marked right or wrong; its is_correct is the question's own option as sealed, and reading it per
-- sitting would split one option's row in two, a change to the figure's shape); learning_delta reads results (through
-- hasil_murid_id since 20270115110000) and marks nothing. The correction's page records both, with every other reader
-- of item_options.is_correct and grade_response the completeness search found.
-- NOT CHANGED: the sealed question, its options, every result, basis and response (requirement 2: nothing here writes a
-- row); evaluate_session, grade_response, submit_session and recompute_result (the original scoring); the catalogue.
--
-- Each replaced definition is checked below to differ from the one it replaces ONLY in the fragments named here (the
-- reverse replacement gives back the previous definition exactly), so nothing else in them moved.
--
-- CATALOGUE: unchanged (D-060(c)); MC-10 stays the live catalogue and class.misconceptions' row (definition, name,
-- version, minimum and denominator) is not touched (C1W-F1-CORRECTION.md §9.5). Two source views change their text
-- (service_cohort_misconceptions, service_item_statistics), not their meaning: for every sitting with no governed
-- correction they return exactly what they returned (each corrected reader falls back to its old sealed expression, and
-- the check below proves the rest of each definition is the previous one byte for byte; selftest F13-K06..K10 and the
-- correction pass's whole-database comparison show it on data). The only sittings whose figures move are those a
-- governed correction (20270115110000) recalculated, whose result in force MC-10 already reads (O41-21); C1w is not
-- promoted (C1W-F1-CORRECTION.md §1), so no deployed database holds such a sitting and no figure stamped MC-10 was ever
-- read the other way. If the reviewer reads this as a change of meaning under D-060(a), it is a catalogue decision for
-- the owner (§7), not made here.
-- ENGINE: unchanged; grade_response, evaluate_session, finalize_session, record_answer and the paper are not touched
-- (nilai_jawaban_berlaku reads the same governed key as before, through the one reader).
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════ the definitions being replaced, kept for the check
do $$
begin
  perform set_config('f1.vor_tqe', (select prosrc from pg_proc where oid = 'public.teacher_question_evidence(uuid,uuid)'::regprocedure), false);
  perform set_config('f1.vor_sm', (select prosrc from pg_proc where oid = 'public.session_misconceptions(uuid)'::regprocedure), false);
  perform set_config('f1.vor_rm', (select prosrc from pg_proc where oid = 'public.reading_map(uuid)'::regprocedure), false);
end $$;

-- ═══════════════════════════════════════════════════════════ the one reader of the key in force
-- For a sitting whose learner's result is a governed correction: each question of its basis, the key it was scored
-- by, and when that basis was written. Nothing for a sitting with no governed correction. No sitting: every one.
create or replace function public.kunci_berlaku_sesi(p_session uuid default null)
returns table (session_id uuid, item_id uuid, kunci text[], pada timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select b.session_id, e.key::uuid, array(select jsonb_array_elements_text(e.value -> 'kunci')), b.written_at
    from public.assessment_result_bases b
    cross join lateral jsonb_each(b.basis -> 'soal') e
   where (p_session is null or b.session_id = p_session)
     and b.result_id = public.hasil_murid_id(b.session_id)
$$;
revoke all on function public.kunci_berlaku_sesi(uuid) from public, anon, authenticated;
comment on function public.kunci_berlaku_sesi(uuid) is
  'F-1 (O41-21): the one reader of the key in force. For a sitting whose learner''s result (hasil_murid_id) is a '
  'governed key correction, each question of its basis and the key it was scored by; nothing for any other sitting. '
  'With no sitting, every governed sitting (a class-wide view joins it once). Every view that marks an answer reads '
  'the key here and falls back to the sealed options where it has no row.';

-- grade_response, or the key the learner's governed corrected result scored this question by: through the one reader
create or replace function public.nilai_jawaban_berlaku(p_session uuid, p_item uuid, p_value jsonb)
returns numeric language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select public.grade_kunci(p_item, p_value, k.kunci) from public.kunci_berlaku_sesi(p_session) k where k.item_id = p_item),
    public.grade_response(p_item, p_value))
$$;
revoke all on function public.nilai_jawaban_berlaku(uuid, uuid, jsonb) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ row 2: the teacher's per-question evidence
-- 20261124100000's definition (D-088(k), C-12), with each answer marked through nilai_jawaban_berlaku and each option's
-- key read in force. Where a question's key in force is not its sealed key, its options also say was_key (the sealed
-- key) and the question says key_corrected; a question whose key is the sealed one reads exactly as before.
create or replace function public.teacher_question_evidence(p_assignment uuid, p_class uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_aa record; v_out jsonb;
begin
  if public.current_person_id() is null or p_assignment is null or p_class is null then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  select aa.id, aa.node_id, aa.institution_id into v_aa
    from public.assessment_assignments aa where aa.id = p_assignment;
  -- the assignment was set for THIS class, and the reader teaches it
  if v_aa.id is null or v_aa.node_id <> p_class or not exists (
       select 1 from public.role_assignments ra join public.org_nodes n on n.id = p_class
        where ra.person_id = public.current_person_id() and ra.role = 'EDUCATOR'
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
          and ra.scope_node_id is not null and n.jalur @> array[ra.scope_node_id]) then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;
  -- D-069(b) (C-12): in a professional-learning place the answers are the participant's own. Its facilitator reads
  -- enrolment, progress, completion and the result in the professional-learning record, never answers question by
  -- question; fail closed, so a place that is not plainly academic is refused the same way.
  if not exists (select 1 from public.org_nodes n where n.id = p_class and n.learning_context = 'ACADEMIC') then
    raise exception using errcode = '42501', message = 'question-level class evidence is for the class''s teacher';
  end if;

  with sit as (            -- the class's sittings of this assignment that were handed in
    select s.id, s.person_id
      from public.assessment_sessions s
     where s.assessment_assignment_id = p_assignment
       and s.class_node_id = p_class
       and s.institution_id = v_aa.institution_id
       and s.status in ('SUBMITTED', 'FINALIZED')
  ),
  kunci as (               -- F-1 (O41-21): the key in force for these sittings, where a governed correction recorded one
    select k.session_id, k.item_id, k.kunci, k.pada from sit st cross join lateral public.kunci_berlaku_sesi(st.id) k
  ),
  jawab as (               -- each sitting's final answer to each question it presented
    select st.person_id, p.item_id, p.position, f.value,
           case when f.value is null then null else public.nilai_jawaban_berlaku(st.id, p.item_id, f.value) end as nilai,
           kk.kunci, kk.pada
      from sit st
      join public.presented_items p on p.session_id = st.id
      left join lateral (select r.value from public.responses r
                          where r.presented_item_id = p.id and r.is_final
                          order by r.client_seq desc nulls last limit 1) f on true
      left join kunci kk on kk.session_id = st.id and kk.item_id = p.item_id
  ),
  soal as (
    select j.item_id,
           min(j.position) as urutan,
           count(*) filter (where j.value is not null) as menjawab,
           count(*) filter (where j.nilai >= 1) as tepat,
           count(*) as disajikan,
           nullif((jsonb_agg(to_jsonb(j.kunci) order by j.pada desc) filter (where j.kunci is not null)) -> 0,
                  to_jsonb(public.soal_kunci(j.item_id))) as kunci   -- the key in force, where it is not the sealed one
      from jawab j group by j.item_id
  )
  select jsonb_build_object(
    'sittings', (select count(*) from sit),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_id', q.item_id,
               'stem', i.stem,
               'stimulus', i.stimulus,
               'options', (select coalesce(jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body, 'is_key', coalesce(q.kunci ? o.label, o.is_correct))
                                                      || case when q.kunci is null then '{}'::jsonb else jsonb_build_object('was_key', o.is_correct) end
                                                     order by o.label), '[]'::jsonb)
                             from public.item_options o where o.item_id = q.item_id),
               'presented', q.disajikan, 'answered', q.menjawab, 'right', q.tepat)
             || case when q.kunci is null then '{}'::jsonb else jsonb_build_object('key_corrected', true) end
             order by q.urutan, q.item_id)
        from soal q join public.items i on i.id = q.item_id), '[]'::jsonb),
    'learners', coalesce((
      select jsonb_agg(jsonb_build_object(
               'person_id', l.person_id, 'name', pr.display_name,
               'answers', l.answers) order by pr.display_name, l.person_id)
        from (select j.person_id,
                     jsonb_agg(jsonb_build_object('item_id', j.item_id,
                                                  'chosen', j.value ->> 'pilihan',
                                                  'right', coalesce(j.nilai >= 1, false))
                               order by j.position) as answers
                from jawab j group by j.person_id) l
        join public.persons pr on pr.id = l.person_id), '[]'::jsonb))
  into v_out;
  return v_out;
end $$;

-- the grants as 20261101100000 gave them (ADR-0021: revoked from PUBLIC in the migration that creates it)
revoke all on function public.teacher_question_evidence(uuid, uuid) from public, anon;
grant execute on function public.teacher_question_evidence(uuid, uuid) to authenticated;

comment on function public.teacher_question_evidence(uuid, uuid) is
  'D-088(k), D-085 M5: for the class''s teacher, the class''s handed-in sittings of one assessment, question by question '
  '(answered, right, options and key) and learner by learner (submitted option, right). Never a running sitting, '
  'times, integrity or anomaly data, or Question Health. Teaching evidence, not surveillance. C-12 (D-069(b)): an '
  'academic place only; a professional-learning place is refused, its answers being the participant''s own. F-1 '
  '(O41-21): marked by the key in force; a question whose key was corrected also says its original key (was_key).';


-- ═══════════════════════════════════════════════════════════ row 4: one sitting's misconceptions
-- 20261202100000's definition (CR-50), with the chosen option taken as wrong by the key in force.
-- ═══════════════════════════════════════════════════════════ 3. M3: the readers
CREATE OR REPLACE FUNCTION public.session_misconceptions(p_session uuid)
 RETURNS TABLE(item_id uuid, misconception_code text, label text, remediation text, lesson_id uuid, page_citation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select f.item_id, o.misconception_code, mt.label, mt.remediation, i.lesson_id, i.page_citation
    from public.session_final_responses(p_session) f
    join public.items i on i.id = f.item_id
    left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id   -- F-1 (O41-21): the key in force
    join public.item_options o on o.item_id = f.item_id
                             and o.label = (f.value ->> 'pilihan')
                             and not coalesce(o.label = any (kb.kunci), o.is_correct)
    join public.misconception_taxonomy mt on mt.code = o.misconception_code and mt.institution_id = o.institution_id
   where o.misconception_code is not null
$function$;
revoke all on function public.session_misconceptions(uuid) from public, anon, authenticated;
grant execute on function public.session_misconceptions(uuid) to service_role;

-- ═══════════════════════════════════════════════════════════ row 3: the reading map's remediation
-- 20261202100000's definition as 20270115110000 left it (its score through nilai_jawaban_berlaku), with the remediation
-- join taking the chosen option as wrong by the key in force.

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
                                         and o2.label = (g2.value ->> 'pilihan')
                                         and not coalesce(o2.label = any (g2.kunci), o2.is_correct)
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code and mt.institution_id = o2.institution_id
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $function$;
revoke all on function public.reading_map(uuid) from public, anon;
grant execute on function public.reading_map(uuid) to authenticated, service_role;


-- ═══════════════════════════════════════════════════════════ rows 1 and 5: the class-wide views, joined to the reader once
-- Replaced from their own current definitions (the anchors are checked first), so nothing else in them changes; the
-- governed keys are one function scan per query, joined to every answer as a set.
do $$
declare v_def text; v_new text; v_rel text; v_old text; v_to text;
begin
  -- 1 · service_cohort_misconceptions: an answer is a misconception when its option is not in the key in force
  v_def := pg_get_viewdef('public.service_cohort_misconceptions'::regclass);
  perform set_config('f1.vor_scm', v_def, false);
  v_old := E'JOIN presented_items p ON ((p.id = r.presented_item_id)))\n             JOIN item_options o ON (((o.item_id = p.item_id) AND (o.label = (r.value ->> ''pilihan''::text)) AND (NOT o.is_correct))))';
  v_to  := E'JOIN presented_items p ON ((p.id = r.presented_item_id)))\n             LEFT JOIN public.kunci_berlaku_sesi() kb ON (((kb.session_id = s.id) AND (kb.item_id = p.item_id)))\n             JOIN item_options o ON (((o.item_id = p.item_id) AND (o.label = (r.value ->> ''pilihan''::text)) AND (NOT COALESCE((o.label = ANY (kb.kunci)), o.is_correct)))))';
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'F-1: service_cohort_misconceptions'' sealed-key join is not where it was';
  end if;
  execute 'create or replace view public.service_cohort_misconceptions as ' || replace(v_def, v_old, v_to);

  -- 5 · service_item_statistics: an answer is correct when its option is in the key in force
  v_def := pg_get_viewdef('public.service_item_statistics'::regclass);
  perform set_config('f1.vor_sis', v_def, false);
  v_old := 'count(*) FILTER (WHERE o.is_correct)';
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 2 then
    raise exception 'F-1: service_item_statistics does not count the sealed key where it did';
  end if;
  v_new := replace(v_def, v_old, 'count(*) FILTER (WHERE COALESCE((o.label = ANY (kb.kunci)), o.is_correct))');
  v_old := E'     LEFT JOIN item_options o ON (((o.item_id = i.id) AND (o.label = (r.value ->> ''pilihan''::text)))))';
  if position(v_old in v_new) = 0 then raise exception 'F-1: service_item_statistics'' option join is not where it was'; end if;
  v_new := replace(v_new, v_old, v_old || E'\n     LEFT JOIN public.kunci_berlaku_sesi() kb ON (((kb.session_id = r.session_id) AND (kb.item_id = i.id)))');
  execute 'create or replace view public.service_item_statistics as ' || v_new;
end $$;

-- ═══════════════════════════════════════════════════════════ the check: only the named fragments moved
-- Each corrected definition, with its key-in-force fragments put back to the sealed read, is exactly the definition it
-- replaced (selftest/plants/bob04-10..15 and selftest.f13_kunci_segel put back the same fragments).
do $$
declare r record; v_def text; v_back text; v_was text; p text[];
begin
  for r in select * from (values
    ('tqe', 'f', 'public.teacher_question_evidence(uuid,uuid)'),
    ('sm',  'f', 'public.session_misconceptions(uuid)'),
    ('rm',  'f', 'public.reading_map(uuid)'),
    ('scm', 'v', 'public.service_cohort_misconceptions'),
    ('sis', 'v', 'public.service_item_statistics')) x(k, kind, obj)
  loop
    v_was := current_setting('f1.vor_' || r.k);
    if r.kind = 'f' then v_def := (select prosrc from pg_proc where oid = r.obj::regprocedure);
    else v_def := pg_get_viewdef(r.obj::regclass); end if;
    v_back := v_def;
    foreach p slice 1 in array (case r.k
      when 'tqe' then array[
        array[E'  kunci as (               -- F-1 (O41-21): the key in force for these sittings, where a governed correction recorded one\n    select k.session_id, k.item_id, k.kunci, k.pada from sit st cross join lateral public.kunci_berlaku_sesi(st.id) k\n  ),\n', ''],
        array[E'public.nilai_jawaban_berlaku(st.id, p.item_id, f.value) end as nilai,\n           kk.kunci, kk.pada\n', E'public.grade_response(p.item_id, f.value) end as nilai\n'],
        array[E'      left join kunci kk on kk.session_id = st.id and kk.item_id = p.item_id\n', ''],
        array[E'           count(*) as disajikan,\n           nullif((jsonb_agg(to_jsonb(j.kunci) order by j.pada desc) filter (where j.kunci is not null)) -> 0,\n                  to_jsonb(public.soal_kunci(j.item_id))) as kunci   -- the key in force, where it is not the sealed one\n', E'           count(*) as disajikan\n'],
        array[E'''is_key'', coalesce(q.kunci ? o.label, o.is_correct))\n                                                      || case when q.kunci is null then ''{}''::jsonb else jsonb_build_object(''was_key'', o.is_correct) end\n', E'''is_key'', o.is_correct)\n'],
        array[E'             || case when q.kunci is null then ''{}''::jsonb else jsonb_build_object(''key_corrected'', true) end\n', '']]
      when 'sm' then array[
        array[E'    left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id   -- F-1 (O41-21): the key in force\n', ''],
        array['and not coalesce(o.label = any (kb.kunci), o.is_correct)', 'and not o.is_correct']]
      when 'rm' then array[
        array[E' end as score,\n           kb.kunci   -- F-1 (O41-21): the key in force, where a governed correction recorded one\n', E' end as score\n'],
        array[E'      left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id\n', ''],
        array['and not coalesce(o2.label = any (g2.kunci), o2.is_correct)', 'and not o2.is_correct']]
      when 'scm' then array[
        array['FROM (((((academic_responses r', 'FROM ((((academic_responses r'],
        array[E'\n             LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON (((kb.session_id = s.id) AND (kb.item_id = p.item_id))))', ''],
        array['NOT COALESCE((o.label = ANY (kb.kunci)), o.is_correct)', 'NOT o.is_correct']]
      when 'sis' then array[
        array['FROM ((((items i', 'FROM (((items i'],
        array[E'\n     LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON (((kb.session_id = r.session_id) AND (kb.item_id = i.id))))', ''],
        array['COALESCE((o.label = ANY (kb.kunci)), o.is_correct)', 'o.is_correct']]
      end)
    loop
      if position(p[1] in v_back) = 0 then raise exception 'F-1: % does not carry its fragment «%»', r.obj, left(p[1], 80); end if;
      v_back := replace(v_back, p[1], p[2]);
    end loop;
    if v_back is distinct from v_was then
      raise exception 'F-1: % differs from the definition it replaced beyond the key-in-force fragments', r.obj;
    end if;
    perform set_config('f1.vor_' || r.k, '', false);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════ the rules the replaced definitions carried, still carried
do $$
declare v_def text;
begin
  -- C-12 (20261124100000) and D-088(k), on the teacher's evidence as it now stands
  v_def := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
  if v_def !~ $r$ra\.role = 'EDUCATOR'$r$ or v_def ~ $r$has_scope\($r$ or v_def !~ $r$s\.status in \('SUBMITTED', 'FINALIZED'\)$r$
     or v_def !~ 'aa.node_id <> p_class' or v_def !~ $r$n\.learning_context = 'ACADEMIC'$r$ then
    raise exception 'F-1: teacher_question_evidence lost its teacher check, handed-in-only rule, class binding or academic place';
  end if;
  if v_def ~* '(telemetry|hesitation|assistance|integrity|anomal|duration|started_at|submitted_at|question_health)' then
    raise exception 'F-1: teacher_question_evidence reads something that is not teaching evidence';
  end if;
  if has_function_privilege('anon', 'public.teacher_question_evidence(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.teacher_question_evidence(uuid,uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.kunci_berlaku_sesi(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.session_misconceptions(uuid)', 'execute') then
    raise exception 'F-1: a grant moved';
  end if;
  -- CR-50's M3 (20261202100000): every reader joins a definition on the option's own school
  if pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure) !~ 'mt\.institution_id = o\.institution_id'
     or pg_get_functiondef('public.reading_map(uuid)'::regprocedure) !~ 'mt\.institution_id = o2\.institution_id'
     or pg_get_viewdef('public.service_cohort_misconceptions'::regclass) !~ 'mt\.institution_id = o\.institution_id' then
    raise exception 'F-1: a reader joins a misconception definition on its code alone';
  end if;
  -- the withdrawn ruling (20270113150000) still reaches both class-wide views
  if position('ditarik_dikecualikan' in pg_get_viewdef('public.service_cohort_misconceptions'::regclass)) = 0
     or position('sesi_ditarik_dikecualikan' in pg_get_viewdef('public.service_item_statistics'::regclass)) = 0 then
    raise exception 'F-1: the withdrawn ruling no longer reaches the class-wide views';
  end if;
  -- the one reader: every corrected reader names it, and none still reads the sealed key bare
  if position('kunci_berlaku_sesi' in pg_get_functiondef('public.nilai_jawaban_berlaku(uuid,uuid,jsonb)'::regprocedure)) = 0
     or position('kunci_berlaku_sesi' in pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure)) = 0
     or position('kunci_berlaku_sesi' in pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure)) = 0
     or position('kunci_berlaku_sesi' in pg_get_functiondef('public.reading_map(uuid)'::regprocedure)) = 0
     or position('kunci_berlaku_sesi' in pg_get_viewdef('public.service_cohort_misconceptions'::regclass)) = 0
     or position('kunci_berlaku_sesi' in pg_get_viewdef('public.service_item_statistics'::regclass)) = 0
     or pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure) ~ 'grade_response'
     or pg_get_functiondef('public.reading_map(uuid)'::regprocedure) ~ 'not o2\.is_correct'
     or pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure) ~ 'not o\.is_correct'
     or pg_get_viewdef('public.service_cohort_misconceptions'::regclass) ~ 'NOT o\.is_correct' then
    raise exception 'F-1: a reader does not take the key in force from kunci_berlaku_sesi';
  end if;
end $$;
