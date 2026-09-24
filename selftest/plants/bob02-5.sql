-- bob02-5 — BUG B RETURNS. A prepared package carries no pending confirmation, so /studio/unggah never offers one.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.prepare_ingest_batch(uuid)'::regprocedure);
  src := replace(orig, $p$open_questions = case when v_ok then jsonb_build_array($p$, $p$open_questions = case when false then jsonb_build_array($p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
