-- d2r-16 — THE GATE READS THE MODE'S NAME (Sharon's condition 2). session_review gates on POST_TEST and STANDALONE by name.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
  src := replace(orig, 'if v_s.bersertifikasi then', 'if v_s.mode in (''POST_TEST'', ''STANDALONE'') then');
  if src = orig then raise exception 'the plant did not reach the gate'; end if;
  execute src;
end $d$;
