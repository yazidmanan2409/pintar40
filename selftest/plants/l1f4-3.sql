-- l1f4-3 — the closure's record UNDONE: minta_akun writes no record of what the person held, so the deletion cannot
-- tell a role held at the closure from one gained after it.
do $$
declare v text := pg_get_functiondef('public.minta_akun(text,boolean)'::regprocedure);
begin
  if position('public.orang_dipegang(v_me)' in v) = 0 then raise exception 'l1f4-3: minta_akun does not write the record where it did'; end if;
  execute replace(v, 'public.orang_dipegang(v_me)', 'null');
end $$;
