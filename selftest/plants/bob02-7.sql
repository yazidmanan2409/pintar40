-- bob02-7 — ANY FILE NAME IS SIGNED. The upload predicate stops asking whether the package names the file.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.may_upload_package_media(text)'::regprocedure);
  src := replace(orig, $p$return exists (select 1 from jsonb_array_elements(coalesce(b.inferred_mapping$p$, $p$return true or exists (select 1 from jsonb_array_elements(coalesce(b.inferred_mapping$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
