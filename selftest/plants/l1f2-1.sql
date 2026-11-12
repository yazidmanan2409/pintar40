-- l1f2-1 — L1-R2's delete UNDONE: a lock leaves the person's RECOVERY and ACTIVATION permits standing, so a permit
-- issued in the moment before the lock committed can still be spent within its minute.
do $$
declare v text := pg_get_functiondef('public.akun_kunci(uuid,boolean)'::regprocedure);
        a int := position('  if p_kunci then
    delete from public.password_write_permits w' in v);
        b int := position('  return n;' in v);
begin
  if a = 0 or b = 0 or b < a then raise exception 'l1f2-1: akun_kunci does not delete where it did'; end if;
  execute substr(v, 1, a - 1) || substr(v, b);
end $$;
