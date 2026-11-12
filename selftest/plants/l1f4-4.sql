-- l1f4-4 — Daisy's count UNDONE: «{n} sertifikat baru dapat diterbitkan» counts a certificate that will not be issued
-- to a person whose personal data was deleted.
do $$
declare v text := pg_get_functiondef('public.koreksi_kunci_hitung_untuk(uuid,text[])'::regprocedure);
        x text := E'       and not exists (select 1 from public.persons p where p.id = s.person_id and p.anonymized_at is not null) then\n';
begin
  if position(x in v) = 0 then raise exception 'l1f4-4: koreksi_kunci_hitung_untuk does not exclude where it did'; end if;
  execute replace(v, x, E'       then\n');
end $$;
