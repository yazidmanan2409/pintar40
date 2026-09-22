-- wp8-3 — A REVISION THAT OVERWRITES IN PLACE. The template version stops
-- moving, so a report already issued can no longer say which assembly
-- produced it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.save_report_template(uuid,text,text,jsonb,uuid)'::regprocedure);
  src := replace(orig, 'v_version := v_version + 1;', 'v_version := v_version;');
  if src = orig then raise exception 'the plant did not reach the version bump'; end if;
  execute src;
end $d$;
