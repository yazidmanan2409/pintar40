-- W1.8 (Batch 3; J4.12, UX-13): «Riwayat perbaikan» names who sent a version back and who approved it, and who wrote
-- each correction. The package page read those names from public.persons under the reader's own row security, so the
-- author (a Guru, who may read their own Studio content but not the head of department's person row) saw the reason
-- and the date with no name: the history the send-back exists for was missing its «who» for the one person it is for.
--
-- This returns exactly those names and nothing else: the display name of each person recorded as the reviewer of a
-- review outcome, or the writer of a correction note, of the packages asked for, and only of packages whose school the
-- reader may already work on in Studio (CAN_DRAFT or CAN_REVIEW there, as content_review_outcomes' own read policy
-- has it). A package of another school, or one the reader may not see, gives no row. No person is found by name, no
-- other column is returned, and nothing is written.

create or replace function public.nama_riwayat_paket(p_courses uuid[])
returns table (person_id uuid, display_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  with boleh as (
    select c.id
    from public.courses c
    where c.id = any (coalesce(p_courses, '{}'::uuid[]))
      and (public.can_in_institution('CAN_DRAFT', c.institution_id) or public.can_in_institution('CAN_REVIEW', c.institution_id))
  ), orang as (
    select o.reviewer_person_id as pid from public.content_review_outcomes o join boleh b on b.id = o.course_id
    union
    select n.written_by_person_id from public.course_revision_notes n join boleh b on b.id = n.course_id
    where n.written_by_person_id is not null
  )
  select p.id, p.display_name from public.persons p join orang on orang.pid = p.id;
$$;

revoke all on function public.nama_riwayat_paket(uuid[]) from public, anon, authenticated;
grant execute on function public.nama_riwayat_paket(uuid[]) to authenticated;

comment on function public.nama_riwayat_paket(uuid[]) is
  'W1.8: the display names of the reviewers and correction writers recorded on the given packages, for a reader who may work on their school in Studio (CAN_DRAFT or CAN_REVIEW); nothing else.';

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('nama_riwayat_paket', 'STAFF',
   'W1.8 (Batch 3): the display names of the reviewers and correction writers recorded on the given packages, for '
   || '«Riwayat perbaikan»; only packages whose school the caller may work on in Studio (CAN_DRAFT or CAN_REVIEW); '
   || 'reads nothing else and writes nothing.',
   'CAPABILITY', 'CAN_DRAFT');

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'nama_riwayat_paket' and p.prosecdef
                    and array_to_string(p.proconfig, ',') like '%search_path=public, pg_temp%') then
    raise exception 'W1.8: nama_riwayat_paket is missing, not SECURITY DEFINER, or has no pinned search_path';
  end if;
  if has_function_privilege('anon', 'public.nama_riwayat_paket(uuid[])', 'execute') then
    raise exception 'W1.8: nama_riwayat_paket is executable by anon';
  end if;
  if not exists (select 1 from public.client_rpc_registry where function_name = 'nama_riwayat_paket') then
    raise exception 'W1.8: nama_riwayat_paket has no exposure class';
  end if;
end $$;
