-- Ruling 79's audit world (track 3c), fixture W9-pemeliharaan-mulai (J4's «maintenance starts», second moment: stage 0),
-- after w9-pemeliharaan: Admin PINTAR starts the planned maintenance now (change_maintenance, the product's own
-- «Mulai sekarang»), with Galih's Uji Penguasaan still open.
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
begin
  perform dunia.jaga();
  perform dunia.sebagai('pintar.admin1');
  perform public.change_maintenance(dunia.ambil('w9.jendela')::uuid, 'MULAI', 'Mulai lebih awal (dunia audit J4).');
  perform dunia.sebagai(null);
  raise notice 'dunia: W9-pemeliharaan-mulai (the maintenance started now)';
end $$;
