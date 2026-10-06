-- D-084 C1, D-085 M1 (J1.1) -- A SCHOOL IS FOUNDED BY ONE VERSIONED, AUDITED STEP.
--
-- M1: "A new school is provisioned by an authorised PINTAR Platform Administrator through a controlled, repeatable,
-- versioned and audited provisioning process ... Hand-written production SQL is NOT an acceptable normal
-- provisioning method. The provisioning process establishes the minimum institutional foundation required to hand
-- PINTAR safely to the school's first administrator." C1 (Golden School contract): run only through a
-- dispatch-only workflow whose inputs are the school's details; it replaces the hand-written school birth (the audit
-- harness's step W0 and the coordinator's SQL under D-013).
--
-- THE FOUNDATION (specified here, Phase 2): the school (a real institution, never synthetic), its root place (the
-- institution node institutions_after_insert makes), and its current school year (one academic period). Nothing
-- that normal school operation does: no structure below the root, no person, no role, no namespace (the school's
-- administrator reserves it), no content. After it, the platform admin adds the first school admin in the app.
--
-- operator_found_school(name, slug, year name, year start, year end, operator reference):
--   * executable by service_role only, so only the workflow's operator connection reaches it, never a session;
--   * refuses a name or slug of the wrong shape, a slug already taken, a year that ends before it starts or lasts
--     beyond 400 days, and an operator reference that does not say who ran it (the workflow's run);
--   * writes the founding to the audit log as school.founded, with the operator reference, beside the
--     institution.created row the trigger writes.
-- Which environment it runs against is the workflow's: staging now; production only on Yazid's approval (M1).

create or replace function public.operator_found_school(
  p_name text, p_slug text, p_year_name text, p_year_starts date, p_year_ends date, p_operator_ref text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_name text := btrim(coalesce(p_name, '')); v_slug text := lower(btrim(coalesce(p_slug, '')));
        v_year text := btrim(coalesce(p_year_name, '')); v_ref text := btrim(coalesce(p_operator_ref, ''));
begin
  if char_length(v_name) not between 3 and 120 then
    raise exception using errcode = 'PR050', detail = 'FOUND_NAME', message = 'a school''s name is 3 to 120 characters';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' then
    raise exception using errcode = 'PR050', detail = 'FOUND_SLUG', message = 'a school''s slug is lower-case letters, digits and hyphens';
  end if;
  if exists (select 1 from public.institutions where slug = v_slug) then
    raise exception using errcode = 'PR050', detail = 'FOUND_SLUG_TAKEN', message = 'that slug is already a school''s';
  end if;
  if char_length(v_year) not between 4 and 40 or p_year_starts is null or p_year_ends is null
     or p_year_ends <= p_year_starts or p_year_ends - p_year_starts > 400 then
    raise exception using errcode = 'PR050', detail = 'FOUND_YEAR', message = 'a school year has a name and ends after it starts, within 400 days';
  end if;
  if char_length(v_ref) not between 8 and 300 then
    raise exception using errcode = 'PR050', detail = 'FOUND_OPERATOR', message = 'a founding says which operator run made it';
  end if;

  insert into public.institutions (name, slug, is_synthetic) values (v_name, v_slug, false) returning id into v_id;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on) values (v_id, v_year, p_year_starts, p_year_ends);
  perform public.audit_write('school.founded', 'institutions', v_id::text, v_id,
    jsonb_build_object('name', v_name, 'slug', v_slug, 'year', v_year, 'starts_on', p_year_starts, 'ends_on', p_year_ends,
                       'operator_ref', v_ref, 'step', 'operator_found_school/1'));
  return v_id;
end $$;
revoke all on function public.operator_found_school(text, text, text, date, date, text) from public, anon, authenticated;
grant execute on function public.operator_found_school(text, text, text, date, date, text) to service_role;

do $$
begin
  if has_function_privilege('authenticated', 'public.operator_found_school(text, text, text, date, date, text)', 'execute')
     or has_function_privilege('anon', 'public.operator_found_school(text, text, text, date, date, text)', 'execute') then
    raise exception 'C1: a school is founded only by the operator''s connection';
  end if;
  raise notice 'C1 verified: a school is founded by one versioned, audited step, by the operator only';
end $$;
