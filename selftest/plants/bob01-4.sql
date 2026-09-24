-- bob01-4 — A KELAS IGNORES THE YEAR IT WAS GIVEN. create_kelas no longer
-- compares the stated year with its Tingkat's.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_kelas(uuid,text,text)'::regprocedure);
  src := replace(orig, 'if v_year is distinct from (y::text || ''/'' || (y + 1)::text) then',
                       'if false then');
  if src = orig then raise exception 'the plant did not reach the year clause'; end if;
  execute src;
end $d$;
