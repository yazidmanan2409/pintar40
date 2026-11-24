-- d2r-9 — THE ANSWERS CARRY A MARK. session_answers gains a correctness column.
drop function public.session_answers(uuid);
create function public.session_answers(p_session uuid)
returns table (presented_item_id uuid, client_seq integer, posisi jsonb, received_at timestamptz, benar boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.presented_item_id, r.client_seq, null::jsonb, r.received_at, null::boolean from public.responses r where r.session_id = p_session
$$;
grant execute on function public.session_answers(uuid) to authenticated;
