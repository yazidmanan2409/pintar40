-- ---------------------------------------------------------------------------
-- A LOCAL DEVELOPMENT SHAPE, NOT A SUPABASE STACK.
--
-- PINTAR's migrations assume the objects a Supabase project already provides:
-- the four PostgREST roles, `auth.users`, `auth.uid()`, the storage tables and
-- the migration history table. A plain PostgreSQL server has none of them, so
-- a developer cannot replay the migration set locally without this.
--
-- It exists ONLY so `scripts/dev/golden-db.sh` can build a disposable local
-- baseline quickly. It is applied to a database ONLY when `auth.users` is
-- absent, so running it against a real Supabase stack is a no-op by
-- construction.
--
-- IT PROVES NOTHING. The authoritative clean-install evidence is CI's
-- `migrations · clean database + seed` job, which runs every migration against
-- a real Supabase stack started by the pinned CLI. A green local golden
-- database is a convenience; that job is the gate.
-- ---------------------------------------------------------------------------
do $r$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; end $r$;
do $r$ begin if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $r$;
do $r$ begin if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if; end $r$;
do $r$ begin if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin nologin; end if; end $r$;
do $r$ begin if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator noinherit login; end if; end $r$;
grant anon, authenticated, service_role to authenticator;
grant anon, authenticated, service_role, supabase_auth_admin to postgres;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role, postgres;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid,
  aud varchar(255),
  role varchar(255),
  email varchar(255) unique,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmation_token varchar(255),
  recovery_token varchar(255),
  email_change_token_new varchar(255),
  email_change varchar(255),
  last_sign_in_at timestamptz
);
create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (provider_id, provider)
);
-- GoTrue's sessions (a subset): one row per signed-in device; deleting it makes that session's refresh fail.
create table auth.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  not_after timestamptz,
  refreshed_at timestamp
);
create function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$fn$;

create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now()
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, created_at timestamptz default now()
);
alter table storage.objects enable row level security;
create schema if not exists supabase_migrations;
create table supabase_migrations.schema_migrations (version text primary key, name text, statements text[]);
