-- C-12 (D-069(b)): A PROFESSIONAL-LEARNING ANSWER STAYS THE PARTICIPANT'S OWN.
--
-- C-12's machine proof (audit run 37353180694, step C12f) found the facilitator of a professional-learning Kelas
-- reading the participant's individual answers on «Lihat per soal»: his name, the option he chose and whether it was
-- right, question by question. D-069(b) gives the facilitator enrolment, participation, progress, completion and the
-- result, and "not individual answers", enforced at the database boundary.
--
-- The cause: teacher_question_evidence (20261101100000, D-088(k)) is SECURITY DEFINER because the rows it reads are
-- row-protected from the teacher, and it authorizes only "an active EDUCATOR over the class". BOB-46 (20261118100000)
-- narrowed the tables themselves to the participant, but this function reads past them and was not narrowed with
-- them, so a PD Kelas's facilitator, who holds EDUCATOR there, was handed what the tables refuse him.
--
-- The one change: the function answers only for an ACADEMIC place (fail closed), and refuses every other place with
-- its own existing refusal, so «Lihat per soal» shows the ordinary refusal page there. An aggregate per question is
-- not offered either: with a handful of participants, or one, a count is an answer. Everything else in the function
-- is 20261101100000's, verbatim, and still meets that migration's assertions; no route, screen or other function
-- changes. The facilitator's record (professional_learning_record) is untouched.

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
  jawab as (               -- each sitting's final answer to each question it presented
    select st.person_id, p.item_id, p.position, f.value,
           case when f.value is null then null else public.grade_response(p.item_id, f.value) end as nilai
      from sit st
      join public.presented_items p on p.session_id = st.id
      left join lateral (select r.value from public.responses r
                          where r.presented_item_id = p.id and r.is_final
                          order by r.client_seq desc nulls last limit 1) f on true
  ),
  soal as (
    select j.item_id,
           min(j.position) as urutan,
           count(*) filter (where j.value is not null) as menjawab,
           count(*) filter (where j.nilai >= 1) as tepat,
           count(*) as disajikan
      from jawab j group by j.item_id
  )
  select jsonb_build_object(
    'sittings', (select count(*) from sit),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_id', q.item_id,
               'stem', i.stem,
               'stimulus', i.stimulus,
               'options', (select coalesce(jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body, 'is_key', o.is_correct)
                                                     order by o.label), '[]'::jsonb)
                             from public.item_options o where o.item_id = q.item_id),
               'presented', q.disajikan, 'answered', q.menjawab, 'right', q.tepat)
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
  'academic place only; a professional-learning place is refused, its answers being the participant''s own.';

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
  -- D-088(k)'s own, unchanged
  if v_def !~ $r$ra\.role = 'EDUCATOR'$r$ or v_def ~ $r$has_scope\($r$ or v_def !~ $r$s\.status in \('SUBMITTED', 'FINALIZED'\)$r$
     or v_def !~ 'aa.node_id <> p_class' then
    raise exception 'C-12: teacher_question_evidence lost its teacher check, its handed-in-only rule or its class binding';
  end if;
  if v_def ~* '(telemetry|hesitation|assistance|integrity|anomal|duration|started_at|submitted_at|question_health)' then
    raise exception 'C-12: teacher_question_evidence reads something that is not teaching evidence';
  end if;
  -- the one added rule
  if v_def !~ $r$n\.learning_context = 'ACADEMIC'$r$ then
    raise exception 'C-12: teacher_question_evidence answers for a place that is not academic';
  end if;
  if has_function_privilege('anon', 'public.teacher_question_evidence(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.teacher_question_evidence(uuid,uuid)', 'execute') then
    raise exception 'C-12: teacher_question_evidence is for a signed-in caller only';
  end if;
end $$;
