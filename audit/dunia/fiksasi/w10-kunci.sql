-- Ruling 79's audit world (track 3c), fixture W10-kunci (J10's session lock, the branches): every open shared or card
-- session's last activity is moved 6 minutes back, as if the computer had stood unused past the 5-minute lock
-- (sesi_keadaan: last_activity_at + 5 minutes <= now → TERKUNCI). The main walk waits the real 5 minutes once; the
-- branches use this. Captures labelled «keadaan fiksasi: waktu diam dimajukan».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare n int;
begin
  perform dunia.jaga();
  update public.device_sessions set last_activity_at = now() - interval '6 minutes'
   where ended_at is null and mode <> 'PERSONAL' and locked_at is null;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'W10-kunci: no open shared or card session to lock'; end if;
  raise notice 'dunia: W10-kunci (% open session(s) idle 6 minutes)', n;
end $$;
