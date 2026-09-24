-- bob01-c01 — THE STALE ROW. create_kelas takes the structure lock but judges
-- the Tingkat it read BEFORE the lock, so a Kelas can be added under a Tingkat
-- another connection has just deactivated. Driven against F10-C01 by CI, not
-- by plants.json: the race needs two committed connections, not one
-- transaction.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_kelas(uuid,text,text)'::regprocedure);
  src := replace(orig, '  select * into t from public.org_nodes o where o.id = t.id;', '');
  if src = orig then raise exception 'the plant did not reach the re-read under the lock'; end if;
  execute src;
end $d$;
