-- ---------------------------------------------------------------------------------------------------------------
-- Z · D-1 (R-16, ruling 55): A MULTI-ANSWER RESPONSE IS READ AS EVERY OPTION CHOSEN. Sharon's inventory
-- (RULING55-D1-D8-D6-7ba18b03.md): seven readers took `value ->> 'pilihan'` as one label, so for {"pilihan": ["A","C"]}
-- they matched no option. The learner's review showed no answer and no reason, Peta Bacaan and the misconceptions lost
-- it, the teacher's evidence showed the raw JSON as «chosen», and the statistics counted it wrong and unchosen.
-- Red first: Z-D1-01. The guard Z-D1-02 moves the seven off its pending list in this commit.
--
--   * pilihan_dipilih(value): the chosen labels, distinct and in label order (collate "C", as grade_kunci orders them);
--     a single answer is one label, anything else none. pilihan_tunggal(value): the label of a single answer, else
--     null. Both branch on jsonb_typeof, are immutable and pure, and are for SQL only (no client grant).
--   * session_review, session_misconceptions, reading_map and teacher_question_evidence join on every chosen option.
--     The review keeps one row per question: the chosen options' bodies, and their distinct reasons, joined by « · » in
--     label order, under the same F-1 rule. The teacher's «chosen» is the single answer as before (null for a
--     multi-answer, never JSON text), and chosen_all is every label.
--   * service_distractor_uptake and service_cohort_misconceptions count each chosen option. service_item_statistics
--     counts a response right by the scorer itself, grade_kunci against the key in force, one row per response.
--   * A single answer reads byte-identically (Z-D1-01 compares each reader's output on the seeded sitting). Every
--     definition is restated in full from its live text; grants, view options and the registry are unchanged.
--   * CORRECTED IN PLACE (undeployed; Bob 10:56Z, D060-J78-01). CATALOGUE: unchanged (D-060(c)). Every metric's definition, source list, calculator and audience keep their meaning;
--     the three service sources now read the response the definition always meant (each option a multi-answer response
--     chose; right by the key in force, as F-1 already made the item's own reading). A figure moves only where a
--     multi-answer response or an approved key correction exists, and every single answer reads as before (Z-D1-01).
--     scripts/release/before-import/d1-multi-answer.sql counts the multi-answer responses before a promotion. No new
--     catalogue is published. ENGINE: no engine function is touched.
-- ---------------------------------------------------------------------------------------------------------------

create or replace function public.pilihan_dipilih(p_value jsonb)
returns text[] language sql immutable parallel safe set search_path = pg_catalog, pg_temp as $$
  select case jsonb_typeof(p_value -> 'pilihan')
           when 'string' then array[p_value ->> 'pilihan']
           when 'array'  then array(select d.x from (select distinct t.x from jsonb_array_elements_text(p_value -> 'pilihan') t(x)) d
                                     order by d.x collate "C")
           else '{}'::text[] end
$$;
revoke all on function public.pilihan_dipilih(jsonb) from public, anon, authenticated, service_role;

create or replace function public.pilihan_tunggal(p_value jsonb)
returns text language sql immutable parallel safe set search_path = pg_catalog, pg_temp as $$
  select case when jsonb_typeof(p_value -> 'pilihan') = 'string' then p_value ->> 'pilihan' end
$$;
revoke all on function public.pilihan_tunggal(jsonb) from public, anon, authenticated, service_role;

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
                             and o.label = any (public.pilihan_dipilih(f.value))   -- Z D-1: every chosen option
                             and not coalesce(o.label = any (kb.kunci), o.is_correct)
    join public.misconception_taxonomy mt on mt.code = o.misconception_code and mt.institution_id = o.institution_id
   where o.misconception_code is not null
$function$;

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
                                         and o2.label = any (public.pilihan_dipilih(g2.value))   -- Z D-1: every chosen option
                                         and not coalesce(o2.label = any (g2.kunci), o2.is_correct)
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code and mt.institution_id = o2.institution_id
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $function$;

CREATE OR REPLACE FUNCTION public.teacher_question_evidence(p_assignment uuid, p_class uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
               -- F1-R1b (Sharon §3a.1; Daisy §6a): a wrong option, by the key in force, not linked to a misconception
               -- F1-R1b, Daisy (12 Nov): an answer in this view landed on a wrong option not linked to a misunderstanding
               'ada_tak_terkait', exists (select 1 from jawab j2
                                             join public.item_options o2 on o2.item_id = j2.item_id and o2.label = any (public.pilihan_dipilih(j2.value))
                                            where j2.item_id = q.item_id and j2.value is not null and coalesce(j2.nilai, 0) < 1
                                              and o2.misconception_code is null),
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
                                                  -- Z D-1: the single answer as before (null for a multi-answer, never
                                                  -- its JSON text); every chosen label in chosen_all
                                                  'chosen', public.pilihan_tunggal(j.value),
                                                  'chosen_all', to_jsonb(public.pilihan_dipilih(j.value)),
                                                  'right', coalesce(j.nilai >= 1, false))
                               order by j.position) as answers
                from jawab j group by j.person_id) l
        join public.persons pr on pr.id = l.person_id), '[]'::jsonb))
  into v_out;
  return v_out;
end $function$;

create or replace view public.service_item_statistics as  SELECT i.id AS item_id,
    i.institution_id,
    i.lesson_id,
    i.bank_type,
    i.item_type,
    count(*)::integer AS evidence_count,
    count(*) FILTER (WHERE z.benar)::integer AS correct_count,
        CASE
            WHEN count(*) = 0 THEN NULL::numeric
            ELSE round(count(*) FILTER (WHERE z.benar)::numeric / count(*)::numeric, 4)
        END AS correctness_rate,
    avg(EXTRACT(epoch FROM r.received_at - p.presented_at))::numeric(10,3) AS mean_response_seconds,
    min(p."position") AS first_position,
    max(p."position") AS last_position
   FROM items i
     JOIN presented_items p ON p.item_id = i.id
     JOIN academic_responses r ON r.presented_item_id = p.id AND NOT sesi_ditarik_dikecualikan(r.session_id)
     LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON kb.session_id = r.session_id AND kb.item_id = i.id
     -- Z D-1: right is the scorer's own answer against the key in force (one row per response, for every MCQ type)
     CROSS JOIN LATERAL ( SELECT i.item_type = ANY (ARRAY['MCQ_SINGLE'::item_type, 'MCQ_MULTI'::item_type])
              AND grade_kunci(i.id, r.value, COALESCE(kb.kunci, ARRAY( SELECT o.label FROM item_options o WHERE o.item_id = i.id AND o.is_correct))) >= 1::numeric AS benar) z
  GROUP BY i.id, i.institution_id, i.lesson_id, i.bank_type, i.item_type;

create or replace view public.service_distractor_uptake as  SELECT i.id AS item_id,
    i.institution_id,
    o.label,
    o.is_correct,
    o.misconception_code,
    count(*)::integer AS chosen_count
   FROM items i
     JOIN item_options o ON o.item_id = i.id
     JOIN presented_items p ON p.item_id = i.id
     JOIN academic_responses r ON r.presented_item_id = p.id AND o.label = ANY (pilihan_dipilih(r.value)) AND NOT sesi_ditarik_dikecualikan(r.session_id)
  GROUP BY i.id, i.institution_id, o.label, o.is_correct, o.misconception_code;

create or replace view public.service_cohort_misconceptions as  WITH x AS (
         SELECT s.institution_id,
            s.cohort_node_id,
            s.class_node_id,
            s.person_id,
            o.misconception_code,
            mt.label,
            mt.remediation
           FROM academic_responses r
             JOIN assessment_sessions s ON s.id = r.session_id
             JOIN presented_items p ON p.id = r.presented_item_id
             LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON kb.session_id = s.id AND kb.item_id = p.item_id
             JOIN item_options o ON o.item_id = p.item_id AND o.label = ANY (pilihan_dipilih(r.value)) AND NOT COALESCE(o.label = ANY (kb.kunci), o.is_correct)
             JOIN misconception_taxonomy mt ON mt.code = o.misconception_code AND mt.institution_id = o.institution_id
          WHERE o.misconception_code IS NOT NULL AND NOT ditarik_dikecualikan(s.learning_assignment_id)
        ), per_class AS (
         SELECT x_1.institution_id,
            x_1.class_node_id,
            x_1.misconception_code,
            count(DISTINCT x_1.person_id) AS learners
           FROM x x_1
          GROUP BY x_1.institution_id, x_1.class_node_id, x_1.misconception_code
        ), class_total AS (
         SELECT x_1.institution_id,
            x_1.class_node_id,
            count(DISTINCT x_1.person_id) AS learners
           FROM x x_1
          GROUP BY x_1.institution_id, x_1.class_node_id
        )
 SELECT x.institution_id,
    x.cohort_node_id,
    x.class_node_id,
    x.misconception_code,
    x.label,
    x.remediation,
    count(*)::integer AS occurrences,
    max(pc.learners)::integer AS learners,
    max(ct.learners)::integer AS class_learners
   FROM x
     LEFT JOIN per_class pc ON pc.institution_id = x.institution_id AND NOT pc.class_node_id IS DISTINCT FROM x.class_node_id AND pc.misconception_code = x.misconception_code
     LEFT JOIN class_total ct ON ct.institution_id = x.institution_id AND NOT ct.class_node_id IS DISTINCT FROM x.class_node_id
  GROUP BY x.institution_id, x.cohort_node_id, x.class_node_id, x.misconception_code, x.label, x.remediation;

do $$
declare v_f text;
begin
  -- no reader of the seven takes a response's pilihan as one label any more
  foreach v_f in array array['public.session_review(uuid)', 'public.session_misconceptions(uuid)',
                             'public.reading_map(uuid)', 'public.teacher_question_evidence(uuid,uuid)'] loop
    if pg_get_functiondef(v_f::regprocedure) ~ '->>\s*''pilihan''' then
      raise exception 'Z D-1: % still reads ->> ''pilihan'' as one label', v_f;
    end if;
  end loop;
  if exists (select 1 from pg_views where schemaname = 'public'
              and viewname in ('service_item_statistics', 'service_distractor_uptake', 'service_cohort_misconceptions')
              and definition ~ '->>\s*''pilihan''') then
    raise exception 'Z D-1: a statistical view still reads ->> ''pilihan'' as one label';
  end if;
  if public.pilihan_dipilih('{"pilihan": ["C", "A", "C"]}') <> array['A', 'C']
     or public.pilihan_dipilih('{"pilihan": "B"}') <> array['B'] or public.pilihan_dipilih('{}') <> '{}'::text[]
     or public.pilihan_tunggal('{"pilihan": ["A"]}') is not null or public.pilihan_tunggal('{"pilihan": "B"}') <> 'B' then
    raise exception 'Z D-1: pilihan_dipilih or pilihan_tunggal does not read a choice as specified';
  end if;
  if has_function_privilege('authenticated', 'public.pilihan_dipilih(jsonb)', 'execute')
     or has_function_privilege('anon', 'public.pilihan_tunggal(jsonb)', 'execute') then
    raise exception 'Z D-1: the choice helpers are for SQL only';
  end if;
end $$;

-- CORRECTED IN PLACE (undeployed; Bob 10:56Z, F06-S01). ADR-0021: every function this migration creates is revoked
-- from PUBLIC after its
-- last create. PUBLIC held no EXECUTE on any of them before (CREATE OR REPLACE keeps the grants), so this changes nothing
-- at runtime; it states the rule where the rule is read.
revoke execute on function public.session_review(uuid) from public;
revoke execute on function public.session_misconceptions(uuid) from public;
revoke execute on function public.reading_map(uuid) from public;
revoke execute on function public.teacher_question_evidence(uuid, uuid) from public;
