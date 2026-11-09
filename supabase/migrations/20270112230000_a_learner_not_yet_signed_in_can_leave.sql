-- E3 and the year-end flow (the journeys' S27 on d2b7b714): «invalid enrollment transition PENDING → ENDED». Red on
-- ee3b3783: F37-E07, F37-K01..K05 with a PENDING learner.
--
-- enrollments_guard (20260912004321) allowed PENDING only to ACTIVE or CANCELLED: a learner recorded but not yet signed
-- in could not leave, graduate or move up, so one such learner refused a whole class's «Konfirmasi kenaikan kelas».
-- PENDING -> ENDED is now allowed; nothing else in the guard changes.

CREATE OR REPLACE FUNCTION public.enrollments_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if tg_op = 'DELETE' then raise exception 'enrollments are append-only (INV-23)'; end if;
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.academic_periods ap where ap.id = new.academic_period_id and ap.institution_id = new.institution_id) then
      raise exception 'academic period belongs to another institution';
    end if;
    if new.programme_id is not null and not exists (
      select 1 from public.org_nodes n where n.id = new.programme_id and n.kind = 'PROGRAMME' and n.institution_id = new.institution_id) then
      raise exception 'programme_id must be a PROGRAMME node of the same institution';
    end if;
    if new.status not in ('PENDING','ACTIVE') then raise exception 'new enrollment must be PENDING or ACTIVE'; end if;
    return new;
  end if;
  -- UPDATE: identity columns immutable; only lifecycle transitions allowed.
  if new.person_id <> old.person_id or new.institution_id <> old.institution_id
     or new.academic_period_id <> old.academic_period_id or new.valid_from <> old.valid_from then
    raise exception 'enrollment identity columns are immutable';
  end if;
  if new.status <> old.status then
    -- 9 Nov: a learner recorded and not yet signed in (PENDING) is enrolled and placed, and can leave, graduate or move
    -- up a year like anyone else: PENDING -> ENDED, through akhiri_pendaftaran and kenaikan_tetapkan (clients write no
    -- enrolment, 20270112160000). CANCELLED stays «never took effect»; a closed enrolment stays immutable.
    if not ((old.status='PENDING' and new.status in ('ACTIVE','CANCELLED','ENDED'))
         or (old.status='ACTIVE' and new.status='ENDED')) then
      raise exception 'invalid enrollment transition % → %', old.status, new.status;
    end if;
    if new.status in ('ENDED','CANCELLED') and new.valid_to is null then new.valid_to := now(); end if;
  elsif old.status in ('ENDED','CANCELLED') then
    raise exception 'a closed enrollment is immutable';
  end if;
  return new;
end $function$
;
-- ADR-0021: a function's EXECUTE is revoked from PUBLIC in the migration that (re)creates it
revoke all on function public.enrollments_guard() from public, anon, authenticated;

do $$
begin
  if position($q$old.status='PENDING' and new.status in ('ACTIVE','CANCELLED','ENDED')$q$ in
              (select prosrc from pg_proc where oid = 'public.enrollments_guard()'::regprocedure)) = 0 then
    raise exception 'lifecycle: a PENDING learner still cannot leave';
  end if;
  if position($q$a closed enrollment is immutable$q$ in (select prosrc from pg_proc where oid = 'public.enrollments_guard()'::regprocedure)) = 0 then
    raise exception 'lifecycle: a closed enrolment is no longer immutable';
  end if;
end $$;
