-- wp8-13 — D-093 T1 RETURNS. service_role can again change the installation's
-- posture, which only the deployment system may set.
grant update on public.platform_environment to service_role;
