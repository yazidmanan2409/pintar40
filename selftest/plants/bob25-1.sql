-- bob25-1 — A REFUSAL FILLS THE WINDOW. email_send_reserve counts the limits' own refusals, so a ceiling once reached stays shut.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.email_send_reserve(text, text)'::regprocedure);
  src := replace(orig, $p$where s.outcome <> 'REFUSED_LIMIT'$p$, $p$where true$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
