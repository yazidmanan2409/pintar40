-- E3/E4 on the screen (the Action & Consequence inventory, 9 Nov: akhiri_pendaftaran and daftarkan_kembali had no
-- caller). Red on 8231655c: F37-E06.
--
-- murid_keluar(sekolah): the learners who left this school and are enrolled nowhere here now, for «Murid yang sudah
-- keluar» on Konfigurasi · Pindah kelas: each with their latest ending here (when, why), whether that ending can be
-- corrected (the latest, recorded with a reason by E3, not yet corrected: daftarkan_kembali's own rule) and whether
-- they are enrolled at another school now (then only a transfer brings them back, and the screen says so). Only the
-- school's INSTITUTION_ADMIN (and the platform) reads it; every act is still daftarkan_kembali's.

create or replace function public.murid_keluar(p_sekolah uuid)
returns table (person_id uuid, display_name text, institutional_id text, enrollment_id uuid, end_reason text,
               ended_at timestamptz, reason_code text, bisa_dikoreksi boolean, di_sekolah_lain boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_sekolah is null or not public.has_scope('INSTITUTION_ADMIN', p_sekolah) then
    raise exception using errcode = '42501', message = 'the learners who left a school are its INSTITUTION_ADMIN''s to read';
  end if;
  return query
  select p.id, p.display_name, ii.institutional_id, e.id, e.end_reason::text, e.valid_to,
         (select a.summary ->> 'reason_code' from public.audit_log a where a.target_table = 'enrollments'
           and a.target_id = e.id::text and a.action = 'enrollment.ended_with_reason' order by a.at desc limit 1),
         exists (select 1 from public.audit_log a where a.target_table = 'enrollments' and a.target_id = e.id::text
                   and a.action = 'enrollment.ended_with_reason')
           and not exists (select 1 from public.audit_log a where a.action = 'enrollment.reopened' and a.summary ->> 'corrects' = e.id::text)
           -- CORRECTED IN PLACE (undeployed; Sharon F5): only while the ending's school year runs
           and coalesce((select ap.ends_on from public.academic_periods ap where ap.id = e.academic_period_id)
                          >= public.hari_sekolah(p_sekolah), true),
         exists (select 1 from public.enrollments x where x.person_id = p.id and x.institution_id <> p_sekolah
                   and x.status in ('PENDING', 'ACTIVE'))
    from public.persons p
    join lateral (select e2.* from public.enrollments e2 where e2.person_id = p.id and e2.institution_id = p_sekolah
                   order by e2.created_at desc limit 1) e on true
    left join public.institutional_identities ii on ii.person_id = p.id and ii.institution_id = p_sekolah
   where public.murid_sudah_keluar(p.id, p_sekolah)
     and not public.memegang_peran_staf(p.id)
   order by e.valid_to desc nulls last, p.display_name
   limit 200;
end;
$$;
revoke all on function public.murid_keluar(uuid) from public, anon, authenticated;
grant execute on function public.murid_keluar(uuid) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('murid_keluar', 'STAFF', '«Murid yang sudah keluar»: the learners who left this school, each with their latest ending, '
   || 'whether it can be corrected and whether they are enrolled elsewhere now.', 'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if position('has_scope(''INSTITUTION_ADMIN''' in (select prosrc from pg_proc where oid = 'public.murid_keluar(uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: the departed learners are readable beyond the school''s administrator';
  end if;
end $$;
