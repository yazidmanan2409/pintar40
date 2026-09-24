-- bob01-5 — EVERY BAGIAN BRINGS ITS OWN JENJANG. structure_jenjang stops
-- reusing the school's one hidden FACULTY.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_jenjang(uuid)'::regprocedure);
  src := replace(orig, 'if v is null then', 'if true then');
  if src = orig then raise exception 'the plant did not reach the reuse clause'; end if;
  execute src;
end $d$;
