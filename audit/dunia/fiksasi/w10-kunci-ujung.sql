-- Ruling 79's audit world (track 3c), fixture W10-kunci-ujung (J10's session lock, its end): every open shared or card
-- session is made to have been locked for 61 minutes (sesi_keadaan: 60 minutes locked → BERAKHIR), so the lock
-- screen says the session has ended. Captures labelled «keadaan fiksasi: kunci 61 menit».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare n int;
begin
  perform dunia.jaga();
  update public.device_sessions set last_activity_at = now() - interval '66 minutes', locked_at = now() - interval '61 minutes'
   where ended_at is null and mode <> 'PERSONAL';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'W10-kunci-ujung: no open shared or card session'; end if;
  raise notice 'dunia: W10-kunci-ujung (% session(s) locked 61 minutes)', n;
end $$;
