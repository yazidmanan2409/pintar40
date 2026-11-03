-- W2.1, W2.2, W2.3 (Batch 4, D-152; CR-13, CR-14, CR-15 per F-8): A PERSON WITH AN ACCOUNT IS FOUND, TO BE CORRECTED.
--
-- The three corrections exist in the database and are guarded there: a wrong email (authorize_email_correction, D-120
-- QN1: before activation CAN_PROVISION_PEOPLE in the person's school or the platform admin, after it the platform
-- admin only), a name (correct_person_name, D-077(3): the platform admin only) and a username (correct_username, F-8 /
-- D-152(b): the platform admin only). What was missing was a way to find the person: Aktivasi lists only the people
-- still waiting for an account and the class-card holders, so a correction was an operator's SQL step (REL-02).
--
-- orang_berakun(search, offset, limit): the people with an EMAIL account (not personas), each with their name, PINTAR
-- ID, school, sign-in address, username and whether the account has been activated; and, so a screen offers only what
-- the database will accept, which corrections THIS reader may make (boleh_email, boleh_identitas). Scope: the platform
-- admin reads everyone; a reader with CAN_PROVISION_PEOPLE reads the people who belong to those schools (by PINTAR ID,
-- a live staff role or a live enrolment); anyone else nobody. boleh_email follows authorize_email_correction exactly. It
-- reads and writes nothing else, and the corrections still decide for themselves. Paged (20 by default, at most 50),
-- with the total, so the platform lists stay paged (W2.10). An optional school narrows it to the working context's
-- school (L3, D-132); it never widens what the reader may see.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

create function public.orang_berakun(p_cari text default null, p_offset integer default 0, p_limit integer default 20,
                                      p_sekolah uuid default null)
returns table (person_id uuid, display_name text, institutional_id text, institution_id uuid, institution_name text,
               email text, username text, activated boolean, boleh_email boolean, boleh_identitas boolean, total bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  with sekolah as (
    -- every school a person belongs to: their PINTAR ID's, a live staff role's, a live enrolment's
    select x.person_id, x.institution_id from public.institutional_identities x
    union
    select ra.person_id, ra.institution_id from public.role_assignments ra
     where ra.revoked_at is null and now() < ra.valid_until and ra.institution_id is not null
    union
    select e.person_id, e.institution_id from public.enrollments e
     where e.status = 'ACTIVE' and e.institution_id is not null
  ), baca as (
    select a.person_id, p.display_name, ii.institutional_id, coalesce(ii.institution_id, sk.institution_id) as institution_id,
           i.name as institution_name, lower(u.email) as email, un.username,
           not exists (select 1 from public.account_setup s where s.account_id = a.id and s.state = 'REQUIRED') as activated,
           public.is_system_admin() as sys,
           exists (select 1 from sekolah k where k.person_id = a.person_id
                      and public.can_on_node('CAN_PROVISION_PEOPLE', k.institution_id)) as sekolah,
           -- the email correction's own rule (authorize_email_correction): the school of the person's PINTAR ID
           (ii.institution_id is not null and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)) as sekolah_id
      from public.accounts a
      join public.persons p on p.id = a.person_id
      join auth.users u on u.id = a.auth_user_id
      left join lateral (select x.institutional_id, x.institution_id from public.institutional_identities x
                          where x.person_id = a.person_id order by x.issued_at limit 1) ii on true
      left join lateral (select k.institution_id from sekolah k where k.person_id = a.person_id
                          order by k.institution_id limit 1) sk on true
      left join public.institutions i on i.id = coalesce(ii.institution_id, sk.institution_id)
      left join public.person_usernames un on un.person_id = a.person_id
     where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
  ), terlihat as (
    select b.* from baca b
     where (b.sys or b.sekolah)
       -- L3 (D-132): a school's working context lists that school's people only
       and (p_sekolah is null or exists (select 1 from sekolah k where k.person_id = b.person_id and k.institution_id = p_sekolah))
       and (coalesce(btrim(p_cari), '') = ''
            or b.display_name ilike '%' || btrim(p_cari) || '%'
            or b.email ilike '%' || btrim(p_cari) || '%'
            or coalesce(b.username, '') ilike '%' || btrim(p_cari) || '%'
            or coalesce(b.institutional_id, '') ilike '%' || btrim(p_cari) || '%'
            -- the panel reads the one person it opened for, by id
            or b.person_id::text = lower(btrim(p_cari)))
  )
  select t.person_id, t.display_name, t.institutional_id, t.institution_id, t.institution_name, t.email, t.username,
         t.activated, (t.sys or (t.sekolah_id and not t.activated)) as boleh_email, t.sys as boleh_identitas,
         count(*) over () as total
    from terlihat t
   order by t.display_name, t.person_id
   offset greatest(coalesce(p_offset, 0), 0)
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;
revoke all on function public.orang_berakun(text, integer, integer, uuid) from public, anon, service_role;
grant execute on function public.orang_berakun(text, integer, integer, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('orang_berakun', 'STAFF',
   'W2.1-W2.3 (Batch 4): the people with an email account the reader may correct: all for the platform admin, the people '
   || 'of the schools where the reader holds CAN_PROVISION_PEOPLE for anyone else; name, PINTAR ID, school, address, '
   || 'username, activation, and which corrections this reader may make. Paged; reads nothing else, writes nothing.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE');

do $$
begin
  if has_function_privilege('anon', 'public.orang_berakun(text,integer,integer,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.orang_berakun(text,integer,integer,uuid)', 'execute') then
    raise exception 'orang_berakun is reached by the wrong roles';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'orang_berakun' and p.prosecdef
                    and array_to_string(p.proconfig, ',') like '%search_path=public, pg_temp%') then
    raise exception 'orang_berakun is not SECURITY DEFINER with a pinned search_path';
  end if;
end $$;
