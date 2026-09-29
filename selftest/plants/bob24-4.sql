-- bob24-4 — A USERNAME CAN BE RENAMED. The guard lets any rename through, not only the platform admin's correction.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.person_usernames_guard()'::regprocedure);
  src := replace(orig, $p$(new.username is distinct from old.username and coalesce(current_setting('pintar.identity_correction', true), '') <> 'on')$p$, $p$false$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
