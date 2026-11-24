-- Ruling 79's audit world (track 3c), fixture W7b (J3's «the retake abandoned», second moment), applied after W7a.
--   The open retake is ended by Sinta's teacher, not counted (akhiri_pengerjaan, NOT_COUNTED, with a reason: the
--   teacher's own end of a sitting): never finalised. The line goes; the W6 result and its verdict stay.
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('w7.sesi_ulang')::uuid;
begin
  perform dunia.jaga();
  perform dunia.sebagai('smp.guru8b');
  perform public.akhiri_pengerjaan(s, 'NOT_COUNTED', 'Uji ulang tidak dilanjutkan hari ini (dunia audit W7).');
  perform dunia.sebagai(null);
  if (select status::text from public.assessment_sessions where id = s) in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'FINALIZED') then
    raise exception 'W7b: the retake was not ended';
  end if;
  raise notice 'dunia: W7b (Sinta''s retake ended unfinished)';
end $$;
