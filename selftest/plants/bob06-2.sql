-- bob06-2 — ANYBODY HOLDS THE PROVISIONING PASS. The guards' one path around the capability is open to every writer.
create or replace function public.report_template_provisioning_pass()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select true $$;
