-- 0002 — Organisation: institutions, academic periods, the containment
-- hierarchy with an ancestor path ("jalur"), and class lifecycle.
-- Architecture: doc 02 "Organisation"; doc 04 §3; INV-13.

create type public.org_kind as enum
  ('INSTITUTION','FACULTY','DEPARTMENT','PROGRAMME','COHORT','CLASS');
create type public.class_status as enum ('SCHEDULED','ACTIVE','ENDED','CANCELLED');

-- Institutions: top-level tenant. Never deleted, only deactivated.
-- is_synthetic marks harness tenants; every evidence row under them inherits
-- SYNTHETIC (doc 06). retention_days is institution-configurable but has NO
-- default duration (OD-5): null means "not configured, job disabled".
create table public.institutions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  is_synthetic   boolean not null default false,
  is_active      boolean not null default true,
  retention_days integer check (retention_days is null or retention_days > 0),
  created_at     timestamptz not null default now()
);
alter table public.institutions enable row level security;

create function public.institutions_no_delete() returns trigger language plpgsql as $$
begin raise exception 'institutions are deactivated, never deleted (doc 02)'; end $$;
create trigger institutions_no_delete before delete on public.institutions
  for each row execute function public.institutions_no_delete();

-- Academic periods: append-only. A new year is a new row.
create table public.academic_periods (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  name           text not null,
  starts_on      date not null,
  ends_on        date not null check (ends_on > starts_on),
  created_at     timestamptz not null default now(),
  unique (institution_id, name)
);
alter table public.academic_periods enable row level security;
create function public.academic_periods_append_only() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'academic_periods are append-only'; end if;
  if new.starts_on <> old.starts_on or new.ends_on <> old.ends_on or new.institution_id <> old.institution_id then
    raise exception 'academic period dates/institution are immutable; create a new period';
  end if;
  return new;
end $$;
create trigger academic_periods_append_only before update or delete on public.academic_periods
  for each row execute function public.academic_periods_append_only();

-- Hierarchy nodes. The institution's own root node has id = institutions.id.
-- jalur = ancestor path from the root down to and including this node.
create table public.org_nodes (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id),
  parent_id          uuid references public.org_nodes(id),
  kind               public.org_kind not null,
  name               text not null,
  jalur              uuid[] not null default '{}',
  academic_period_id uuid references public.academic_periods(id),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);
create index org_nodes_jalur_gin on public.org_nodes using gin (jalur);
create index org_nodes_parent_idx on public.org_nodes (parent_id);
create index org_nodes_institution_kind_idx on public.org_nodes (institution_id, kind);
alter table public.org_nodes enable row level security;

create function public.org_kind_level(k public.org_kind) returns smallint
language sql immutable parallel safe as $$
  select case k when 'INSTITUTION' then 0 when 'FACULTY' then 1 when 'DEPARTMENT' then 2
    when 'PROGRAMME' then 3 when 'COHORT' then 4 when 'CLASS' then 5 end::smallint
$$;

-- Maintain jalur, enforce the strict containment chain and period rules.
create function public.org_nodes_before_write() returns trigger
language plpgsql as $$
declare p record;
begin
  if new.kind = 'INSTITUTION' then
    if new.parent_id is not null then raise exception 'institution root has no parent'; end if;
    if new.id <> new.institution_id then raise exception 'institution root node id must equal institutions.id'; end if;
    new.jalur := array[new.id];
  else
    if new.parent_id is null then raise exception 'non-root node requires a parent'; end if;
    select * into p from public.org_nodes where id = new.parent_id;
    if p.id is null then raise exception 'parent not found'; end if;
    if p.institution_id <> new.institution_id then raise exception 'parent belongs to another institution (INV-13)'; end if;
    if public.org_kind_level(p.kind) + 1 <> public.org_kind_level(new.kind) then
      raise exception 'invalid containment: % cannot be a child of %', new.kind, p.kind;
    end if;
    new.jalur := p.jalur || new.id;
  end if;
  if new.kind in ('COHORT','CLASS') then
    if new.academic_period_id is null then raise exception '% requires an academic period', new.kind; end if;
    if not exists (select 1 from public.academic_periods ap where ap.id = new.academic_period_id and ap.institution_id = new.institution_id) then
      raise exception 'academic period belongs to another institution';
    end if;
    if new.kind = 'CLASS' and p.academic_period_id <> new.academic_period_id then
      raise exception 'class must share its cohort''s academic period';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.institution_id <> old.institution_id then
    raise exception 'nodes never change institution';
  end if;
  return new;
end $$;
create trigger org_nodes_before_write before insert or update of parent_id, kind, institution_id, academic_period_id
  on public.org_nodes for each row execute function public.org_nodes_before_write();

-- Moving a node cascades the path to its whole subtree (never a stale cache).
create function public.org_nodes_after_move() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.jalur is distinct from new.jalur then
    update public.org_nodes c
       set jalur = new.jalur || c.jalur[array_position(c.jalur, new.id)+1 : array_length(c.jalur,1)]
     where c.jalur @> array[new.id] and c.id <> new.id;
  end if;
  return null;
end $$;
create trigger org_nodes_after_move after update of jalur on public.org_nodes
  for each row execute function public.org_nodes_after_move();

-- Deletion is blocked while anything references the node; deactivate instead.
create function public.org_nodes_no_delete() returns trigger language plpgsql as $$
begin raise exception 'org nodes are deactivated, never deleted (doc 02)'; end $$;
create trigger org_nodes_no_delete before delete on public.org_nodes
  for each row execute function public.org_nodes_no_delete();

-- Creating an institution creates its root node.
create function public.institutions_after_insert() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.org_nodes (id, institution_id, parent_id, kind, name)
  values (new.id, new.id, null, 'INSTITUTION', new.name);
  perform public.audit_write('institution.created', 'institutions', new.id::text, new.id,
                             jsonb_build_object('name', new.name, 'is_synthetic', new.is_synthetic));
  return new;
end $$;
create trigger institutions_after_insert after insert on public.institutions
  for each row execute function public.institutions_after_insert();

-- Class detail (doc 04 §3): lifecycle SCHEDULED → ACTIVE → ENDED, CANCELLED from SCHEDULED only.
create table public.classes (
  node_id    uuid primary key references public.org_nodes(id),
  subject    text not null,
  status     public.class_status not null default 'SCHEDULED',
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;
create function public.classes_transition() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.org_nodes n where n.id = new.node_id and n.kind = 'CLASS') then
      raise exception 'classes.node_id must reference a CLASS node';
    end if;
    return new;
  end if;
  if new.status = old.status then return new; end if;
  if not ((old.status='SCHEDULED' and new.status in ('ACTIVE','CANCELLED'))
       or (old.status='ACTIVE' and new.status='ENDED')) then
    raise exception 'invalid class transition % → %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger classes_transition before insert or update on public.classes
  for each row execute function public.classes_transition();

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from public.org_nodes
   where cardinality(jalur) = 0 or jalur[cardinality(jalur)] <> id;
  if n > 0 then raise exception '% org node(s) with missing/malformed jalur', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
end $$;
