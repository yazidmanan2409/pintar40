-- 0084 -- synthetic credential-bearing fixtures are LOCAL, not hosted-development.
--
-- LAYER-3 FINDING L3-F01. The FABLE-01 seed guard refused only
-- `environment = 'production'` -- a fail-OPEN denylist. `platform_environment.
-- environment` is migration-seeded 'development' IDENTICALLY on local, CI and
-- hosted (20260912004158_foundation_base.sql:34), so a network-reachable hosted
-- DEVELOPMENT project satisfied the guard, and synthetic.sql populated real Auth
-- identities there -- including a global SYSTEM_ADMIN whose password is a tracked
-- repository literal. The identities were removed by the L3-F01 remediation; this
-- migration stops them coming back.
--
-- WHY NOT REUSE `environment`. Every other consumer compares it only against
-- 'production', and it is CHECK IN ('development','staging','production'); it is
-- the dev/prod axis, not the local/hosted axis, and conflating them was the
-- defect. This adds a SEPARATE, FAIL-CLOSED marker on the singleton row,
-- defaulting to false. A database that has only had migrations applied -- which
-- is exactly what a hosted project is -- carries false and refuses synthetic
-- credential fixtures. The marker is flipped true only by the local seed
-- pipeline (`config.toml [db.seed]`), which hosted never executes.
--
-- WHAT THIS DOES NOT CLAIM. It is not forgery-proof against a human who
-- deliberately runs the local enabler on hosted as well. Measured: no in-SQL
-- signal distinguishes a local Supabase stack from a hosted project -- same
-- image, roles and extensions. The enforcing control against residual state is
-- the hosted credential audit (docs/audit/hosted-credential-audit.sql, L3-F01
-- C.2) plus removal; this migration removes the fail-OPEN default that let the
-- incident happen with no deliberate act at all.

alter table public.platform_environment
  add column local_fixtures_enabled boolean not null default false;

comment on column public.platform_environment.local_fixtures_enabled is
  'Fail-closed marker (L3-F01): synthetic credential-bearing seeds refuse unless true. Flipped true only by the local seed pipeline (config.toml [db.seed]); false after a migrations-only apply, which is what a hosted project is.';

-- The single predicate both credential seeds consult. SECURITY DEFINER + pinned
-- search_path (INV-08 / the search_path lint); ADR-0021 revokes it from every
-- client role -- it is seed machinery, not a client entry point.
create function public.synthetic_fixtures_permitted()
returns boolean language sql stable security definer set search_path = public, pg_temp as $function$
  select environment <> 'production' and local_fixtures_enabled
    from public.platform_environment
$function$;
revoke all on function public.synthetic_fixtures_permitted() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Fail-closed by default; true only when the
-- marker is set on a non-production environment; always false on production.
-- ---------------------------------------------------------------------------
do $$
begin
  if public.synthetic_fixtures_permitted() then
    raise exception '0084: fixtures permitted on a migrations-only apply; the marker is not fail-closed';
  end if;
  begin
    update public.platform_environment set local_fixtures_enabled = true;
    if not public.synthetic_fixtures_permitted() then
      raise exception '0084: marker set on a non-production environment did not permit fixtures';
    end if;
    update public.platform_environment set environment = 'production';
    if public.synthetic_fixtures_permitted() then
      raise exception '0084: production must refuse fixtures even with the local marker set';
    end if;
    raise exception 'PROBE_0084_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0084_ROLLBACK' then raise; end if;
  end;
  -- and the default survived the rolled-back probe
  if public.synthetic_fixtures_permitted() then
    raise exception '0084: the probe leaked; fixtures are permitted after rollback';
  end if;
  raise notice '0084 verified: synthetic credential fixtures are fail-closed by default, permitted only with the local marker on a non-production environment, and always refused on production';
end $$;
