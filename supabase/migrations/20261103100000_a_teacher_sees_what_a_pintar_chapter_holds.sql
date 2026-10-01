-- D-085 M6 -- A TEACHER SEES WHAT A PINTAR CHAPTER HOLDS BEFORE GIVING IT.
--
-- M6: PINTAR prepares standard content once and distributes the release to
-- every applicable school; "teachers preparing learning must be able to see and
-- assign both applicable PINTAR standard content and their school's own
-- published content, with origin made clear". assign_release already gives a
-- distributed canonical release to a class (it checks release_is_distributed_to),
-- but «Siapkan materi» listed only the school's own releases, and a teacher's
-- own row security cannot read a canonical course's modules or tests, so the
-- review step («Yang akan diterima murid») would show a PINTAR chapter as empty.
--
-- distributed_release_outline (0057) already gives the lessons, behind
-- caller_may_read_distributed_release. This adds the one thing it does not: the
-- two tests the cycle draws -- exactly the definitions assign_release would use
-- (release_cycle_definition) -- with their size and attempt limit, behind the
-- same gate. Counts and titles only: no item, no option, no key. Nothing is
-- written; no table, policy or existing function changes.

create or replace function public.distributed_release_instruments(p_release uuid)
returns table (mode public.assessment_mode, title text, item_count smallint, attempt_limit smallint)
language sql stable security definer set search_path = public, pg_temp as $$
  select d.mode, d.title, d.item_count, d.attempt_limit
    from unnest(array['PRE_TEST', 'POST_TEST']::public.assessment_mode[]) with ordinality as m(mode, urutan)
    cross join lateral (select (public.release_cycle_definition(p_release, m.mode)).*) d
   where d.id is not null
     and public.caller_may_read_distributed_release(p_release)
   order by m.urutan
$$;
revoke all on function public.distributed_release_instruments(uuid) from public, anon, authenticated;
grant execute on function public.distributed_release_instruments(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('distributed_release_instruments', 'STAFF',
   'D-085 M6: the Pemetaan Awal and Uji Penguasaan a distributed canonical release gives a class (title, size, attempt '
   'limit), gated on an active grant held by an institution the caller is staff in. No item content, no answer key.')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

do $$
declare v_pro text;
begin
  v_pro := pg_get_functiondef('public.distributed_release_instruments(uuid)'::regprocedure);
  if v_pro !~ 'caller_may_read_distributed_release' or v_pro !~ 'release_cycle_definition' or v_pro ~* 'item_options|is_correct|stem' then
    raise exception 'M6: the instruments read is gated as the outline is, draws the cycle''s own definitions, and carries no item';
  end if;
  if has_function_privilege('anon', 'public.distributed_release_instruments(uuid)', 'execute') then
    raise exception 'M6: the instruments read is for signed-in staff only';
  end if;
  raise notice 'M6 verified: the cycle''s two tests of a distributed release, behind the distribution gate, no item content';
end $$;
