-- Ruling 79's audit world (track 3c), fixture W15-kartu (Sharon's PIN-reload probe, ledger a73874d6; Bob 21:12Z): a
-- W15-style school with learners waiting for class cards. SD Sintetis Anggrek gains its year, its structure and classes
-- 1A and 1B with three recorded learners each (invented names; the school's own numbers issued as Pendataan issues them), none
-- with an account, so the admin makes their cards on Aktivasi. Captures labelled «keadaan fiksasi: kelas 1A Anggrek
-- dengan tiga murid menunggu kartu».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('w15.sekolah')::uuid; ta uuid; fak uuid; dep uuid; prog uuid; ang uuid; k uuid; p uuid; e uuid; m text; kk text; nm text[];
begin
  perform dunia.jaga();
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (s, dunia.ta_nama(), dunia.ta_mulai(), dunia.ta_selesai()) returning id into ta;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, s, 'FACULTY', 'Sekolah Dasar') returning id into fak;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, fak, 'DEPARTMENT', 'Kelas Rendah') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, dep, 'PROGRAMME', 'SD Reguler') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (s, prog, 'COHORT', 'Kelas 1', ta) returning id into ang;
  -- two classes, so each probe sequence starts from a sheet just made: 1A (made → Reload), 1B (made → leave → Back)
  foreach kk in array array['1A', '1B'] loop
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (s, ang, 'CLASS', kk, ta) returning id into k;
    insert into public.classes (node_id, subject, status) values (k, 'Matematika', 'ACTIVE');
    nm := case kk when '1A' then array['Laras Kinanti', 'Yoga Prasetya', 'Dewi Anjani'] else array['Bagas Saputra', 'Citra Ayu', 'Fajar Nugraha'] end;
    foreach m in array nm loop
      insert into public.persons (display_name) values (m) returning id into p;
      perform dunia.sebagai('w15.admin');
      perform public.issue_institutional_id(p, s);
      perform dunia.sebagai(null);
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (p, s, ta, prog, 'ACTIVE') returning id into e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e, ang, ta), (e, k, ta);
    end loop;
    perform dunia.simpan('w15.kelas' || lower(kk), k::text);
  end loop;
  raise notice 'dunia: W15-kartu (Anggrek: 1A and 1B, three learners each, waiting for class cards)';
end $$;
