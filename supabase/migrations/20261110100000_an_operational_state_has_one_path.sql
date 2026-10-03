-- D-093 T1 (owner ruling 3 Oct, O4) -- AN OPERATIONAL STATE HAS ONE PATH.
--
-- The D-093 inventory (docs/coordination/design/D-093-OPERATIONAL-SWITCH-INVENTORY.md) found authoritative state a
-- signed-in client could change by writing the table directly, past the functions that govern and audit it:
--
--   S10  learning_assignments / assessment_assignments: status, opens_at, closes_at, available_until. Any holder of
--        CAN_ASSIGN_LEARNING or CAN_DRAFT in the school could close, end or extend a window by PostgREST with no audit
--        row (grants of 20260912201500). The product opens windows only through assign_release and
--        launch_quick_assessment, both SECURITY DEFINER and audited; it has no close, extend or reopen at all.
--   S16  institutions: is_synthetic and is_active, writable by the school's own INSTITUTION_ADMIN (grant and policy of
--        20260912004431). is_synthetic caps the evidence class of every new sitting (derive_evidence_class), so a
--        school could make its own evidence OFFICIAL or SYNTHETIC with no record. No PINTAR screen writes this table;
--        a school is founded by operator_found_school and its namespace reserved by reserve_institution_namespace,
--        both SECURITY DEFINER.
--   S18  classes: status, writable by Heads of Department and above; nothing in PINTAR writes it.
--
-- The dependency trace before this change (3 Oct): no application code, server action, seed or harness writes these
-- four tables as a client; every function that writes them is SECURITY DEFINER; three database self-test suites
-- activated assignments as the signed-in teacher and now do it as the functions do (the D-041 writer pattern:
-- the person's claims stay, the client role is dropped), so the triggers still decide on the person.
--
-- So the client grants go. Reads are unchanged. No new setter is made: there was no legitimate client write to
-- preserve, and a future need (closing a window early, changing a school's state) becomes an audited function
-- under O1 when it is designed.
--
-- S17  platform_environment (the installation's posture): deployment configuration, not a runtime switch. The
--      table says "Set to 'production' only by the deployment system" (foundation_base); staging sets it once by
--      the `initialise` step of staging.yml as the database owner; the local seed pipeline sets the fixtures marker.
--      Signed-in clients hold SELECT only. On a Supabase stack service_role also holds INSERT, UPDATE, DELETE and
--      TRUNCATE by the platform's default privileges (as audit_log did, 20260912051935); nothing uses them. They go,
--      so only the deployment system (the owner) can change the posture, and each change it makes is recorded.

revoke insert, update on public.learning_assignments   from authenticated;
revoke insert, update on public.assessment_assignments from authenticated;
revoke insert, update on public.institutions           from authenticated;
revoke insert, update on public.classes                from authenticated;

revoke insert, update, delete, truncate on public.platform_environment from public, anon, authenticated, service_role;

-- The deployment system's change, on the record: from what, to what, by which database role. Not a setter; it
-- fires only on the owner's own UPDATE, and only when something actually changed.
create function public.platform_environment_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (old.environment, old.local_fixtures_enabled) is distinct from (new.environment, new.local_fixtures_enabled) then
    perform public.audit_write('platform_environment.changed', 'platform_environment', 'singleton', null,
      jsonb_build_object(
        'from', jsonb_build_object('environment', old.environment, 'local_fixtures_enabled', old.local_fixtures_enabled),
        'to',   jsonb_build_object('environment', new.environment, 'local_fixtures_enabled', new.local_fixtures_enabled),
        'database_role', session_user));
  end if;
  return null;
end $$;
revoke all on function public.platform_environment_audit() from public, anon, authenticated, service_role;
create trigger platform_environment_audit after update on public.platform_environment
  for each row execute function public.platform_environment_audit();

-- ---------------------------------------------------------------------------
-- Verification: no client role can write the four tables; nobody but the owner can write the posture; the posture's
-- change is audited from and to, and a save that changes nothing writes nothing.
-- ---------------------------------------------------------------------------
do $$
declare t text; r text; p text; n int; v_before bigint;
begin
  foreach t in array array['learning_assignments','assessment_assignments','institutions','classes'] loop
    foreach r in array array['anon','authenticated'] loop
      foreach p in array array['insert','update','delete'] loop
        if has_table_privilege(r, 'public.' || t, p) then
          raise exception 'D-093 T1: % still holds % on public.%', r, upper(p), t;
        end if;
      end loop;
    end loop;
    if not has_table_privilege('authenticated', 'public.' || t, 'select') then
      raise exception 'D-093 T1: authenticated lost SELECT on public.%: reads were not to change', t;
    end if;
  end loop;
  foreach r in array array['anon','authenticated','service_role'] loop
    foreach p in array array['insert','update','delete','truncate'] loop
      if has_table_privilege(r, 'public.platform_environment', p) then
        raise exception 'D-093 T1: % still holds % on public.platform_environment', r, upper(p);
      end if;
    end loop;
  end loop;

  select coalesce(max(id), 0) into v_before from public.audit_log;
  begin
    update public.platform_environment set environment = environment;   -- nothing changes: nothing recorded
    select count(*) into n from public.audit_log where id > v_before and action = 'platform_environment.changed';
    if n <> 0 then raise exception 'D-093 T1: an unchanged posture was recorded as a change'; end if;
    update public.platform_environment
       set environment = case when environment = 'production' then 'staging' else 'production' end;
    select count(*) into n from public.audit_log
     where id > v_before and action = 'platform_environment.changed'
       and summary ? 'from' and summary ? 'to' and summary ->> 'database_role' is not null
       and summary -> 'from' ->> 'environment' is distinct from summary -> 'to' ->> 'environment';
    if n <> 1 then raise exception 'D-093 T1: the posture change was recorded % time(s), expected once with from and to', n; end if;
    raise exception 'D093_ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'D093_ROLLBACK_PROBE' then raise; end if;
  end;
end $$;
