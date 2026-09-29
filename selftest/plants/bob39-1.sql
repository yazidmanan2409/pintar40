-- bob39-1 — A REFERRAL REACHES NOBODY. The review records REFERRED_TO_INSTITUTION and raises no decision.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.record_integrity_review(uuid, text, text)'::regprocedure);
  src := replace(orig, $p$    perform public.refer_integrity_signal(p_signal, p_note);$p$, $p$    null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
