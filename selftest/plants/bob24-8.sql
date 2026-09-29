-- bob24-8 — THE FIRST LOCK LASTS A MINUTE. The answer still says an hour; the ladder lets guessing resume after 60 s.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.recovery_attempt(text, text)'::regprocedure);
  src := replace(orig, $p$case r.level when 0 then interval '1 hour' else interval '4 hours' end$p$, $p$case r.level when 0 then interval '60 seconds' else interval '4 hours' end$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
