-- A2b, commit 3 · D4, "cannot finish before the window" (THE PLAN §5.3 D4; A2B-COMPLETION.md row 5; PLAN-A2B-C2W.md
-- §2.3 K3 and K4). DRAFT.
--
-- At start, if the new sitting's own deadline (authoritative_deadline: start plus its duration) would fall after the
-- starts_at of a planned window that reaches its work, the start is refused PR110 MAINTENANCE_CANNOT_FINISH, naming
-- the window's start. This replaces nothing: T−15 (MAINTENANCE_NO_NEW_START) stays and is judged first; a sitting with
-- no deadline is refused only inside T−15, as today; during an active work-scoped window the place refuses
-- (MAINTENANCE_PLACE, Sharon's ruling 1).
--
-- One rule, two readers: maintenance_mulai_tolak(person, node, deadline) answers for the sitting-insert trigger and for
-- may_start_assessment, so the screen never offers what the trigger refuses (Sharon's classing: «the same answer, for
-- the screen»; it had no maintenance check before). "Reaches its work": a class or school window over the node, or a
-- platform-wide window. All on clock_timestamp().

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

create function public.maintenance_mulai_tolak(p_person uuid, p_node uuid, p_tenggat timestamptz,
                                               out kode text, out mulai timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_kini timestamptz := clock_timestamp();
begin
  if p_node is not null and public.maintenance_affects_place(p_node, v_kini) then
    kode := 'MAINTENANCE_PLACE'; return;
  end if;
  -- the planned windows not yet started that reach this work: over its place, or platform-wide
  select min(w.starts_at) filter (where w.starts_at - interval '15 minutes' <= v_kini),
         min(w.starts_at) filter (where p_tenggat is not null and w.starts_at < p_tenggat)
    into mulai, p_tenggat
    from public.maintenance_windows w left join public.org_nodes n on n.id = p_node
   where w.kind = 'PLANNED' and w.ended_at is null and w.starts_at > v_kini
     and (w.platform
          or (n.id is not null and n.institution_id = any (w.institution_ids)
              and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)));
  if mulai is not null then kode := 'MAINTENANCE_NO_NEW_START'; return; end if;   -- T−15 first, as today
  if p_tenggat is not null then kode := 'MAINTENANCE_CANNOT_FINISH'; mulai := p_tenggat; return; end if;
end $$;
revoke all on function public.maintenance_mulai_tolak(uuid, uuid, timestamptz) from public, anon, authenticated, service_role;

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
  r := public.maintenance_mulai_tolak(new.person_id, v_node, new.authoritative_deadline);
  if r.kode = 'MAINTENANCE_PLACE' then perform public.maintenance_tolak_tempat(); end if;
  if r.kode = 'MAINTENANCE_NO_NEW_START' then perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START'); end if;
  if r.kode = 'MAINTENANCE_CANNOT_FINISH' then
    raise exception using errcode = 'PR110', detail = 'MAINTENANCE_CANNOT_FINISH', hint = r.mulai::text,
      message = format('this assessment cannot finish before planned maintenance starts at %s; start it after the maintenance ends',
                       to_char(r.mulai at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"'));
  end if;
  return new;
end $$;
revoke all on function public.enforce_no_new_sitting_in_maintenance() from public, anon, authenticated;

-- the screen's answer: the same rule, on the learner's class under the assignment and the deadline a start would get
do $$
begin
  perform pg_temp.a2b_ganti('public.may_start_assessment(uuid)',
    E'  ok := true; reason := ''OK''; return next;\n',
    E'  -- A2b D4 and the place (Sharon: the same answer as the sitting-insert trigger, for the screen)\n'
    || E'  reason := (public.maintenance_mulai_tolak(v_person,\n'
    || E'               coalesce((select m.node_id from public.memberships m join public.org_nodes n on n.id = m.node_id\n'
    || E'                          where m.enrollment_id = v_enrol and m.valid_to is null and n.kind = ''CLASS''\n'
    || E'                            and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]) order by m.valid_from desc limit 1),\n'
    || E'                        v_aa.node_id),\n'
    || E'               v_aa.closes_at)).kode;\n'
    || E'  if reason is not null then ok := false; return next; return; end if;\n'
    || E'  ok := true; reason := ''OK''; return next;\n');
end $$;

do $$
begin
  if position('maintenance_mulai_tolak' in pg_get_functiondef('public.enforce_no_new_sitting_in_maintenance()'::regprocedure)) = 0
     or position('maintenance_mulai_tolak' in pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure)) = 0
     or has_function_privilege('authenticated', 'public.maintenance_mulai_tolak(uuid,uuid,timestamp with time zone)'::regprocedure, 'execute') then
    raise exception 'A2b commit 3: D4 is not read by the trigger and the screen alike, or its helper is open to a client';
  end if;
end $$;
