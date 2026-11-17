-- A2b batch 2 · «Akhiri sekarang» and «Mulai sekarang» on a PLANNED window read the database's clock (the Chief
-- Architect, 16 Nov 09:59: fixed in batch 2; Sharon's recommendation, 11eca8bb). DRAFT.
--
-- The defect (A2B-E05, found sweeping the K8 rule): change_maintenance read maintenance_state(w, now()) and stamped
-- starts_at, activation_recorded_at, ended_at, deactivation_recorded_at and the notice's withdrawn_at with now(), the
-- transaction's start, where perpanjang_pemeliharaan reads clock_timestamp() (K8). So a planned window that ended on
-- the clock after the transaction began could still be "ended early", its ended_at stamped before its real end, and
-- «Mulai sekarang» was accepted on a window already under way.
--
-- The fix: one v_kini, taken after the locks (the actor, the fence for an EMERGENCY, the window's row), used for the
-- state read and every stamp. For a PLANNED window it is clock_timestamp(); for an EMERGENCY it is now(), so A2a's
-- fenced lift computes exactly the values it computed before (its T_lift is still clock_timestamp(), unchanged), and
-- A2B-E05 pins that: lifted in a 2 s old transaction, ended_at is the transaction's now() and T_lift the clock.
-- audit_write takes no time (audit_log.at is now()), so a PLANNED early end's summary carries 'ended_at', the
-- instant it ended (A2B-A07); an EMERGENCY's summary is unchanged.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

do $$
declare f regprocedure := 'public.change_maintenance(uuid,text,text)';
begin
  perform pg_temp.a2b_ganti(f, 'declare v_lift timestamptz;', 'declare v_kini timestamptz; v_lift timestamptz;');
  perform pg_temp.a2b_ganti(f, '  v_from := public.maintenance_state(w, now());',
    E'  -- A2b batch 2 (A2B-E05): one instant, after the locks; the clock for a PLANNED window, the transaction''s\n'
    || E'  -- start for an EMERGENCY (A2a''s fenced lift computes what it computed before)\n'
    || E'  v_kini := case when w.kind = ''PLANNED'' then clock_timestamp() else now() end;\n'
    || '  v_from := public.maintenance_state(w, v_kini);');
  perform pg_temp.a2b_ganti(f, 'set starts_at = now(), activation_recorded_at = now() where id = w.id;',
    'set starts_at = v_kini, activation_recorded_at = v_kini where id = w.id;');
  perform pg_temp.a2b_ganti(f, 'set ended_at = now(), t_lift = v_lift,', 'set ended_at = v_kini, t_lift = v_lift,');
  perform pg_temp.a2b_ganti(f, 'deactivation_recorded_at = coalesce(deactivation_recorded_at, now())',
    'deactivation_recorded_at = coalesce(deactivation_recorded_at, v_kini)');
  perform pg_temp.a2b_ganti(f, 'update public.broadcast_notices set withdrawn_at = now(), withdrawn_by_person_id = v_me',
    'update public.broadcast_notices set withdrawn_at = v_kini, withdrawn_by_person_id = v_me');
  perform pg_temp.a2b_ganti(f, E'''reason'', btrim(p_reason), ''t_stop'', w.t_stop, ''t_lift'', v_lift));',
    E'''reason'', btrim(p_reason), ''t_stop'', w.t_stop, ''t_lift'', v_lift)\n'
    || E'      || case when w.kind = ''PLANNED'' and p_action = ''AKHIRI'' then jsonb_build_object(''ended_at'', v_kini) else ''{}''::jsonb end);');
end $$;

do $$
declare v text := pg_get_functiondef('public.change_maintenance(uuid,text,text)'::regprocedure);
begin
  if v ~ 'now\(\)' and v !~ 'clock_timestamp\(\) else now\(\) end' then
    raise exception 'A2b batch 2: change_maintenance still reads now() outside its one instant';
  end if;
  if (length(v) - length(replace(v, 'now()', ''))) / 5 <> 1 or position('maintenance_state(w, v_kini)' in v) = 0 then
    raise exception 'A2b batch 2: change_maintenance does not read one instant for its state and its stamps';
  end if;
end $$;
