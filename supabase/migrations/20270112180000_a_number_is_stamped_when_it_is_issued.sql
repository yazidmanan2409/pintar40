-- SI-D03, Sharon's review of 0b60b012 (two Low findings). F37-S05 red on the commit before this one.
-- 1. issue_institutional_id locked the person, then the school; the import holds the school for its whole transaction
--    and issues per person, so an import and another issue for one of its people could deadlock. It now locks the
--    school first, then the person.
-- 2. A registration was stamped by the column default now(), the start of its transaction: a transaction that began
--    first, waited on the locks and committed later recorded the older time, so the onboarding rule's newest number
--    need not be the one committed last. It is now stamped with clock_timestamp() after the locks.

CREATE OR REPLACE FUNCTION public.issue_institutional_id(p_person uuid, p_institution uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ns text; v_next integer; v_id text; v_existing text; v_suffix text;
begin
  -- ALREADY HAS ONE -> THAT ONE. Not a second number and not an error: the
  -- pair already has an identity and this is what it is. This is the row-level
  -- idempotency the import path leans on.
  select ii.institutional_id into v_existing from public.institutional_identities ii
   where ii.person_id = p_person and ii.institution_id = p_institution;
  if v_existing is not null then return v_existing; end if;

  -- The row lock serialises allocation inside one school; the unique
  -- constraint on (institution_id, sequence_number) is what makes it true.
  select i.namespace into v_ns from public.institutions i
   where i.id = p_institution for update;
  -- Sharon (0b60b012): the school first, then the person, the order the import already holds them in, so an import
  -- and another issue for one of its people never wait on each other in a cycle; the person's row still serialises a
  -- new number against a school's credential act on them (sekolah_memegang)
  perform 1 from public.persons where persons.id = p_person for update;
  if v_ns is null then
    raise exception 'this institution has reserved no namespace, so it can issue no institutional ID';
  end if;

  select coalesce(max(ii.sequence_number), 0) + 1 into v_next
    from public.institutional_identities ii where ii.institution_id = p_institution;
  if v_next > 999999 then
    raise exception 'this institution has issued all 999999 institutional person IDs available under %', v_ns;
  end if;

  -- Two uppercase alphanumerics carrying no meaning and no secret; the
  -- namespace and the number already make the ID unique, and
  -- institutional_identities_id_unique is the backstop that says so.
  v_suffix := (select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                                        1 + floor(random() * 36)::int, 1), '')
                 from generate_series(1, 2));
  v_id := v_ns || lpad(v_next::text, 6, '0') || v_suffix;

  insert into public.institutional_identities
    (person_id, institution_id, institutional_id, sequence_number, issued_by_person_id, issued_at)
  values (p_person, p_institution, v_id, v_next, public.current_person_id(),
          clock_timestamp());   -- Sharon (0b60b012): the moment of issue, after the locks
  return v_id;
end;
$function$;
revoke all on function public.issue_institutional_id(uuid, uuid) from public, anon, authenticated;
grant execute on function public.issue_institutional_id(uuid, uuid) to service_role;

do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.issue_institutional_id(uuid, uuid)'::regprocedure);
begin
  if position('clock_timestamp()' in v_src) = 0 then
    raise exception 'SI-D03: a registration is not stamped at its moment of issue';
  end if;
  if position('from public.institutions i' in v_src) > position('from public.persons where persons.id = p_person for update' in v_src) then
    raise exception 'SI-D03: issue_institutional_id locks the person before the school';
  end if;
end $$;
