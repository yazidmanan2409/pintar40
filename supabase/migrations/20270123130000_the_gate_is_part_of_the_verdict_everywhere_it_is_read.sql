-- ---------------------------------------------------------------------------------------------------------------
-- Z · K-01 (ruling 78; Sharon's PASS of the Z0 inventory, Q1-Q3; Bob's Q2): THE MUST-BE-RIGHT GATE IS PART OF THE
-- VERDICT EVERYWHERE IT IS READ. The verdict is gate AND mastery (session_outcome.lulus). A learner who failed only the
-- gate had nothing to study (tujuan_belum_tercapai returned only objectives below the mark) and the approver's retake
-- queue showed a figure above the target with no gate. Red first: Z-K01-01.
--
--   * tujuan_gerbang_terlewat(result): the objectives of the must-be-right items that result missed, graded by the key
--     that row was computed with (its basis's key where a governed correction recorded one, else the sealed key);
--     never regraded with today's key; [] when the row's gate passed. Internal: no client grant, no registry row.
--   * session_outcome gains tujuan_gerbang from the learner's own result row (hasil_murid_id), on an Uji Penguasaan
--     only; still session_is_mine. tujuan_belum_tercapai adds the same helper's objectives for the learner's most
--     recent attempt's effective result, under its existing staff rule. Restated in full from their live definitions.
--   * percobaan_antrean gains gerbang, the same last result's gate, under the same CAN_VIEW_LEARNER_RESULT condition as
--     the figure and the target; its return type changes, so it is dropped and created, its grant restated.
--   * CORRECTED IN PLACE (undeployed). Bob's ruling on Sharon's pre-existing item (Z1-SQL-df8d84a0.md): the queue's last result, its figure and now its
--     gate, is the result in force (hasil_terkini_id, D11), not the newest computed_at; a recalculation stamped before
--     its original was read as superseded.
-- ---------------------------------------------------------------------------------------------------------------

create function public.tujuan_gerbang_terlewat(p_result uuid)
returns uuid[] language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select array_agg(distinct o order by o)
      from public.assessment_results r
      cross join lateral public.session_final_responses(r.session_id) f
      join public.items i on i.id = f.item_id
      cross join lateral unnest(i.objective_ids) o
      left join public.assessment_result_bases b on b.result_id = r.id
     where r.id = p_result and not r.safety_gate_passed and f.is_safety_critical
       and coalesce(case when b.basis -> 'soal' ? f.item_id::text
                         then public.grade_kunci(f.item_id, f.value,
                                array(select jsonb_array_elements_text(b.basis -> 'soal' -> f.item_id::text -> 'kunci'))) end,
                    public.grade_response(f.item_id, f.value)) < 1), '{}'::uuid[])
$$;
revoke all on function public.tujuan_gerbang_terlewat(uuid) from public, anon, authenticated, service_role;

drop function public.percobaan_antrean(uuid);

CREATE OR REPLACE FUNCTION public.session_outcome(p_session uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_s public.assessment_sessions; v_r public.assessment_results;
        v_min numeric; v_out jsonb;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_r from public.assessment_results
   where id = public.hasil_murid_id(p_session);   -- C1w (O41-21): a governed correction is the learner's result
  if v_r.id is null then return null; end if;

  v_out := jsonb_build_object(
    'penguasaan',  v_r.mastery,
    'per_domain',  v_r.per_domain,
    'ringkasan',   v_r.delta_inputs) || public.hasil_koreksi_ringkas(p_session);

  if v_s.mode = 'PRE_TEST' then
    -- diagnostic only. No verdict, no gate banner, nothing to render as a mark.
    return v_out || jsonb_build_object('diagnostik', true);
  end if;

  -- D-088(b): the mark sealed on this attempt, and no other. None sealed: no verdict, never a guessed one.
  v_min := v_s.pass_mark;
  return v_out || jsonb_build_object(
    'diagnostik', false,
    'gerbang_keselamatan', v_r.safety_gate_passed,
    -- INV-10: the gate is independent of the score and can refuse alone.
    'lulus', case when v_min is null then null
                  else (v_r.safety_gate_passed and v_r.mastery >= v_min) end,
    'ambang', v_min,
    -- Z K-01 (Sharon's Q1): the objectives of the must-be-right items this result missed, from this same result row
    -- (graded by the key that row was computed with); [] when its gate passed. Never on a pre-test (returned above).
    'tujuan_gerbang', to_jsonb(public.tujuan_gerbang_terlewat(v_r.id)));
end $function$;

CREATE OR REPLACE FUNCTION public.tujuan_belum_tercapai(p_class uuid, p_learner uuid)
 RETURNS TABLE(objective_id uuid, statement text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
        -- each of the learner's official Uji Penguasaan attempts in this class, its EFFECTIVE result: the one nothing
        -- supersedes (D11, structural; a recalculation stamped earlier than its original is still the one read)
        select distinct on (r.session_id) r.session_id, r.id as result_id, r.per_domain, s.assessment_definition_id, s.finalized_at
          from public.scoped_official_results r
          join public.scoped_official_sessions s on s.id = r.session_id
         where not exists (select 1 from public.scoped_official_results q where q.supersedes_result_id = r.id)
           and s.institution_id = v_inst
           and s.class_node_id = p_class
           and s.person_id = p_learner
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by r.session_id, r.computed_at desc, (r.supersedes_result_id is not null) desc
      ), per_objective as (
        select kv.key as code,
               (kv.value ->> 'penguasaan')::numeric as penguasaan,
               a.pass_mark,
               l.finalized_at, l.session_id,
               (select o.id
                  from public.assessment_definitions ad
                  join public.modules mo on mo.id = ad.module_id or (ad.module_id is null and mo.course_id = ad.course_id)
                  join public.lessons le on le.module_id = mo.id
                  join public.learning_objectives o on o.lesson_id = le.id
                 where ad.id = l.assessment_definition_id and o.code = kv.key
                 order by mo.ordinal, le.ordinal, o.id
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
      , gerbang as (
        -- Z K-01 (Sharon's Q1): the objectives of the must-be-right items the learner's most recent attempt missed, by
        -- the same helper the learner's result reads, from that attempt's effective result row
        select o as objective_id
          from (select l.result_id from latest l order by l.finalized_at desc nulls last, l.session_id limit 1) t
          cross join lateral unnest(public.tujuan_gerbang_terlewat(t.result_id)) o
      ), semua as (
        select x.objective_id, coalesce(lo.statement, x.code) as statement, x.code
          from newest x
          left join public.learning_objectives lo on lo.id = x.objective_id
         where x.pass_mark is not null and x.penguasaan < x.pass_mark
        union
        select g.objective_id, coalesce(lo.statement, lo.code), coalesce(lo.code, '')
          from gerbang g join public.learning_objectives lo on lo.id = g.objective_id
      )
      select distinct on (s.statement, s.code) s.objective_id, s.statement
        from semua s
       order by s.statement, s.code;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $function$;

CREATE FUNCTION public.percobaan_antrean(p_institution uuid)
 RETURNS TABLE(id uuid, person_id uuid, nama text, kelas_id uuid, kelas text, assessment_assignment_id uuid, judul text, mode assessment_mode, diminta_oleh uuid, nama_peminta text, diminta_pada timestamp with time zone, alasan text, percobaan_terpakai integer, batas_percobaan integer, milik_sendiri boolean, kursus text, hasil_terakhir numeric, target numeric, gerbang boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null then perform public.pengerjaan_tolak('ATTEMPT_DECISION_NOT_ALLOWED'); end if;
  return query
    select r.id, r.person_id, p.display_name, n.id, n.name, r.assessment_assignment_id, d.title, d.mode,
           r.requested_by_person_id, q.display_name, r.requested_at, r.reason,
           public.percobaan_terpakai(r.person_id, r.assessment_assignment_id), d.attempt_limit::integer,
           r.requested_by_person_id = v_me,
           (select c.title from public.plp_releases pr join public.courses c on c.id = pr.course_id where pr.id = s.plp_release_id),
           -- the last result and its target only for a reader who may see this learner's results (a head of department;
           -- a school admin decides without them: 20260924100000, an administrator is not an examiner)
           case when public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id))
                -- Z (Bob's ruling on Sharon's Z1 pre-existing item): the result in force (D11), not the newest computed_at
                then (select ar.mastery from public.assessment_results ar where ar.id = public.hasil_terkini_id(s.id)) end,
           case when public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id)) then s.pass_mark end,
           -- Z K-01 (Bob's Q2): that same last result's must-be-right gate, under the same condition, so a learner who
           -- missed one is never read as reached beside a figure above the target
           case when public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id))
                then (select ar.safety_gate_passed from public.assessment_results ar where ar.id = public.hasil_terkini_id(s.id)) end
      from public.attempt_requests r
      join public.assessment_sessions s on s.id = r.session_id
      join public.persons p on p.id = r.person_id
      join public.persons q on q.id = r.requested_by_person_id
      join public.assessment_definitions d on d.id = s.assessment_definition_id
      left join public.org_nodes n on n.id = coalesce(s.class_node_id, s.cohort_node_id)
     where r.institution_id = p_institution and r.status = 'PENDING'
       and public.boleh_putuskan_percobaan(r.session_id)
     order by r.requested_at, r.id;
end $function$;

revoke all on function public.percobaan_antrean(uuid) from public, anon, authenticated, service_role;
grant execute on function public.percobaan_antrean(uuid) to authenticated;

do $$
begin
  if has_function_privilege('authenticated', 'public.tujuan_gerbang_terlewat(uuid)', 'execute')
     or has_function_privilege('anon', 'public.tujuan_gerbang_terlewat(uuid)', 'execute')
     or exists (select 1 from public.client_rpc_registry where function_name = 'tujuan_gerbang_terlewat') then
    raise exception 'Z K-01: the gate''s objectives are read only through session_outcome and tujuan_belum_tercapai';
  end if;
  if position('tujuan_gerbang_terlewat' in pg_get_functiondef('public.session_outcome(uuid)'::regprocedure)) = 0
     or position('tujuan_gerbang_terlewat' in pg_get_functiondef('public.tujuan_belum_tercapai(uuid,uuid)'::regprocedure)) = 0 then
    raise exception 'Z K-01: the learner and the teacher do not read the gate''s objectives from one helper';
  end if;
  if not has_function_privilege('authenticated', 'public.percobaan_antrean(uuid)', 'execute')
     or not exists (select 1 from public.client_rpc_registry where function_name = 'percobaan_antrean') then
    raise exception 'Z K-01: percobaan_antrean lost its grant or registry row';
  end if;
  if position('computed_at desc' in pg_get_functiondef('public.percobaan_antrean(uuid)'::regprocedure)) > 0
     or position('hasil_terkini_id' in pg_get_functiondef('public.percobaan_antrean(uuid)'::regprocedure)) = 0 then
    raise exception 'Z K-01: the retake queue does not read the result in force';
  end if;
end $$;

-- CORRECTED IN PLACE (undeployed; Bob 10:56Z, F06-S01). ADR-0021: every function this migration creates is revoked
-- from PUBLIC after its
-- last create. PUBLIC held no EXECUTE on any of them before (CREATE OR REPLACE keeps the grants), so this changes nothing
-- at runtime; it states the rule where the rule is read.
revoke execute on function public.session_outcome(uuid) from public;
revoke execute on function public.tujuan_belum_tercapai(uuid, uuid) from public;
