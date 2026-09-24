-- bob01-8 — NAMES ARE NEVER TAKEN. structure_name_taken always answers no, so
-- two active Bagian (or Kelas) can share a name.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_name_taken(uuid,public.org_kind,text,uuid,uuid,uuid)'::regprocedure);
  src := replace(orig, 'select exists (', 'select false and exists (');
  if src = orig then raise exception 'the plant did not reach the name check'; end if;
  execute src;
end $d$;
