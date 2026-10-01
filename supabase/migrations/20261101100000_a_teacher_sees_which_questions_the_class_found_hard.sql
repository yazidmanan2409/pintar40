-- D-088(k) (Yazid, 2 Oct; D-085 M5) -- A TEACHER SEES WHICH QUESTIONS THEIR
-- CLASS FOUND HARD, AND WHO MAY NEED HELP. TEACHING EVIDENCE, NOT SURVEILLANCE.
--
-- A teacher held no read of responses: `responses` answers only the learner
-- and CAN_REVIEW_INTEGRITY (EDU-J21, EDU-J26). Yazid approved this boundary,
-- with one refinement -- the purpose is teaching evidence, and it must never
-- read as an integrity console:
--
--   WHO      a reader holding an active EDUCATOR assignment over the class the
--            assessment was set for (on the class or a place above it). The
--            role itself, not has_scope's ladder: a dean ranks above EDUCATOR
--            and holds no read of responses, so the ladder would widen a dean.
--   WHEN     only sittings already SUBMITTED or FINALIZED. A sitting still
--            running is never read: nothing live, whether or not the window
--            has closed.
--   WHAT     per question: the question, its options and key, how many of the
--            class's submitted sittings answered it and how many were right;
--            per learner of those sittings: the option they submitted and
--            whether it was right.
--   NEVER    times, durations, hesitation, assistance, integrity signals or
--            anomalies, devices, attempts, Question Health; another class's
--            sittings; a learner's sitting from outside this assignment.
--
-- One function, SECURITY DEFINER because the rows it reads are row-protected
-- from the teacher; it authorizes first and reads only inside that answer. It
-- writes nothing. Registered in client_rpc_registry (STAFF, ROLE_SET EDUCATOR).

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

comment on function public.teacher_question_evidence(uuid, uuid) is
  'D-088(k), D-085 M5: for the class''s teacher, the class''s handed-in sittings of one assessment, question by question '
  '(answered, right, options and key) and learner by learner (submitted option, right). Never a running sitting, '
  'times, integrity or anomaly data, or Question Health. Teaching evidence, not surveillance.';

revoke all on function public.teacher_question_evidence(uuid, uuid) from public, anon;
grant execute on function public.teacher_question_evidence(uuid, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('teacher_question_evidence', 'STAFF',
        'D-088(k), M5: the class''s handed-in sittings of one assessment, question by question and learner by learner, '
        'for a reader holding EDUCATOR over that class; teaching evidence, never live, never integrity',
        'ROLE_SET', 'EDUCATOR')
on conflict (function_name) do update
  set exposure = excluded.exposure, note = excluded.note,
      authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
  if v_def !~ $r$ra\.role = 'EDUCATOR'$r$ or v_def ~ $r$has_scope\($r$ or v_def !~ $r$s\.status in \('SUBMITTED', 'FINALIZED'\)$r$
     or v_def !~ 'aa.node_id <> p_class' then
    raise exception 'D-088(k): teacher_question_evidence lost its teacher check, its handed-in-only rule or its class binding';
  end if;
  if v_def ~* '(telemetry|hesitation|assistance|integrity|anomal|duration|started_at|submitted_at|question_health)' then
    raise exception 'D-088(k): teacher_question_evidence reads something that is not teaching evidence';
  end if;
  if has_function_privilege('anon', 'public.teacher_question_evidence(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.teacher_question_evidence(uuid,uuid)', 'execute') then
    raise exception 'D-088(k): teacher_question_evidence is for a signed-in caller only';
  end if;
  if not exists (select 1 from public.client_rpc_registry r where r.function_name = 'teacher_question_evidence'
                  and r.authorization_kind = 'ROLE_SET' and r.authorization_requirement = 'EDUCATOR') then
    raise exception 'D-088(k): teacher_question_evidence is not classified in client_rpc_registry';
  end if;
end $$;
