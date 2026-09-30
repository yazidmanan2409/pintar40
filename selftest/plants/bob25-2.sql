-- bob25-2 — A SEND THE HOST REFUSED IS FREE. email_send_reserve stops counting host refusals, so a failing address can be asked without end.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.email_send_reserve(text, text)'::regprocedure);
  src := replace(orig, $p$where s.outcome <> 'REFUSED_LIMIT'$p$, $p$where s.outcome not in ('REFUSED_LIMIT', 'REFUSED_BY_HOST')$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
