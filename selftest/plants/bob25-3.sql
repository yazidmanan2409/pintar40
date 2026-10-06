-- bob25-3 — A SEND SETTLES TWICE. email_send_settle no longer requires the row to be pending, so a sent email can be rewritten as failed.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.email_send_settle(uuid, text, integer)'::regprocedure);
  src := replace(orig, $p$where id = p_log_id and outcome = 'PENDING'$p$, $p$where id = p_log_id$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
