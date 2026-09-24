-- 0072 -- one evaluator, a CLOSED input set, and report functions that cannot compute.
--
-- WHAT THE OBVIOUS ASSERTION WOULD HAVE MISSED. The tempting guard here is
-- `count(evaluator functions) = 1`. It is true, it is cheap, and it is green on
-- the day it is written and green forever -- because a second evaluator
-- appearing was never the risk. Measured on the 70-migration substrate, twelve
-- to thirteen aggregate calls ALREADY compute numbers outside any evaluator,
-- in relations that pre-date this catalogue:
--
--     service_item_statistics        9 aggregate calls
--     service_exam_exposure          2
--     service_cohort_misconceptions  1
--     service_distractor_uptake      1
--
-- The risk is a number reaching a report WITHOUT PASSING THROUGH THE CATALOGUE
-- -- from a service view read directly, from arithmetic inside a report
-- function, or from the TypeScript layer. So this migration asserts the
-- CLOSURE, not the cardinality, in three parts. Cardinality is kept as the
-- cheap first guard, but it is not allowed to carry the property.
--
-- =========================================================================
-- HOW THE INPUT SET IS CLOSED MECHANICALLY, AND WHY IT IS NOT A REGEX.
--
-- A SQL function written with `BEGIN ATOMIC` has its body PARSED AT CREATION,
-- so PostgreSQL records what it reads in `pg_depend`. A string-bodied function
-- (`AS $$ ... $$`) is not parsed and records nothing. Measured here:
--
--     begin atomic select count(*) from official_sessions  ->  rel deps 1
--     as $$ select count(*) from official_sessions $$      ->  rel deps 0
--
-- So every calculator below is atomic-bodied, and `assert_metric_closure`
-- compares the PLANNER'S OWN dependency record against the catalogue's declared
-- sources. Adding a service view to a calculator's reach is therefore a
-- CATALOGUE CHANGE, not a silent second path.
--
-- TWO VACUITY TRAPS, BOTH MEASURED RATHER THAN REASONED ABOUT:
--
--   1. A string-bodied calculator records no dependencies and would satisfy a
--      subset check trivially. Guarded by requiring `prosqlbody is not null`.
--
--   2. ONE LEVEL OF FUNCTION INDIRECTION EMPTIES THE RELATION SET:
--
--          begin atomic select inner()   ->  rel deps 0, FUNCTION deps 1
--
--      A calculator reading its data through a helper records zero relation
--      dependencies -- and "at least one dependency" does not catch it either,
--      because the function dependency satisfies that. So a calculator's
--      `pg_proc` dependency set must be EMPTY or itself a declared calculator.
--      Indirection is then either absent or inside the catalogue.
--
-- WHAT `pg_depend` CANNOT SEE, so assertion 3 stays textual:
--
--     begin atomic select sum(a) / nullif(count(b),0) from src
--        ->  operator deps (none),  function deps (none)
--
-- Built-in aggregates and arithmetic operators are pinned catalog objects and
-- record no dependency rows. A dependency check is blind to `a / b`. That case
-- carries no function name at all, which is why the textual check looks for
-- bare operators and not only for a list of aggregate names.
-- =========================================================================
--
-- CONVENTION NOTE FOR CALCULATORS -- READ BEFORE ADDING ONE.
--
-- `BEGIN ATOMIC` exists nowhere else in this schema (0 of 195 functions before
-- this migration). Two house conventions therefore need stating rather than
-- assuming:
--
--   * NO PINNED `search_path` ON A CALCULATOR, AND THAT IS NOT AN OVERSIGHT.
--     An atomic body resolves every name at CREATION time and stores the
--     resolved OIDs, so it is structurally immune to the search_path
--     substitution that `SECURITY DEFINER ... SET search_path` exists to
--     prevent. The lint counts `secdef_without_search_path`, and calculators
--     are SECURITY INVOKER, so they are outside it by construction.
--
--   * CALCULATORS ARE `SECURITY INVOKER` AND HAVE NO GRANTS. They are reached
--     only from `metric_evaluate`, which is SECURITY DEFINER and performs the
--     authorization. A calculator is a computation, never an entry point.
--
-- OPERATIONAL CONSEQUENCE FOR LATER PHASES -- `drop view` on a declared source
-- is REFUSED while an atomic-bodied calculator depends on it
-- (`dependent_objects_still_exist`). That is mostly the property we want: a
-- catalogue source cannot be removed without confronting its calculators. But
-- it changes forward-only mechanics -- reshaping `service_item_statistics`
-- now requires dropping or replacing its calculators IN THE SAME MIGRATION.
-- `create or replace view` with an unchanged column set is unaffected.

-- ---------------------------------------------------------------------------
-- The declared source set. Versioned with the catalogue it belongs to.
-- ---------------------------------------------------------------------------
create table public.metric_sources (
  catalogue_version text not null references public.metric_catalogue(version) on delete restrict,
  source_relation   text not null,
  why               text not null,
  primary key (catalogue_version, source_relation),
  constraint metric_sources_relation_shape check (source_relation ~ '^[a-z][a-z0-9_]{2,60}$')
);
alter table public.metric_sources enable row level security;
create trigger metric_sources_immutable
  before update or delete on public.metric_sources
  for each row execute function public.enforce_catalogue_immutable();

insert into public.metric_sources (catalogue_version, source_relation, why) values
  ('MC-1','official_sessions','who sat which assessment, in which class and cohort'),
  ('MC-1','official_results','mastery, the safety gate, and per-domain outcomes'),
  ('MC-1','service_item_statistics','per-item correctness and response time over OFFICIAL evidence'),
  ('MC-1','service_distractor_uptake','which options were chosen, and which never were'),
  ('MC-1','service_cohort_misconceptions','named misconceptions and their remediation, per cohort'),
  ('MC-1','certificates','issued and unrevoked credentials'),
  ('MC-1','readiness_tiers','the versioned bands a mastery figure resolves into');
-- NOT declared, deliberately: service_exam_exposure. No MC-1 metric reads it,
-- and leaving it out is what proves the closure is tight rather than decorative.

-- ---------------------------------------------------------------------------
-- The calculators. One per `calculation_key`, uniform signature, atomic body.
--
-- The catalogue VERSION is a parameter rather than a lookup, deliberately: a
-- call to `current_metric_catalogue()` would record a pg_proc dependency and
-- put the calculator's indirection guard into a state it could not
-- distinguish from a hidden helper. The evaluator resolves the version once
-- and hands it down.
--
-- Built-in aggregates and operators record no dependency (measured), so a
-- calculator that uses only built-ins carries pg_proc deps of exactly zero.
-- That is the state the closure assertion requires.
-- ---------------------------------------------------------------------------

create function public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', count(distinct s.person_id),
           'sample', count(distinct s.person_id))
    from public.official_sessions s
   where s.institution_id = p_institution and s.class_node_id = p_node;
end;

create function public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', round(avg(x.mastery), 4),
           'sample', count(*))
    from (select distinct on (r.session_id) r.mastery
            from public.official_results r
            join public.official_sessions s on s.id = r.session_id
           where s.institution_id = p_institution and s.class_node_id = p_node
             and s.mode = 'POST_TEST'
           order by r.session_id, r.computed_at desc) x;
end;

create function public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', round(avg(g.post - g.pre), 4),
           'sample', count(*))
    from (select s.person_id,
                 max(case when s.mode = 'PRE_TEST'  then r.mastery end) as pre,
                 max(case when s.mode = 'POST_TEST' then r.mastery end) as post
            from public.official_sessions s
            join public.official_results r on r.session_id = s.id
           where s.institution_id = p_institution and s.class_node_id = p_node
             and s.mode in ('PRE_TEST','POST_TEST')
           group by s.person_id) g
   where g.pre is not null and g.post is not null;
end;

create function public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_object_agg(d.tier_key, d.n), '{}'::jsonb),
           'sample', coalesce(sum(d.n), 0))
    from (select coalesce(t.tier_key, lowest.tier_key, nopost.tier_key) as tier_key, count(*) as n
            from (select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed
                    from public.official_sessions s
                    join public.official_results r on r.session_id = s.id
                   where s.institution_id = p_institution and s.class_node_id = p_node
                     and s.mode = 'POST_TEST'
                   order by s.person_id, r.computed_at desc) learner
            left join lateral (select t2.tier_key from public.readiness_tiers t2
                                where t2.catalogue_version = p_catalogue
                                  and t2.min_mastery is not null
                                  and learner.mastery >= t2.min_mastery
                                  and learner.mastery <  t2.max_mastery
                                  and learner.safety_gate_passed is not false
                                limit 1) t on true
            left join lateral (select t3.tier_key from public.readiness_tiers t3
                                where t3.catalogue_version = p_catalogue
                                  and t3.min_mastery is not null
                                order by t3.min_mastery limit 1) lowest on true
            left join lateral (select t4.tier_key from public.readiness_tiers t4
                                where t4.catalogue_version = p_catalogue
                                  and t4.applies_without_post_test limit 1) nopost on true
           group by 1) d;
end;

create function public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_object_agg(d.domain, d.avg_score), '{}'::jsonb),
           'sample', coalesce(max(d.n), 0))
    from (select kv.key as domain,
                 round(avg((kv.value #>> '{}')::numeric), 4) as avg_score,
                 count(*) as n
            from (select distinct on (r.session_id) r.per_domain, r.session_id
                    from public.official_results r
                    join public.official_sessions s on s.id = r.session_id
                   where s.institution_id = p_institution and s.class_node_id = p_node
                     and s.mode = 'POST_TEST'
                   order by r.session_id, r.computed_at desc) latest,
                 lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv
           where jsonb_typeof(kv.value) = 'number'
           group by kv.key) d;
end;

create function public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_agg(jsonb_build_object(
                      'code', m.misconception_code, 'label', m.label,
                      'remediation', m.remediation, 'occurrences', m.occurrences)
                      order by m.occurrences desc), '[]'::jsonb),
           'sample', coalesce(sum(m.occurrences), 0))
    from public.service_cohort_misconceptions m
   where m.institution_id = p_institution and m.class_node_id = p_node;
end;

create function public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', count(distinct s.person_id),
           'sample', count(distinct s.person_id))
    from public.official_sessions s where s.institution_id = p_institution;
end;

create function public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', round(avg(g.post - g.pre), 4),
           'sample', count(*))
    from (select s.person_id,
                 max(case when s.mode = 'PRE_TEST'  then r.mastery end) as pre,
                 max(case when s.mode = 'POST_TEST' then r.mastery end) as post
            from public.official_sessions s
            join public.official_results r on r.session_id = s.id
           where s.institution_id = p_institution and s.mode in ('PRE_TEST','POST_TEST')
           group by s.person_id) g
   where g.pre is not null and g.post is not null;
end;

create function public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', round(count(*) filter (where x.safety_gate_passed)::numeric
                          / nullif(count(*), 0)::numeric, 4),
           'sample', count(*))
    from (select distinct on (r.session_id) r.safety_gate_passed
            from public.official_results r
            join public.official_sessions s on s.id = r.session_id
           where s.institution_id = p_institution and s.mode = 'POST_TEST'
           order by r.session_id, r.computed_at desc) x;
end;

create function public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_agg(jsonb_build_object(
                      'cohort_node_id', c.cohort_node_id, 'learners', c.learners,
                      'mean_mastery', c.mean_mastery) order by c.mean_mastery desc nulls last), '[]'::jsonb),
           'sample', coalesce(sum(c.learners), 0))
    from (select s.cohort_node_id,
                 count(distinct s.person_id) as learners,
                 round(avg(r.mastery), 4) as mean_mastery
            from public.official_sessions s
            join public.official_results r on r.session_id = s.id
           where s.institution_id = p_institution and s.mode = 'POST_TEST'
           group by s.cohort_node_id) c;
end;

-- OD-1: the GENERIC competency shape. No named accreditation framework is
-- encoded here, and binding one is configuration in a later phase -- the
-- frozen scope says "do not encode a named accreditor's rubric on assumption",
-- so this reports the domains the evidence itself carries.
create function public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_agg(jsonb_build_object(
                      'competency', d.domain, 'mean_score', d.avg_score, 'learners', d.n)
                      order by d.avg_score desc), '[]'::jsonb),
           'sample', coalesce(max(d.n), 0))
    from (select kv.key as domain,
                 round(avg((kv.value #>> '{}')::numeric), 4) as avg_score,
                 count(*) as n
            from (select distinct on (r.session_id) r.per_domain, r.session_id
                    from public.official_results r
                    join public.official_sessions s on s.id = r.session_id
                   where s.institution_id = p_institution and s.mode = 'POST_TEST'
                   order by r.session_id, r.computed_at desc) latest,
                 lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv
           where jsonb_typeof(kv.value) = 'number'
           group by kv.key) d;
end;

create function public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', count(*) filter (where c.revoked_at is null),
           'sample', count(*))
    from public.certificates c where c.institution_id = p_institution;
end;

create function public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', max(st.correctness_rate),
           'sample', coalesce(max(st.evidence_count), 0))
    from public.service_item_statistics st
   where st.institution_id = p_institution and st.item_id = p_node;
end;

create function public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_agg(jsonb_build_object(
                      'label', u.label, 'is_correct', u.is_correct,
                      'misconception_code', u.misconception_code, 'chosen', u.chosen_count)
                      order by u.label), '[]'::jsonb),
           'sample', coalesce(sum(u.chosen_count), 0))
    from public.service_distractor_uptake u
   where u.institution_id = p_institution and u.item_id = p_node;
end;

create function public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', jsonb_build_object(
                      'first_position', max(st.first_position),
                      'last_position',  max(st.last_position),
                      'mean_response_seconds', max(st.mean_response_seconds)),
           'sample', coalesce(max(st.evidence_count), 0))
    from public.service_item_statistics st
   where st.institution_id = p_institution and st.item_id = p_node;
end;

create function public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable begin atomic
  select jsonb_build_object(
           'value', coalesce(jsonb_agg(jsonb_build_object(
                      'session_id', x.session_id, 'mode', x.mode, 'mastery', x.mastery,
                      'safety_gate_passed', x.safety_gate_passed) order by x.finalized_at), '[]'::jsonb),
           'sample', count(*))
    from (select distinct on (r.session_id) r.session_id, s.mode, r.mastery,
                 r.safety_gate_passed, s.finalized_at
            from public.official_results r
            join public.official_sessions s on s.id = r.session_id
           where s.institution_id = p_institution and s.person_id = p_node
           order by r.session_id, r.computed_at desc) x;
end;

-- L2, AND IT CAUGHT ME AGAIN WRITING THIS FILE. `alter default privileges`
-- revokes from `anon` and `authenticated` but NOT from `PUBLIC`, and EXECUTE
-- is granted to PUBLIC by default -- so all sixteen calculators above were
-- client-reachable the moment they were created, and the terminal block
-- refused the migration until this ran. A calculator is a computation, never
-- an entry point: the only way to a number is `metric_evaluate`, which
-- re-authorizes.
--
-- Written as a loop rather than sixteen lines deliberately. This is a REVOKE,
-- not a grant: L1's rule is that an exposure must be named one at a time, and
-- the risk here is the opposite one -- forgetting a single name and leaving it
-- exposed. The terminal block asserts the resulting count is zero, so the loop
-- cannot quietly under-reach.
do $revoke$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
             join pg_namespace ns on ns.oid = p.pronamespace
            where ns.nspname = 'public' and p.proname like 'calc\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $revoke$;

-- ---------------------------------------------------------------------------
-- The evaluator. One entry point, and the only place authorization is decided.
--
-- IT NEVER RAISES FOR A DATA REASON, and that is the design, not laxness. The
-- natural implementation of "a metric the viewer may not see" is an exception,
-- and an exception makes the WHOLE REPORT refuse -- which turns a saved
-- configuration into a denial-of-service on its reader, and is precisely the
-- failure carried delta 3.3 is written against. So every case a report can
-- legitimately meet -- not permitted, deprecated, gone from the live
-- catalogue, below minimum sample -- comes back as an envelope with a status
-- the surface can state honestly. The report still renders.
--
-- The only raise is a missing live catalogue, which is a system fault rather
-- than a fact about this viewer or this class.
--
-- DISPATCH IS DYNAMIC, AND SAFE BECAUSE THE CATALOGUE CONSTRAINS THE NAME.
-- `calculation_key` is CHECKed against '^[a-z][a-z0-9_]{2,60}$' at write time,
-- so it cannot carry punctuation, and `%I` quotes it besides. The alternative
-- -- a sixteen-branch CASE -- would have to be edited every time the catalogue
-- gains a metric, which is exactly the second calculation path this migration
-- exists to prevent.
-- ---------------------------------------------------------------------------
create function public.metric_evaluate(p_metric_id text, p_node uuid, p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean; v_me uuid;
begin
  v_cat := public.current_metric_catalogue();
  if v_cat is null then
    raise exception 'no live metric catalogue: a report cannot cite a version that does not exist';
  end if;
  v_me := public.current_person_id();

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = p_metric_id;

  -- A saved template may name a metric the live catalogue no longer carries.
  -- That is a legitimate consequence of a catalogue bump, not an error.
  if d.metric_id is null then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'unavailable');
  end if;
  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'note_key', d.deprecation_note_key);
  end if;

  -- EXECUTION-TIME RE-AUTHORIZATION, against the VIEWER -- never against
  -- whoever saved the configuration. This is what makes a template inert with
  -- respect to permissions.
  v_permitted := public.is_system_admin()
    or exists (select 1 from public.role_assignments ra
                where ra.person_id = v_me and ra.institution_id = p_institution
                  and ra.revoked_at is null
                  and now() >= ra.valid_from and now() < ra.valid_until
                  and ra.role = any(d.allowed_audiences))
    or (d.scope = 'LEARNER_IN_INSTITUTION' and v_me is not null and p_node = v_me
        and 'STUDENT' = any(d.allowed_audiences));
  if not v_permitted then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'not_permitted');
  end if;

  execute format('select public.%I($1, $2, $3)', d.calculation_key)
     into v_out using p_node, p_institution, v_cat;

  -- Below the catalogue's minimum sample the number is withheld and the
  -- shortfall is stated. An honest "N of M" beats a figure computed from three
  -- learners and read as if it meant something.
  if coalesce((v_out ->> 'sample')::numeric, 0) < d.minimum_sample then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum',
                              'have', coalesce((v_out ->> 'sample')::numeric, 0),
                              'needed', d.minimum_sample);
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample');
end $function$;

revoke all on function public.metric_evaluate(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('metric_evaluate', 'STAFF',
   'The only path from a metric id to a number. Re-authorizes against the caller at execution and withholds below the catalogue minimum.');

create policy metric_sources_select on public.metric_sources
  for select to authenticated using (public.current_person_id() is not null);
grant select on public.metric_sources to authenticated;

-- ---------------------------------------------------------------------------
-- ASSERTIONS 1 AND 2: cardinality (cheap) and CLOSURE (the real one).
--
-- Assertion 3 -- "no report function computes" -- is NOT here. There are no
-- report functions yet, so it would pass over an empty set: a green assertion
-- measuring nothing, which is the failure this file's header is about. It
-- lands in 0073 with the reports it guards, and is watched to fail there.
-- ---------------------------------------------------------------------------
create function public.assert_metric_closure()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; n int; v_cat text;
begin
  v_cat := public.current_metric_catalogue();

  -- (1) CARDINALITY. Cheap, real, and deliberately not carrying the property.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'metric_evaluate';
  if n <> 1 then
    problems := problems || format('%s metric_evaluate function(s): there must be exactly one', n);
  end if;

  -- (2a) BIJECTION. Every catalogue metric has a calculator, and every
  --      calculator is named by the catalogue. An orphan calculator is an
  --      un-catalogued computation sitting in the schema.
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d
   where d.catalogue_version = v_cat
     and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname = 'public' and p.proname = 'calc_' || d.calculation_key);
  if bad is not null then
    problems := problems || ('catalogue metric(s) with no calculator: ' || bad);
  end if;
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from public.metric_definitions d
                      where d.catalogue_version = v_cat
                        and 'calc_' || d.calculation_key = p.proname);
  if bad is not null then
    problems := problems || ('calculator(s) no live catalogue metric names: ' || bad);
  end if;

  -- (2b) VACUITY GUARD ONE: a string-bodied calculator records no dependencies
  --      at all and would satisfy every check below trivially.
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%' and p.prosqlbody is null;
  if bad is not null then
    problems := problems ||
      ('calculator(s) without a parsed body, whose reads are therefore unrecorded: ' || bad);
  end if;

  -- (2c) VACUITY GUARD TWO: one level of user-defined function indirection
  --      empties the relation set. Measured: `begin atomic select inner()`
  --      records zero relation dependencies and one FUNCTION dependency -- so
  --      "at least one dependency" does not catch it either. A calculator's
  --      pg_proc dependency set must be empty, or itself a declared calculator.
  select string_agg(distinct p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    join pg_depend dep on dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                      and dep.refclassid = 'pg_proc'::regclass
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and (select p2.proname from pg_proc p2 where p2.oid = dep.refobjid) not like 'calc\_%';
  if bad is not null then
    problems := problems ||
      ('calculator(s) reading through an undeclared helper, which hides their real input set: ' || bad);
  end if;

  -- (2d) and a calculator that reads NOTHING is not computing from evidence
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from pg_depend dep
                      where dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                        and dep.refclassid = 'pg_class'::regclass);
  if bad is not null then
    problems := problems || ('calculator(s) that read no relation at all: ' || bad);
  end if;

  -- (2e) THE CLOSURE ITSELF. Every relation a calculator reads -- as recorded
  --      by the PARSER, not by a comment -- must be a declared catalogue
  --      source. A new service view is then a catalogue change.
  select string_agg(distinct p.proname || ' -> ' || dep.refobjid::regclass::text, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    join pg_depend dep on dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                      and dep.refclassid = 'pg_class'::regclass
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from public.metric_sources ms
                      where ms.catalogue_version = v_cat
                        and ms.source_relation = dep.refobjid::regclass::text);
  if bad is not null then
    problems := problems || ('calculator(s) reading an undeclared source: ' || bad);
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'catalogue %s: one evaluator; %s calculator(s) in bijection with the catalogue, every one parsed at '
      || 'creation, reading no undeclared helper, and reading only the %s declared source(s)',
      v_cat,
      (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
        where ns.nspname='public' and p.proname like 'calc\_%'),
      (select count(*) from public.metric_sources where catalogue_version = v_cat))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_metric_closure() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_msg text; v_detail text; v_out jsonb;
begin
  -- === structural ==========================================================
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the closure this migration just created does not hold: %',
      (select a.detail from public.assert_metric_closure() a);
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname='public' and p.proname like 'calc\_%';
  if n <> 16 then raise exception '% calculators, expected 16', n; end if;

  -- no calculator is reachable by a client: a computation is not an entry point
  select string_agg(p.proname, ', ') into v_msg
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname='public' and p.proname like 'calc\_%'
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'));
  if v_msg is not null then
    raise exception 'calculator(s) reachable by a client role: %', v_msg;
  end if;
  if has_function_privilege('anon', 'public.metric_evaluate(text,uuid,uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'metric_evaluate is reachable by anon';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    -- (1) THE CLOSURE IS WATCHED TO FAIL -- undeclared source.
    --     A calculator reading a real relation nobody declared must be named.
    create function public.calc_probe_undeclared(p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable begin atomic
      select jsonb_build_object('value', count(*), 'sample', count(*))
        from public.service_exam_exposure;
    end;
    if (select a.ok from public.assert_metric_closure() a) then
      raise exception 'a calculator reading an undeclared source was not noticed';
    end if;
    v_detail := (select a.detail from public.assert_metric_closure() a);
    if v_detail !~ 'undeclared source' or v_detail !~ 'service_exam_exposure' then
      raise exception 'the undeclared source was not named: %', v_detail;
    end if;
    drop function public.calc_probe_undeclared(uuid, uuid, text);

    -- (2) THE INDIRECTION HOLE IS WATCHED TO FAIL. This is the case a naive
    --     subset check passes vacuously: zero relation dependencies, one
    --     function dependency.
    create function public.probe_helper() returns bigint language sql stable
      begin atomic select count(*) from public.service_exam_exposure; end;
    create function public.calc_probe_indirect(p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable begin atomic
      select jsonb_build_object('value', public.probe_helper(), 'sample', 999);
    end;
    if (select count(*) from pg_depend dep
         where dep.objid = 'public.calc_probe_indirect(uuid,uuid,text)'::regprocedure
           and dep.classid='pg_proc'::regclass and dep.refclassid='pg_class'::regclass) <> 0 then
      raise exception 'the indirection probe recorded a relation dependency; the hole it models is gone';
    end if;
    if (select a.ok from public.assert_metric_closure() a) then
      raise exception 'a calculator hiding its reads behind a helper was not noticed';
    end if;
    v_detail := (select a.detail from public.assert_metric_closure() a);
    if v_detail !~ 'undeclared helper' then
      raise exception 'the hidden helper was not named: %', v_detail;
    end if;
    drop function public.calc_probe_indirect(uuid, uuid, text);
    drop function public.probe_helper();

    -- (3) A STRING-BODIED CALCULATOR IS WATCHED TO FAIL. It records no reads
    --     at all, so every dependency check above would pass over it.
    create function public.calc_probe_string(p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable as $body$
      select jsonb_build_object('value', count(*), 'sample', count(*)) from public.official_sessions
    $body$;
    if (select a.ok from public.assert_metric_closure() a) then
      raise exception 'a calculator whose body is never parsed was not noticed';
    end if;
    if (select a.detail from public.assert_metric_closure() a) !~ 'without a parsed body' then
      raise exception 'the unparsed body was not named';
    end if;
    drop function public.calc_probe_string(uuid, uuid, text);

    -- (4) THE BIJECTION HOLDS IN BOTH DIRECTIONS -- an orphan calculator is an
    --     un-catalogued computation.
    create function public.calc_probe_orphan(p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable begin atomic
      select jsonb_build_object('value', count(*), 'sample', count(*))
        from public.official_sessions;
    end;
    if (select a.ok from public.assert_metric_closure() a) then
      raise exception 'a calculator no catalogue metric names was not noticed';
    end if;
    if (select a.detail from public.assert_metric_closure() a) !~ 'no live catalogue metric names' then
      raise exception 'the orphan calculator was not named';
    end if;
    drop function public.calc_probe_orphan(uuid, uuid, text);

    -- and the closure is whole again once every probe is withdrawn
    if not (select a.ok from public.assert_metric_closure() a) then
      raise exception 'the closure did not recover after the probes: %',
        (select a.detail from public.assert_metric_closure() a);
    end if;

    -- (5) THE EVALUATOR NEVER RAISES FOR A DATA REASON. Each of these is a
    --     case a real report meets, and each must come back as a statement
    --     rather than as an exception that would take the whole report down.
    v_out := public.metric_evaluate('no.such.metric', gen_random_uuid(), gen_random_uuid());
    if v_out ->> 'status' <> 'unavailable' then
      raise exception 'an unknown metric id did not come back as unavailable: %', v_out;
    end if;
    -- with no identity at all, a real metric is refused as not permitted --
    -- not raised, and certainly not computed
    v_out := public.metric_evaluate('class.comprehension', gen_random_uuid(), gen_random_uuid());
    if v_out ->> 'status' <> 'not_permitted' then
      raise exception 'an unauthorized viewer did not get not_permitted: %', v_out;
    end if;
    if v_out ? 'value' then
      raise exception 'a refused metric still carried a value: %', v_out;
    end if;

    raise exception 'PROBE_0072_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0072_ROLLBACK' then raise; end if;
  end;

  raise notice '0072 verified: 16 calculators closed over 7 declared sources; undeclared source, hidden helper, unparsed body and orphan each watched to fail; evaluator states rather than raises';
end $$;
