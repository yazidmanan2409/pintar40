-- Ruling 79's audit world (track 3c), fixture W12-tujuan-lain (J6's «a stale form», AI_TUJUAN_LAIN): while the AI form
-- is open on the package's first lesson, another author REPLACES that lesson's first objective: it moves to the
-- second lesson, and a new objective takes its place in the first. The form still names the old one, so the request
-- is refused (the lesson still has an objective, so the refusal is the stale one, not «no objective»). Captures
-- labelled «keadaan fiksasi: tujuan pembelajaran diganti saat formulir terbuka».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare k uuid := (dunia.ambil('w12.paket')::jsonb ->> 'kursus')::uuid; l1 uuid; l2 uuid; o uuid;
begin
  perform dunia.jaga();
  select l.id into l1 from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = k order by m.ordinal, l.ordinal limit 1;
  select l.id into l2 from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = k order by m.ordinal, l.ordinal offset 1 limit 1;
  select id into o from public.learning_objectives where lesson_id = l1 order by code limit 1;
  if o is null or l2 is null then raise exception 'W12-tujuan-lain: no objective to move'; end if;
  update public.learning_objectives set lesson_id = l2 where id = o;
  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
  select l1, institution_id, code || '-B', 'Menyelesaikan soal perbandingan senilai dengan tabel.', bloom, is_core
    from public.learning_objectives where id = o;
  raise notice 'dunia: W12-tujuan-lain (the first lesson''s objective replaced: the old one moved to the second lesson)';
end $$;
