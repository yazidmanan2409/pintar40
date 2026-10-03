-- wp8-15 — D-093 T2 RETURNS. A role's revocation is recorded without the reason it was given.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_audit()'::regprocedure);
  src := replace(orig, '''reason'', new.revoked_reason,', '''reason'', null,');
  if src = orig then raise exception 'the plant did not reach the revocation''s reason'; end if;
  execute src;
end $d$;
