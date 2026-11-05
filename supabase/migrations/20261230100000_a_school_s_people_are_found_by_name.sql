-- W2.17 (FD-4 at 10x staging): A SCHOOL'S PEOPLE ARE FOUND BY NAME, A PAGE AT A TIME.
--
-- Konfigurasi's two pickers that list a school's people (the transfer form's enrolment, the roles form's person) read
-- the school's ACTIVE enrolments through the enrolments policy. enrollment_readable() is a per-row plpgsql function, and
-- status = 'ACTIVE' (an enum comparison, not leakproof) can only be applied after it, so the policy ran on every
-- enrolment the school ever had: with 13,300 more active enrolments in one school (10x staging's 1,323), and the ended
-- ones a school accumulates, the read passed the statement timeout (57014) even for a page of 50, and both pickers were
-- drawn empty. W217-SKALA-01 (selftest/app.test.ts) was red on it.
--
-- school_people_page() decides who may read once per school, as the policy would for an administrator
-- (has_scope('INSTITUTION_ADMIN', school)), and then reads that school's ACTIVE enrolments by its index: the newest
-- p_limit (at most 50), or those whose person's name holds p_search (case-insensitive, a plain substring, at least two
-- characters). A school the caller does not administer gives no rows, as the policy gives none. p_institutions null
-- means every school, for the platform administrator only (the evaluation persona's platform-wide form, C10); for
-- anyone else it gives no rows. Nothing is written.

create or replace function public.school_people_page(p_institutions uuid[], p_search text default null, p_limit integer default 50)
returns table (id uuid, person_id uuid, institution_id uuid, academic_period_id uuid, status public.enrollment_status,
               member_kind text, display_name text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_sekolah uuid[];
  v_cari text := nullif(lower(btrim(regexp_replace(coalesce(p_search, ''), '\s+', ' ', 'g'))), '');
  v_batas integer := least(greatest(coalesce(p_limit, 50), 1), 50);
begin
  if public.current_person_id() is null then return; end if;
  if p_institutions is null then
    if not public.is_system_admin() then return; end if;
    select coalesce(array_agg(i.id), '{}') into v_sekolah from public.institutions i;
  else
    select coalesce(array_agg(s), '{}') into v_sekolah
      from unnest(p_institutions) s where public.has_scope('INSTITUTION_ADMIN', s);
  end if;
  if cardinality(v_sekolah) = 0 then return; end if;
  if v_cari is not null and length(v_cari) < 2 then v_cari := null; end if;
  return query
    select e.id, e.person_id, e.institution_id, e.academic_period_id, e.status, public.member_kind(e), p.display_name
      from (select e0.* from public.enrollments e0 join public.persons p0 on p0.id = e0.person_id
             where e0.institution_id = any (v_sekolah) and e0.status = 'ACTIVE'
               and (v_cari is null or position(v_cari in lower(p0.display_name)) > 0)
             order by e0.created_at desc, e0.id limit v_batas) e
      join public.persons p on p.id = e.person_id
     order by e.created_at desc, e.id;
end $$;
revoke all on function public.school_people_page(uuid[], text, integer) from public, anon;
grant execute on function public.school_people_page(uuid[], text, integer) to authenticated, service_role;

-- THE REGISTRY (L3-F02): a staff read, decided by the school's administrator scope
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('school_people_page', 'STAFF',
   'W2.17: a page of at most 50 of a school''s ACTIVE enrolments, the newest or those whose person''s name holds the '
   || 'search, for Konfigurasi''s transfer and roles pickers. Access is decided once per school (INSTITUTION_ADMIN); '
   || '«every school» (null) for the platform administrator only. Read-only.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- TERMINAL VERIFICATION (ADR-0014). Structural; selftest/db/fable30.sql proves the behaviour on every run.
do $$
begin
  if not exists (select 1 from public.client_rpc_registry
                  where function_name = 'school_people_page' and exposure = 'STAFF'
                    and authorization_kind = 'SCOPE' and authorization_requirement = 'INSTITUTION_ADMIN') then
    raise exception 'W2.17: school_people_page is not declared';
  end if;
  if has_function_privilege('anon', 'public.school_people_page(uuid[], text, integer)'::regprocedure, 'execute') then
    raise exception 'W2.17: an anonymous caller can read a school''s people';
  end if;
  if (select p.provolatile from pg_proc p where p.oid = 'public.school_people_page(uuid[], text, integer)'::regprocedure) <> 's' then
    raise exception 'W2.17: school_people_page is not STABLE (it must write nothing)';
  end if;
end $$;
