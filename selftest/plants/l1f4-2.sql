-- l1f4-2 — Sharon's required change UNDONE: the deletion tells history from a live attachment by comparing created_at
-- with the closure's started_at again. An attachment whose transaction began before the closure and inserted after it
-- carries the earlier time, is read as history, and the deletion goes through.
do $$
declare v text := pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure);
        a int := position('  -- L1-F4 (Sharon, interim review of ea3c4b6f)' in v);
        b int := position(E'    perform public.akun_tolak(''ACCOUNT_LIVE_ATTACHMENT'');\n  end if;\n' in v);
begin
  if a = 0 or b = 0 or b < a then raise exception 'l1f4-2: hapus_data_pribadi does not measure where it did'; end if;
  execute substr(v, 1, a - 1)
    || E'  if exists (select 1 from public.person_suspensions x where x.person_id = r.person_id and x.ended_at is null\n'
    || E'               and x.category = ''CLOSED_AT_REQUEST''\n'
    || E'               and (exists (select 1 from public.enrollments e where e.person_id = r.person_id\n'
    || E'                              and e.status in (''PENDING'', ''ACTIVE'') and e.created_at > x.started_at)\n'
    || E'                    or exists (select 1 from public.role_assignments ra where ra.person_id = r.person_id and ra.revoked_at is null\n'
    || E'                                 and (ra.valid_until is null or ra.valid_until > now()) and ra.created_at > x.started_at))) then\n'
    || substr(v, b);
end $$;
