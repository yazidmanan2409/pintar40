-- bob02-9 — A CONFIRMED PACKAGE CAN BE CONFIRMED AGAIN. The state check before the lock-protected confirmation is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.confirm_ingest_batch(uuid)'::regprocedure);
  src := replace(orig, $p$  select * into b from public.ingest_batches where ingest_batches.id = b.id;
  if b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then perform public.package_refuse('PACKAGE_STATE_INVALID'); end if;$p$, $p$  select * into b from public.ingest_batches where ingest_batches.id = b.id;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
