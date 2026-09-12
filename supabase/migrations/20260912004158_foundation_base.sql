-- 0001 — Foundation base: extensions, schemas, closed-by-default privileges,
-- platform environment, audit trail (append-only), authorization enums.
-- Architecture: docs/rebuild/03 INV-14, INV-18, INV-21, INV-36; doc 16 §2.
-- Every migration ends with its own verification block; a failed check fails
-- the whole migration.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Closed by default (INV-36): revoke the default open grants Supabase gives
-- client roles on public, and make sure future tables never inherit them.
-- Grants are added back per table, explicitly, below and in later migrations.
-- ---------------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Platform environment: single row. Seeds refuse to run against production
-- (INV-21). Set to 'production' only by the deployment system.
-- ---------------------------------------------------------------------------
create table public.platform_environment (
  singleton   boolean primary key default true check (singleton),
  environment text not null check (environment in ('development','staging','production')),
  updated_at  timestamptz not null default now()
);
alter table public.platform_environment enable row level security;
insert into public.platform_environment (environment) values ('development');

-- ---------------------------------------------------------------------------
-- Roles and capabilities (doc 05).
-- ---------------------------------------------------------------------------
create type public.app_role as enum
  ('STUDENT','EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN','SYSTEM_ADMIN');

create function public.role_rank(r public.app_role) returns smallint
language sql immutable parallel safe as $$
  select case r
    when 'STUDENT' then 1 when 'EDUCATOR' then 2 when 'HEAD_OF_DEPARTMENT' then 3
    when 'DEAN' then 4 when 'INSTITUTION_ADMIN' then 5 when 'SYSTEM_ADMIN' then 6 end::smallint
$$;

-- Capability model derived from role (FABLE-01 §4; doc 05). Never assigned
-- directly to a user. DEAN deliberately holds none (INV-19).
create function public.role_capabilities(r public.app_role) returns text[]
language sql immutable parallel safe as $$
  select case r
    when 'SYSTEM_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY']
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY']
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT']
    when 'DEAN' then array[]::text[]
    when 'STUDENT' then array[]::text[]
  end
$$;

-- ---------------------------------------------------------------------------
-- Audit trail (INV-18): append-only from day one. Clients never write it
-- directly; SECURITY DEFINER writers (triggers/functions) do. No role, not
-- even service_role, gets UPDATE/DELETE — a trigger refuses them outright.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id               bigint generated always as identity primary key,
  at               timestamptz not null default now(),
  actor_auth_uid   uuid,
  actor_person_id  uuid,
  action           text not null,
  target_table     text not null,
  target_id        text,
  institution_id   uuid,
  summary          jsonb not null default '{}'::jsonb,
  build_sha        text
);
create index audit_log_institution_at_idx on public.audit_log (institution_id, at desc);
create index audit_log_target_idx on public.audit_log (target_table, target_id);
alter table public.audit_log enable row level security;

create function public.audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only (INV-18)';
end $$;
create trigger audit_log_no_update before update on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_delete before delete on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

-- The one audit writer. search_path pinned (INV-14).
create function public.audit_write(
  p_action text, p_target_table text, p_target_id text,
  p_institution_id uuid, p_summary jsonb default '{}'::jsonb
) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id bigint; v_person uuid;
begin
  begin
    select a.person_id into v_person from public.accounts a where a.auth_user_id = auth.uid();
  exception when undefined_table then v_person := null; end;
  insert into public.audit_log (actor_auth_uid, actor_person_id, action, target_table, target_id, institution_id, summary, build_sha)
  values (auth.uid(), v_person, p_action, p_target_table, p_target_id, p_institution_id, coalesce(p_summary,'{}'::jsonb),
          nullif(current_setting('app.build_sha', true), ''))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.audit_write(text,text,text,uuid,jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification (fails the migration on any violation)
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from pg_tables t
   where t.schemaname='public' and not t.rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  select count(*) into n from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee in ('anon','authenticated');
  if n > 0 then raise exception 'client roles still hold % table grant(s) in public', n; end if;
end $$;
