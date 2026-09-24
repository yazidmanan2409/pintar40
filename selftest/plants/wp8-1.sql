-- wp8-1 — W8-01 RETURNS. The ladder trigger's own helper stops being
-- executable by a client, which is the exact state that made a real school
-- unable to add a class while every owner-built fixture passed.
revoke execute on function public.org_kind_level(public.org_kind) from authenticated;
