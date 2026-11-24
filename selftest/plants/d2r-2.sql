-- d2r-2 — THE PLAYER IS OFFERED HELP. assistance_state ignores the sitting's capture and gives the definition's window.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.assistance_state(uuid)'::regprocedure);
  src := replace(orig, 'case when s.bantuan_diizinkan then d.hesitation_window_seconds end', 'd.hesitation_window_seconds');
  if src = orig then raise exception 'the plant did not reach the window'; end if;
  execute src;
end $d$;
