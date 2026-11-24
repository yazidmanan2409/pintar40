-- Ruling 79's audit world (track 3c), fixture W9-pemeliharaan (J4's «maintenance starts», first moment: T−15): a
-- per-journey fixture. Admin PINTAR Hendra (pintar.admin1) schedules a platform maintenance starting in 10 minutes,
-- through the product's own function (schedule_maintenance), while Galih's Uji Penguasaan is open: inside the
-- 15-minute line (staff) and the 60-minute warning (everyone). Its start, the second moment, is w9-pemeliharaan-mulai.
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare w uuid;
begin
  perform dunia.jaga();
  perform dunia.sebagai('pintar.admin1');
  w := public.schedule_maintenance(true, '{}'::uuid[], now() + interval '10 minutes', now() + interval '70 minutes',
         'Pemeliharaan rutin (dunia audit J4).', 'Pemeliharaan rutin', false, '{}'::uuid[], null);
  perform dunia.sebagai(null);
  if w is null then select id into w from public.maintenance_windows order by created_at desc limit 1; end if;
  perform dunia.simpan('w9.jendela', w::text);
  raise notice 'dunia: W9-pemeliharaan (platform maintenance in 10 minutes)';
end $$;
