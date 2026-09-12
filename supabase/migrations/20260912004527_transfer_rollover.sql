-- 0005 — Transfer domain (doc 04 §3c, INV-25), record-class registry,
-- portable visibility, and the period-rollover service (doc 04 §3b, INV-23).

create type public.transfer_status as enum ('REQUESTED','AUTHORIZED','EXECUTED','REJECTED','CANCELLED');
create type public.record_portability as enum ('PORTABLE','INSTITUTION_SCOPED');

-- Every evidence/record table declares whether it may follow a learner across
-- institutions. Phase 1 registers the foundation tables; later phases add theirs.
create table public.record_class_registry (
  table_name  text primary key,
  portability public.record_portability not null,
  note        text
);
alter table public.record_class_registry enable row level security;
insert into public.record_class_registry values
  ('enrollments',  'PORTABLE',            'verified academic progression'),
  ('memberships',  'PORTABLE',            'class/cohort history'),
  ('audit_log',    'INSTITUTION_SCOPED',  'accountability material never transfers'),
  ('role_assignments','INSTITUTION_SCOPED','staff grants are institutional');

-- Portable visibility: created on EXECUTED; lets the receiving institution's
-- staff read the person's portable record classes (never institution-scoped ones).
create table public.portable_visibility (
  person_id      uuid not null references public.persons(id),
  institution_id uuid not null references public.institutions(id),
  transfer_id    uuid not null,
  granted_at     timestamptz not null default now(),
  primary key (person_id, institution_id)
);
alter table public.portable_visibility enable row level security;

create table public.transfers (
  id                       uuid primary key default gen_random_uuid(),
  person_id                uuid not null references public.persons(id),
  from_enrollment_id       uuid not null references public.enrollments(id),
  from_institution_id      uuid not null references public.institutions(id),
  to_institution_id        uuid not null references public.institutions(id),
  to_academic_period_id    uuid not null references public.academic_periods(id),
  to_programme_id          uuid references public.org_nodes(id),
  to_enrollment_id         uuid references public.enrollments(id),
  status                   public.transfer_status not null default 'REQUESTED',
  record_classes           text[] not null default array['enrollments','memberships'],
  requested_by             uuid references public.persons(id),
  requested_by_institution uuid references public.institutions(id),
  authorized_by            uuid references public.persons(id),
  authorized_by_institution uuid references public.institutions(id),
  consent                  jsonb not null default '{}'::jsonb,   -- consent facts per policy (OD-9); shape is configuration
  reason                   text,
  created_at               timestamptz not null default now(),
  executed_at              timestamptz,
  check (from_institution_id <> to_institution_id)
);
create index transfers_person_idx on public.transfers (person_id);
alter table public.transfers enable row level security;

-- Only PORTABLE record classes may be listed.
create function public.transfers_guard() returns trigger language plpgsql as $$
declare bad text;
begin
  if tg_op = 'DELETE' then raise exception 'transfers are never deleted (audit)'; end if;
  select rc into bad from unnest(new.record_classes) rc
   where not exists (select 1 from public.record_class_registry r where r.table_name = rc and r.portability = 'PORTABLE') limit 1;
  if bad is not null then raise exception 'record class % is not portable (INV-25)', bad; end if;
  if tg_op = 'UPDATE' then
    if new.person_id <> old.person_id or new.from_enrollment_id <> old.from_enrollment_id
       or new.to_institution_id <> old.to_institution_id then
      raise exception 'transfer identity is immutable';
    end if;
    if new.status <> old.status and not (
         (old.status='REQUESTED' and new.status in ('AUTHORIZED','REJECTED','CANCELLED'))
      or (old.status='AUTHORIZED' and new.status in ('EXECUTED','CANCELLED'))) then
      raise exception 'invalid transfer transition % → %', old.status, new.status;
    end if;
    if old.status in ('EXECUTED','REJECTED','CANCELLED') then raise exception 'a closed transfer is immutable'; end if;
  end if;
  return new;
end $$;
create trigger transfers_guard before insert or update or delete on public.transfers
  for each row execute function public.transfers_guard();

create function public.transfers_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.audit_write('transfer.'||lower(new.status::text), 'transfers', new.id::text, new.from_institution_id,
    jsonb_build_object('person_id', new.person_id, 'to_institution_id', new.to_institution_id, 'record_classes', new.record_classes));
  perform public.audit_write('transfer.'||lower(new.status::text), 'transfers', new.id::text, new.to_institution_id,
    jsonb_build_object('person_id', new.person_id, 'from_institution_id', new.from_institution_id, 'record_classes', new.record_classes));
  return null;
end $$;
create trigger transfers_audit after insert or update on public.transfers
  for each row execute function public.transfers_audit();

-- Workflow RPCs. Policy (who may request/authorize, consent) is OD-9 — the
-- hooks below accept a consent document and require CAN_AUTHORIZE_TRANSFER on
-- the acting side; nothing about consent is invented here.
create function public.transfer_request(p_from_enrollment uuid, p_to_institution uuid, p_to_period uuid,
                                        p_to_programme uuid, p_reason text, p_consent jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare e record; v_id uuid; v_me uuid := public.current_person_id(); v_side uuid;
begin
  select * into e from public.enrollments where id = p_from_enrollment;
  if e.id is null then raise exception 'source enrollment not found'; end if;
  if e.status <> 'ACTIVE' then raise exception 'source enrollment is not ACTIVE'; end if;
  if public.can_on_node('CAN_AUTHORIZE_TRANSFER', e.institution_id) then v_side := e.institution_id;
  elsif public.can_on_node('CAN_AUTHORIZE_TRANSFER', p_to_institution) then v_side := p_to_institution;
  elsif v_me = e.person_id then v_side := null;   -- learner/guardian-initiated request (policy per OD-9)
  else raise exception 'not authorized to request a transfer'; end if;
  insert into public.transfers (person_id, from_enrollment_id, from_institution_id, to_institution_id,
                                to_academic_period_id, to_programme_id, requested_by, requested_by_institution, reason, consent)
  values (e.person_id, e.id, e.institution_id, p_to_institution, p_to_period, p_to_programme, v_me, v_side, p_reason, coalesce(p_consent,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;

create function public.transfer_authorize(p_transfer uuid, p_consent jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_side uuid;
begin
  select * into t from public.transfers where id = p_transfer;
  if t.id is null then raise exception 'transfer not found'; end if;
  -- The counterpart institution authorizes (both sides end up recorded).
  if t.requested_by_institution is distinct from t.to_institution_id and public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) then
    v_side := t.to_institution_id;
  elsif t.requested_by_institution is distinct from t.from_institution_id and public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id) then
    v_side := t.from_institution_id;
  else raise exception 'authorization must come from the counterpart institution'; end if;
  update public.transfers
     set status = 'AUTHORIZED', authorized_by = public.current_person_id(), authorized_by_institution = v_side,
         consent = consent || coalesce(p_consent,'{}'::jsonb)
   where id = p_transfer;
end $$;

create function public.transfer_execute(p_transfer uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_new uuid;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then raise exception 'transfer not found'; end if;
  if t.status <> 'AUTHORIZED' then raise exception 'transfer is not AUTHORIZED'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized to execute';
  end if;
  -- receiving enrollment (new context; nothing is re-parented)
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (t.person_id, t.to_institution_id, t.to_academic_period_id, t.to_programme_id, 'ACTIVE') returning id into v_new;
  -- close the sending enrollment and its open memberships
  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = t.from_enrollment_id and valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;
  -- portable visibility for the receiving institution
  insert into public.portable_visibility (person_id, institution_id, transfer_id)
  values (t.person_id, t.to_institution_id, t.id)
  on conflict (person_id, institution_id) do update set transfer_id = excluded.transfer_id, granted_at = now();
  update public.transfers set status = 'EXECUTED', to_enrollment_id = v_new, executed_at = now() where id = p_transfer;
  return v_new;
end $$;

create function public.transfer_reject(p_transfer uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  select * into t from public.transfers where id = p_transfer;
  if t.id is null then raise exception 'transfer not found'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized';
  end if;
  update public.transfers set status = 'REJECTED', reason = coalesce(p_reason, reason) where id = p_transfer;
end $$;

grant execute on function public.transfer_request(uuid,uuid,uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.transfer_authorize(uuid,jsonb) to authenticated;
grant execute on function public.transfer_execute(uuid) to authenticated;
grant execute on function public.transfer_reject(uuid,text) to authenticated;

-- Portable visibility extends person/enrollment/membership reads for the
-- receiving institution's INSTITUTION_ADMIN and above; institution-scoped
-- records (audit, role assignments) are untouched by design.
create or replace function public.person_visible_to_me(p_person uuid) returns boolean
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
              where e.person_id = p_person and public.has_scope('EDUCATOR', m.node_id)) then
    return true;
  end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then
    return true;
  end if;
  return false;
exception when others then return false;
end $$;

grant select on public.transfers to authenticated;
create policy transfers_select on public.transfers for select to authenticated
  using (person_id = public.current_person_id()
         or public.has_scope('INSTITUTION_ADMIN', from_institution_id)
         or public.has_scope('INSTITUTION_ADMIN', to_institution_id));

grant select on public.portable_visibility to authenticated;
create policy portable_visibility_select on public.portable_visibility for select to authenticated
  using (person_id = public.current_person_id() or public.has_scope('INSTITUTION_ADMIN', institution_id));

grant select on public.record_class_registry to authenticated;
create policy record_class_registry_select on public.record_class_registry for select to authenticated
  using (public.current_person_id() is not null);

-- ---------------------------------------------------------------------------
-- Period rollover (doc 04 §3b): closes current memberships under one period
-- and creates new ones under the next, per an explicit mapping
-- [{from_node, to_node}]. Never updates node_id in place. Audited.
-- ---------------------------------------------------------------------------
create function public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare m record; v_count int := 0; v_from uuid; v_to uuid;
begin
  if not public.has_scope('INSTITUTION_ADMIN', p_institution) then raise exception 'INSTITUTION_ADMIN required'; end if;
  if not exists (select 1 from public.academic_periods where id = p_to_period and institution_id = p_institution)
     or not exists (select 1 from public.academic_periods where id = p_from_period and institution_id = p_institution) then
    raise exception 'periods must belong to the institution';
  end if;
  for m in select (x->>'from_node')::uuid as from_node, (x->>'to_node')::uuid as to_node from jsonb_array_elements(p_mapping) x loop
    v_from := m.from_node; v_to := m.to_node;
    if not exists (select 1 from public.org_nodes where id = v_from and institution_id = p_institution and academic_period_id = p_from_period)
       or not exists (select 1 from public.org_nodes where id = v_to and institution_id = p_institution and academic_period_id = p_to_period) then
      raise exception 'mapping node not in the expected institution/period';
    end if;
    with closed as (
      update public.memberships mm set valid_to = now(), close_reason = 'PERIOD_ROLLOVER'
       where mm.node_id = v_from and mm.valid_to is null
         and exists (select 1 from public.enrollments e where e.id = mm.enrollment_id and e.status = 'ACTIVE')
       returning mm.enrollment_id
    )
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    select c.enrollment_id, v_to, p_to_period from closed c;
    get diagnostics v_count = row_count;
  end loop;
  perform public.audit_write('period.rollover', 'academic_periods', p_to_period::text, p_institution,
    jsonb_build_object('from_period', p_from_period, 'to_period', p_to_period, 'mapping', p_mapping));
  return v_count;
end $$;
grant execute on function public.period_rollover(uuid,uuid,uuid,jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
end $$;
