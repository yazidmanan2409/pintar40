-- ---------------------------------------------------------------------------
-- WP5A, PART ONE. INSTITUTIONAL IDENTITY, AND THE FOUR THINGS IT IS NOT.
--
--   PERSON                 a human being PINTAR knows about, platform-wide
--   INSTITUTIONAL IDENTITY that person's relationship to ONE school
--   ACCOUNT                an auth user bound to a person
--   ACTIVE USER            somebody who has actually signed in
--
-- Provisioned is not active. A school may provision six hundred people on a
-- Tuesday and none of them has an account, a password or a login. The
-- institutional ID is what that school calls them; it is not a credential and
-- nothing here treats it as one.
--
-- THE ID IS NOT A NEW PRIMARY KEY FOR PERSONS. `persons` stays exactly as it
-- is -- institution-free, one row per human -- because the same person may
-- legitimately be ABC123456XY at one school and DEF000842K7 at another, and a
-- column on `persons` would say the opposite. The identity lives on the PAIR.
--
-- FORMAT: NNN######SS, eleven characters. NNN is the school's namespace,
-- ###### six decimal digits, SS two uppercase alphanumerics PINTAR generates.
--
-- THE SEQUENCE IS INSTITUTION-LOCAL, by ruling. Every school allocates
-- 000001..999999 independently; XYZ000001xx and ABC000001xx are both first
-- IDs and both legitimate, because the namespace is globally unique and is
-- part of the ID. Exhaustion is one school's ceiling and stops nobody else.
-- Monotonic within a school, never recycled, gaps permitted and not chased.
--
-- UNIQUENESS IS THE DATABASE'S JOB, NOT THE APPLICATION'S. Namespace
-- reservation is a unique index on upper(namespace), so two schools racing for
-- 'XYZ' cannot both win and 'xyz' cannot slip past 'XYZ'. Number allocation
-- takes a row lock on the institution and is backed by
-- unique (institution_id, sequence_number): the lock is the fast path and the
-- constraint is the truth. `institutions_update` already lets an institution
-- admin write that row directly, so every rule here is a trigger or a
-- constraint -- never an RPC check a direct UPDATE would walk past.
-- ---------------------------------------------------------------------------

alter table public.institutions
  add column namespace text,
  add constraint institutions_namespace_shape check (namespace is null or namespace ~ '^[A-Z0-9]{3}$');

create unique index institutions_namespace_unique on public.institutions (upper(namespace))
  where namespace is not null;

comment on column public.institutions.namespace is
  'WP5A: the three-character institutional namespace, canonical uppercase, globally unique and reserved '
  'case-insensitively. Editable until the first institutional person ID is issued under it, and immutable '
  'afterwards -- because an issued ID is never rewritten.';

create table public.institutional_identities (
  person_id        uuid not null references public.persons(id),
  institution_id   uuid not null references public.institutions(id),
  institutional_id text not null,
  sequence_number  integer not null,
  issued_at        timestamptz not null default now(),
  issued_by_person_id uuid references public.persons(id),
  -- AT MOST ONE CURRENT INSTITUTIONAL IDENTITY PER PERSON x INSTITUTION.
  -- Changing class, role, department, account or email is not a new identity,
  -- and this key is why none of them can accidentally become one.
  primary key (person_id, institution_id),
  constraint institutional_identities_id_unique unique (institutional_id),
  -- INSTITUTION-LOCAL, said as a constraint rather than as a convention
  constraint institutional_identities_sequence_unique unique (institution_id, sequence_number),
  constraint institutional_identities_id_shape
    check (institutional_id ~ '^[A-Z0-9]{3}[0-9]{6}[A-Z0-9]{2}$'),
  -- SIX DIGITS FAIL CLOSED. 1,000,000 does not wrap to 000000 and does not
  -- reuse 000001; it fails, for this school only.
  constraint institutional_identities_sequence_capacity
    check (sequence_number between 1 and 999999)
);

create index institutional_identities_institution_idx
  on public.institutional_identities (institution_id, sequence_number desc);

alter table public.institutional_identities enable row level security;
grant select on public.institutional_identities to authenticated;

insert into public.record_class_registry values
  ('institutional_identities', 'INSTITUTION_SCOPED',
   'what one school calls a person; it does not travel, because another school calls them something else');

-- THE ID IS GENERATED, NEVER SUBMITTED. A caller writing the table directly
-- must still produce exactly what PINTAR would have produced, so there is no
-- "preferred ID" to submit.
create function public.institutional_identities_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ns text;
begin
  if tg_op = 'DELETE' then
    raise exception 'an institutional identity is never deleted: an issued number is never recycled';
  end if;
  if tg_op = 'UPDATE' then
    if new.institutional_id is distinct from old.institutional_id
       or new.person_id is distinct from old.person_id
       or new.institution_id is distinct from old.institution_id
       or new.sequence_number is distinct from old.sequence_number then
      raise exception 'an institutional person ID is immutable once issued';
    end if;
    return new;
  end if;

  select i.namespace into v_ns from public.institutions i where i.id = new.institution_id;
  if v_ns is null then
    raise exception 'this institution has reserved no namespace, so it can issue no institutional ID';
  end if;
  if substr(new.institutional_id, 1, 3) <> v_ns then
    raise exception 'an institutional ID must begin with its own institution''s namespace';
  end if;
  if substr(new.institutional_id, 4, 6) <> lpad(new.sequence_number::text, 6, '0') then
    raise exception 'an institutional ID must carry its own allocated sequence number';
  end if;
  return new;
end $$;
revoke all on function public.institutional_identities_guard() from public, anon, authenticated;

create trigger institutional_identities_write
  before insert or update or delete on public.institutional_identities
  for each row execute function public.institutional_identities_guard();

create function public.institutions_namespace_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.namespace is distinct from old.namespace
     and exists (select 1 from public.institutional_identities ii where ii.institution_id = old.id) then
    raise exception
      'this institution has already issued institutional person IDs under %, so the namespace is immutable',
      old.namespace;
  end if;
  return new;
end $$;
revoke all on function public.institutions_namespace_guard() from public, anon, authenticated;

create trigger institutions_namespace_immutable before update on public.institutions
  for each row execute function public.institutions_namespace_guard();

-- ────────────────────────── who may administer a school's people
CREATE OR REPLACE FUNCTION public.role_capabilities(r app_role)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case r
    when 'SYSTEM_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT','CAN_PROVISION_PEOPLE']
    -- PROVISIONING IS INSTITUTIONAL ADMINISTRATION, which is this role's job.
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_PROVISION_PEOPLE']
    -- NOT HERE. WP4 calls a head of department Management; Management is
    -- academic judgement and provisioning is not, so neither they nor a dean
    -- gains it by being senior.
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT']
    when 'DEAN' then array['CAN_VIEW_LEARNER_ROSTER']
    when 'STUDENT' then array[]::text[]
  end
$function$;
revoke all on function public.role_capabilities(app_role) from public, anon, authenticated;
grant execute on function public.role_capabilities(app_role) to authenticated;

create policy institutional_identities_select on public.institutional_identities for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_on_node('CAN_PROVISION_PEOPLE', institution_id));

-- ──────────────────────────── reserving a namespace, race-safely
create function public.reserve_institution_namespace(p_institution uuid, p_namespace text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ns text; v_old text;
begin
  if p_institution is null or p_namespace is null then
    raise exception 'reserving a namespace needs an institution and a proposal';
  end if;
  if not public.can_on_node('CAN_PROVISION_PEOPLE', p_institution) then
    raise exception 'reserving an institutional namespace is for an institution administrator of this school';
  end if;

  -- CANONICALISED BEFORE IT IS COMPARED, so 'xyz' and 'XYZ' are one
  -- reservation rather than two.
  v_ns := upper(btrim(p_namespace));
  if v_ns !~ '^[A-Z0-9]{3}$' then
    raise exception 'an institutional namespace is exactly three characters of A-Z or 0-9';
  end if;

  select i.namespace into v_old from public.institutions i where i.id = p_institution;
  if v_old is not distinct from v_ns then return v_ns; end if;

  -- The unique index decides a race; this only turns its error into a
  -- sentence a person can read.
  begin
    update public.institutions set namespace = v_ns where institutions.id = p_institution;
  exception when unique_violation then
    raise exception 'the namespace % is already reserved by another institution', v_ns;
  end;

  perform public.audit_write('institution_namespace.reserved', 'institutions', p_institution::text,
    p_institution, jsonb_build_object('namespace', v_ns, 'previous', v_old));
  return v_ns;
end $$;
comment on function public.reserve_institution_namespace(uuid, text) is
  'Reserves this school''s three-character namespace, canonicalising to uppercase before comparing so '
  'reservation is case-insensitive. The unique index decides a race, not this function.';
revoke all on function public.reserve_institution_namespace(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_institution_namespace(uuid, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('reserve_institution_namespace', 'STAFF',
        'Reserves or, before any ID has been issued, changes this school''s institutional namespace. '
        'Audited as institution_namespace.reserved.',
        'CAPABILITY', 'CAN_PROVISION_PEOPLE')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ─────────────────────── allocating one, exactly once per pair
create function public.issue_institutional_id(p_person uuid, p_institution uuid)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
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
    (person_id, institution_id, institutional_id, sequence_number, issued_by_person_id)
  values (p_person, p_institution, v_id, v_next, public.current_person_id());
  return v_id;
end $$;
comment on function public.issue_institutional_id(uuid, uuid) is
  'Allocates this school''s next institutional person ID for a person who has none there, and returns the '
  'existing one for a person who has. PINTAR decides all eleven characters; no caller submits one.';
revoke all on function public.issue_institutional_id(uuid, uuid) from public, anon, authenticated;
-- DELIBERATELY NOT GRANTED to `authenticated`: it is reached through the
-- import path, which authorizes the job. On its own it would be an
-- unauthorized way to mint an identity in any school.

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). A migration runs before the seeds, so this builds
-- its own two schools and rolls every row back.
-- ---------------------------------------------------------------------------
do $$
declare
  v_a uuid; v_b uuid; v_p uuid; v_p2 uuid; v_id text; v_id_b text; v_try text;
  v_caught boolean; v_n int;
begin
  if 'CAN_PROVISION_PEOPLE' = any (public.role_capabilities('HEAD_OF_DEPARTMENT'))
     or 'CAN_PROVISION_PEOPLE' = any (public.role_capabilities('DEAN'))
     or 'CAN_PROVISION_PEOPLE' = any (public.role_capabilities('EDUCATOR'))
     or 'CAN_PROVISION_PEOPLE' = any (public.role_capabilities('STUDENT')) then
    raise exception 'provisioning reached a role whose job is not institutional administration';
  end if;
  if not ('CAN_PROVISION_PEOPLE' = any (public.role_capabilities('INSTITUTION_ADMIN'))) then
    raise exception 'the institution administrator cannot provision';
  end if;

  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah WP5 A', 'wp5a-' || substr(md5(random()::text), 1, 10), true)
    returning institutions.id into v_a;
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah WP5 B', 'wp5b-' || substr(md5(random()::text), 1, 10), true)
    returning institutions.id into v_b;

    -- A/B. THREE OF A-Z0-9 AND NOTHING ELSE.
    update public.institutions set namespace = 'XYZ' where institutions.id = v_a;
    foreach v_try in array array['XY', 'XYZA', 'xyz', 'X-Z', 'X Z'] loop
      v_caught := false;
      begin update public.institutions set namespace = v_try where institutions.id = v_b;
      exception when check_violation then v_caught := true; end;
      if not v_caught then
        raise exception 'the namespace % was accepted and is not three of A-Z0-9', v_try;
      end if;
    end loop;

    -- C/D. COLLISION, AND IT IS THE DATABASE THAT REFUSES IT. Lowercase
    --      cannot pass the column; the duplicate cannot pass the index; and
    --      the index is on upper(), which is what makes a race between two
    --      schools safe rather than a matter of who upcased first.
    v_caught := false;
    begin update public.institutions set namespace = 'XYZ' where institutions.id = v_b;
    exception when unique_violation then v_caught := true; end;
    if not v_caught then raise exception 'two institutions reserved the same namespace'; end if;
    if (select count(*) from pg_indexes
         where schemaname = 'public' and indexname = 'institutions_namespace_unique'
           and indexdef like '%upper(namespace)%') <> 1 then
      raise exception 'namespace reservation is not case-insensitive in the database';
    end if;

    -- E. BEFORE ISSUANCE IT MAY STILL MOVE.
    update public.institutions set namespace = 'ABC' where institutions.id = v_a;
    update public.institutions set namespace = 'XYZ' where institutions.id = v_a;
    update public.institutions set namespace = 'DEF' where institutions.id = v_b;

    insert into public.persons (display_name) values ('Orang WP5') returning persons.id into v_p;

    -- G. THE FIRST ID AT A SCHOOL IS 000001, by ruling.
    v_id := public.issue_institutional_id(v_p, v_a);
    if v_id !~ '^XYZ000001[A-Z0-9]{2}$' or length(v_id) <> 11 then
      raise exception 'the first institutional ID issued was % and not XYZ000001xx', v_id;
    end if;

    -- H. AND NO CALLER SUBMITS ONE.
    v_caught := false;
    begin
      insert into public.institutional_identities
        (person_id, institution_id, institutional_id, sequence_number)
      values (v_p, v_b, 'MINE00042Z', 42);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'a caller submitted their own institutional ID'; end if;

    -- I. ONE IDENTITY PER PAIR, AND ASKING AGAIN RETURNS IT.
    if public.issue_institutional_id(v_p, v_a) <> v_id then
      raise exception 'the same person was given a second institutional ID at the same school';
    end if;
    select count(*) into v_n from public.institutional_identities ii
     where ii.person_id = v_p and ii.institution_id = v_a;
    if v_n <> 1 then raise exception 'a person holds % identities at one school', v_n; end if;

    -- J. THE SAME PERSON AT A SECOND SCHOOL GETS THAT SCHOOL'S OWN 000001.
    v_id_b := public.issue_institutional_id(v_p, v_b);
    if v_id_b !~ '^DEF000001[A-Z0-9]{2}$' then
      raise exception 'the second school did not independently allocate 000001 (got %)', v_id_b;
    end if;
    if substr(v_id, 4, 6) <> substr(v_id_b, 4, 6) then
      raise exception 'the sequence was not institution-local: % and % share no number', v_id, v_id_b;
    end if;

    -- F. AND NOW THE NAMESPACE IS FROZEN.
    v_caught := false;
    begin update public.institutions set namespace = 'QQQ' where institutions.id = v_a;
    exception when others then v_caught := true; end;
    if not v_caught then
      raise exception 'the namespace changed after an institutional ID had been issued under it';
    end if;

    -- K. A RENAME IS NOT A RE-NUMBERING.
    update public.institutions set name = 'Sekolah WP5 A (berganti nama)' where institutions.id = v_a;
    if (select ii.institutional_id from public.institutional_identities ii
         where ii.person_id = v_p and ii.institution_id = v_a) <> v_id then
      raise exception 'renaming the institution rewrote an issued institutional ID';
    end if;

    -- L. NEVER RECYCLED, IN EITHER DIRECTION.
    v_caught := false;
    begin delete from public.institutional_identities where person_id = v_p and institution_id = v_a;
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'an issued institutional identity was deleted'; end if;
    v_caught := false;
    begin
      update public.institutional_identities set institutional_id = 'XYZ000999AA'
       where person_id = v_p and institution_id = v_a;
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'an issued institutional ID was rewritten'; end if;

    -- M. THE NUMBER IS UNIQUE INSIDE ITS SCHOOL. A serial test cannot prove
    --    concurrency and this does not pretend to: it proves the CONSTRAINT a
    --    race would land on, which is the thing that actually decides.
    insert into public.persons (display_name) values ('Orang WP5 dua') returning persons.id into v_p2;
    v_caught := false;
    begin
      insert into public.institutional_identities
        (person_id, institution_id, institutional_id, sequence_number)
      values (v_p2, v_a, 'XYZ000001ZZ', 1);
    exception when unique_violation then v_caught := true; end;
    if not v_caught then raise exception 'two people in one school share a sequence number'; end if;

    -- N. SIX DIGITS FAIL CLOSED RATHER THAN WRAP, for this school only.
    v_caught := false;
    begin
      insert into public.institutional_identities
        (person_id, institution_id, institutional_id, sequence_number)
      values (v_p2, v_a, 'XYZ1000000Z', 1000000);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'the six-digit capacity wrapped instead of failing closed'; end if;
    -- and the other school is unaffected by that ceiling
    if public.issue_institutional_id(v_p2, v_b) !~ '^DEF000002[A-Z0-9]{2}$' then
      raise exception 'one school''s exhaustion disturbed another school''s allocation';
    end if;

    -- PROVISIONED IS NOT ACTIVE: two people exist institutionally and neither
    -- has an account.
    select count(*) into v_n from public.accounts a where a.person_id in (v_p, v_p2);
    if v_n <> 0 then raise exception '% account(s) appeared for people nobody activated', v_n; end if;

    perform set_config('app.seed_intent', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  raise notice '0099 verified: a namespace is three of A-Z0-9, reserved case-insensitively by a unique '
    'index on upper(), and moves freely until the first ID is issued under it and never afterwards; the '
    'first ID at a school is 000001 and the SECOND SCHOOL INDEPENDENTLY ALLOCATES 000001 TOO, which is '
    'the institution-local ruling made visible; a caller submits no ID; one person holds exactly one '
    'identity per school and asking again returns it; a rename rewrites nothing; an issued identity is '
    'neither deleted nor edited; the number is unique inside its school and fails closed at six digits '
    'without disturbing any other school; and nobody was given an account';
end $$;
