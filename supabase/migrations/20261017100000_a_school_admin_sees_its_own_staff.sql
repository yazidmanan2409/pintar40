-- BOB-20 (D-048; BOB-10 Q1; M2's first half) -- A SCHOOL ADMIN SEES AND NAMES
-- THE STAFF OF THEIR OWN SCHOOL.
--
-- person_visible_to_me showed a school admin only the people enrolled at the
-- school (and the ones transferred in). Staff hold no enrolment, so the
-- school's own teacher appeared in Konfigurasi's grant list as an ID, and a
-- newly recorded teacher -- a name-only intake row since BOB-10, which gives
-- them an institutional identity and nothing else -- could not be found to be
-- given a first role at all.
--
-- The rule is the person's relationship with the school AS STAFF, never
-- learner enrolment, and no synthetic enrolment is made to reach it:
--   * an institutional identity at the school (the school gave them its
--     number), or
--   * an active role at the school that is not SYSTEM_ADMIN.
-- The viewer is an INSTITUTION_ADMIN of that school (has_scope, which also
-- answers yes for the platform administrator, who sees everyone already).
--
-- Boundaries (D-048 (b)):
--   * own school only: both relations are read for the school the viewer
--     administers, so another school's staff stay invisible, by list (the
--     persons_select policy reads this function) and by direct id;
--   * no platform-level person: a SYSTEM_ADMIN row never counts, so a platform
--     administrator with no identity at the school is not visible to it;
--   * seeing grants nothing: role_assignments_guard and grant_role are not
--     touched; what the admin may grant is decided where it always was.
--
-- The school admin's own "waiting for a first role" list
-- (persons_awaiting_first_role_at) is new beside the platform's, which stays
-- the platform administrator's: the people with an identity at the school who
-- hold no role there, are not enrolled there and are not mid-transfer.

-- ---------------------------------------------------------------------------
-- 1. person_visible_to_me: the school's own staff, for the school's admin.
-- ---------------------------------------------------------------------------
create or replace function public.person_visible_to_me(p_person uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid;
begin
  if p_person is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if v_me = p_person then return true; end if;
  if public.is_system_admin() then return true; end if;
  if exists (select 1 from public.enrollments e
              where e.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', e.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
              where e.person_id = p_person and public.can_on_node('CAN_VIEW_LEARNER_ROSTER', m.node_id)) then
    return true;
  end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then
    return true;
  end if;
  -- D-048: the school's own staff -- the school's number, or a role held there
  if exists (select 1 from public.institutional_identities ii
              where ii.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', ii.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.role_assignments ra
              where ra.person_id = p_person and ra.role <> 'SYSTEM_ADMIN'
                and ra.revoked_at is null and now() < ra.valid_until
                and ra.institution_id is not null
                and public.has_scope('INSTITUTION_ADMIN', ra.institution_id)) then
    return true;
  end if;
  return false;
exception when others then return false;
end $$;
-- create or replace keeps the function's grants as they were

-- ---------------------------------------------------------------------------
-- 2. The school's own "waiting for a first role" list.
-- ---------------------------------------------------------------------------
create function public.persons_awaiting_first_role_at(p_institution uuid)
returns table (person_id uuid, display_name text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    raise exception 'naming the people a school has recorded who hold nothing there yet is for that school''s INSTITUTION_ADMIN';
  end if;
  return query
    select p.id, p.display_name
      from public.institutional_identities ii
      join public.persons p on p.id = ii.person_id
     where ii.institution_id = p_institution
       and p.anonymized_at is null
       and not exists (select 1 from public.role_assignments ra
                        where ra.person_id = p.id and ra.revoked_at is null
                          and ra.institution_id = p_institution)
       and not exists (select 1 from public.enrollments e
                        where e.person_id = p.id and e.institution_id = p_institution)
       and not exists (select 1 from public.transfers t
                        where t.person_id = p.id
                          and p_institution in (t.from_institution_id, t.to_institution_id))
     order by ii.issued_at desc, p.id;
end $$;
revoke all on function public.persons_awaiting_first_role_at(uuid) from public, anon;
grant execute on function public.persons_awaiting_first_role_at(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('persons_awaiting_first_role_at', 'STAFF',
        'BOB-20 (D-048): the people one school has recorded (an institutional identity there) who hold no role '
        || 'there, are not enrolled there and are not mid-transfer -- the school admin''s list for giving a new '
        || 'teacher a first role. For that school''s INSTITUTION_ADMIN (or the platform administrator); refuses '
        || 'everyone else. Naming a person grants no authority over them: grant_role decides what may be given.',
        'SCOPE', 'INSTITUTION_ADMIN');

update public.client_rpc_registry
   set note = 'Whether the caller may see a person: themselves; everyone for the platform administrator; a '
           || 'school''s learners for its admin and the classes'' roster readers; and (BOB-20, D-048) a school''s '
           || 'own staff for its admin -- an institutional identity there, or an active non-SYSTEM_ADMIN role '
           || 'there. Never through a learner enrolment made for the purpose; seeing grants no authority.'
 where function_name = 'person_visible_to_me';

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  if v_src !~ 'institutional_identities' or v_src !~ 'role_assignments' then
    raise exception 'BOB-20: person_visible_to_me does not read the staff relations';
  end if;
  if v_src !~ $r$ra\.role <> 'SYSTEM_ADMIN'$r$ then
    raise exception 'BOB-20: a platform role could make a person visible to a school';
  end if;
  -- the staff rule never reaches through an enrolment it made for the purpose
  if v_src ~* 'insert into' then
    raise exception 'BOB-20: person_visible_to_me writes';
  end if;
  if has_function_privilege('anon', 'public.persons_awaiting_first_role_at(uuid)', 'execute') then
    raise exception 'BOB-20: the school''s waiting list is anon-executable';
  end if;
  if not exists (select 1 from public.client_rpc_registry
                  where function_name = 'persons_awaiting_first_role_at'
                    and authorization_kind = 'SCOPE' and authorization_requirement = 'INSTITUTION_ADMIN') then
    raise exception 'BOB-20: the school''s waiting list is not registered';
  end if;
  -- the platform's own list is untouched: still the platform administrator's
  if pg_get_functiondef('public.persons_awaiting_first_role()'::regprocedure) !~ 'is_system_admin' then
    raise exception 'BOB-20: persons_awaiting_first_role lost its platform gate';
  end if;
end $$;
