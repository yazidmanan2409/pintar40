-- bob25-5 — ONE ADDRESS, ANY NUMBER OF CODES. email_send_reserve forgets the per-kind minute: the resend countdown is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.email_send_reserve(text, text)'::regprocedure);
  src := replace(orig, $p$(l.scope = 'ADDRESS' or s.kind = p_kind)$p$, $p$(l.scope = 'ADDRESS' or (s.kind = p_kind and false))$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
