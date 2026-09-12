-- 0003 — Identity: Person (platform-wide), Account, Institution Enrollment,
-- Class/Cohort Membership — dated, append-only (INV-23).
-- Architecture: doc 02 "Identity, enrollment and authorization"; doc 04 §3a–3b.

create type public.account_kind as enum ('EMAIL','CLASSROOM_CARD');
create type public.enrollment_status as enum ('PENDING','ACTIVE','ENDED','CANCELLED');
create type public.enrollment_end_reason as enum ('COMPLETED','TRANSFERRED_OUT','WITHDRAWN','EXPIRED');
create type public.membership_close_reason as enum ('PERIOD_ROLLOVER','MOVED','ENROLLMENT_ENDED');

-- Person: one human, platform-wide, never owned by an institution.
-- No institution_id, no class_id, no cohort_id — by design (INV-23).
create table public.persons (
  id            uuid primary key default gen_random_uuid(),
  display_name  text not null check (length(display_name) between 1 and 200),
  photo_path    text,            -- storage path in the private bucket; never a URL
  anonymized_at timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.persons enable row level security;
create function public.persons_no_delete() returns trigger language plpgsql as $$
begin raise exception 'persons are anonymized, never deleted (doc 06)'; end $$;
create trigger persons_no_delete before delete on public.persons
  for each row execute function public.persons_no_delete();

-- Account: login credential set attached to exactly one Person.
create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references public.persons(id),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  kind          public.account_kind not null,
  card_number   text unique,
  created_at    timestamptz not null default now(),
  check ((kind = 'CLASSROOM_CARD') = (card_number is not null))
);
create index accounts_person_idx on public.accounts (person_id);
alter table public.accounts enable row level security;

-- Institution Enrollment: dated, append-only (doc 04 §3a).
create table public.enrollments (
  id                 uuid primary key default gen_random_uuid(),
  person_id          uuid not null references public.persons(id),
  institution_id     uuid not null references public.institutions(id),
  academic_period_id uuid not null references public.academic_periods(id),
  programme_id       uuid references public.org_nodes(id),
  status             public.enrollment_status not null default 'PENDING',
  end_reason         public.enrollment_end_reason,
  valid_from         timestamptz not null default now(),
  valid_to           timestamptz,
  created_at         timestamptz not null default now(),
  check ((status = 'ENDED') = (end_reason is not null)),
  check ((status in ('ENDED','CANCELLED')) = (valid_to is not null))
);
create index enrollments_person_idx on public.enrollments (person_id);
create index enrollments_institution_idx on public.enrollments (institution_id, status);
alter table public.enrollments enable row level security;

create function public.enrollments_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'enrollments are append-only (INV-23)'; end if;
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.academic_periods ap where ap.id = new.academic_period_id and ap.institution_id = new.institution_id) then
      raise exception 'academic period belongs to another institution';
    end if;
    if new.programme_id is not null and not exists (
      select 1 from public.org_nodes n where n.id = new.programme_id and n.kind = 'PROGRAMME' and n.institution_id = new.institution_id) then
      raise exception 'programme_id must be a PROGRAMME node of the same institution';
    end if;
    if new.status not in ('PENDING','ACTIVE') then raise exception 'new enrollment must be PENDING or ACTIVE'; end if;
    return new;
  end if;
  -- UPDATE: identity columns immutable; only lifecycle transitions allowed.
  if new.person_id <> old.person_id or new.institution_id <> old.institution_id
     or new.academic_period_id <> old.academic_period_id or new.valid_from <> old.valid_from then
    raise exception 'enrollment identity columns are immutable';
  end if;
  if new.status <> old.status then
    if not ((old.status='PENDING' and new.status in ('ACTIVE','CANCELLED'))
         or (old.status='ACTIVE' and new.status='ENDED')) then
      raise exception 'invalid enrollment transition % → %', old.status, new.status;
    end if;
    if new.status in ('ENDED','CANCELLED') and new.valid_to is null then new.valid_to := now(); end if;
  elsif old.status in ('ENDED','CANCELLED') then
    raise exception 'a closed enrollment is immutable';
  end if;
  return new;
end $$;
create trigger enrollments_guard before insert or update or delete on public.enrollments
  for each row execute function public.enrollments_guard();

-- Class / Cohort Membership: dated, append-only. A period rollover closes
-- memberships and creates new ones; it never updates node_id in place.
create table public.memberships (
  id                 uuid primary key default gen_random_uuid(),
  enrollment_id      uuid not null references public.enrollments(id),
  node_id            uuid not null references public.org_nodes(id),
  academic_period_id uuid not null references public.academic_periods(id),
  valid_from         timestamptz not null default now(),
  valid_to           timestamptz,
  close_reason       public.membership_close_reason,
  created_at         timestamptz not null default now(),
  check ((valid_to is null) = (close_reason is null)),
  check (valid_to is null or valid_to >= valid_from)
);
create index memberships_enrollment_idx on public.memberships (enrollment_id);
create index memberships_node_idx on public.memberships (node_id, valid_to);
alter table public.memberships enable row level security;

create function public.memberships_guard() returns trigger
language plpgsql as $$
declare v_kind public.org_kind; v_node_inst uuid; v_node_period uuid; v_enr_inst uuid;
begin
  if tg_op = 'DELETE' then raise exception 'memberships are append-only (INV-23)'; end if;
  if tg_op = 'INSERT' then
    select kind, institution_id, academic_period_id into v_kind, v_node_inst, v_node_period
      from public.org_nodes where id = new.node_id;
    if v_kind not in ('COHORT','CLASS') then raise exception 'membership node must be a COHORT or CLASS'; end if;
    if v_node_period <> new.academic_period_id then raise exception 'membership period must match the node''s period'; end if;
    select institution_id into v_enr_inst from public.enrollments where id = new.enrollment_id;
    if v_enr_inst <> v_node_inst then raise exception 'membership node belongs to another institution (INV-13)'; end if;
    if new.valid_to is not null then raise exception 'a new membership is open'; end if;
    return new;
  end if;
  -- UPDATE: only closing is allowed, once.
  if old.valid_to is not null then raise exception 'a closed membership is immutable'; end if;
  if new.enrollment_id <> old.enrollment_id or new.node_id <> old.node_id
     or new.academic_period_id <> old.academic_period_id or new.valid_from <> old.valid_from then
    raise exception 'membership identity columns are immutable; create a new membership (INV-23)';
  end if;
  if new.valid_to is null then raise exception 'the only allowed update is closing (valid_to + close_reason)'; end if;
  return new;
end $$;
create trigger memberships_guard before insert or update or delete on public.memberships
  for each row execute function public.memberships_guard();

-- Audit: every enrollment/membership change is a high-impact action (INV-18).
create function public.enrollment_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.audit_write(
    case when tg_op='INSERT' then 'enrollment.created' else 'enrollment.'||lower(new.status::text) end,
    'enrollments', new.id::text, new.institution_id,
    jsonb_build_object('person_id', new.person_id, 'status', new.status, 'end_reason', new.end_reason));
  return null;
end $$;
create trigger enrollments_audit after insert or update on public.enrollments
  for each row execute function public.enrollment_audit();

create function public.membership_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  select institution_id into v_inst from public.enrollments where id = new.enrollment_id;
  perform public.audit_write(
    case when tg_op='INSERT' then 'membership.created' else 'membership.closed' end,
    'memberships', new.id::text, v_inst,
    jsonb_build_object('enrollment_id', new.enrollment_id, 'node_id', new.node_id,
                       'academic_period_id', new.academic_period_id, 'close_reason', new.close_reason));
  return null;
end $$;
create trigger memberships_audit after insert or update on public.memberships
  for each row execute function public.membership_audit();

-- Historical question the architecture must always answer:
-- "who was in node X on date D" (doc 02 Membership).
create function public.members_of_node_at(p_node uuid, p_at timestamptz)
returns table (person_id uuid, enrollment_id uuid, membership_id uuid)
language sql stable security invoker set search_path = public, pg_temp as $$
  select e.person_id, e.id, m.id
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
   where m.node_id = p_node
     and m.valid_from <= p_at
     and (m.valid_to is null or m.valid_to > p_at)
$$;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  -- A Person must have no institution/class/cohort column (INV-23, structural).
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='persons'
     and column_name in ('institution_id','class_id','cohort_id','node_id');
  if n > 0 then raise exception 'persons must not carry institution/class columns (INV-23)'; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
end $$;
