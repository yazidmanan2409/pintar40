-- W2.10 (Batch 4, D-152; CR-49, CAP-10): MAINTENANCE WINDOWS AND NOTICES ARE LISTED A PAGE AT A TIME.
--
-- maintenance_list (#148) answered the newest 50 windows and the newest 50 notices the reader may act on, with no way
-- past them, and Konfigurasi narrowed the windows to a school's working context in the browser by comparing the
-- schools' NAMES the list carries with the context's school ID, so in Mengelola · a school no window ever matched
-- (found while paging, Batch 4). Now the database does both:
--
--   maintenance_list(p_hal_jendela, p_hal_pengumuman, p_sekolah): a page of 20 windows and a page of 20 notices, newest
--   first, each with whether another page follows (lagi_pemeliharaan, lagi_pengumuman); with p_sekolah, the windows
--   that reach that school (it is among the window's schools) and the notices that are not platform-wide, as Konfigurasi
--   asked before (L3, D-132). A narrowing only: who may call, what each row says and which rows the reader may act on
--   are #148's, unchanged. Called with no arguments it answers the first pages for every school, as before.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

drop function public.maintenance_list();

create function public.maintenance_list(p_hal_jendela integer default 1, p_hal_pengumuman integer default 1,
                                        p_sekolah uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_win jsonb; v_not jsonb; v_lagi_win boolean; v_lagi_not boolean;
        c_ukuran constant integer := 20;
        v_dari_win integer := (greatest(coalesce(p_hal_jendela, 1), 1) - 1) * 20;
        v_dari_not integer := (greatest(coalesce(p_hal_pengumuman, 1), 1) - 1) * 20;
begin
  -- an administrator's list: Admin platform, or a person holding Admin sekolah somewhere
  if public.current_person_id() is null
     or not (public.is_system_admin()
             or exists (select 1 from public.role_assignments ra
                         where ra.person_id = public.current_person_id() and ra.role = 'INSTITUTION_ADMIN'
                           and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  perform public.maintenance_record_edges();
  -- one row more than a page is read, so whether another page follows is known
  -- the window travels as its own row type (b.w), which maintenance_state and maintenance_controls take
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', (b.w).id, 'jenis', (b.w).kind, 'keadaan', public.maintenance_state(b.w, now()), 'platform', (b.w).platform,
           'sekolah', (select coalesce(jsonb_agg(i.name order by i.name), '[]'::jsonb) from public.institutions i where i.id = any ((b.w).institution_ids)),
           'mulai', (b.w).starts_at, 'selesai', (b.w).ends_at, 'diakhiri', (b.w).ended_at, 'pesan', (b.w).message, 'alasan', (b.w).reason,
           'menguasai', public.maintenance_controls(b.w)) order by (b.w).created_at desc, (b.w).id) filter (where b.urutan <= c_ukuran), '[]'::jsonb),
         coalesce(bool_or(b.urutan > c_ukuran), false)
    into v_win, v_lagi_win
    -- numbered after the page is cut (a window function runs before OFFSET), so row 21 means another page follows
    from (select x.w, row_number() over (order by (x.w).created_at desc, (x.w).id) as urutan
            from (select m as w from public.maintenance_windows m
           where (public.is_system_admin() or public.maintenance_controls(m)
                  -- a platform-wide window reaches every school, so its admins see it (they cannot change it)
                  or m.platform)
             and (p_sekolah is null or p_sekolah = any (m.institution_ids))
           order by m.created_at desc, m.id offset v_dari_win limit c_ukuran + 1) x) b;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', n.id, 'pesan', n.message, 'terbit', n.publish_at, 'sampai', n.expires_at, 'ditarik', n.withdrawn_at,
           'platform', n.platform, 'boleh', public.maintenance_may_act(n.platform, n.institution_ids))
           order by n.created_at desc, n.id) filter (where n.urutan <= c_ukuran), '[]'::jsonb),
         coalesce(bool_or(n.urutan > c_ukuran), false)
    into v_not, v_lagi_not
    from (select y.*, row_number() over (order by y.created_at desc, y.id) as urutan
            from (select x.* from public.broadcast_notices x
           where public.maintenance_may_act(x.platform, x.institution_ids)
             and (p_sekolah is null or not x.platform)
           order by x.created_at desc, x.id offset v_dari_not limit c_ukuran + 1) y) n;
  return jsonb_build_object('pemeliharaan', v_win, 'pengumuman', v_not,
                            'lagi_pemeliharaan', v_lagi_win, 'lagi_pengumuman', v_lagi_not);
end $$;
revoke all on function public.maintenance_list(integer, integer, uuid) from public, anon;
grant execute on function public.maintenance_list(integer, integer, uuid) to authenticated;

update public.client_rpc_registry
   set note = '#148: the windows and notices the caller may act on, newest first, a page of 20 of each at a time (W2.10), '
              || 'optionally narrowed to one school''s; records automatic edges as SYSTEM.'
 where function_name = 'maintenance_list';

do $$
begin
  if has_function_privilege('anon', 'public.maintenance_list(integer,integer,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.maintenance_list(integer,integer,uuid)', 'execute') then
    raise exception 'maintenance_list is reached by the wrong roles';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'maintenance_list' and p.pronargs = 0) then
    raise exception 'the unpaged maintenance_list() still exists';
  end if;
  if not exists (select 1 from public.client_rpc_registry where function_name = 'maintenance_list') then
    raise exception 'maintenance_list is not in the registry';
  end if;
end $$;
