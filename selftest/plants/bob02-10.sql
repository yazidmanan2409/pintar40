-- bob02-10 — A FAILED SAVE LEAVES THE BATCH CONFIRMED. The confirmation is written before, and outside, the block that undoes a failed materialisation.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.confirm_ingest_batch(uuid)'::regprocedure);
  src := replace(orig, $p$  begin
    update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = b.id;
    v_courses := public.lesson_package_materialise(b.id);$p$, $p$  update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = b.id;
  begin
    v_courses := public.lesson_package_materialise(b.id);$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
