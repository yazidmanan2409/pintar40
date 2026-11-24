-- Ruling 79's audit world (track 3c), fixture W7a (J3's «the retake abandoned», first moment): a per-journey fixture,
-- applied to the world already loaded (muat.sh --fiksasi w7a), never part of the shared world.
--   Sinta's teacher (smp.guru8b, CAN_MANAGE_SITTINGS: a learner cannot ask herself) requests a retake of the Uji
--   Penguasaan Sinta (W6) sat (minta_percobaan); the head of department
--   (smp.wakasek, CAN_REVIEW_INTEGRITY) approves it (putuskan_percobaan); Sinta begins the retake and answers two
--   questions, then leaves it open. hasil.ulang_berjalan is due on her side and the teacher's; her W6 result is in force.
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare r jsonb; req uuid; s uuid;
begin
  perform dunia.jaga();
  perform dunia.sebagai('smp.guru8b');
  r := public.minta_percobaan(dunia.ambil('w6.sesi')::uuid, 'Sinta sudah belajar ulang soal yang wajib benar (dunia audit W7).');
  perform dunia.sebagai(null);
  req := (r ->> 'id')::uuid;
  if req is null or (r ->> 'ok')::boolean is not true then raise exception 'W7a: no retake request was recorded (%)', r; end if;
  perform dunia.sebagai('smp.wakasek');
  perform public.putuskan_percobaan(req, true, 'Disetujui: sudah belajar ulang (dunia audit W7).');
  perform dunia.sebagai(null);
  s := dunia.duduk('w6.murid', ((dunia.ambil('w6.bab'))::jsonb ->> 'up')::uuid, '{}', 2);
  perform dunia.simpan('w7.permintaan', req::text);
  perform dunia.simpan('w7.sesi_ulang', s::text);
  if (select status::text from public.assessment_sessions where id = s) not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    raise exception 'W7a: the retake is not open';
  end if;
  raise notice 'dunia: W7a (Sinta''s retake approved and begun, two answers, open)';
end $$;
