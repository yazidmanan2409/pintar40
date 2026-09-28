-- BOB-10 (M5b, interim) -- THE INTAKE REFUSES STAFF ROWS AT VALIDATION.
--
-- What happened: an EDUCATOR, HEAD_OF_DEPARTMENT or DEAN row with a place
-- passed "Periksa daftar ini" and then went wrong at recording, because
-- import_advance records every row with a place as a learner first (an
-- enrolment and a membership) and grants the role after:
--   * placed in a Kelas, the teacher became a student of that class (M5);
--   * placed in a Bagian, the membership was refused at recording, and the
--     administrator read the database's own sentence in the row's reason.
--
-- The interim rule, until the intake has a staff path (M5b): a row naming a
-- staff role is refused by import_row_problems, the function the check, the
-- confirmation and the recording step all ask, so it is refused before
-- anything is provisioned and can never reach the learner's path. Learner rows
-- (no role, or STUDENT) are unchanged, and so is every other phrase.
--
-- import_row_problems as it was (20261006100000), with one branch added.

create or replace function public.import_row_problems(p_institution uuid, p_payload jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_bad jsonb := '[]'::jsonb; v_name text; v_node uuid; v_role text; v_person uuid;
        v_kind public.org_kind; v_active boolean;
begin
  v_name := btrim(coalesce(p_payload ->> 'display_name', ''));
  begin v_node := nullif(p_payload ->> 'node_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('node_id is not a uuid'::text); end;
  begin v_person := nullif(p_payload ->> 'person_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('person_id is not a uuid'::text); end;
  v_role := nullif(p_payload ->> 'role', '');

  if v_name = '' or length(v_name) > 200 then
    v_bad := v_bad || to_jsonb('display_name is missing or too long'::text);
  end if;

  -- An existing person may be named only if this caller can already see them;
  -- otherwise a uuid probe becomes an existence oracle. NO MATCHING IS DONE:
  -- PINTAR never decides on its own that two people at two schools are one
  -- person, and this is the line where that temptation would live.
  if v_person is not null then
    if not exists (select 1 from public.persons p where p.id = v_person)
       or not public.person_visible_to_me(v_person) then
      v_bad := v_bad || to_jsonb('person_id is not a person you may name'::text);
    elsif exists (select 1 from public.institutional_identities ii
                   where ii.person_id = v_person and ii.institution_id = p_institution) then
      v_bad := v_bad || to_jsonb('this person already holds an institutional identity here'::text);
    end if;
  end if;

  if v_node is not null then
    select n.kind, n.is_active into v_kind, v_active from public.org_nodes n
     where n.id = v_node and n.institution_id = p_institution;
    if v_kind is null then
      v_bad := v_bad || to_jsonb('node_id is not an organizational node of this institution'::text);
    elsif not public.can_on_node('CAN_PROVISION_PEOPLE', v_node) then
      v_bad := v_bad || to_jsonb('node_id is outside your provisioning scope'::text);
    elsif (v_role is null or v_role = 'STUDENT')
          and (v_kind not in ('CLASS', 'COHORT') or not v_active) then
      -- M5a. A learner is placed through a membership, and a membership
      -- exists only in a Kelas or a Tingkat. Said here, before anything is
      -- provisioned, instead of by a database sentence at provisioning.
      v_bad := v_bad || to_jsonb('a learner is placed in an active Kelas or Tingkat'::text);
    end if;
  end if;

  if v_role is not null then
    if not exists (select 1 from unnest(enum_range(null::public.app_role)) e where e::text = v_role) then
      v_bad := v_bad || to_jsonb('role is not a role this platform has'::text);
    elsif v_role in ('SYSTEM_ADMIN', 'INSTITUTION_ADMIN') then
      v_bad := v_bad || to_jsonb('this role is not granted by bulk provisioning'::text);
    elsif v_role <> 'STUDENT' then
      -- BOB-10 (M5b, interim). Recording a staff row takes the learner's path
      -- first: a row with a place is enrolled there and made a member before
      -- its role is granted. In a Kelas that turns a teacher into a student of
      -- the class; in a Bagian the membership is refused at recording with
      -- the database's own words. Until the intake has a staff path, a staff
      -- row is refused here, before anything exists, with a reason.
      v_bad := v_bad || to_jsonb('a staff row is not recorded by the bulk intake yet'::text);
    elsif v_node is null then
      v_bad := v_bad || to_jsonb('a role needs an organizational node to be scoped to'::text);
    end if;
  end if;
  return v_bad;
end $$;
-- ADR-0021: the same grants as the definition it replaces -- reached only
-- through import_validate and import_advance, never by a client directly.
revoke all on function public.import_row_problems(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification. No fixture is needed: the role checks run before
-- and without any place.
-- ---------------------------------------------------------------------------
do $$
declare v jsonb; r text;
begin
  foreach r in array array['EDUCATOR', 'HEAD_OF_DEPARTMENT', 'DEAN'] loop
    v := public.import_row_problems(gen_random_uuid(), jsonb_build_object('display_name', 'Guru Uji', 'role', r));
    if not v ? 'a staff row is not recorded by the bulk intake yet' then
      raise exception 'BOB-10: a % row is not refused as staff: %', r, v;
    end if;
  end loop;
  v := public.import_row_problems(gen_random_uuid(), '{"display_name": "Murid Uji"}'::jsonb);
  if v <> '[]'::jsonb then raise exception 'BOB-10: a bare learner row now has problems: %', v; end if;
  v := public.import_row_problems(gen_random_uuid(), '{"display_name": "Murid Uji", "role": "STUDENT"}'::jsonb);
  if v <> '["a role needs an organizational node to be scoped to"]'::jsonb then
    raise exception 'BOB-10: a STUDENT row without a place changed: %', v;
  end if;
end $$;
