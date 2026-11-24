-- Ruling 79's audit world (track 3c), fixture W15-staf (J8's roles, applied after J8's L1 has built the structure): bulk
-- intake records learners only today (PERAN_PENDATAAN = ["STUDENT"], BOB-10 interim), and «Peran & akses» finds only
-- people with an ACTIVE enrolment (school_people_page), so a new school's staff cannot be reached for a role. This
-- records two staff members as the coming staff intake would leave them: the person, the school's own number, an
-- ACTIVE enrolment in the staff Bagian's programme. Captures labelled «keadaan fiksasi: dua staf didata (jalur staf
-- pendataan belum ada)».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('w15.sekolah')::uuid; ta uuid; prog uuid; p uuid; m text;
begin
  perform dunia.jaga();
  select id into ta from public.academic_periods where institution_id = s order by starts_on desc limit 1;
  select pr.id into prog from public.org_nodes pr join public.org_nodes d on d.id = pr.parent_id
   where pr.institution_id = s and pr.kind = 'PROGRAMME' and d.name = 'Guru dan Staf' limit 1;
  if ta is null or prog is null then raise exception 'W15-staf: J8''s L1 has not built the year and the staff Bagian yet'; end if;
  foreach m in array array['Siti Rahma', 'Dodi Firmansyah'] loop
    insert into public.persons (display_name) values (m) returning id into p;
    perform dunia.sebagai('w15.admin');
    perform public.issue_institutional_id(p, s);
    perform dunia.sebagai(null);
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (p, s, ta, prog, 'ACTIVE');
  end loop;
  raise notice 'dunia: W15-staf (two staff members recorded in Guru dan Staf)';
end $$;
