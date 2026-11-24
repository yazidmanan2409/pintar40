-- d2r-3 — THE LIVE ROW DECIDES. open_assistance reads mode_policy at the call, not what the sitting captured.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.open_assistance(uuid,smallint)'::regprocedure);
  src := replace(orig, 'select s.mode, s.bantuan_diizinkan into v_mode, v_allows from public.assessment_sessions s where s.id = v_session;',
    'select s.mode into v_mode from public.assessment_sessions s where s.id = v_session; select m.allows_assistance into v_allows from public.mode_policy m where m.mode = v_mode;');
  if src = orig then raise exception 'the plant did not reach the capture read'; end if;
  execute src;
end $d$;
