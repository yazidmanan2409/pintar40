-- A2b, commit 12 · draining is PER WINDOW, read through ONE place predicate (the Chief Architect's ruling, 16 Nov
-- 08:03, on Sharon's question; Sharon's conditions, 08:14 and 08:21). DRAFT; corrected in place before any deploy.
--
-- The rule: a person is draining for a window only through a sitting that window affects. For a platform-wide window
-- every sitting is affected, so the person-wide maintenance_draining(person) (#148, D-100(b)) is right there, and
-- maintenance_block_for_me reads it only for such a window (20270120110000 skips class and school PLANNED windows
-- first; an EMERGENCY returns before it). It stays as it is.
--
-- The defect: pintar_status_saya computed 'berjalan' with maintenance_draining(v_me) for EVERY window it lists, class
-- and school windows included, so a sitting at the person's other school made a class window here read "your
-- sitting continues". The app read 'berjalan' only on person-level branches, so nothing showed it, but the value was
-- wrong. A2B-D14 (a two-school learner) was red on it; A2B-D15 pins the person-wide reading to its one caller.
--
-- ONE PLACE PREDICATE (Sharon, condition 1 and (a)): "this window's place covers this node" was written three times,
-- identically, in maintenance_affects_place and twice in maintenance_mulai_tolak:
--     n.institution_id = any (w.institution_ids) and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)
--     n.institution_id = any (x.institution_ids) and (cardinality(x.node_ids) = 0 or x.node_ids && n.jalur)   (twice)
-- It is now maintenance_jendela_atas(w, n), the same expression, and those three call it, as does the new reader. The
-- same expression means the same edge cases: classes '{}' (a school window) covers every node of the school; classes
-- NULL (the column is NOT NULL, so only a constructed row) makes cardinality NULL and the whole predicate NULL, which
-- every caller reads as "not covered", exactly as before; a NULL node (a left join that found none) is NULL likewise.
-- A2B-D16 asserts the helper equals the old expression on all of them. It is LANGUAGE sql STABLE SECURITY INVOKER
-- (inlinable by the planner, Sharon's note) with maintenance_draining's grants; its callers are SECURITY DEFINER.
--
-- The per-window reader: maintenance_draining_di(person, window) counts only sittings whose place (the sitting's
-- class, else its cohort, else its learning assignment's node) the window covers, and every sitting for a platform-wide
-- window; the same liveness as maintenance_draining (the effective deadline plus the late-sync grace); read only.
-- 'berjalan' reads it.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

-- ───────────────────────────────────────────────────────────── the one place predicate
create function public.maintenance_jendela_atas(w public.maintenance_windows, n public.org_nodes)
returns boolean language sql stable security invoker set search_path = public, pg_temp as $$
  select n.institution_id = any (w.institution_ids) and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)
$$;
revoke all on function public.maintenance_jendela_atas(public.maintenance_windows, public.org_nodes) from public, anon, authenticated;

-- its three callers: the old expression, replaced by the call (each anchor checked for its exact count)
do $$
begin
  perform pg_temp.a2b_ganti('public.maintenance_affects_place(uuid,timestamptz)',
    'n.institution_id = any (w.institution_ids)
       and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)',
    'public.maintenance_jendela_atas(w, n)');
  perform pg_temp.a2b_ganti('public.maintenance_mulai_tolak(uuid,uuid)',
    'n.institution_id = any (x.institution_ids) and (cardinality(x.node_ids) = 0 or x.node_ids && n.jalur)',
    'public.maintenance_jendela_atas(x, n)');
  perform pg_temp.a2b_ganti('public.maintenance_mulai_tolak(uuid,uuid)',
    'n.institution_id = any (x.institution_ids)
                         and (cardinality(x.node_ids) = 0 or x.node_ids && n.jalur)',
    'public.maintenance_jendela_atas(x, n)');
end $$;

-- ───────────────────────────────────────────────────────────── the per-window reader
create function public.maintenance_draining_di(p_person uuid, w public.maintenance_windows)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.assessment_sessions s
                   join public.assessment_definitions d on d.id = s.assessment_definition_id
                   left join public.org_nodes n on n.id = coalesce(s.class_node_id, s.cohort_node_id,
                     (select la.node_id from public.learning_assignments la where la.id = s.learning_assignment_id))
                  where s.person_id = p_person and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
                    and (w.platform or (n.id is not null and public.maintenance_jendela_atas(w, n)))
                    and case when s.authoritative_deadline is null then s.status <> 'EXPIRED'
                             else now() <= public.pengerjaan_tenggat_efektif(s.id)
                                           + make_interval(secs => coalesce(d.late_sync_grace_seconds, 0)) end)
$$;
-- maintenance_draining's grants exactly (revoked from public, anon and authenticated)
revoke all on function public.maintenance_draining_di(uuid, public.maintenance_windows) from public, anon, authenticated;

do $$
begin
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'''berjalan'', public.maintenance_draining(v_me)',
    E'''berjalan'', public.maintenance_draining_di(v_me, w)');
end $$;

do $$
declare f text;
begin
  if position('maintenance_draining_di(v_me, w)' in pg_get_functiondef('public.pintar_status_saya()'::regprocedure)) = 0
     or position('maintenance_draining(v_me)' in pg_get_functiondef('public.pintar_status_saya()'::regprocedure)) > 0 then
    raise exception 'A2b commit 12: the status read does not read draining per window';
  end if;
  foreach f in array array['public.maintenance_affects_place(uuid,timestamptz)', 'public.maintenance_mulai_tolak(uuid,uuid)',
                           'public.maintenance_draining_di(uuid,public.maintenance_windows)'] loop
    if position('maintenance_jendela_atas(' in pg_get_functiondef(f::regprocedure)) = 0
       or pg_get_functiondef(f::regprocedure) ~ 'node_ids && n\.jalur' then
      raise exception 'A2b commit 12: % does not read the one place predicate, or still carries a copy', f;
    end if;
  end loop;
  foreach f in array array['public.maintenance_draining_di(uuid,public.maintenance_windows)',
                           'public.maintenance_jendela_atas(public.maintenance_windows,public.org_nodes)'] loop
    if has_function_privilege('authenticated', f::regprocedure, 'execute') or has_function_privilege('anon', f::regprocedure, 'execute') then
      raise exception 'A2b commit 12: % is open to a client', f;
    end if;
  end loop;
end $$;
