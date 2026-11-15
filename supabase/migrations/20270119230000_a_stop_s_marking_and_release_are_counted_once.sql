-- A2a, change C · D6.9's remaining audit rows (THE PLAN §5.3 D6.9): "one when marking completes (how many held), one at
-- the lift (with T_lift; how many released, how many held for a suspension and left held)". DRAFT.
--
-- Each is written once per stop: scenario 9's "stopping twice or lifting twice writes no second audit row".
--   * maintenance.marking_completed: the marking batch, when a run finishes, for each stop in force that has none yet:
--     the stop, its T_stop, and how many sittings it holds (marked with it).
--   * maintenance.release_completed: the release batch, when a run finishes, for each stop lifted in the last seven days
--     that has none yet: the stop, its T_stop and T_lift, how many of the sittings it held are released, and how many
--     are left held for a suspension (A1's hold, which the lift does not release).
-- The lift records T_lift itself (maintenance.ended_now, commit 18); since C18-1 the lift releases and marks nothing
-- (its work under the exclusive fence is ≤ 0.5 s), so the counts are the release batch's, which the closer's job runs
-- every five minutes, and the row names T_lift.

create or replace function pg_temp.a2a_ekor(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2a D6.9: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
begin
  perform pg_temp.a2a_ekor('public.pengerjaan_tandai_darurat(integer)',
    E'    get diagnostics n = row_count;\n    commit;\n    exit when n = 0;\n  end loop;\nend $procedure$',
    E'    get diagnostics n = row_count;\n    commit;\n    exit when n = 0;\n  end loop;\n'
    || E'  -- D6.9: the marking completed, once per stop in force: how many sittings it holds\n'
    || E'  for x in select w.id, w.t_stop, w.platform, w.institution_ids from public.maintenance_windows w\n'
    || E'            where w.kind = ''EMERGENCY'' and w.t_stop is not null and w.ended_at is null\n'
    || E'              and not exists (select 1 from public.audit_log l where l.action = ''maintenance.marking_completed'' and l.target_id = w.id::text)\n'
    || E'            order by w.t_stop, w.id loop\n'
    || E'    perform public.audit_write(''maintenance.marking_completed'', ''maintenance_windows'', x.id::text,\n'
    || E'      case when x.platform then null else x.institution_ids[1] end,\n'
    || E'      jsonb_build_object(''window'', x.id, ''t_stop'', x.t_stop,\n'
    || E'        ''held'', (select count(*) from public.assessment_sessions s where s.darurat_jendela_id = x.id)));\n'
    || E'  end loop;\n'
    || E'  commit;\n'
    || E'end $procedure$');
  perform pg_temp.a2a_ekor('public.pengerjaan_lepas_darurat_semua(integer)',
    E'      perform public.pengerjaan_kredit_darurat(r.id);\n      n := n + 1; v_dari := r.id;\n    end loop;\n    commit;\n    exit when n = 0;\n  end loop;\nend $procedure$',
    E'      perform public.pengerjaan_kredit_darurat(r.id);\n      n := n + 1; v_dari := r.id;\n    end loop;\n    commit;\n    exit when n = 0;\n  end loop;\n'
    || E'  -- D6.9: the release completed, once per stop lifted: how many it released, how many it leaves held for a suspension\n'
    || E'  for r in select w.* from public.maintenance_windows w\n'
    || E'            where w.kind = ''EMERGENCY'' and w.t_stop is not null and w.ended_at is not null\n'
    || E'              and coalesce(w.t_lift, w.ended_at) > now() - interval ''7 days''\n'
    || E'              and not exists (select 1 from public.audit_log l where l.action = ''maintenance.release_completed'' and l.target_id = w.id::text)\n'
    || E'            order by w.t_stop, w.id loop\n'
    || E'    perform public.audit_write(''maintenance.release_completed'', ''maintenance_windows'', r.id::text,\n'
    || E'      case when r.platform then null else r.institution_ids[1] end,\n'
    || E'      (select jsonb_build_object(''window'', r.id, ''t_stop'', r.t_stop, ''t_lift'', coalesce(r.t_lift, r.ended_at),\n'
    || E'                ''released'', count(*) filter (where not (s.frozen_at is not null and s.unfrozen_at is null)),\n'
    || E'                ''held_for_suspension'', count(*) filter (where s.frozen_at is not null and s.unfrozen_at is null))\n'
    || E'         from public.maintenance_windows w2 join public.assessment_sessions s on s.created_at <= w2.t_stop\n'
    || E'        where w2.id = r.id and (w2.platform or s.person_id in (select o from public.penghentian_orang(w2) o))\n'
    || E'          and (s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') or public.pengerjaan_dalam_tenggang_pada(s, w2.t_stop))\n'
    || E'          and public.maintenance_affects_pada(w2, s.person_id, w2.t_stop)));\n'
    || E'  end loop;\n'
    || E'  commit;\n'
    || E'end $procedure$');
  if public.jalur_tanpa_pin() <> 0 then raise exception 'A2a D6.9: a batch procedure is no longer excused'; end if;
end $$;
