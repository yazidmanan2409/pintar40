-- 0053 -- release_distributions: the governed grant that lets a school teach
-- canonical content.
--
-- WHAT A GRANT IS. It is an exposure decision, recorded as a row, with an actor
-- and a reason. It is not a convenience join and not a visibility flag. The
-- unit is (canonical release, consuming institution): PINTAR publishes a
-- release once and then decides, per school, whether that school may teach it.
--
-- WHAT IT IS NOT. It is not institution-to-institution sharing. School B can
-- never distribute to School C, and nothing here makes that expressible: the
-- grant refuses any release whose owner is not a PLATFORM_CANONICAL tenant, so
-- there is no shape of row that means "B lent this to C" (OD-4 stays LATER).
--
-- WITHDRAWAL IS INV-27, NOT INV-17. Withdrawing a grant refuses NEW sessions
-- from the next attempt. It does not interrupt a learner who has legitimately
-- started, exactly as an assignment window closing does not. INV-17 governs
-- authorization that has been revoked from a PERSON; a distribution withdrawal
-- is a content-supply decision between two institutions, and a learner
-- mid-attempt is neither party to it nor at fault. Completed evidence, results
-- and certificates are untouched permanently, and the row is never deleted --
-- an audit trail of what a school was authorized to teach, and when, is the
-- whole point (INV-18). ADR-0015.
--
-- APPEND-ONLY IN THE HONEST SENSE. Rows are never deleted, and the only field
-- that ever changes is the transition ACTIVE -> WITHDRAWN together with its
-- actor, time and reason. Re-granting after a withdrawal writes a NEW row, so
-- the history reads as a sequence of decisions rather than a mutable flag.

create type public.distribution_status as enum ('ACTIVE', 'WITHDRAWN');

create table public.release_distributions (
  id                      uuid primary key default gen_random_uuid(),
  plp_release_id          uuid not null references public.plp_releases(id),
  institution_id          uuid not null references public.institutions(id),
  status                  public.distribution_status not null default 'ACTIVE',
  authorized_by_person_id uuid not null references public.persons(id),
  authorized_at           timestamptz not null default now(),
  withdrawn_by_person_id  uuid references public.persons(id),
  withdrawn_at            timestamptz,
  reason                  text,
  created_at              timestamptz not null default now(),
  constraint release_distributions_withdrawal_is_coherent
    check ((status = 'WITHDRAWN') = (withdrawn_at is not null)
       and (withdrawn_at is null) = (withdrawn_by_person_id is null))
);

-- One live grant per (release, school). A withdrawn row does not block a new
-- one, which is how re-granting produces a second row rather than a resurrection.
create unique index release_distributions_one_active
  on public.release_distributions (plp_release_id, institution_id)
  where status = 'ACTIVE';

create index release_distributions_by_institution
  on public.release_distributions (institution_id, status);

comment on table public.release_distributions is
  'Append-only record of which institution is authorized to teach which canonical '
  'PLP release. Only PLATFORM_CANONICAL-owned, only PUBLISHED releases. Withdrawal '
  'refuses new sessions (INV-27) and never interrupts a started one. ADR-0015.';

insert into public.record_class_registry (table_name, portability, note) values
  ('release_distributions', 'INSTITUTION_SCOPED',
   'Names the consuming institution, so it moves with neither party: it is a decision '
   'about one school, not a record belonging to a learner. The canonical content it '
   'points at belongs to no institution at all -- see the tenant_kind notes on the '
   'content tables (ADR-0015).');

-- ---------------------------------------------------------------------------
-- 1. Append-only, enforced.
-- ---------------------------------------------------------------------------
create function public.enforce_release_distribution_append_only() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'release_distributions is append-only; a grant is withdrawn, never deleted (INV-18)';
  end if;
  if new.plp_release_id is distinct from old.plp_release_id
     or new.institution_id is distinct from old.institution_id
     or new.authorized_by_person_id is distinct from old.authorized_by_person_id
     or new.authorized_at is distinct from old.authorized_at
     or new.created_at is distinct from old.created_at then
    raise exception 'a distribution grant''s provenance is immutable after insert (INV-33)';
  end if;
  if old.status = 'WITHDRAWN' then
    raise exception 'a withdrawn grant is final; re-authorizing writes a new grant';
  end if;
  if new.status <> 'WITHDRAWN' then
    raise exception 'the only permitted transition is ACTIVE -> WITHDRAWN';
  end if;
  return new;
end $$;
revoke all on function public.enforce_release_distribution_append_only() from public, anon, authenticated;
create trigger release_distributions_append_only
  before update or delete on public.release_distributions
  for each row execute function public.enforce_release_distribution_append_only();

-- ---------------------------------------------------------------------------
-- 2. RLS: closed to writes entirely (INV-36). Reads are narrow and deliberate.
--
-- The consuming school sees its own grants -- Studio has to be able to say "you
-- may no longer assign this, and here is when that changed" in plain language.
-- The owning canonical tenant's publishers see the grants they issued. Nobody
-- sees a third party's.
-- ---------------------------------------------------------------------------
alter table public.release_distributions enable row level security;
alter table public.release_distributions force row level security;

create policy release_distributions_select on public.release_distributions
  for select to authenticated
  using (
    public.is_member_of_institution(institution_id)
    or exists (select 1 from public.plp_releases r
                where r.id = plp_release_id
                  and public.can_in_institution('CAN_PUBLISH', r.institution_id))
  );

-- No INSERT, UPDATE or DELETE policy exists. Every write goes through the two
-- SECURITY DEFINER functions below, which is where the authority check lives.

-- ---------------------------------------------------------------------------
-- 3. The predicate every relaxation reads.
--
-- ONE definition of "this school may teach this canonical release", so a future
-- change has one place to happen. It is deliberately conjunctive: canonical
-- ownership AND an active grant. Drop either half and the predicate would admit
-- institution-to-institution sharing, which is precisely what it exists to
-- refuse.
-- ---------------------------------------------------------------------------
create function public.release_is_distributed_to(p_release uuid, p_institution uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.plp_releases r
      join public.institutions owner on owner.id = r.institution_id
      join public.release_distributions d
        on d.plp_release_id = r.id and d.institution_id = p_institution
     where r.id = p_release
       and owner.tenant_kind = 'PLATFORM_CANONICAL'
       and d.status = 'ACTIVE'
  )
$$;
revoke all on function public.release_is_distributed_to(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Granting and withdrawing.
-- ---------------------------------------------------------------------------
create function public.grant_release_distribution(
  p_release uuid, p_institution uuid, p_reason text default null)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_actor uuid; v_id uuid; v_target_kind public.tenant_kind;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'a distribution grant requires an authenticated actor'; end if;

  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label, i.tenant_kind
    into r
    from public.plp_releases pr join public.institutions i on i.id = pr.institution_id
   where pr.id = p_release;
  if r.id is null then raise exception 'unknown release %', p_release; end if;

  if r.tenant_kind <> 'PLATFORM_CANONICAL' then
    raise exception
      'only a PLATFORM_CANONICAL tenant''s release is distributable; institution-to-institution content sharing is not a capability of this system (OD-4)';
  end if;
  if r.status <> 'PUBLISHED' then
    raise exception 'distribution is downstream of publication: this release is %, not PUBLISHED', r.status;
  end if;

  select tenant_kind into v_target_kind from public.institutions where id = p_institution;
  if v_target_kind is null then raise exception 'unknown institution %', p_institution; end if;
  if v_target_kind <> 'INSTITUTION' then
    raise exception 'a distribution is granted to a school, not to another content-owning tenant';
  end if;

  -- Authority is a platform act. A consuming institution can never grant itself
  -- a distribution, because it holds no role assignment in the canonical tenant
  -- and is not a system admin.
  if not (public.is_system_admin() or public.can_in_institution('CAN_PUBLISH', r.institution_id)) then
    raise exception
      'authorizing a distribution requires SYSTEM_ADMIN or CAN_PUBLISH in the owning canonical tenant';
  end if;

  if exists (select 1 from public.release_distributions d
              where d.plp_release_id = p_release and d.institution_id = p_institution
                and d.status = 'ACTIVE') then
    raise exception 'this release is already distributed to this institution';
  end if;

  insert into public.release_distributions
    (plp_release_id, institution_id, authorized_by_person_id, reason)
  values (p_release, p_institution, v_actor, p_reason)
  returning id into v_id;

  perform public.audit_write('RELEASE_DISTRIBUTION_GRANTED', 'release_distributions',
    v_id::text, p_institution,
    jsonb_build_object('plp_release_id', p_release, 'course_id', r.course_id,
                       'version_label', r.version_label,
                       'owner_institution_id', r.institution_id, 'reason', p_reason));
  return v_id;
end $$;
revoke all on function public.grant_release_distribution(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.grant_release_distribution(uuid, uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('grant_release_distribution', 'PLATFORM',
   'Authorizes one institution to teach one canonical PUBLISHED release. SYSTEM_ADMIN or '
   'CAN_PUBLISH in the owning canonical tenant; a consuming school can never reach it. Audited.');

create function public.withdraw_release_distribution(p_distribution uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare d record; v_actor uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'a withdrawal requires an authenticated actor'; end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a withdrawal records why; the reason is not optional';
  end if;

  select rd.id, rd.status, rd.institution_id, rd.plp_release_id, pr.institution_id as owner_id
    into d
    from public.release_distributions rd
    join public.plp_releases pr on pr.id = rd.plp_release_id
   where rd.id = p_distribution;
  if d.id is null then raise exception 'unknown distribution %', p_distribution; end if;
  if d.status <> 'ACTIVE' then raise exception 'this distribution is already %', d.status; end if;

  if not (public.is_system_admin() or public.can_in_institution('CAN_PUBLISH', d.owner_id)) then
    raise exception
      'withdrawing a distribution requires SYSTEM_ADMIN or CAN_PUBLISH in the owning canonical tenant';
  end if;

  update public.release_distributions
     set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = v_actor,
         reason = p_reason
   where id = p_distribution;

  -- INV-27, not INV-17: nothing here touches a session, a result or a
  -- certificate, and no started attempt is interrupted.
  perform public.audit_write('RELEASE_DISTRIBUTION_WITHDRAWN', 'release_distributions',
    p_distribution::text, d.institution_id,
    jsonb_build_object('plp_release_id', d.plp_release_id,
                       'owner_institution_id', d.owner_id, 'reason', p_reason,
                       'started_sessions_untouched', true));
  return p_distribution;
end $$;
revoke all on function public.withdraw_release_distribution(uuid, text) from public, anon, authenticated;
grant execute on function public.withdraw_release_distribution(uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('withdraw_release_distribution', 'PLATFORM',
   'Ends a school''s authorization to start new sessions against a canonical release. '
   'INV-27 semantics: started attempts continue, evidence is untouched, the row is kept.');

-- ---------------------------------------------------------------------------
-- Terminal verification. Builds its own probe data and rolls it back (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_canon uuid; v_school uuid; v_course uuid; v_rel uuid; v_person uuid;
  v_dist uuid; n int; v_raised boolean; v_screl uuid; v_sccourse uuid; v_uid uuid;
begin
  select id into v_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then raise exception 'no canonical tenant to probe with'; end if;

  begin
    -- A synthetic school, a canonical course and a canonical release. Content
    -- rows are created at INGESTED (INV-22) and reaching PUBLISHED needs
    -- CAN_PUBLISH held by a real person, which a migration has no way to be --
    -- so the probes below are the ones reachable without impersonation, and
    -- F05-T05..T09 carry the authorized paths against seeded actors.
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe school 0053', 'probe-school-0053', true, true) returning id into v_school;

    -- An actor the authority checks can actually see. Without this every probe
    -- below would stop at "a distribution grant requires an authenticated
    -- actor" and prove nothing about the checks that follow it. The person and
    -- account come from the ordinary sign-up path (handle_new_auth_user), not
    -- from a hand-built row, so the probe exercises the shape the system
    -- actually produces.
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0053@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    if v_person is null then raise exception 'the probe actor has no person'; end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    if public.current_person_id() is distinct from v_person then
      raise exception 'the probe actor did not resolve; the authority probes below would be vacuous';
    end if;

    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
    values (v_canon, 'Matematika', 'SMA', 'X', 'probe canonical course 0053', 'INGESTED', v_person)
    returning id into v_course;

    insert into public.plp_releases (institution_id, course_id, version_label, status, author_person_id)
    values (v_canon, v_course, '1.0.0', 'INGESTED', v_person) returning id into v_rel;

    -- the predicate is false before any grant exists
    if public.release_is_distributed_to(v_rel, v_school) then
      raise exception 'an undistributed canonical release reads as distributed';
    end if;

    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_rel, v_school, v_person, 'probe') returning id into v_dist;

    if not public.release_is_distributed_to(v_rel, v_school) then
      raise exception 'an active grant does not read as distributed';
    end if;

    -- a second institution is NOT admitted by the first school's grant
    if public.release_is_distributed_to(v_rel, v_canon) then
      raise exception 'the predicate admits an institution with no grant';
    end if;

    -- A SCHOOL-owned release is never distributable, whatever rows exist. This
    -- is the institution-to-institution refusal, proven by building the row
    -- that would express it and showing the predicate still says no.
    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
    values (v_school, 'Matematika', 'SMA', 'X', 'probe school course 0053', 'INGESTED', v_person)
    returning id into v_sccourse;
    insert into public.plp_releases (institution_id, course_id, version_label, status, author_person_id)
    values (v_school, v_sccourse, '1.0.0', 'INGESTED', v_person) returning id into v_screl;
    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_screl, v_canon, v_person, 'probe');
    if public.release_is_distributed_to(v_screl, v_canon) then
      raise exception
        'the predicate admitted a school-owned release: institution-to-institution sharing is reachable';
    end if;

    -- and the granting function refuses it by name, before any authority check
    v_raised := false;
    begin
      perform public.grant_release_distribution(v_screl, v_canon, 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'grant_release_distribution accepted a school-owned release';
      end if;
      if sqlerrm !~ 'PLATFORM_CANONICAL' then
        raise exception 'a school-owned release was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the school-owned-release probe did not run'; end if;

    -- distribution is downstream of publication
    v_raised := false;
    begin
      perform public.grant_release_distribution(v_rel, v_school, 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'grant_release_distribution accepted an unpublished release';
      end if;
      if sqlerrm !~ 'PUBLISHED' then
        raise exception 'an unpublished release was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the unpublished-release probe did not run'; end if;

    -- a distribution is granted to a school, never to another content owner
    v_raised := false;
    begin
      perform public.grant_release_distribution(v_rel, v_canon, 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'grant_release_distribution accepted a canonical tenant as the consumer';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the canonical-consumer probe did not run'; end if;

    -- provenance is immutable
    v_raised := false;
    begin
      update public.release_distributions set institution_id = v_canon where id = v_dist;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a grant could be re-pointed at another institution (INV-33)';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the provenance probe did not run'; end if;

    -- withdrawal ends the authorization and keeps the row
    update public.release_distributions
       set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = v_person
     where id = v_dist;
    if public.release_is_distributed_to(v_rel, v_school) then
      raise exception 'a withdrawn grant still reads as distributed';
    end if;
    select count(*) into n from public.release_distributions where id = v_dist;
    if n <> 1 then raise exception 'withdrawal removed the row; it must be kept (INV-18)'; end if;

    -- the withdrawn row is final
    v_raised := false;
    begin
      update public.release_distributions set status = 'ACTIVE' where id = v_dist;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a withdrawn grant could be reactivated in place';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the reactivation probe did not run'; end if;

    -- and no row is ever deleted
    v_raised := false;
    begin
      delete from public.release_distributions where id = v_dist;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a distribution grant could be deleted (INV-18)';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the delete probe did not run'; end if;

    -- re-granting after a withdrawal writes a SECOND row rather than
    -- resurrecting the first
    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_rel, v_school, v_person, 'probe re-grant');
    select count(*) into n from public.release_distributions
     where plp_release_id = v_rel and institution_id = v_school;
    if n <> 2 then raise exception 're-granting did not produce a second row (%)', n; end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  -- nothing the probe built survives
  select count(*) into n from public.release_distributions;
  if n <> 0 then raise exception 'the probe left % distribution row(s) behind', n; end if;
  select count(*) into n from public.institutions where slug = 'probe-school-0053';
  if n <> 0 then raise exception 'the probe left its school behind'; end if;

  -- structural: the table is closed to client writes
  select count(*) into n from pg_policies
   where schemaname = 'public' and tablename = 'release_distributions' and cmd <> 'SELECT';
  if n <> 0 then raise exception 'release_distributions has % client write policy/policies', n; end if;
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = 'release_distributions'
     and c.relrowsecurity and c.relforcerowsecurity;
  if n <> 1 then raise exception 'release_distributions does not have RLS forced (INV-36)'; end if;

  -- both write functions are classified in the same breath as their grant
  select count(*) into n from public.client_rpc_registry
   where function_name in ('grant_release_distribution', 'withdraw_release_distribution')
     and exposure = 'PLATFORM';
  if n <> 2 then raise exception 'the distribution RPCs are not both classified PLATFORM (%)', n; end if;

  -- and the predicate itself is reachable by no client role
  if has_function_privilege('authenticated', 'public.release_is_distributed_to(uuid,uuid)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.release_is_distributed_to(uuid,uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'the distribution predicate is directly executable by a client role';
  end if;

  raise notice '0053 verified: canonical-only distribution, append-only, withdrawal keeps the row';
end $$;
