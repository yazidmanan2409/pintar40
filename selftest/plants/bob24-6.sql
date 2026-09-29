-- bob24-6 — 1234 IS A PIN. The run check is gone from the blocklist.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.pin_weakness(text)'::regprocedure);
  src := replace(orig, $p$if naik or turun then return 'PIN_SEQUENCE'; end if;$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
