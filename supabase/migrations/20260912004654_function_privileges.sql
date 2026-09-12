-- 0007 — Function privilege hardening.
-- Finding (Supabase security advisor, 2026-09-12): Postgres grants EXECUTE
-- on new functions to PUBLIC, so `anon` inherited RPC access to every
-- SECURITY DEFINER function even though anon itself was revoked. Migrations
-- 0001–0006 verified explicit grants, not effective privilege. This migration
-- (a) revokes EXECUTE from PUBLIC on every function in public, (b) sets the
-- default so future functions are not executable by PUBLIC/anon/authenticated
-- until explicitly granted, (c) re-grants only the intended RPC allow-list to
-- authenticated, (d) pins search_path on every function (not only SECURITY
-- DEFINER) so the advisor's mutable-search_path warning is closed, and
-- (e) verifies effective privilege with has_function_privilege().
-- Architecture: INV-14, INV-36, INV-37; doc 16 §5 (advisor findings are
-- audit evidence).

do $$
declare f record;
begin
  for f in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', f.proname, f.args);
    execute format('alter function public.%I(%s) set search_path = public, pg_temp', f.proname, f.args);
  end loop;
end $$;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from public;

-- Intended RPC / helper allow-list for signed-in users (doc 05). Trigger
-- functions, audit_write and internal helpers stay unexecutable by clients.
grant execute on function public.current_person_id() to authenticated;
grant execute on function public.is_system_admin() to authenticated;
grant execute on function public.has_scope(public.app_role, uuid) to authenticated;
grant execute on function public.can_on_node(text, uuid) to authenticated;
grant execute on function public.is_member_of_institution(uuid) to authenticated;
grant execute on function public.person_visible_to_me(uuid) to authenticated;
grant execute on function public.role_capabilities(public.app_role) to authenticated;
grant execute on function public.role_rank(public.app_role) to authenticated;
grant execute on function public.members_of_node_at(uuid, timestamptz) to authenticated;
grant execute on function public.grant_role(uuid, public.app_role, uuid, timestamptz) to authenticated;
grant execute on function public.revoke_role(uuid) to authenticated;
grant execute on function public.transfer_request(uuid,uuid,uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.transfer_authorize(uuid,jsonb) to authenticated;
grant execute on function public.transfer_execute(uuid) to authenticated;
grant execute on function public.transfer_reject(uuid,text) to authenticated;
grant execute on function public.period_rollover(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.flag_enabled(text, uuid) to authenticated;

-- RLS policies call the primitives as the policy owner; grants above are for
-- direct RPC use by the application server on behalf of a signed-in user.

-- ---------------------------------------------------------------------------
-- Verification: effective privilege, not explicit grants.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text;
begin
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if bad is not null then raise exception 'anon can execute: %', bad; end if;

  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')
     and p.proname not in ('current_person_id','is_system_admin','has_scope','can_on_node','is_member_of_institution',
                           'person_visible_to_me','role_capabilities','role_rank','members_of_node_at','grant_role','revoke_role',
                           'transfer_request','transfer_authorize','transfer_execute','transfer_reject','period_rollover','flag_enabled');
  if bad is not null then raise exception 'authenticated can execute non-allow-listed function(s): %', bad; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public'
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) without pinned search_path', n; end if;

  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% policy(ies) use USING/WITH CHECK (true) (INV-36)', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception 'RLS not enabled on % public table(s)', n; end if;
end $$;
