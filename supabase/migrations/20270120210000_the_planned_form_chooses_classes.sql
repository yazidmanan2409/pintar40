-- A2b batch 2 · the planned form chooses classes (THE PLAN §5.3 D1; the Chief Architect, 16 Nov 09:33, 09:44, 09:59
-- and 10:03; Sharon's checklist A2B-BATCH2-PREP.md and her conditions, 11eca8bb). DRAFT.
--
-- * The bound on p_nodes (the Chief Architect, 09:59): more than 500 entries is refused MAINTENANCE_INPUT_INVALID
--   before any lookup, in schedule_maintenance and in maintenance_collisions; 500 accepted. Duplicates are collapsed
--   (stored once), as before.
-- * An inactive (archived) class is refused MAINTENANCE_NODE_INVALID, as an unknown one is (A2B-K17).
-- * maintenance_collisions gains a trailing p_nodes uuid[] DEFAULT '{}' (the old four-argument function is replaced:
--   an overload with a default would make every call ambiguous; 4.0's and M148's four-argument calls are unchanged).
--   With classes it applies schedule_maintenance's checks in schedule_maintenance's order (authority, then the class
--   check: NODE_INVALID), and counts the assessments that reach the chosen classes (the Chief Architect, 09:44): those
--   on a chosen class or under it, decided through the one place predicate maintenance_jendela_atas (Sharon's
--   condition; A2B-D15), and those set above a chosen class (the school, its cohort). Advisory only: it refuses
--   nothing on account of other windows. It returns counts only: asesmen and terakhir_selesai.
-- * pemeliharaan_kelas_sekolah(p_sekolah): the school's active classes for the planned form's class step, for whoever
--   may schedule there (the school's Admin sekolah, Admin PINTAR); anyone else MAINTENANCE_NOT_ALLOWED. A new read
--   rather than widening A2a's penghentian_kelas_sekolah (A2a is frozen; Sharon). A STAFF read.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

-- ───────────────────────────────────────────────────────────── the writer: the bound and an archived class
do $$
declare f regprocedure := 'public.schedule_maintenance(boolean,uuid[],timestamptz,timestamptz,text,text,boolean,uuid[],text)';
begin
  perform pg_temp.a2b_ganti(f, E'begin\n  v_me := public.current_person_id();\n',
    E'begin\n  -- A2b batch 2: the class list is bounded before any lookup (the Chief Architect, 16 Nov 09:59)\n'
    || E'  if cardinality(coalesce(p_nodes, ''{}'')) > 500 then perform public.maintenance_refuse(''MAINTENANCE_INPUT_INVALID''); end if;\n'
    || E'  v_me := public.current_person_id();\n');
  perform pg_temp.a2b_ganti(f, 'where n.id = x and n.kind = ''CLASS'' and n.institution_id = v_inst[1]))) then',
    'where n.id = x and n.kind = ''CLASS'' and n.is_active and n.institution_id = v_inst[1]))) then');
end $$;

-- ───────────────────────────────────────────────────────────── the advisory count, with the class choice
drop function public.maintenance_collisions(boolean, uuid[], timestamptz, timestamptz);
create function public.maintenance_collisions(p_platform boolean, p_institutions uuid[], p_starts_at timestamptz,
                                              p_ends_at timestamptz, p_nodes uuid[] default '{}')
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_from timestamptz; v_to timestamptz; v_n int; v_last timestamptz; v_inst uuid[]; v_nodes uuid[];
        w public.maintenance_windows;
begin
  if cardinality(coalesce(p_nodes, '{}')) > 500 then perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID'); end if;
  if not public.maintenance_may_act(p_platform, p_institutions) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  v_nodes := (select coalesce(array_agg(distinct x order by x), '{}') from unnest(coalesce(p_nodes, '{}')) x);
  -- schedule_maintenance's class check (K10, K17): active classes of exactly one school, chosen with it, not platform
  if cardinality(v_nodes) > 0 and (coalesce(p_platform, false) or cardinality(v_inst) <> 1
       or exists (select 1 from unnest(v_nodes) x
                   where not exists (select 1 from public.org_nodes n
                                      where n.id = x and n.kind = 'CLASS' and n.is_active and n.institution_id = v_inst[1]))) then
    perform public.maintenance_refuse('MAINTENANCE_NODE_INVALID');
  end if;
  v_from := coalesce(p_starts_at, now()) - interval '15 minutes';
  v_to := coalesce(p_ends_at, coalesce(p_starts_at, now()) + interval '1 day');
  if cardinality(v_nodes) = 0 then
    select count(*), max(aa.closes_at) into v_n, v_last
      from public.assessment_assignments aa
     where aa.status in ('SCHEDULED', 'OPEN')
       and (p_platform or aa.institution_id = any (p_institutions))
       and coalesce(aa.opens_at, aa.created_at) < v_to
       and (aa.closes_at is null or aa.closes_at > v_from);
  else
    -- the proposed window, as the one place predicate reads it
    w.platform := false; w.institution_ids := v_inst; w.node_ids := v_nodes;
    select count(*), max(aa.closes_at) into v_n, v_last
      from public.assessment_assignments aa
      join public.org_nodes n on n.id = aa.node_id
     where aa.status in ('SCHEDULED', 'OPEN')
       and aa.institution_id = v_inst[1]
       and (public.maintenance_jendela_atas(w, n)                                       -- on a chosen class, or under it
            or exists (select 1 from public.org_nodes k where k.id = any (v_nodes) and k.jalur @> array[n.id]))  -- above it
       and coalesce(aa.opens_at, aa.created_at) < v_to
       and (aa.closes_at is null or aa.closes_at > v_from);
  end if;
  return jsonb_build_object('asesmen', v_n, 'terakhir_selesai', v_last);
end $$;
revoke all on function public.maintenance_collisions(boolean, uuid[], timestamptz, timestamptz, uuid[]) from public, anon;
grant execute on function public.maintenance_collisions(boolean, uuid[], timestamptz, timestamptz, uuid[]) to authenticated, service_role;

-- ───────────────────────────────────────────────────────────── the class step's list
create function public.pemeliharaan_kelas_sekolah(p_sekolah uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.current_person_id() is null or p_sekolah is null or not public.maintenance_may_act(false, array[p_sekolah]) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'nama', n.name, 'tahun', ap.name) order by n.name, ap.starts_on, n.id)
                     from public.org_nodes n left join public.academic_periods ap on ap.id = n.academic_period_id
                    where n.institution_id = p_sekolah and n.kind = 'CLASS' and n.is_active), '[]'::jsonb);
end $$;
revoke all on function public.pemeliharaan_kelas_sekolah(uuid) from public, anon, service_role;
grant execute on function public.pemeliharaan_kelas_sekolah(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('pemeliharaan_kelas_sekolah', 'STAFF',
   'A2b D1: the active classes of one school, for the planned maintenance form''s class step; for whoever may schedule '
   || 'there (the school''s Admin sekolah, Admin PINTAR); anyone else MAINTENANCE_NOT_ALLOWED. Read only.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if to_regprocedure('public.maintenance_collisions(boolean,uuid[],timestamptz,timestamptz)') is not null
     or position('maintenance_jendela_atas(w, n)' in pg_get_functiondef('public.maintenance_collisions(boolean,uuid[],timestamptz,timestamptz,uuid[])'::regprocedure)) = 0
     or position('> 500' in pg_get_functiondef('public.schedule_maintenance(boolean,uuid[],timestamptz,timestamptz,text,text,boolean,uuid[],text)'::regprocedure)) = 0
     or has_function_privilege('anon', 'public.pemeliharaan_kelas_sekolah(uuid)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.maintenance_collisions(boolean,uuid[],timestamptz,timestamptz,uuid[])'::regprocedure, 'execute') then
    raise exception 'A2b batch 2: the class step, its count or its bound is not as intended';
  end if;
end $$;
