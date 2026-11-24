-- Ruling 79's audit world (track 3c), part 9: W15 (J8), an empty school.
--
--   W15  SD Sintetis Anggrek (WIB): the school and its one Admin sekolah, and nothing else: no school year, no
--        structure, no people, no pass mark. J8 sets the year up through the screens. The workbook with planted errors
--        is made by J8's capture from the template the app itself offers (so it is always the app's current template).

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare s uuid;
begin
  perform dunia.jaga();
  insert into public.institutions (name, slug, is_synthetic, namespace) values ('SD Sintetis Anggrek', 'dunia-sd-anggrek', true, 'AGR')
  returning id into s;
  perform dunia.simpan('w15.sekolah', s::text);
  perform dunia.sebagai('pintar.admin1');
  perform public.atur_zona_waktu_sekolah(s, 'Asia/Jakarta');
  perform dunia.sebagai(null);
  perform dunia.staf('w15.admin', 'admin.anggrek@dunia.pintar.test', 'Sintetis-AnggrekAdmin-71!', 'Wahyu Nugroho', 'INSTITUTION_ADMIN', s);
  if exists (select 1 from public.academic_periods where institution_id = s)
     or exists (select 1 from public.org_nodes where institution_id = s and id <> s) then
    raise exception 'W15: the school was meant to be empty';
  end if;
  raise notice 'dunia: W15 (SD Sintetis Anggrek, empty, one Admin sekolah)';
end $$;
