-- d2r-2 — THE PLAYER IS OFFERED HELP. assistance_state ignores the sitting's capture and gives the definition's window.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.assistance_state(uuid)'::regprocedure);
  src := regexp_replace(orig, 'select case when \(s\.assistance_policy ->> ''arah''\)::boolean or \(s\.assistance_policy ->> ''petunjuk''\)::boolean\s+or \(s\.assistance_policy ->> ''contoh''\)::boolean then d\.hesitation_window_seconds end into v_window',
                        'select d.hesitation_window_seconds into v_window');
  if src = orig then raise exception 'the plant did not reach the window'; end if;
  execute src;
end $d$;
