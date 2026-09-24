-- r1-1 — A CONFLICT LOSES ITS CODE. submit_response raises the seq conflict
-- without PR001, so the player can no longer tell "renumber" from anything
-- else, which is the defect that held a learner's answer forever.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.submit_response(uuid,integer,jsonb,timestamptz,public.receipt_mode,boolean)'::regprocedure);
  src := replace(orig, 'using errcode = ''PR001'', detail = coalesce(v_max, p_client_seq)::text;', ';');
  if src = orig then raise exception 'the plant did not reach the PR001 conflict'; end if;
  execute src;
end $d$;
