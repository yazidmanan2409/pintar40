-- A2b, commit 7 · a maintenance refusal still shows the assessment's orientation, with its code and its scope (the
-- Chief Architect's go, 16 Nov 04:15, on Second Eye's report of commit 3's defect; R-A). DRAFT.
--
-- The defect (commit 3, 38a4b34f): may_start_assessment refuses a start with MAINTENANCE_PLACE, MAINTENANCE_NO_NEW_START
-- (and, before the Chief Architect's D4 ruling, a D4 code since removed: see 20270120120000), and assessment_orientation returned its row only when may_start was ok, so the
-- orientation vanished under a maintenance refusal: the learner met the generic refusal page, a platform window's T−15
-- no longer showed «Mulai» (4.0 shows it, and the start redirects to the maintenance page), and D8-3's disabled «Mulai»
-- had nowhere to be. Caught by none of the tests: A2B-O01 now does, with the old condition as its plant.
--
-- The fix:
--   * maintenance_mulai_tolak also returns the refusing window's scope (cakupan: ORANG for a platform-wide window,
--     TEMPAT for a class or school window) and its id, from the same read as its code (the Chief Architect's condition 1:
--     the screen's branch and the refusal can never disagree through two reads);
--   * assessment_orientation returns its row when may_start is ok, OR when its refusal is one of the two maintenance
--     codes (may_start judges them last, so every other check has passed), with tolak_pemeliharaan, tolak_cakupan,
--     tolak_mulai, tolak_selesai and tolak_kelas from one call of maintenance_mulai_tolak.
-- Rule 3 (condition 2), every caller of assessment_orientation: no database function; the app's engine.orientation
-- (src/lib/assessment-engine/index.ts) and its Orientation type; the tests F06's orientation probe (fable06.sql),
-- F29-S01 (fable29.sql), experience.test.ts's start-screen checks, A2A-T01's reader classing. Each reads columns by name,
-- so the added columns change nothing for them. The grants and the registry entry are kept exactly: revoked from
-- public and anon, granted to authenticated and service_role; LEARNER.

-- ───────────────────────────────────────────────────────────── the one start rule, with its window and scope
drop function public.maintenance_mulai_tolak(uuid, uuid);
create function public.maintenance_mulai_tolak(p_person uuid, p_node uuid,
                                               out kode text, out mulai timestamptz, out cakupan text, out jendela uuid)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_kini timestamptz := clock_timestamp(); w public.maintenance_windows;
begin
  -- an active work-scoped window over the place: the one place question first (maintenance_affects_place, the guard
  -- every refused writer asks), then which window it is
  if p_node is not null and public.maintenance_affects_place(p_node, v_kini) then
    select x.* into w from public.maintenance_windows x join public.org_nodes n on n.id = p_node
     where (x.ended_at is null or x.ended_at > v_kini) and x.kind = 'PLANNED' and not x.platform
       and x.starts_at <= v_kini and (x.ends_at is null or x.ends_at > v_kini)
       and n.institution_id = any (x.institution_ids) and (cardinality(x.node_ids) = 0 or x.node_ids && n.jalur)
     order by x.starts_at, x.id limit 1;
    if w.id is not null then
      kode := 'MAINTENANCE_PLACE'; mulai := w.starts_at; cakupan := 'TEMPAT'; jendela := w.id; return;
    end if;
  end if;
  -- T−15, as today: the nearest planned window not yet begun that reaches this work, starting within 15 minutes
  select x.* into w from public.maintenance_windows x left join public.org_nodes n on n.id = p_node
   where x.kind = 'PLANNED' and x.ended_at is null and x.starts_at > v_kini and x.starts_at - interval '15 minutes' <= v_kini
     and (x.platform or (n.id is not null and n.institution_id = any (x.institution_ids)
                         and (cardinality(x.node_ids) = 0 or x.node_ids && n.jalur)))
   order by x.starts_at, x.platform desc, x.id limit 1;
  if w.id is not null then
    kode := 'MAINTENANCE_NO_NEW_START'; mulai := w.starts_at; jendela := w.id;
    cakupan := case when w.platform then 'ORANG' else 'TEMPAT' end; return;
  end if;
end $$;
revoke all on function public.maintenance_mulai_tolak(uuid, uuid) from public, anon, authenticated, service_role;

-- ───────────────────────────────────────────────────────────── the orientation
drop function public.assessment_orientation(uuid);
create function public.assessment_orientation(p_assessment_assignment uuid)
returns table (mode assessment_mode, title text, item_count smallint, allows_pause boolean, hesitation_window_seconds integer,
               opens_at timestamptz, closes_at timestamptz, attempt_limit smallint, attempts_used integer,
               tolak_pemeliharaan text, tolak_cakupan text, tolak_mulai timestamptz, tolak_selesai timestamptz,
               tolak_kelas text[])
language sql stable security definer set search_path = public, pg_temp as $$
  select d.mode, d.title, d.item_count, d.allows_pause, d.hesitation_window_seconds,
         aa.opens_at, aa.closes_at, d.attempt_limit,
         (select count(*)::integer from public.assessment_sessions s
           where s.assessment_assignment_id = aa.id
             and s.person_id = public.current_person_id()),
         t.kode, t.cakupan, t.mulai, w.ends_at,
         case when cardinality(w.node_ids) > 0 then
           (select array_agg(n.name order by n.name) from public.org_nodes n where n.id = any (w.node_ids)) end
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    cross join lateral (select e.ok, e.reason from public.may_start_assessment(aa.id) e) m
    -- A2b: a maintenance refusal (judged last by may_start, so every other check has passed) is read once, with its
    -- window and scope, on the learner's class under the assignment and the deadline a start would get
    left join lateral (
      select r.* from public.maintenance_mulai_tolak(public.current_person_id(),
        coalesce((select mm.node_id from public.enrollments e join public.memberships mm on mm.enrollment_id = e.id
                    join public.org_nodes nn on nn.id = mm.node_id
                   where e.person_id = public.current_person_id() and e.institution_id = aa.institution_id
                     and e.status = 'ACTIVE' and mm.valid_to is null and nn.kind = 'CLASS'
                     and (nn.id = aa.node_id or nn.jalur @> array[aa.node_id])
                   order by mm.valid_from desc limit 1), aa.node_id)) r
      where m.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START')) t on true
    left join public.maintenance_windows w on w.id = t.jendela
   where aa.id = p_assessment_assignment
     and public.current_person_id() is not null
     and (m.ok or m.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START'))
$$;
-- kept exactly as 20260921090000 set them
revoke all on function public.assessment_orientation(uuid) from public, anon;
grant execute on function public.assessment_orientation(uuid) to authenticated, service_role;

do $$
begin
  if not has_function_privilege('authenticated', 'public.assessment_orientation(uuid)'::regprocedure, 'execute')
     or not has_function_privilege('service_role', 'public.assessment_orientation(uuid)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.assessment_orientation(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.maintenance_mulai_tolak(uuid,uuid)'::regprocedure, 'execute')
     or not exists (select 1 from public.client_rpc_registry where function_name = 'assessment_orientation' and exposure = 'LEARNER')
     or position('MAINTENANCE_NO_NEW_START' in pg_get_functiondef('public.assessment_orientation(uuid)'::regprocedure)) = 0 then
    raise exception 'A2b commit 7: the orientation''s grants, registry entry or maintenance branch are not as intended';
  end if;
end $$;
