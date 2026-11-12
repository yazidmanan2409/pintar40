-- l1f4-5 — Sharon's L1F4-A2 UNDONE: the reopen no longer refuses a person whose personal data was deleted, so an open
-- request to reopen ends the closure and unlocks their accounts.
do $$
declare v text := pg_get_functiondef('public.buka_kembali_akun(uuid,text)'::regprocedure);
        x text := E'    perform public.akun_tolak(''ACCOUNT_ANONYMISED'');\n';
begin
  if position(x in v) = 0 then raise exception 'l1f4-5: buka_kembali_akun does not refuse where it did'; end if;
  execute replace(v, x, E'    null;\n');
end $$;
