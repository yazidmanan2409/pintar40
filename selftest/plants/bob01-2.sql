-- bob01-2 — ANY SCHOOL'S ADMIN IS AN ADMIN HERE. structure_node also admits a
-- caller who is an INSTITUTION_ADMIN at some other school.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_node(uuid)'::regprocedure);
  src := replace(orig, 'not public.has_scope(''INSTITUTION_ADMIN'', v.institution_id)',
                       'not (public.has_scope(''INSTITUTION_ADMIN'', v.institution_id) or exists (select 1 '
                       || 'from public.role_assignments ra where ra.person_id = public.current_person_id() '
                       || 'and ra.role = ''INSTITUTION_ADMIN'' and ra.revoked_at is null))');
  if src = orig then raise exception 'the plant did not reach the authorization clause'; end if;
  execute src;
end $d$;
