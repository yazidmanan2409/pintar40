-- W2.5 (Batch 5; CR-05, ADM-18, J8.5): A SCHOOL ADMIN FINDS A CERTIFICATE OF THEIR SCHOOL AND REVOKES IT ON A SCREEN.
--
-- revoke_certificate (20261111100000) already revokes, with a reason, once, audited (certificate.revoked, D-093,
-- D-097), and the public check already reads a revoked certificate as «Dicabut». What was missing is the screen, and
-- under it a way for the school to find the certificate at all: certificates_select admits the holder only, so no
-- staff read of a school's certificates existed.
--
-- sertifikat_sekolah(p_sekolah, p_cari, p_hal, p_id) is that read, and nothing more:
--   * who: exactly who revoke_certificate accepts, CAN_PUBLISH in the certificate's school (Admin sekolah, Admin
--     platform). With p_sekolah null, Admin platform only (every school, «Seluruh platform»), except one certificate
--     by id, which whoever may revoke it reads (so the revocation can learn its school for the working-context check,
--     D-132(k)). Anyone else is refused;
--   * what: the issued certificates (ISSUED, REVOKED, SUPERSEDED; a prepared ELIGIBLE row is no certificate yet) with
--     what the screen shows: the number, the holder's name, the school, the course as issued, when it was issued, its
--     state, and when and why it was revoked. No payload, signature, token or result;
--   * search: by the certificate's number (from its start) or by the holder's name (a part of it); a page of 20, newest
--     first, with the total; p_id reads the one certificate the form page opens, under the same rule.
-- It writes nothing. The act stays revoke_certificate's, unchanged.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

create or replace function public.sertifikat_sekolah(p_sekolah uuid, p_cari text default null, p_hal integer default 1,
                                                     p_id uuid default null)
returns table (id uuid, certificate_number text, holder_name text, institution_id uuid, institution_name text,
               course_title text, issued_at timestamptz, status public.certificate_status, revoked_at timestamptz,
               revoked_reason text, total bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  c_ukuran constant integer := 20;
  v_dari integer := (greatest(coalesce(p_hal, 1), 1) - 1) * 20;
  v_cari text := nullif(btrim(coalesce(p_cari, '')), '');
  v_pola text;
begin
  if public.current_person_id() is null
     or (p_sekolah is null and p_id is null and not public.is_system_admin())
     -- one certificate by id with no school named: whoever may revoke it (its own school's CAN_PUBLISH), so a revocation
     -- can first learn which school it acts in (the working-context check, D-132(k))
     or (p_sekolah is null and p_id is not null
         and not public.can_in_institution('CAN_PUBLISH', (select c.institution_id from public.certificates c where c.id = p_id)))
     or (p_sekolah is not null and not public.can_in_institution('CAN_PUBLISH', p_sekolah)) then
    raise exception using errcode = '42501', detail = 'DITOLAK',
      message = 'reading a school''s certificates requires CAN_PUBLISH in that school';
  end if;
  -- a search is words, never a pattern: % and _ are matched as themselves
  v_pola := case when v_cari is null then null
                 else replace(replace(replace(v_cari, '\', '\\'), '%', '\%'), '_', '\_') end;
  return query
    select c.id, c.certificate_number, p.display_name, c.institution_id, i.name,
           coalesce(c.course_title_as_issued, ''), c.issued_at, c.status, c.revoked_at, c.revoked_reason,
           count(*) over ()
      from public.certificates c
      join public.persons p on p.id = c.person_id
      join public.institutions i on i.id = c.institution_id
     where c.status <> 'ELIGIBLE'
       and (p_sekolah is null or c.institution_id = p_sekolah)
       and (p_id is null or c.id = p_id)
       and (v_pola is null
            or c.certificate_number ilike v_pola || '%'
            or p.display_name ilike '%' || v_pola || '%')
     order by c.issued_at desc, c.id
     offset case when p_id is null then v_dari else 0 end
     limit c_ukuran;
end $$;
revoke all on function public.sertifikat_sekolah(uuid, text, integer, uuid) from public, anon;
grant execute on function public.sertifikat_sekolah(uuid, text, integer, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('sertifikat_sekolah', 'STAFF',
   'W2.5 (CR-05): the issued certificates of one school (every school for Admin platform with no school), searched '
   'by number or holder name, a page of 20 with the total, or one by id; only for whom revoke_certificate accepts '
   '(CAN_PUBLISH in that school). Number, holder name, school, course as issued, issued and revoked times, state, '
   'reason. Read only.', 'CAPABILITY', 'CAN_PUBLISH')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_src text := pg_get_functiondef('public.sertifikat_sekolah(uuid, text, integer, uuid)'::regprocedure);
begin
  if position('can_in_institution(''CAN_PUBLISH''' in v_src) = 0 or position('is_system_admin' in v_src) = 0 then
    raise exception 'the certificate list does not ask what revoke_certificate asks';
  end if;
  if position('signature' in v_src) > 0 or position('verification_token' in v_src) > 0
     or position('canonical_payload' in v_src) > 0 then
    raise exception 'the certificate list carries what a screen must not show';
  end if;
  if has_function_privilege('anon', 'public.sertifikat_sekolah(uuid, text, integer, uuid)', 'EXECUTE') then
    raise exception 'the certificate list is reachable without signing in';
  end if;
end $$;
