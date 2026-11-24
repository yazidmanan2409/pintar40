-- Ruling 79's audit world (track 3c), part 4: W2, activated learners and staff (J1's branches, J10).
--
-- W2 (Daisy's §3): activated learners, one with a personal PIN and one with a reset PIN, and staff with email accounts.
--   w2.murid_pin    SMP Cendekia 8A, by email, setup complete, a personal PIN set by herself (set_my_pin, as her)
--   w2.murid_reset  SMP Cendekia 8A, by email, setup complete, her PIN set and then RESET by the school admin
--                   (admin_reset_recovery: the PIN needs setting again: «belum punya PIN yang bisa dipakai»)
--   w2.guru_pin     the 8A teacher's own personal PIN (staff: J10's session lock by PIN)
--   w2.murid_baru   SMP Cendekia 8A, by email, set-up NOT done (J10's account set-up: PIN, «Komputer siapa ini?»)
-- Staff with email accounts already stand in both schools (01-, 03-). The PINs are synthetic and fixed.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
begin
  perform dunia.jaga();
  perform dunia.murid_email('w2.murid_pin', 'intan.permatasari@dunia.pintar.test', 'Sintetis-IntanP-61!', 'Intan Permatasari',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', true);
  perform dunia.sebagai('w2.murid_pin');
  perform public.set_my_pin('4829');
  perform dunia.sebagai(null);
  perform dunia.simpan('w2.murid_pin.pin', '4829');

  perform dunia.murid_email('w2.murid_reset', 'joko.susilo@dunia.pintar.test', 'Sintetis-JokoS-62!', 'Joko Susilo',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', true);
  perform dunia.sebagai('w2.murid_reset');
  perform public.set_my_pin('7392');
  perform dunia.sebagai('smp.admin');
  perform public.admin_reset_recovery(((dunia.ambil('w2.murid_reset'))::jsonb ->> 'person')::uuid,
                                      'Dunia audit W2: PIN lupa, diatur ulang oleh sekolah');
  perform dunia.sebagai(null);

  -- J10's account set-up (moved from J1, 24 Nov): an email learner whose account exists but whose set-up is NOT done
  -- (no PIN, the computer question not answered): she makes a personal PIN and answers «Komputer siapa ini?»
  perform dunia.murid_email('w2.murid_baru', 'wulan.sari@dunia.pintar.test', 'Sintetis-WulanS-63!', 'Wulan Sari',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', false);

  perform dunia.sebagai('smp.guru8a');
  perform public.set_my_pin('6150');
  perform dunia.sebagai(null);
  perform dunia.simpan('w2.guru_pin.pin', '6150');

  -- W2's own checks
  if not exists (select 1 from public.person_pins pp where pp.person_id = ((dunia.ambil('w2.murid_pin'))::jsonb ->> 'person')::uuid
                  and not pp.reset_required) then
    raise exception 'W2: the learner with a personal PIN has none';
  end if;
  if not exists (select 1 from public.person_pins pp where pp.person_id = ((dunia.ambil('w2.murid_reset'))::jsonb ->> 'person')::uuid
                  and pp.reset_required) then
    raise exception 'W2: the learner with a reset PIN is not marked for a new PIN';
  end if;
  raise notice 'dunia: W2 two activated learners (a PIN; a reset PIN), one with set-up pending, and a teacher''s PIN';
end $$;
