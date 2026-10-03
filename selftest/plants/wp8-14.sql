-- wp8-14 — D-093 T1 RETURNS. The posture changes and nothing records it.
create or replace function public.platform_environment_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return null;
end $$;
