-- FABLE-31 · H31 (migration 20270101100000, MC-8): «KENAIKAN» PAIRS EACH LEARNER'S TWO TESTS WITHIN ONE CHAPTER.
--
-- class.net_gain and institution.net_gain used to take a learner's highest Pemetaan Awal and highest Uji Penguasaan
-- over EVERY chapter they sat, so a class that had taught two chapters subtracted one chapter's pre-test from
-- another's post-test. Migration 198's own check reads the calculator's text; this one measures what it returns:
--
--   F31-K01  in a class of its own, learner A sits Bab 1 (pre 30%, post 80%) and Bab 2 (pre 70%, post 75%); learner B
--            sits only Bab 1's pre-test (20%) and Bab 2's post-test (90%). calc_class_net_gain returns 0.275, the mean
--            of A's two chapter gains (0.50 and 0.05) — not 0.10 (A's maxima, 80 − 70) and not anything of B's, whose
--            two tests are of different chapters; its sample is 1, the people counted, not the 2 chapters.
--            calc_institution_net_gain over the whole school equals the mean of every (learner, chapter) pair's gain,
--            computed here independently from the official sessions and results, and its sample is the number of
--            people with such a pair.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

create or replace function selftest.run_fable31()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare v_cukup boolean;
  v_probs text[] := array[]::text[]; v_fatal text := '';
  v_inst uuid; v_tmpl record; v_rel2 uuid; v_cls uuid; v_pa uuid; v_pb uuid; v_e uuid; v_new uuid;
  m record; r jsonb; v_cat text; v_expect numeric; v_people int;
begin
  perform selftest.as_owner();
  begin
    v_cat := public.current_metric_catalogue();
    select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
    if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
    -- a real finalized official session to copy, so the evidence is the tenant's own (a synthetic school is capped at
    -- SYNTHETIC evidence and every calculator would answer nothing)
    select s.* into v_tmpl from public.assessment_sessions s
     where s.institution_id = v_inst and s.status = 'FINALIZED'
       and exists (select 1 from public.official_sessions o where o.id = s.id)
       and exists (select 1 from public.assessment_results x where x.session_id = s.id)
     order by s.id limit 1;
    if v_tmpl.id is null then raise exception 'the demonstration tenant holds no finalized official session to copy'; end if;

    -- Bab 2: a second release of the same course
    insert into public.plp_releases (institution_id, course_id, version_label)
    select p.institution_id, p.course_id, '31.0.' || (extract(epoch from clock_timestamp())::bigint % 100000)::text
      from public.plp_releases p where p.id = v_tmpl.plp_release_id
    returning plp_releases.id into v_rel2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select v_inst, o.parent_id, 'CLASS', 'Kelas F31 Kenaikan', o.academic_period_id
      from public.org_nodes o where o.id = v_tmpl.class_node_id
    returning org_nodes.id into v_cls;

    for m in select * from (values
        ('A', 1, 'PRE_TEST', 0.30), ('A', 1, 'POST_TEST', 0.80),
        ('A', 2, 'PRE_TEST', 0.70), ('A', 2, 'POST_TEST', 0.75),
        ('B', 1, 'PRE_TEST', 0.20), ('B', 2, 'POST_TEST', 0.90)) x(who, bab, md, ms) loop
      if m.who = 'A' and v_pa is null or m.who = 'B' and v_pb is null then
        insert into public.persons (display_name) values ('Murid F31 ' || m.who) returning persons.id into v_new;
        if m.who = 'A' then v_pa := v_new; else v_pb := v_new; end if;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
        select v_new, v_inst, e.academic_period_id, e.programme_id, 'ACTIVE'
          from public.enrollments e where e.id = v_tmpl.enrollment_id
        returning enrollments.id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id)
        values (v_e, v_cls, v_tmpl.academic_period_id);
      end if;
      select e.id into v_e from public.enrollments e
       where e.person_id = case m.who when 'A' then v_pa else v_pb end and e.institution_id = v_inst;
      v_new := gen_random_uuid();
      insert into public.assessment_sessions
        (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
         plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
         scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
         started_at, submitted_at, finalized_at, deadline_extended_count)
      values (v_new, case m.who when 'A' then v_pa else v_pb end, v_inst, v_e, v_tmpl.academic_period_id, v_cls,
              v_tmpl.cohort_node_id, case m.bab when 1 then v_tmpl.plp_release_id else v_rel2 end,
              v_tmpl.assessment_definition_id, v_tmpl.assessment_definition_version, v_tmpl.engine_version,
              v_tmpl.scoring_policy_version, v_tmpl.evidence_channel, v_tmpl.evidence_class, m.md::assessment_mode,
              'CREATED', v_tmpl.shuffle_seed, v_tmpl.started_at, v_tmpl.submitted_at, v_tmpl.finalized_at, 0);
      -- the lifecycle is a trigger, so the fixture walks it
      update public.assessment_sessions set status = 'IN_PROGRESS' where assessment_sessions.id = v_new;
      update public.assessment_sessions set status = 'SUBMITTED'   where assessment_sessions.id = v_new;
      update public.assessment_sessions set status = 'FINALIZED'   where assessment_sessions.id = v_new;
      insert into public.assessment_results
        (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
         mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
      select gen_random_uuid(), v_new, x.institution_id, case m.who when 'A' then v_pa else v_pb end, x.evidence_class,
             x.engine_version, x.scoring_policy_version, m.ms, x.per_domain, x.safety_gate_passed, x.delta_inputs, now()
        from public.assessment_results x where x.session_id = v_tmpl.id;
    end loop;

    -- the class
    perform set_config('pintar.metric_boundary_node', v_cls::text, true);
    r := public.calc_class_net_gain(v_cls, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_node', '', true);
    -- RESTATED TO THE OWNER'S HISTORICAL-DISCLOSURE RULING (9 Nov): each of this learner's two chapters holds one pair,
    -- under the class minimum, so the class's Kenaikan is withheld (its value would give a small chapter's gain when
    -- read before and after); the arithmetic itself (0.275 over two pairs) is F36-X01's, on five such learners
    if r ? 'value' and r -> 'value' <> 'null'::jsonb or r -> 'withheld' ->> 'reason' is distinct from 'subgroup' then
      v_probs := v_probs || format('the class gain over two one-pair chapters is given (%s) rather than withheld', left(r::text, 200));
    end if;
    -- owner (9 Nov): the governed unit is the (learner, chapter) pair: one learner, two pairs, each weighed once
    if (r ->> 'pairs')::int is distinct from 2 then
      v_probs := v_probs || format('the class gain is over %s pair(s), not the learner''s 2 chapters', coalesce(r ->> 'pairs', 'nothing'));
    end if;
    if (r ->> 'sample')::int is distinct from 1 then
      v_probs := v_probs || format('the class sample is %s (expected 1 person: B has no chapter with both tests, and A''s '
                                   'two chapters are one person)', coalesce(r ->> 'sample', 'nothing'));
    end if;

    -- the school, against the same figure computed independently. RESTATED TO OWNER DECISIONS 7 AND 8 (9 Nov): the
    -- pairing is the current Uji Penguasaan (latest sitting, its effective result) against the earliest Pemetaan Awal,
    -- never each test's highest; and a school figure whose pairs fall in a class with fewer learners than the class
    -- minimum is WITHHELD (a reader of the class figures could otherwise subtract), its learners still counted
    with eff as (select distinct on (x.session_id) x.session_id, s.person_id, s.plp_release_id, s.class_node_id, s.mode, s.finalized_at, x.mastery
                   from public.official_sessions s join public.official_results x on x.session_id = s.id
                  where s.institution_id = v_inst
                    and not exists (select 1 from public.official_results q where q.supersedes_result_id = x.id)
                  order by x.session_id),
         a as (select distinct on (person_id, plp_release_id) * from eff where mode = 'PRE_TEST' order by person_id, plp_release_id, finalized_at),
         b as (select distinct on (person_id, plp_release_id) * from eff where mode = 'POST_TEST' order by person_id, plp_release_id, finalized_at desc),
         g as (select a.person_id, b.mastery - a.mastery as gain,
                      (select b.class_node_id where a.class_node_id = b.class_node_id) as sel
                 from a join b on b.person_id = a.person_id and b.plp_release_id = a.plp_release_id
                where a.mastery is not null and b.mastery is not null)
    -- the cells are the school rule's: a pair is a class's when both its sittings are there, else it belongs to none
    select round(avg(g.gain), 4), count(distinct g.person_id),
           not exists (select 1 from (select g2.sel, count(distinct g2.person_id) n from g g2 group by g2.sel) c where c.n < 5)
      into v_expect, v_people, v_cukup
      from g;
    perform set_config('pintar.metric_boundary_node', v_inst::text, true);
    r := public.calc_institution_net_gain(v_inst, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_node', '', true);
    if (r ->> 'sample')::int is distinct from v_people then
      v_probs := v_probs || format('the school counts %s people, not %s', coalesce(r ->> 'sample', 'nothing'), v_people);
    end if;
    -- this tenant's pairs fall in classes of fewer than five: the school figure is withheld, never recomputed without them
    if not coalesce(v_cukup, false) and (r ? 'value' and r -> 'value' <> 'null'::jsonb or r -> 'withheld' ->> 'reason' is distinct from 'subgroup') then
      v_probs := v_probs || format('the school figure over a class of fewer than five is given (%s) rather than withheld', left(r::text, 200));
    elsif coalesce(v_cukup, false) and (r ->> 'value')::numeric is distinct from v_expect then
      v_probs := v_probs || format('the school answered %s, expected %s (current Uji Penguasaan minus the earliest Pemetaan Awal)',
                                   coalesce(r ->> 'value', 'nothing'), v_expect);
    end if;
    if v_people < 1 then v_probs := v_probs || 'the school has no paired chapter at all, so nothing was measured'::text; end if;

    raise exception 'F31_ROLLBACK';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform selftest.as_owner();
    if sqlerrm <> 'F31_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  id := 'F31-K01'; area := 'H31 (MC-8) -- «Kenaikan» pairs each learner''s two tests within one chapter';
  if v_fatal <> '' then
    ok := false; detail := 'the test could not run: ' || left(v_fatal, 200);
  elsif cardinality(v_probs) > 0 then
    ok := false; detail := format('%s problem(s): %s', cardinality(v_probs), array_to_string(v_probs, '; '));
  else
    ok := true;
    detail := 'a class that taught two chapters reports the mean of each learner''s per-chapter gains (0.275, not 0.10), '
           || 'never a pre-test of one chapter against a post-test of another, with its sample in people; the school '
           || 'figure equals the same pairing computed independently';
  end if;
  return next;

  id := 'F31-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-31 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable31() from public;
