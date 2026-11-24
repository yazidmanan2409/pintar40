-- d2r-14 — THE FIX OVERREACHES. reading_map hides the reasons of every result, Pemetaan Awal's among them.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.reading_map(uuid)'::regprocedure);
  src := replace(orig, 'if (select s.bersertifikasi from public.assessment_sessions s where s.id = p_session) then', 'if true then');
  if src = orig then raise exception 'the plant did not reach the branch'; end if;
  execute src;
end $d$;
