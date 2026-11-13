-- DRAFT for Sharon's ruling and the owner's (A2a's page §6, "What the corrected engine reports on main's code"); not
-- part of change A. The lifecycle acts lock a person FOR NO KEY UPDATE instead of FOR UPDATE.
--
-- WHY. A2A-L01, with foreign keys counted (Sharon's R1), reports 48 places where a foreign key's check takes FOR KEY
-- SHARE on a person after a higher-ranked lock. FOR KEY SHARE conflicts only with FOR UPDATE (and a delete). One of
-- them was reproduced on two connections as a real deadlock: a sitting being finalized (the sitting locked, then the
-- result row's person_id = the learner, a FOR KEY SHARE) against that learner's suspension (the learner FOR UPDATE,
-- then their open sittings): "deadlock detected", the finalize aborted. With tangguhkan_akun taking the person FOR NO
-- KEY UPDATE, the same race had no deadlock: the finalize went on and the suspension waited for the sitting.
--
-- WHAT CHANGES. The 16 statements that take a person FOR UPDATE, in 15 functions, take FOR NO KEY UPDATE. Each locks
-- persons alone. A person's key never changes and no person is deleted (persons_no_delete). FOR NO KEY UPDATE still
-- conflicts with itself, with FOR SHARE and with FOR UPDATE, so every lifecycle act still excludes every other, and
-- L1-F2's and L1-F4's designed serialisation (their guards' FOR SHARE) is kept. What stops is only a foreign key's
-- check waiting on a lifecycle act. Nothing else in the functions changes.
do $$
declare f record; v text; neu text; n int;
begin
  for f in select * from (values
      ('public.akhiri_tugas_staf', 1), ('public.aktifkan_kembali_akun', 1), ('public.buka_kembali_akun', 1),
      ('public.confirm_my_name', 1), ('public.correct_person_name', 1), ('public.daftarkan_kembali', 1),
      ('public.enrol_for_professional_learning', 1), ('public.enrollments_programme_alone', 1),
      ('public.hapus_data_pribadi', 2), ('public.issue_institutional_id', 1), ('public.kenaikan_tetapkan', 1),
      ('public.minta_akun', 1), ('public.sekolah_memegang', 1), ('public.tangguhkan_akun', 1), ('public.ubah_peran', 1)
    ) x(fn, harap)
  loop
    if (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = split_part(f.fn, '.', 2)) <> 1 then
      raise exception 'NOKEY: % is not exactly one function', f.fn;
    end if;
    select pg_get_functiondef(p.oid) into v from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = split_part(f.fn, '.', 2);
    neu := regexp_replace(v, '((?:select|perform)[^;]*from\s+public\.persons\M[^;]*?)\mfor update\M', '\1for no key update', 'gi');
    n := (length(neu) - length(v)) / length(' no key');
    if n <> f.harap then raise exception 'NOKEY: % had % person lock(s) to change, expected %', f.fn, n, f.harap; end if;
    execute neu;
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare v text;
begin
  select string_agg(p.proname, ', ') into v from pg_proc p where p.pronamespace = 'public'::regnamespace
     and p.prosrc ~* '(select|perform)[^;]*from\s+(public\.)?persons\y[^;]*for\s+update';
  if v is not null then raise exception 'NOKEY: a person is still locked FOR UPDATE by: %', v; end if;
end $$;
