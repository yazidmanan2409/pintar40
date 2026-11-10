-- ---------------------------------------------------------------------------
-- D-199 (owner, 10 Nov): A SCHOOL'S DATES ON THE SCHOOL'S OWN CLOCK. The public certificate check.
--
-- verify_certificate answered the issue date as the first ten characters of issued_at_iso, a UTC instant, while the
-- certificate itself and the learner's list write the issue day on the school's clock. A certificate issued between
-- 00.00 and 07.00 WIB (wider for WITA and WIT) was checked publicly as the day before the one printed on it. The date
-- is the issuing school's issue day: the issuance is the school's act, and the public check names the school.
--
-- Only that one value changes: the same keys, the same row shape, the same refusals; the sealed payload and
-- issued_at_iso are untouched (the date is read from them). The function is replaced from its own definition, the one
-- line swapped, so nothing else in it moves. Red first: F38-Z01.
--
-- CATALOGUE: unchanged (no calc_, scoped_, official_, academic_ or service_ object is touched).
-- ---------------------------------------------------------------------------
do $$
declare v_def text := pg_get_functiondef('public.verify_certificate(text)'::regprocedure);
        v_old text := 'date       := left(v_c.issued_at_iso, 10);';
begin
  if position(v_old in v_def) = 0 then raise exception 'D-199: verify_certificate no longer reads its date where it did'; end if;
  execute replace(v_def, v_old,
    '-- D-199 (owner, 10 Nov): the issuing school''s issue day, on its own clock (WIB when the school keeps none)' || E'\n'
    || '  date       := to_char((v_c.issued_at_iso::timestamptz) at time zone coalesce(' || E'\n'
    || '                  (select i.zona_waktu from public.institutions i where i.id = v_c.institution_id), ''Asia/Jakarta''), ''YYYY-MM-DD'');');
end $$;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;
grant execute on function public.verify_certificate(text) to service_role;

do $$
begin
  if position('zona_waktu' in pg_get_functiondef('public.verify_certificate(text)'::regprocedure)) = 0 then
    raise exception 'D-199: the public check''s date is not on the school''s clock';
  end if;
end $$;
