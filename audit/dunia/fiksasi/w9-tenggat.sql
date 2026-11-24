-- Ruling 79's audit world (track 3c), fixture W9-tenggat (J4's «the time runs out during the gap»): a per-journey
-- fixture, applied to the world already loaded (muat.sh --fiksasi w9-tenggat), never part of the shared world.
--   Galih's open Uji Penguasaan (W9) gets a deadline 75 seconds from now, so that, while he is away, it runs out. A
--   sitting's deadline is its assignment's window (months away) and only moves later in the product; Daisy's script
--   says «it needs the clock moved», and this moves it for this one sitting.
--   A FIXTURE-ONLY STATE, WRITTEN PAST TODAY'S GUARD: the sitting's state guard (assessment_sessions_a1_state) is
--   disabled ON THE TABLE FOR THIS ONE UPDATE, inside the fixture's one transaction, and enabled again at once; the
--   fixture fails unless it is. Captures labelled «keadaan fiksasi: tenggat satu pengerjaan dimajukan».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('w9.sesi')::uuid; n int;
begin
  perform dunia.jaga();
  alter table public.assessment_sessions disable trigger assessment_sessions_a1_state;
  update public.assessment_sessions set authoritative_deadline = now() + interval '75 seconds'
   where id = s and status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
  get diagnostics n = row_count;
  alter table public.assessment_sessions enable trigger assessment_sessions_a1_state;
  if n <> 1 then raise exception 'W9-tenggat: Galih''s sitting is not open (% row)', n; end if;
  if (select tgenabled from pg_trigger where tgrelid = 'public.assessment_sessions'::regclass and tgname = 'assessment_sessions_a1_state') <> 'O' then
    raise exception 'W9-tenggat: the state guard is not enabled again';
  end if;
  perform dunia.simpan('w9.tenggat', (now() + interval '75 seconds')::text);
  raise notice 'dunia: W9-tenggat (Galih''s deadline in 75 seconds)';
end $$;
