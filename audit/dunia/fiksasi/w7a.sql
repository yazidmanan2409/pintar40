-- Ruling 79's audit world (track 3c), fixture W7a (J3's «the retake abandoned», first moment): a per-journey fixture,
-- applied to the world already loaded (muat.sh --fiksasi w7a), never part of the shared world.
--   Sinta's teacher (j3.guru, Bambang Sutrisno, CAN_MANAGE_SITTINGS: a learner cannot ask herself) requests a retake of the Uji
--   Penguasaan Sinta sat (J3's Sinta in the dev/CI bootstrap tenant, 13-j2-j3.sql; minta_percobaan); the head of department
--   (w14.kaprodi, CAN_REVIEW_INTEGRITY) approves it (putuskan_percobaan); Sinta begins the retake and answers two
--   questions, then leaves it open. hasil.ulang_berjalan is due on her side and the teacher's; her first result is in force.
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare r jsonb; req uuid; s uuid;
begin
  perform dunia.jaga();
  perform dunia.sebagai('j3.guru');
  r := public.minta_percobaan(dunia.ambil('j3.sesi')::uuid, 'Sinta sudah belajar ulang soal yang wajib benar (dunia audit W7).');
  perform dunia.sebagai(null);
  req := (r ->> 'id')::uuid;
  if req is null or (r ->> 'ok')::boolean is not true then raise exception 'W7a: no retake request was recorded (%)', r; end if;
  perform dunia.sebagai('w14.kaprodi');
  perform public.putuskan_percobaan(req, true, 'Disetujui: sudah belajar ulang (dunia audit W7).');
  perform dunia.sebagai(null);
  s := dunia.duduk('j3.murid_resmi', ((dunia.ambil('j3.bab'))::jsonb ->> 'up')::uuid, '{}', 2);
  perform dunia.simpan('w7.permintaan', req::text);
  perform dunia.simpan('w7.sesi_ulang', s::text);
  if (select status::text from public.assessment_sessions where id = s) not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    raise exception 'W7a: the retake is not open';
  end if;
  raise notice 'dunia: W7a (Sinta''s retake approved and begun, two answers, open)';
end $$;
