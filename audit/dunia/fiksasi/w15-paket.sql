-- Ruling 79's audit world (track 3c), fixture W15-paket (J8's pass marks): a pass mark is set per lesson line of the
-- school (school_lesson_lines: every course of the school, a draft included), and W15 starts with none, so «Batas
-- ketuntasan» has nothing to set (Daisy, TEMUAN-J8). This gives SD Sintetis Anggrek one draft Studio package of its
-- own, as a teacher's first upload would leave it (INGESTED, no lessons yet), authored by its admin. Captures labelled
-- «keadaan fiksasi: satu paket draf di Anggrek».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('w15.sekolah')::uuid; a uuid := (dunia.ambil('w15.admin')::jsonb ->> 'person')::uuid; k uuid;
begin
  perform dunia.jaga();
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (s, 'Matematika', 'SD', 'Kelas 1', 'Bilangan sampai 20', a) returning id into k;
  perform dunia.simpan('w15.paket', k::text);
  if not exists (select 1 from public.school_lesson_lines(s) l where l.course_id = k) then
    raise exception 'W15-paket: the package is not a lesson line of the school';
  end if;
  raise notice 'dunia: W15-paket (Anggrek: one draft package, «Bilangan sampai 20»)';
end $$;
