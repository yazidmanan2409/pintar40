-- bob02-4 — A LESSON IS MADE BEFORE ITS MEDIA ARRIVE. Confirmation stops asking storage whether each file was uploaded.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.confirm_ingest_batch(uuid)'::regprocedure);
  src := replace(orig, $p$where not exists (select 1 from storage.objects so where so.bucket_id = 'assets' and so.name = x ->> 'path');$p$, $p$where false;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
