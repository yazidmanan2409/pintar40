-- 0075 -- the calculators pin their search_path after all.
--
-- 0072's header argued that a calculator needs no pinned `search_path`, and
-- the SAFETY argument was correct: a `BEGIN ATOMIC` body resolves every name
-- at CREATION time and stores resolved OIDs, so it is structurally immune to
-- the substitution that `SET search_path` exists to prevent. Nothing below
-- retracts that.
--
-- WHAT THE ARGUMENT GOT WRONG WAS THE COUNTER, AND I ASSERTED IT HAD NOT MOVED.
-- 0072's commit message reads "Counters unchanged". I checked eight counters,
-- including `secdef_without_search_path` -- which is genuinely 0, because the
-- calculators are SECURITY INVOKER. I did not check
-- `functions_without_search_path`, which counts EVERY function in `public`
-- regardless of security mode. It went 0 -> 16, one per calculator, and
-- F05-T21 caught it two migrations later.
--
-- So the claim was false and the reasoning behind it was about a different
-- counter than the one that exists. That is the failure, not the missing SET.
--
-- THE REPAIR IS TO PIN THE PATH, NOT TO NARROW THE LINT. A lint that counts
-- every function is a simpler and more honest rule than one carrying an
-- exception for a body shape, and "this function is safe for a different
-- reason" is exactly the argument that makes a counter stop meaning anything.
-- A redundant SET costs nothing -- the same reasoning ADR-0021 applies to a
-- redundant revoke.
--
-- `alter function` rather than `create or replace`: it leaves the parsed body
-- and its `pg_depend` record untouched, which the 0072 closure depends on.
-- Verified on both -- `prosqlbody` still present, relation dependencies
-- unchanged -- before this migration was written.

alter function public.calc_class_participants(uuid, uuid, text)              set search_path = public, pg_temp;
alter function public.calc_class_comprehension(uuid, uuid, text)             set search_path = public, pg_temp;
alter function public.calc_class_net_gain(uuid, uuid, text)                  set search_path = public, pg_temp;
alter function public.calc_class_readiness_distribution(uuid, uuid, text)    set search_path = public, pg_temp;
alter function public.calc_class_topic_mastery(uuid, uuid, text)             set search_path = public, pg_temp;
alter function public.calc_class_misconceptions(uuid, uuid, text)            set search_path = public, pg_temp;
alter function public.calc_institution_participants(uuid, uuid, text)        set search_path = public, pg_temp;
alter function public.calc_institution_net_gain(uuid, uuid, text)            set search_path = public, pg_temp;
alter function public.calc_institution_safety_gate_pass_rate(uuid, uuid, text) set search_path = public, pg_temp;
alter function public.calc_institution_cohort_comparison(uuid, uuid, text)   set search_path = public, pg_temp;
alter function public.calc_institution_competency_outcomes(uuid, uuid, text) set search_path = public, pg_temp;
alter function public.calc_institution_verified_credentials(uuid, uuid, text) set search_path = public, pg_temp;
alter function public.calc_item_correctness_rate(uuid, uuid, text)           set search_path = public, pg_temp;
alter function public.calc_item_distractor_uptake(uuid, uuid, text)          set search_path = public, pg_temp;
alter function public.calc_item_position_effect(uuid, uuid, text)            set search_path = public, pg_temp;
alter function public.calc_learner_result(uuid, uuid, text)                  set search_path = public, pg_temp;

do $$
declare n int; bad text;
begin
  -- the counter this migration exists for, asserted at its target rather than
  -- described
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n <> 0 then
    select string_agg(p.proname, ', ') into bad from pg_proc p
      join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prokind in ('f','p')
       and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
    raise exception '% function(s) still carry no pinned search_path: %', n, bad;
  end if;

  -- AND THE 0072 CLOSURE SURVIVED THE ALTER. This is the reason `alter
  -- function` was chosen over `create or replace`: the closure assertion reads
  -- pg_depend, and recreating sixteen functions would have rebuilt every
  -- dependency row this build relies on.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%' and p.prosqlbody is null;
  if n <> 0 then raise exception '% calculator(s) lost their parsed body', n; end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure did not survive the alter: %',
      (select a.detail from public.assert_metric_closure() a);
  end if;

  raise notice '0075 verified: functions_without_search_path back to 0, all sixteen calculators still parsed at creation, closure intact';
end $$;
