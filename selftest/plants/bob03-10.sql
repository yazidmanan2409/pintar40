-- bob03-10 — BOB-17: A SENTENCE IS BACK AMONG THE CODES. publish_readiness tells an error in the text as "temuan ERROR pada teks siswa" again, so the Terbit step would have a sentence to show and the rule would no longer block by code.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.publish_readiness(uuid)'::regprocedure);
  src := replace(orig, $p$when 'ERROR' then 'READINESS_TEXT_ERROR'$p$, $p$when 'ERROR' then 'temuan ERROR pada teks siswa'$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
