-- 0006 — Storage contract (INV-15), feature flags and platform config
-- (FOUNDATION NOW), reserved boundaries. Doc 16 §8 (flags), doc 09.

-- Private asset bucket. No storage policy for anon/authenticated exists at
-- all in this phase: every read is a server-issued signed URL and every
-- write goes through the service_role upload route (FABLE-01 §7).
insert into storage.buckets (id, name, public, file_size_limit)
values ('assets', 'assets', false, 104857600)
on conflict (id) do update set public = false;

-- Feature flags: platform-wide (institution_id null) or institution-scoped.
create table public.feature_flags (
  key            text not null check (key ~ '^[a-z][a-z0-9_.]{1,80}$'),
  institution_id uuid references public.institutions(id),
  enabled        boolean not null default false,
  note           text,
  updated_at     timestamptz not null default now(),
  primary key (key, institution_id)
);
create unique index feature_flags_platform_key on public.feature_flags (key) where institution_id is null;
alter table public.feature_flags enable row level security;

create function public.feature_flags_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.audit_write('feature_flag.'||tg_op, 'feature_flags', new.key, new.institution_id,
                             jsonb_build_object('enabled', new.enabled));
  return null;
end $$;
create trigger feature_flags_audit after insert or update on public.feature_flags
  for each row execute function public.feature_flags_audit();

-- Effective flag: institution override wins over platform default; default false.
create function public.flag_enabled(p_key text, p_institution uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select enabled from public.feature_flags where key = p_key and institution_id = p_institution),
    (select enabled from public.feature_flags where key = p_key and institution_id is null),
    false)
$$;
grant execute on function public.flag_enabled(text, uuid) to authenticated;

grant select, insert, update on public.feature_flags to authenticated;
create policy feature_flags_select on public.feature_flags for select to authenticated
  using (public.is_system_admin() or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id)));
create policy feature_flags_insert on public.feature_flags for insert to authenticated
  with check (public.is_system_admin() or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id)));
create policy feature_flags_update on public.feature_flags for update to authenticated
  using (public.is_system_admin() or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id)))
  with check (public.is_system_admin() or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id)));

-- Platform config: maintenance mode, registration lock. SYSTEM_ADMIN only.
create table public.platform_config (
  key        text primary key check (key ~ '^[a-z][a-z0-9_.]{1,80}$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.platform_config enable row level security;
insert into public.platform_config (key, value) values
  ('maintenance_mode', 'false'::jsonb),
  ('registration_lock', 'false'::jsonb);
grant select, update on public.platform_config to authenticated;
create policy platform_config_select on public.platform_config for select to authenticated
  using (public.current_person_id() is not null);
create policy platform_config_update on public.platform_config for update to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());

create function public.platform_config_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.audit_write('platform_config.updated', 'platform_config', new.key, null, jsonb_build_object('value', new.value));
  return null;
end $$;
create trigger platform_config_audit after update on public.platform_config
  for each row execute function public.platform_config_audit();

-- ---------------------------------------------------------------------------
-- Verification: the two-lock storage lesson (Lesson 1) — check the policies,
-- not the bucket flag.
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from storage.buckets where public;
  if n > 0 then raise exception '% public bucket(s) exist (INV-15)', n; end if;
  select count(*) into n from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and (roles::text like '%anon%' or roles::text like '%public%' or roles::text like '%authenticated%');
  if n > 0 then raise exception '% storage.objects policy(ies) grant client roles access (INV-15)', n; end if;
  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
end $$;
