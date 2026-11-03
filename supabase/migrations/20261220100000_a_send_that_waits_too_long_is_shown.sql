-- W2.19 (Batch 4, D-152; J1.9): A SEND THAT WAITS TOO LONG IS SHOWN, AND «HANDED OFF» IS NOT «ACCEPTED».
--
-- Every email PINTAR sends is logged (email_send_log, 20261026100000): PENDING from the moment it is handed to the
-- email server until the server answers (SENT: the server ACCEPTED it; REFUSED_BY_HOST, FAILED, REFUSED_LIMIT). The
-- platform admin could look up one address or one reference («Kirim email uji»), but nothing showed a send the server
-- never answered: a stuck send was invisible until someone complained (J1.9).
--
-- email_send_stuck(minutes): for the platform admin only, the sends still PENDING after that many minutes (10 by
-- default, 1 to 1440), oldest first, at most 100: the reference, the kind, when it was handed off and how long it has
-- waited. Like email_send_history it holds and returns no address, code or message. The screen then says, for a
-- pending send, «handed to the email server, no answer yet» while it is young and «stuck» once it is not; SENT stays
-- «accepted by the email server», which is not delivery.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

create function public.email_send_stuck(p_minutes integer default 10)
returns table (id uuid, kind text, requested_at timestamptz, minutes integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_menit integer := least(greatest(coalesce(p_minutes, 10), 1), 1440);
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'email_send_stuck: the platform admin only';
  end if;
  return query
    select s.id, s.kind, s.requested_at, floor(extract(epoch from (now() - s.requested_at)) / 60)::integer
      from public.email_send_log s
     where s.outcome = 'PENDING' and s.requested_at < now() - make_interval(mins => v_menit)
     order by s.requested_at, s.id
     limit 100;
end $$;
revoke all on function public.email_send_stuck(integer) from public, anon, service_role;
grant execute on function public.email_send_stuck(integer) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('email_send_stuck', 'STAFF', 'W2.19 (J1.9): the sends the email server has not answered after N minutes, for the platform '
   || 'admin on «Kirim email uji»: reference, kind, when handed off, minutes waited. No address, code or message.',
   'SYSTEM_ADMIN', null);

do $$
begin
  if has_function_privilege('anon', 'public.email_send_stuck(integer)', 'execute')
     or not has_function_privilege('authenticated', 'public.email_send_stuck(integer)', 'execute') then
    raise exception 'email_send_stuck is reached by the wrong roles';
  end if;
end $$;
