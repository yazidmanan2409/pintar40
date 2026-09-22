-- ---------------------------------------------------------------------------
-- A PERSON WITH NO PAST CANNOT BE GIVEN A FUTURE.
--
-- Second Eye found the integration gap the release rehearsal walked straight
-- past because it drove the database directly. The only role-granting surface
-- — the configuration studio — builds the list of people it offers from three
-- sources: enrolments, transfers, and existing role assignments. Every one of
-- them is a PRIOR RELATIONSHIP.
--
-- So the person who most needs a role has none. A school's first administrator
-- is, by definition, somebody who has just been created in Supabase Auth and
-- has never been enrolled, never transferred and never granted anything. The
-- governed backend permits the grant — `grant_role` asks only that the grantor
-- is an active SYSTEM_ADMIN — and the SYSTEM_ADMIN can already SEE that person,
-- because `person_visible_to_me` returns true for them. The UI simply never
-- asked.
--
-- THE SMALLEST CORRECT PATH is the one read that closes the gap exactly: the
-- people the three existing sources cannot reach. Not a person search, not a
-- directory, not a new visibility rule.
--
--   * AUTHORIZATION IS THE EXISTING ONE, TWICE. The endpoint is for an active
--     SYSTEM_ADMIN and refuses everyone else by name; and every row it returns
--     must still satisfy `person_visible_to_me`, so the predicate that governs
--     the `persons` table governs this list too. Nothing new decides who may
--     see whom, here or in the frontend.
--   * IT IS THE COMPLEMENT, NOT A SEARCH. A person appears only while they
--     hold no active role assignment, no enrolment and no transfer — which is
--     precisely what the studio's three sources miss. The moment they are
--     granted anything they leave this list and appear in the ordinary one, so
--     the union is total and neither half is a directory.
--   * MINIMUM PROJECTION: a person id and a display name. No email, no
--     account, no institutional identity — the same shape WP7D settled on.
--   * TENANT PRIVACY IS UNTOUCHED for everyone else: a non-SYSTEM_ADMIN is
--     refused outright, and `person_visible_to_me` is unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.persons_awaiting_first_role()
returns table (person_id uuid, display_name text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_system_admin() then
    raise exception 'naming the people who hold nothing yet is for a SYSTEM_ADMIN';
  end if;
  return query
    select p.id, p.display_name
      from public.persons p
     where public.person_visible_to_me(p.id)
       and p.anonymized_at is null
       and not exists (select 1 from public.role_assignments ra
                        where ra.person_id = p.id and ra.revoked_at is null)
       and not exists (select 1 from public.enrollments e where e.person_id = p.id)
       and not exists (select 1 from public.transfers t where t.person_id = p.id)
     order by p.created_at desc, p.id;
end $$;
revoke all on function public.persons_awaiting_first_role() from public, anon, authenticated;
grant execute on function public.persons_awaiting_first_role() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('persons_awaiting_first_role', 'STAFF',
        'The people an active SYSTEM_ADMIN may give a first role to: those holding no active role '
        'assignment, no enrolment and no transfer, which is exactly what the configuration studio''s '
        'three existing sources cannot reach. Every row still satisfies person_visible_to_me, so the '
        'predicate that governs the persons table governs this list; it projects a person id and a '
        'display name and nothing else, and grants nothing -- grant_role re-authorizes independently.',
        'SYSTEM_ADMIN', null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014)
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_fac uuid; v_sys_u uuid; v_sys uuid; v_adm_u uuid; v_adm uuid;
        v_new_u uuid; v_new uuid; v_lrn_u uuid; v_lrn uuid; v_period uuid; v_enr uuid;
        v_raised boolean; v_msg text; n int;
begin
  -- structural: declared, client-callable, minimum projection, and it defines
  -- no visibility of its own
  select count(*) into n from public.client_rpc_registry
   where function_name = 'persons_awaiting_first_role' and exposure = 'STAFF'
     and authorization_kind = 'SYSTEM_ADMIN';
  if n <> 1 then raise exception 'persons_awaiting_first_role is not declared as a SYSTEM_ADMIN STAFF read'; end if;
  if not has_function_privilege('authenticated',
       'public.persons_awaiting_first_role()'::regprocedure, 'execute') then
    raise exception 'persons_awaiting_first_role is not reachable by a client';
  end if;
  select count(*) into n
    from unnest(string_to_array(
           regexp_replace(pg_get_function_result('public.persons_awaiting_first_role()'::regprocedure),
                          '^TABLE\(|\)$', '', 'g'), ', ')) c;
  if n <> 2 then raise exception 'the projection is % column(s), expected person_id and display_name', n; end if;
  if pg_get_functiondef('public.persons_awaiting_first_role()'::regprocedure)
       not like '%person_visible_to_me%' then
    raise exception 'the read does not defer to person_visible_to_me';
  end if;
  if pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure) ~* '\yawaiting\y' then
    raise exception 'person_visible_to_me was taught about this list';
  end if;

  ------------------------------------------------------------------ behavioural
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0110 school', 'probe-0110-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 1, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0110-sys@local.invalid') returning id into v_sys_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0110-adm@local.invalid') returning id into v_adm_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0110-new@local.invalid') returning id into v_new_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0110-lrn@local.invalid') returning id into v_lrn_u;
    select a.person_id into v_sys from public.accounts a where a.auth_user_id = v_sys_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_new from public.accounts a where a.auth_user_id = v_new_u;
    select a.person_id into v_lrn from public.accounts a where a.auth_user_id = v_lrn_u;
    update public.persons set display_name = 'Calon Kepala Sekolah' where id = v_new;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_sys, 'SYSTEM_ADMIN',      v_inst, now() - interval '1 day', now() + interval '365 days'),
           (v_adm, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_lrn, v_inst, v_period, 'ACTIVE') returning id into v_enr;
    perform set_config('app.seed_intent', '', true);

    -- (1) THE SYSTEM ADMIN FINDS THE PERSON NOBODY HAS TOUCHED
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_sys_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_sys_u::text, true);
    select count(*) into n from public.persons_awaiting_first_role() where person_id = v_new;
    if n <> 1 then raise exception 'the new person is not offered for a first role'; end if;
    select count(*) into n from public.persons_awaiting_first_role()
     where person_id in (v_sys, v_adm, v_lrn);
    if n <> 0 then raise exception '% person(s) who already hold something are still offered', n; end if;
    select count(*) into n from public.persons_awaiting_first_role()
     where person_id = v_new and display_name = 'Calon Kepala Sekolah';
    if n <> 1 then raise exception 'the offered person does not carry their display name'; end if;

    -- (2) AND THE GRANT THE LIST EXISTS FOR IS ACCEPTED
    perform public.grant_role(v_new, 'INSTITUTION_ADMIN', v_inst, now() + interval '365 days');
    select count(*) into n from public.persons_awaiting_first_role() where person_id = v_new;
    if n <> 0 then raise exception 'a person who now holds a role is still on the waiting list'; end if;

    -- (3) NOBODY ELSE MAY ASK. An institution administrator, an educator-less
    --     learner and an unidentified session are each refused by name.
    for v_msg in select unnest(array[v_adm_u::text, v_lrn_u::text, '']) loop
      perform set_config('request.jwt.claims',
        case when v_msg = '' then '' else json_build_object('sub', v_msg, 'role', 'authenticated')::text end, true);
      perform set_config('request.jwt.claim.sub', v_msg, true);
      v_raised := false;
      begin
        perform public.persons_awaiting_first_role();
      exception when others then v_raised := true; end;
      if not v_raised then
        raise exception 'a caller who is not a SYSTEM_ADMIN read the waiting list';
      end if;
    end loop;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP8F_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'WP8F_PROBE_UNDO' then
      raise exception 'first-role discovery verification failed: %', sqlerrm;
    end if;
  end;
end $$;
