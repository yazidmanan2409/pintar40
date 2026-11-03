-- W2.18 (Batch 5; J5.13): A TEACHER SEES THE OBJECTIVES A LEARNER HAS NOT YET REACHED, IN WORDS.
--
-- The teacher's view of one learner (/mengajar/[kelas]/murid/[orang], M4) shows where the learner stands on each of
-- the class's assessments and the mastery recorded on their official results («Hasil resmi», learner.result through
-- metric_evaluate). It did not say which learning objectives the learner has not yet reached, which is the thing a
-- teacher acts on (J5.13).
--
-- tujuan_belum_tercapai(class, learner): the learning objectives, BY THEIR STATEMENT, that this learner's evidence in
-- this class shows as not yet reached. No figure is returned: PINTAR's doctrine is that a number reaches a staff screen
-- only through the metric catalogue (src/lib/pengajar.ts; migration 0072), so this answers in words, and the
-- recorded mastery itself stays where it is read today (learner.result). No item, answer, key or response is read.
--
-- THE DERIVATION IS THE ONE PINTAR ALREADY HAS, NOT A SECOND DEFINITION OF MASTERY (D-086(b)):
--   * the evidence is the class's own official Uji Penguasaan (POST_TEST) results, the latest result of each attempt,
--     each objective read from the result's per_domain {benar, total, penguasaan} and named by the objective the
--     attempt's chapter carries under that code: exactly calc_class_topic_mastery's reading (MC-4, D-088(g)),
--     narrowed to one learner;
--   * «not yet» is the learner's own result's rule (DAISY-29, bagianUlang; session_outcome D-088(b)): the recorded
--     penguasaan is below the mark SEALED on that attempt. An attempt with no sealed mark gives no verdict, never a
--     guessed one;
--   * an objective is judged by the learner's most recent attempt that recorded it, so a later attempt that reaches
--     the mark takes it off the list. «Belum» is never failure (X.5): the list is what to work on next.
--
-- WHO MAY ASK, DECIDED HERE: the reader holds a live role among learner.result's own audiences (the catalogue's,
-- today EDUCATOR; STUDENT is the learner's own path and never stands over somebody) scoped at or above THIS class,
-- and the learner is placed in this class now (an open membership of a current enrolment, D-088(i)) -- the same
-- standing that admits the learner page (its roster and learner.result's audience_scope_over_learner), bound to the
-- class. Anyone else -- a teacher of another class of the school, a teacher of another school, the learner, a person
-- with no role -- gets nothing: an empty answer, never an error that says whether the learner or the class exists.
-- The evidence read is bounded by the metric boundary bound to the class (scoped_official_sessions), so a learner's
-- results produced in another class or school are not read either.
--
-- METRIC CATALOGUE AND ENGINE: unchanged. No calculator, no catalogue version, no new figure.

create or replace function public.tujuan_belum_tercapai(p_class uuid, p_learner uuid)
returns table (objective_id uuid, statement text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[];
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null or p_learner is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives the learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the learner is in this class now
  if not exists (select 1 from public.memberships m
                   join public.enrollments e on e.id = m.enrollment_id
                  where m.node_id = p_class and m.valid_to is null
                    and e.person_id = p_learner and e.institution_id = v_inst
                    and e.status in ('PENDING', 'ACTIVE')) then
    return;
  end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with latest as (
        -- each of the learner's official Uji Penguasaan attempts in this class, its latest result
        select distinct on (r.session_id) r.session_id, r.per_domain, s.assessment_definition_id, s.finalized_at
          from public.scoped_official_results r
          join public.scoped_official_sessions s on s.id = r.session_id
         where s.institution_id = v_inst
           and s.class_node_id = p_class
           and s.person_id = p_learner
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by r.session_id, r.computed_at desc
      ), per_objective as (
        select kv.key as code,
               (kv.value ->> 'penguasaan')::numeric as penguasaan,
               a.pass_mark,
               l.finalized_at, l.session_id,
               (select o.id
                  from public.assessment_definitions ad
                  join public.lessons le on le.module_id = ad.module_id
                  join public.learning_objectives o on o.lesson_id = le.id
                 where ad.id = l.assessment_definition_id and o.code = kv.key
                 order by le.ordinal, o.id
                 limit 1) as objective_id
          from latest l
          join public.assessment_sessions a on a.id = l.session_id,
               lateral jsonb_each(coalesce(l.per_domain, '{}'::jsonb)) kv(key, value)
         where jsonb_typeof(kv.value) = 'object'
           and jsonb_typeof(kv.value -> 'penguasaan') = 'number'
      ), newest as (
        -- the learner's most recent attempt that recorded each objective
        select distinct on (coalesce(p.objective_id::text, p.code)) p.*
          from per_objective p
         order by coalesce(p.objective_id::text, p.code), p.finalized_at desc nulls last, p.session_id
      )
      select x.objective_id, coalesce(lo.statement, x.code) as statement
        from newest x
        left join public.learning_objectives lo on lo.id = x.objective_id
       where x.pass_mark is not null and x.penguasaan < x.pass_mark
       order by coalesce(lo.statement, x.code), x.code;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.tujuan_belum_tercapai(uuid, uuid) from public, anon;
grant execute on function public.tujuan_belum_tercapai(uuid, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('tujuan_belum_tercapai', 'STAFF', 'W2.18 (J5.13): on the teacher''s view of one learner, the learning objectives, by '
   || 'their statement, that the learner''s latest official Uji Penguasaan in this class recorded below the mark sealed '
   || 'on that attempt. For a holder of learner.result''s staff audience (EDUCATOR) scoped over the class, of a learner '
   || 'placed in it now; anyone else gets nothing. No figure, no item, no answer.',
   'SCOPE', 'EDUCATOR')
on conflict (function_name) do update
  set exposure = excluded.exposure, note = excluded.note,
      authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('anon', 'public.tujuan_belum_tercapai(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.tujuan_belum_tercapai(uuid,uuid)', 'execute') then
    raise exception 'tujuan_belum_tercapai is reached by the wrong roles';
  end if;
  if not exists (select 1 from pg_proc p where p.proname = 'tujuan_belum_tercapai' and p.prosecdef
                   and 'search_path=public, pg_temp' = any (p.proconfig)) then
    raise exception 'tujuan_belum_tercapai is not a SECURITY DEFINER function with a fixed search_path';
  end if;
  if not exists (select 1 from public.client_rpc_registry r where r.function_name = 'tujuan_belum_tercapai') then
    raise exception 'tujuan_belum_tercapai is not in the client RPC registry';
  end if;
end $$;
