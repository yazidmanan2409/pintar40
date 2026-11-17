-- A2b, commit 3 · ONE START RULE, for the sitting-insert trigger and the start screen alike (PLAN-A2B-C2W.md §2.3 K3,
-- K4; Sharon's classing: «the same answer, for the screen»). DRAFT.
--
-- CORRECTED IN PLACE (16 Nov), by the Chief Architect's D4 ruling and Sharon's (fold, never ship the rule that never was):
-- commit 3 first refused a start whose deadline fell after a planned window's start (MAINTENANCE_CANNOT_FINISH), reading
-- the assignment's closes_at as that deadline. THE PLAN §5.3 D4 says the deadline is "start plus its duration", and that
-- "a sitting with no duration is refused only inside T−15 as today". PINTAR has no per-assessment duration, so every
-- sitting is untimed: D4 has no effect until assessments carry their own time limit (a separate future item, outside
-- A2b), and the branch is removed, not left dormant. A2B-D4X asserts its absence, with a plant.
-- WHY D4 IS ABSENT: R-C in PLAN-A2B-C2W.md (D4 applies only to sittings with a duration, and PINTAR has none today).
--
-- What remains: maintenance_mulai_tolak(person, node) answers, in order, the place (a work-scoped window under way over
-- the node: MAINTENANCE_PLACE, Sharon's ruling 1) and T−15 (a planned window that reaches this work starts within 15
-- minutes: MAINTENANCE_NO_NEW_START, as today). "Reaches its work": a class or school window over the node, or a
-- platform-wide window. All on clock_timestamp(). The trigger and may_start_assessment both ask it, so the screen never
-- offers what the trigger refuses (it had no maintenance check before).

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

create function public.maintenance_mulai_tolak(p_person uuid, p_node uuid, out kode text, out mulai timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_kini timestamptz := clock_timestamp();
begin
  if p_node is not null and public.maintenance_affects_place(p_node, v_kini) then
    kode := 'MAINTENANCE_PLACE'; return;
  end if;
  -- the planned windows not yet started that reach this work: over its place, or platform-wide
  select min(w.starts_at) filter (where w.starts_at - interval '15 minutes' <= v_kini)
    into mulai
    from public.maintenance_windows w left join public.org_nodes n on n.id = p_node
   where w.kind = 'PLANNED' and w.ended_at is null and w.starts_at > v_kini
     and (w.platform
          or (n.id is not null and n.institution_id = any (w.institution_ids)
              and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)));
  if mulai is not null then kode := 'MAINTENANCE_NO_NEW_START'; return; end if;   -- T−15, as today
end $$;
revoke all on function public.maintenance_mulai_tolak(uuid, uuid) from public, anon, authenticated, service_role;

-- the trigger: the person-level branch as before, then the one rule
create or replace function public.enforce_no_new_sitting_in_maintenance()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_node uuid; r record;
begin
  -- person-level (EMERGENCY, and PLANNED platform-wide): as before
  if exists (select 1 from public.maintenance_windows w
              where w.ended_at is null and (w.ends_at is null or w.ends_at > now())
                and (w.kind = 'EMERGENCY' or w.platform)
                and public.maintenance_state(w, now()) in ('MENJELANG', 'AKTIF')
                and public.maintenance_affects(w, new.person_id)) then
    perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START');
  end if;
  v_node := coalesce(new.class_node_id, new.cohort_node_id,
                     (select la.node_id from public.learning_assignments la where la.id = new.learning_assignment_id));
  r := public.maintenance_mulai_tolak(new.person_id, v_node);
  if r.kode = 'MAINTENANCE_PLACE' then perform public.maintenance_tolak_tempat(); end if;
  if r.kode = 'MAINTENANCE_NO_NEW_START' then perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START'); end if;
  return new;
end $$;
revoke all on function public.enforce_no_new_sitting_in_maintenance() from public, anon, authenticated;

-- the screen's answer: the same rule, on the learner's class under the assignment
do $$
begin
  perform pg_temp.a2b_ganti('public.may_start_assessment(uuid)',
    E'  ok := true; reason := ''OK''; return next;\n',
    E'  -- A2b, the place and T−15 (Sharon: the same answer as the sitting-insert trigger, for the screen)\n'
    || E'  reason := (public.maintenance_mulai_tolak(v_person,\n'
    || E'               coalesce((select m.node_id from public.memberships m join public.org_nodes n on n.id = m.node_id\n'
    || E'                          where m.enrollment_id = v_enrol and m.valid_to is null and n.kind = ''CLASS''\n'
    || E'                            and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]) order by m.valid_from desc limit 1),\n'
    || E'                        v_aa.node_id))).kode;\n'
    || E'  if reason is not null then ok := false; return next; return; end if;\n'
    || E'  ok := true; reason := ''OK''; return next;\n');
end $$;

do $$
begin
  if position('maintenance_mulai_tolak' in pg_get_functiondef('public.enforce_no_new_sitting_in_maintenance()'::regprocedure)) = 0
     or position('maintenance_mulai_tolak' in pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure)) = 0
     or has_function_privilege('authenticated', 'public.maintenance_mulai_tolak(uuid,uuid)'::regprocedure, 'execute')
     or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosrc like '%MAINTENANCE_CANNOT_FINISH%') then
    raise exception 'A2b commit 3: the start rule is not read by the trigger and the screen alike, its helper is open to a client, or the removed D4 branch remains';
  end if;
end $$;
