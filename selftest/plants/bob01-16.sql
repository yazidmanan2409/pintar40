-- bob01-16 — BOB-20 (D-048): A PLATFORM ROLE COUNTS AS STAFF. The SYSTEM_ADMIN exclusion is gone, so a platform administrator whose row names a school's node becomes visible to that school's admin without any identity there.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  src := replace(orig, $p$ra.role <> 'SYSTEM_ADMIN'$p$, $p$true$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
