-- ---------------------------------------------------------------------------
-- WP7D BACKEND UNBLOCKER. MANAGEMENT CAN NAME THE TEACHER IT ASKS ABOUT.
--
-- WP7B gave Management the authority to open a feedback cycle about an
-- educator and no way to find out who that educator is. The endpoint takes a
-- person id; nothing an authorized head of department could read would tell
-- them one. Measured on a clean stack, as a real `authenticated` session, for
-- a head of department who DOES hold Management scope over the class:
--
--     management_scope_over_node(class)                  true
--     person_visible_to_me(educator)                     false
--     role_assignments rows readable about the educator      0
--     persons rows readable about the educator               0
--     members_of_node_at(class)                              0
--
-- Every one of those is correct on its own terms. `person_visible_to_me` is
-- LEARNER-SHAPED -- self, an institution administrator over an enrolment, a
-- roster holder over a membership, portable visibility after a transfer -- and
-- an educator who teaches a class is none of those unless they also happen to
-- be enrolled as a learner somewhere in the reader's scope. The fixture that
-- first exercised this path had exactly that coincidence, which is why the
-- hole stayed invisible until a surface was built over it.
--
-- WHAT THIS IS NOT. It is not a staff directory, not a person search, not
-- "Management may browse educators", and not a widening of
-- `person_visible_to_me` -- which is untouched, and which would have been the
-- easy fix and the wrong one: a learner-visibility predicate that starts
-- answering about colleagues is a different product decision reached by
-- accident. This is one feedback-domain read that answers one feedback-domain
-- question:
--
--     for this class, which educators may this Management caller open a
--     feedback cycle about?
--
-- ONE RULE, READ TWICE, NEVER WRITTEN TWICE. The danger in a discovery
-- endpoint is that it lists people the operation would refuse, or refuses
-- people the operation would accept -- two rules drifting apart with nothing
-- to notice. So the subject rule is factored out of `open_feedback_cycle`
-- into `feedback_subject_candidates()` and the endpoint now ASKS THAT SET the
-- question it used to answer inline. Its refusals, its messages, its order of
-- checks and its public signature are unchanged; what changed is that there
-- is only one copy of "who may be the subject of a cycle over this class".
--
-- DISCOVERY IS ADVISORY, AND OPENING STILL DECIDES. A candidate list is a
-- statement about the world at the moment it was read. Authority can be
-- revoked, an assignment can end, a class can be reached by
-- professional-development material -- and `open_feedback_cycle`
-- re-authorizes the caller and re-validates the subject from scratch every
-- time. Nothing here is a token, a claim or a cached entitlement, and the
-- endpoint does not trust that discovery ran.
--
-- The ACADEMIC rule is deliberately NOT restated here. It is a fact about the
-- class, not about the subject, and it belongs to the endpoint that owns it:
-- discovery can therefore name an educator of a class whose cycle `open`
-- refuses on context grounds, which is the advisory contract working rather
-- than a disagreement. F07-P14 proves that case explicitly.
--
-- AND IT SAYS NOTHING ABOUT RESPONDENTS. Two columns: the person, and the
-- name a Management surface needs to put next to a checkbox. No email, no
-- account, no auth uid, no institutional identity, no enrolment, no
-- membership, no other role, no cycle, no participation, no count, no
-- threshold and no aggregate. It reads none of the three respondent-bearing
-- relations, and `assert_feedback_is_not_evidence()` now fails if it ever
-- learns to.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════ 1. the one authoritative subject rule
-- INTERNAL. No client grant and no registry row: this is the rule, not an
-- endpoint. The public read below and open_feedback_cycle both consult it, so
-- "who may be the subject" has exactly one answer in this schema.
--
-- THE CLASS CONSTRAINT LIVES HERE, not only in the endpoint. A node that is
-- not a CLASS has no legitimate subjects at all -- asking about a department
-- would otherwise enumerate every educator assigned at or above it, which is
-- the staff directory this must not become.
create function public.feedback_subject_candidates(p_node uuid)
returns table (person_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct ra.person_id
    from public.org_nodes n
    join public.role_assignments ra
      on ra.role = 'EDUCATOR'
     and ra.revoked_at is null
     and now() >= ra.valid_from and now() < ra.valid_until
     and ra.scope_node_id is not null
     and n.jalur @> array[ra.scope_node_id]
   where n.id = p_node
     and n.kind = 'CLASS'
$$;
comment on function public.feedback_subject_candidates(uuid) is
  'The one authoritative answer to "who may be the subject of a feedback cycle over this class": a '
  'live EDUCATOR assignment whose scope contains the class. Internal -- open_feedback_cycle and '
  'feedback_subjects_for_class both read it, so the rule cannot drift into two.';
revoke all on function public.feedback_subject_candidates(uuid) from public, anon, authenticated;

-- ════════════════════ 2. the endpoint asks the rule instead of restating it
-- Spliced from the LIVE definition, with the inline subject test replaced by
-- the set above and nothing else touched: same signature, same checks in the
-- same order, same sentences, same audit row.
create or replace function public.open_feedback_cycle(p_node uuid, p_subject_person_id uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; n record; v_qs text; v_th text; v_id uuid; v_pd text; n_eligible int;
begin
  v_me := public.current_person_id();
  -- AUTHORIZATION FIRST, AND ONE SENTENCE FOR EVERY WAY OF NOT HAVING IT. A
  -- caller who is not Management over this class learns nothing about whether
  -- the class, or the educator they named, exists.
  if v_me is null or p_node is null or not public.management_scope_over_node(p_node) then
    raise exception 'opening a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;

  select o.id, o.institution_id, o.kind, o.academic_period_id, o.jalur, o.is_active
    into n from public.org_nodes o where o.id = p_node;
  if n.kind <> 'CLASS' then
    raise exception 'a feedback cycle is opened for a CLASS, not a %: PINTAR 4.0 asks a class about its own teaching', n.kind;
  end if;
  if not n.is_active then
    raise exception 'that class is not active';
  end if;
  if n.academic_period_id is null then
    raise exception 'that class is bound to no academic period, so a cycle has no period to belong to';
  end if;

  -- THE ACADEMIC BOUNDARY, THROUGH THE ONLY CONTEXT FACT THE REPOSITORY OWNS.
  -- An org node carries no learning context; a COURSE does (WP6A). So the
  -- question asked is the one that can actually be answered: does any learning
  -- assignment reaching this class -- at it or above it -- bind material that
  -- is not ACADEMIC? Professional development is refused here, by name.
  select c.title into v_pd
    from public.learning_assignments la
    join public.courses c on c.id = la.course_id
   where c.learning_context <> 'ACADEMIC'
     and la.node_id = any (n.jalur)
   limit 1;
  if v_pd is not null then
    raise exception 'that class is reached by professional-development material (%): PINTAR 4.0 feedback is ACADEMIC only', v_pd;
  end if;

  -- THE SUBJECT. Not the caller, and holding the teaching authority the
  -- repository actually records: a live EDUCATOR assignment whose scope
  -- contains this class. Being a head of department over the class is NOT
  -- enough -- Management is who asks, not who is asked about.
  --
  -- CHANGED IN WP7D: the rule is no longer written here. It lives in
  -- feedback_subject_candidates(), which the discovery endpoint reads too, so
  -- a list that offers a subject and an endpoint that refuses one cannot
  -- disagree. RE-ASKED ON EVERY CALL: whatever a caller discovered a moment
  -- ago, this is the check that decides.
  if p_subject_person_id is null then
    raise exception 'a feedback cycle is about a named educator';
  end if;
  if p_subject_person_id = v_me then
    raise exception 'a feedback cycle is opened about someone else: the subject does not operate their own cycle';
  end if;
  if not exists (select 1 from public.feedback_subject_candidates(p_node) c
                  where c.person_id = p_subject_person_id) then
    raise exception 'the subject of a feedback cycle holds a live EDUCATOR assignment over that class, and this one does not';
  end if;

  v_qs := public.current_feedback_question_set();
  v_th := public.current_feedback_threshold();
  if v_qs is null then raise exception 'no feedback question set is published'; end if;
  if v_th is null then raise exception 'no anonymity threshold is published'; end if;

  -- ONE PER CLASS, SUBJECT AND PERIOD, refused by name rather than by a raw
  -- constraint violation, because the second attempt is usually a human
  -- wondering where the first one went.
  if exists (select 1 from public.feedback_cycles f
              where f.scope_node_id = p_node
                and f.subject_person_id = p_subject_person_id
                and f.academic_period_id = n.academic_period_id) then
    raise exception 'this class already has a feedback cycle about that educator in this academic period';
  end if;

  insert into public.feedback_cycles
    (institution_id, scope_node_id, academic_period_id, subject_person_id,
     question_set_version, threshold_version, opened_by_person_id)
  values (n.institution_id, p_node, n.academic_period_id, p_subject_person_id, v_qs, v_th, v_me)
  returning feedback_cycles.id into v_id;

  -- ELIGIBILITY, SNAPSHOTTED HERE AND NEVER AGAIN. Who was in the class at
  -- this instant, by the same membership window every other part of PINTAR
  -- reads. A learner who arrives tomorrow was not asked; a learner who leaves
  -- tomorrow was, and their answer -- if they gave one -- stays counted,
  -- because they were there.
  perform set_config('pintar.feedback_opening', v_id::text, true);
  insert into public.feedback_opportunities (cycle_id, person_id)
  select v_id, m.person_id
    from public.members_of_node_at(p_node, now()) m
   where m.person_id <> p_subject_person_id
   on conflict (cycle_id, person_id) do nothing;
  get diagnostics n_eligible = row_count;
  perform set_config('pintar.feedback_opening', '', true);

  -- AUDITED AS AN ACT OF MANAGEMENT, and carrying no count of any kind: not
  -- the eligible population, not a response total, nothing that could become a
  -- timeline in a log an institution's administrator can read.
  perform public.audit_write('feedback_cycle.opened', 'feedback_cycles', v_id::text, n.institution_id,
    jsonb_build_object('scope_node_id', p_node, 'subject_person_id', p_subject_person_id,
                       'academic_period_id', n.academic_period_id,
                       'question_set_version', v_qs, 'threshold_version', v_th));
  return v_id;
end $$;
revoke all on function public.open_feedback_cycle(uuid, uuid) from public, anon;
grant execute on function public.open_feedback_cycle(uuid, uuid) to authenticated;

-- ══════════════════════════ 3. the read Management actually needed
-- TWO COLUMNS. The person, so an ordinary surface can pass it back to
-- open_feedback_cycle, and the name, so a human can tell one colleague from
-- another. Nothing else is returned, and the list is ordered so two educators
-- who share a display name still come back in a stable order rather than an
-- arbitrary one -- this endpoint does not invent a uniqueness the repository
-- does not have.
create function public.feedback_subjects_for_class(p_node uuid)
returns table (person_id uuid, display_name text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  v_me := public.current_person_id();
  -- THE SAME BOUNDARY THE OPERATION REQUIRES, and the same sentence it uses.
  -- Authenticating is not discovery: an educator, an institution's
  -- administrator and a SYSTEM_ADMIN are all refused here exactly as they are
  -- refused the cycle itself, because learning which colleagues may be
  -- reported on is part of operating the round.
  if v_me is null or p_node is null or not public.management_scope_over_node(p_node) then
    raise exception 'naming the subjects of a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class';
  end if;
  return query
    select c.person_id, p.display_name
      from public.feedback_subject_candidates(p_node) c
      join public.persons p on p.id = c.person_id
     -- THE CALLER IS NOT A CANDIDATE FOR THEIR OWN ROUND. open_feedback_cycle
     -- refuses `subject = caller` before it asks the rule, so offering them
     -- here would offer something the very next call rejects.
     where c.person_id <> v_me
     order by p.display_name, c.person_id;
end $$;
comment on function public.feedback_subjects_for_class(uuid) is
  'The educators an authorized head of department or dean may open a feedback cycle about, for one '
  'class: the person and a display name, and nothing else. Advisory -- open_feedback_cycle '
  're-authorizes and re-validates on every call -- and silent about respondents, participation, '
  'counts, thresholds and results.';
revoke all on function public.feedback_subjects_for_class(uuid) from public, anon, authenticated;
grant execute on function public.feedback_subjects_for_class(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('feedback_subjects_for_class', 'STAFF',
        'Which educators a Management caller may open a feedback cycle about, for one CLASS. Reads the '
        'same authoritative subject rule open_feedback_cycle enforces, returns only a person id and a '
        'display name, and grants nothing: opening re-authorizes and re-validates independently.',
        'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ═══════════════ 4. the boundary assertion learns about the new surface
-- Extended rather than duplicated: this is the same claim -- feedback is not a
-- record about a person -- and the subject-discovery path is now one more way
-- it could stop being true. Added here: the two new functions must read none
-- of the three respondent-bearing relations, and the projection Management
-- receives must stay two columns wide.
create or replace function public.assert_feedback_is_not_evidence()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  problems text[] := '{}'; bad text; n int;
  v_consumers text[]; v_rel text[]; n_rel int; n_consumers int;
  v_subject text[] := array['feedback_subject_candidates', 'feedback_subjects_for_class'];
begin
  select array(select c.relname::text from pg_class c
                 join pg_namespace ns on ns.oid = c.relnamespace
                where ns.nspname = 'public' and c.relkind in ('r','v','m')
                  and c.relname like 'feedback\_%')
    into v_rel;
  n_rel := coalesce(cardinality(v_rel), 0);
  -- VACUITY GUARDS, both ways. An assertion over no relations, or over no
  -- consumers, passes while measuring nothing -- the failure this build has
  -- repaired more than once.
  if n_rel = 0 then
    problems := problems || 'there are no feedback relations: this assertion is measuring nothing'::text;
  end if;

  select array(
    select p.proname::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.proname = any (array[
              'grade_response','evaluate_session','finalize_session','session_final_responses',
              'session_outcome','session_review','reading_map','learning_delta','assemble_session',
              'recompute_result','metric_evaluate','generate_report','certificate_eligibility',
              'certificate_prepare','verify_certificate','derive_evidence_class',
              'effective_evidence_class','recompute_question_health','record_integrity_signal',
              'management_learner_detail','advance_briefing','sanitized_item','session_paper'])
         or p.proname like 'calc\_%'))
    into v_consumers;
  n_consumers := coalesce(cardinality(v_consumers), 0);
  if n_consumers < 20 then
    problems := problems || format('the evidence-consumer set has collapsed to %s function(s): this '
                                || 'assertion would pass over almost nothing', n_consumers);
  end if;

  -- 1. NO CONSUMER READS FEEDBACK. Comments stripped first (L4): a consumer
  --    that merely EXPLAINS why it does not read feedback must not be caught,
  --    and one that reads it must not escape by explaining.
  select string_agg(p.proname, ', ') into bad
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_consumers)
     and regexp_replace(regexp_replace(coalesce(p.prosrc,''), '/\*.*?\*/', ' ', 'gs'),
                        '--[^\n]*', ' ', 'g') ~* '\yfeedback_[a-z_]+\y';
  if bad is not null then
    problems := problems || ('evidence consumer(s) reading feedback: ' || bad);
  end if;

  -- 2. no view anywhere in public is built over a feedback relation, which is
  --    how a consumer would reach one without naming it
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
   where ref.relname = any (v_rel) and not (dep.relname = any (v_rel))
     and dep.relnamespace::regnamespace::text = 'public';
  if bad is not null then problems := problems || ('view(s) built over feedback: ' || bad); end if;

  -- 3. not a metric source and not a calculator's subject: assert_metric_closure
  --    refuses a calculator that reaches for an undeclared relation, so staying
  --    out of this table is what keeps feedback out of every report
  select string_agg(source_relation, ', ') into bad from public.metric_sources
   where source_relation = any (v_rel);
  if bad is not null then problems := problems || ('feedback declared as a metric source: ' || bad); end if;

  -- 4. THE RESPONSE TABLE CARRIES NOBODY AND NO CLOCK. Matched on column name,
  --    which is the shape a re-identifying column actually arrives in.
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema = 'public' and table_name = 'feedback_responses'
     and (column_name ~* '(person|account|auth|user|session|enrol|enroll|member|client|device|correlat|request|ip_|agent)'
       or column_name ~* '(_at|_time|timestamp|seq)$'
       or data_type like 'timestamp%');
  if bad is not null then
    problems := problems || ('feedback_responses carries a re-identifying column: ' || bad);
  end if;

  -- 5. and no client role can read it, by grant or by policy
  select string_agg(grantee || ':' || privilege_type, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('feedback_responses','feedback_results')
     and grantee in ('anon','authenticated');
  if bad is not null then
    problems := problems || ('a client role holds a grant on raw feedback: ' || bad);
  end if;
  select string_agg(c.relname, ', ') into bad from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = any (v_rel)
     and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then problems := problems || ('feedback relation(s) without RLS: ' || bad); end if;
  select string_agg(grantee || ':' || table_name, ', ') into bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = any (v_rel)
     and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
  if bad is not null then
    problems := problems || ('a client role holds a write grant on feedback: ' || bad);
  end if;

  -- 6. SUBMISSION WRITES NO AUDIT ROW. audit_write derives the actor from
  --    auth.uid(), so an audit row inside the submission path is the
  --    respondent recorded beside their answers, at a time, in a log an
  --    institution's administrator can read.
  if regexp_replace(regexp_replace(
         coalesce((select p.prosrc from pg_proc p
                    where p.pronamespace='public'::regnamespace and p.proname='submit_feedback'), ''),
         '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g') ~* '\yaudit_write\s*\(' then
    problems := problems || 'submit_feedback writes an audit row: the respondent is recorded beside their answers'::text;
  end if;

  -- 7. nothing about feedback travels with a learner
  select string_agg(table_name, ', ') into bad from public.record_class_registry
   where table_name = any (v_rel) and portability <> 'INSTITUTION_SCOPED';
  if bad is not null then problems := problems || ('feedback declared portable: ' || bad); end if;

  -- 8. ADDED IN WP7D. THE SUBJECT PATH IS ABOUT SUBJECTS, NOT RESPONDENTS.
  --    Discovery answers who may be asked ABOUT; the moment it reads an
  --    opportunity, a response or a result it has become a way to learn
  --    something about the people who answered.
  select count(*) into n from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_subject);
  if n <> cardinality(v_subject) then
    problems := problems || format('%s of the %s subject-discovery function(s) are missing: this check '
                                || 'is measuring nothing', cardinality(v_subject) - n, cardinality(v_subject));
  end if;
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_subject)
     and regexp_replace(regexp_replace(coalesce(p.prosrc,''), '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g')
         ~* '\yfeedback_(responses|opportunities|results)\y';
  if bad is not null then
    problems := problems || ('subject discovery reads a respondent-bearing relation: ' || bad);
  end if;
  --    and the projection stays what Management needs and no more
  select string_agg(a.attname, ', ' order by a.attnum) into bad
    from pg_proc p, unnest(p.proargnames, p.proargmodes) with ordinality as a(attname, mode, attnum)
   where p.pronamespace = 'public'::regnamespace and p.proname = 'feedback_subjects_for_class'
     and a.mode = 't';
  if bad is distinct from 'person_id, display_name' then
    problems := problems || ('the Management subject projection is not the two declared columns: '
                          || coalesce(bad, '(none)'));
  end if;
  --    the rule itself is not client-callable: it is the rule, not an endpoint
  if has_function_privilege('authenticated', 'public.feedback_subject_candidates(uuid)', 'execute') then
    problems := problems || 'feedback_subject_candidates is client-callable: the rule is not an endpoint'::text;
  end if;

  ok := array_length(problems, 1) is null;
  select count(*) into n from public.feedback_cycles;
  detail := case when ok then format(
      'feedback is not evidence: %s feedback relation(s), none of them read by any of the %s evidence '
      || 'consumer(s) named here, none exposed through a view, none declared a metric source and none '
      || 'portable; feedback_responses carries no person, account, session, enrolment, membership, '
      || 'client, device or correlation column and no clock at all; no client role may read the raw '
      || 'answers or the snapshots; the submission path writes no audit row; and the %s '
      || 'subject-discovery function(s) read no opportunity, response or result, project exactly the '
      || 'person and the display name, and keep the rule itself off the client surface (%s cycle(s) in '
      || 'this database)', n_rel, n_consumers, cardinality(v_subject), n)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
comment on function public.assert_feedback_is_not_evidence() is
  'Feedback is a class speaking about its teaching, not a record about a learner. Names the evidence '
  'consumers and fails if any of them reads a feedback relation; checks the response table carries no '
  'identity and no clock; checks no client can read raw answers; checks submission writes no audit '
  'row; and checks the subject-discovery path reads no respondent and projects nothing beyond a '
  'person and a name.';
revoke all on function public.assert_feedback_is_not_evidence() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). Structural, then the reported defect reproduced and
-- closed in a subtransaction that is rolled back.
-- ---------------------------------------------------------------------------
do $$
declare
  bad text; n int; v_src text; v_ok boolean; v_detail text;
  v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_dep2 uuid; v_prog uuid; v_prog2 uuid;
  v_coh uuid; v_coh2 uuid; v_k1 uuid; v_k2 uuid;
  v_hod_u uuid; v_hod uuid; v_hod2_u uuid; v_hod2 uuid; v_dean_u uuid; v_dean uuid;
  v_adm_u uuid; v_adm uuid; v_sys_u uuid; v_sys uuid;
  v_e1_u uuid; v_e1 uuid; v_e2_u uuid; v_e2 uuid; v_lrn_u uuid; v_lrn uuid;
  v_enr uuid; v_cycle uuid; v_raised boolean; v_msg text; r record;
begin
  ------------------------------------------------------------------ structural
  -- 1. THE RULE IS NOT AN ENDPOINT.
  if to_regprocedure('public.feedback_subject_candidates(uuid)') is null then
    raise exception 'the shared subject rule does not exist';
  end if;
  if has_function_privilege('authenticated', 'public.feedback_subject_candidates(uuid)', 'execute')
     or has_function_privilege('anon', 'public.feedback_subject_candidates(uuid)', 'execute') then
    raise exception 'the shared subject rule is client-callable';
  end if;

  -- 2. THE ENDPOINT IS TWO COLUMNS, GRANTED AND DECLARED.
  select string_agg(a.attname, ', ' order by a.attnum) into bad
    from pg_proc p, unnest(p.proargnames, p.proargmodes) with ordinality as a(attname, mode, attnum)
   where p.pronamespace = 'public'::regnamespace and p.proname = 'feedback_subjects_for_class'
     and a.mode = 't';
  if bad is distinct from 'person_id, display_name' then
    raise exception 'the Management subject projection is %, not the two declared columns', coalesce(bad, '(none)');
  end if;
  if not has_function_privilege('authenticated', 'public.feedback_subjects_for_class(uuid)', 'execute') then
    raise exception 'the discovery endpoint is not reachable by a client at all';
  end if;
  if has_function_privilege('anon', 'public.feedback_subjects_for_class(uuid)', 'execute') then
    raise exception 'the discovery endpoint is reachable anonymously';
  end if;
  select count(*) into n from public.client_rpc_registry
   where function_name = 'feedback_subjects_for_class' and exposure = 'STAFF'
     and authorization_kind = 'ROLE_SET' and authorization_requirement = 'HEAD_OF_DEPARTMENT,DEAN';
  if n <> 1 then raise exception 'the discovery endpoint is not declared as a Management STAFF read'; end if;

  -- 3. ONE COPY OF THE RULE. The endpoint asks the set; the rule is not
  --    restated in its body, which is the drift this migration exists to end.
  v_src := regexp_replace(regexp_replace(
             pg_get_functiondef('public.open_feedback_cycle(uuid,uuid)'::regprocedure),
             '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g');
  if v_src !~ 'feedback_subject_candidates' then
    raise exception 'open_feedback_cycle does not consult the shared subject rule';
  end if;
  if v_src ~* 'role_assignments' then
    raise exception 'open_feedback_cycle still carries its own copy of the subject rule';
  end if;
  -- and its public shape is untouched
  if pg_get_function_identity_arguments('public.open_feedback_cycle(uuid,uuid)'::regprocedure)
     <> 'p_node uuid, p_subject_person_id uuid'
     or pg_get_function_result('public.open_feedback_cycle(uuid,uuid)'::regprocedure) <> 'uuid' then
    raise exception 'the open contract changed shape';
  end if;
  -- every refusal it owned, it still owns
  foreach bad in array array['HEAD_OF_DEPARTMENT or DEAN standing over that class',
                             'a CLASS, not a', 'professional-development material',
                             'the subject does not operate their own cycle',
                             'holds a live EDUCATOR assignment over that class'] loop
    if position(bad in v_src) = 0 then
      raise exception 'open_feedback_cycle lost a refusal it owned: %', bad;
    end if;
  end loop;

  -- 4. NEITHER NEW FUNCTION KNOWS ANYTHING ABOUT RESPONDENTS.
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('feedback_subject_candidates', 'feedback_subjects_for_class')
     and coalesce(p.prosrc, '') ~* '\yfeedback_(responses|opportunities|results)\y';
  if bad is not null then raise exception 'subject discovery reads a respondent relation: %', bad; end if;

  -- 5. LEARNER VISIBILITY WAS NOT WIDENED TO FIX A STAFF PROBLEM.
  v_src := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  if v_src ~* '(EDUCATOR|feedback)' then
    raise exception 'person_visible_to_me was taught about educators or feedback';
  end if;

  -- 6. and the standing boundary assertion holds in the database it now governs
  select a.ok, a.detail into v_ok, v_detail from public.assert_feedback_is_not_evidence() a;
  if not v_ok then raise exception 'assert_feedback_is_not_evidence: %', v_detail; end if;

  ----------------------------------------------------------------- behavioural
  -- THE REPORTED DEFECT, REPRODUCED FIRST. The educator here is NOT enrolled as
  -- a learner anywhere -- which is the ordinary case, and the one the earlier
  -- fixture happened not to have.
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0104 school', 'probe-0104-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D1') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D2') returning id into v_dep2;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P1') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep2, 'PROGRAMME', 'P2') returning id into v_prog2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'C1', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog2, 'COHORT', 'C2', v_period) returning id into v_coh2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'K1', v_period) returning id into v_k1;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh2, 'CLASS', 'K2', v_period) returning id into v_k2;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-kaprodi1@local.invalid') returning id into v_hod_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-kaprodi2@local.invalid') returning id into v_hod2_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-dekan@local.invalid') returning id into v_dean_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-admin@local.invalid') returning id into v_adm_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-sysadmin@local.invalid') returning id into v_sys_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-guru1@local.invalid') returning id into v_e1_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-guru2@local.invalid') returning id into v_e2_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0104-murid@local.invalid') returning id into v_lrn_u;
    select a.person_id into v_hod  from public.accounts a where a.auth_user_id = v_hod_u;
    select a.person_id into v_hod2 from public.accounts a where a.auth_user_id = v_hod2_u;
    select a.person_id into v_dean from public.accounts a where a.auth_user_id = v_dean_u;
    select a.person_id into v_adm  from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_sys  from public.accounts a where a.auth_user_id = v_sys_u;
    select a.person_id into v_e1   from public.accounts a where a.auth_user_id = v_e1_u;
    select a.person_id into v_e2   from public.accounts a where a.auth_user_id = v_e2_u;
    select a.person_id into v_lrn  from public.accounts a where a.auth_user_id = v_lrn_u;
    update public.persons set display_name = 'Ibu Sri' where id = v_e1;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_hod,  'HEAD_OF_DEPARTMENT', v_dep,   now() - interval '1 day', now() + interval '365 days'),
           (v_hod2, 'HEAD_OF_DEPARTMENT', v_dep2,  now() - interval '1 day', now() + interval '365 days'),
           (v_dean, 'DEAN',               v_fac,   now() - interval '1 day', now() + interval '365 days'),
           (v_adm,  'INSTITUTION_ADMIN',  v_inst,  now() - interval '1 day', now() + interval '365 days'),
           (v_sys,  'SYSTEM_ADMIN',       v_inst,  now() - interval '1 day', now() + interval '365 days'),
           (v_e1,   'EDUCATOR',           v_k1,    now() - interval '1 day', now() + interval '365 days'),
           (v_e2,   'EDUCATOR',           v_k2,    now() - interval '1 day', now() + interval '365 days');
    -- one enrolled learner, so the class is a real class; the EDUCATOR is not
    -- enrolled anywhere, which is the whole point of this probe
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_lrn, v_inst, v_period, 'ACTIVE') returning id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k1, v_period);
    perform set_config('app.seed_intent', '', true);

    -- (1) THE DEFECT: the head of department holds Management scope over the
    --     class and cannot see the educator at all through learner visibility.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    if not public.management_scope_over_node(v_k1) then
      raise exception 'the probe head of department does not manage the class: everything below proves nothing';
    end if;
    if public.person_visible_to_me(v_e1) then
      raise exception 'the probe educator is visible through learner visibility: the defect is not reproduced';
    end if;

    -- (2) AND THE NEW READ ANSWERS: one educator, by name.
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 1 then raise exception 'the class offers % subject(s), expected exactly 1', n; end if;
    select s.person_id, s.display_name into r from public.feedback_subjects_for_class(v_k1) s;
    if r.person_id <> v_e1 or r.display_name <> 'Ibu Sri' then
      raise exception 'the subject returned is not the educator, by name: % / %', r.person_id, r.display_name;
    end if;

    -- (3) AND THE ID IT RETURNS IS THE ID THE EXISTING CONTRACT ACCEPTS.
    v_cycle := public.open_feedback_cycle(v_k1, r.person_id);
    if v_cycle is null
       or not exists (select 1 from public.feedback_cycles f
                       where f.id = v_cycle and f.subject_person_id = v_e1 and f.state = 'OPEN') then
      raise exception 'the discovered subject did not open a cycle';
    end if;

    -- (4) NOBODY ELSE MAY ASK. Each refusal names the Management boundary
    --     rather than telling the caller what it was protecting.
    for r in select * from unnest(array[v_hod2_u, v_adm_u, v_sys_u, v_e1_u, v_lrn_u],
                                  array['a head of department of the other department',
                                        'the institution administrator', 'a SYSTEM_ADMIN',
                                        'the educator themselves', 'a learner']) as t(uid, who)
    loop
      perform set_config('request.jwt.claims',
        json_build_object('sub', r.uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', r.uid::text, true);
      v_raised := false;
      begin
        perform * from public.feedback_subjects_for_class(v_k1);
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised then
        raise exception '% discovered the subjects of a class', r.who;
      end if;
      if v_msg !~ 'HEAD_OF_DEPARTMENT' then
        raise exception '% was refused for the wrong reason: %', r.who, left(v_msg, 90);
      end if;
    end loop;

    -- (5) A DEAN STANDING OVER BOTH DEPARTMENTS MAY ASK, and gets the same
    --     answer -- and a COHORT offers nobody, because a cycle is a class's.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 1 then raise exception 'the dean sees % subject(s) for that class, expected 1', n; end if;
    select count(*) into n from public.feedback_subjects_for_class(v_coh);
    if n <> 0 then raise exception 'a cohort offered % subject(s): this is not a staff directory', n; end if;

    -- (6) TWO SUBJECTS ARE TWO ROWS, and the caller is not one of them.
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_hod, 'EDUCATOR', v_k1, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 2 then raise exception 'the dean sees % subject(s) where two educators teach', n; end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    select count(*) into n from public.feedback_subjects_for_class(v_k1)
     where person_id = v_hod;
    if n <> 0 then raise exception 'a head of department who also teaches was offered their own round'; end if;
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 1 then raise exception 'the head of department sees % subject(s) with themselves excluded', n; end if;

    -- (7) DISCOVERY IS NOT AUTHORIZATION. The educator's assignment ends after
    --     they were listed, and opening refuses on its own re-validation.
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    update public.role_assignments set revoked_at = now()
     where person_id = v_e2 and role = 'EDUCATOR' and scope_node_id = v_k2;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    select count(*) into n from public.feedback_subjects_for_class(v_k2);
    if n <> 0 then raise exception 'a revoked educator is still offered as a subject'; end if;
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k2, v_e2);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'EDUCATOR' then
      raise exception 'opening accepted a subject the rule no longer holds: %', coalesce(v_msg, '(accepted)');
    end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP7D_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('pintar.feedback_opening', '', true);
    if sqlerrm <> 'WP7D_PROBE_UNDO' then
      raise exception 'WP7D verification failed: %', sqlerrm;
    end if;
  end;
end $$;
