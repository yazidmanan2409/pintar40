-- bob01-9 — A KELAS WITH STUDENTS CAN BE CLOSED. deactivate_school_node stops
-- asking whether anyone is still placed in it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.deactivate_school_node(uuid,text)'::regprocedure);
  src := replace(orig, 'where c.jalur @> array[n.id] and m.valid_to is null) then',
                       'where c.jalur @> array[n.id] and m.valid_to is null and false) then');
  if src = orig then raise exception 'the plant did not reach the members clause'; end if;
  execute src;
end $d$;
