-- Ruling 79's audit world (track 3c), part 13: J2's and J3's own copy of W3's chapter, in the dev/CI bootstrap tenant
-- (Bob, 24 Nov 02:39: J2 ends at a certificate and its public check, J3 at «Lulus.» and the certificate, and only
-- OFFICIAL evidence certifies, INV-20). W14's five conditions hold unchanged (new rows only, fingerprinted seed, the
-- world-only namespace, certificates only through the product's route, the local-only loader), and the captures are
-- labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)». W3 to W6 at Cendekia stay for the other journeys.
--
--   Angkatan «Kelas 8 (dunia J2/J3)» under the bootstrap's Matematika programme; the head of department Made Wirawan
--   (w14.kaprodi) reviews the chapters and decides retakes; the school admin is w14.admin.
--   J2  class «8J (dunia)», teacher Rina Kartika; W3's chapter (w3.spec, sealed at 60); Hana Wirawan (j2.murid_resmi),
--       by email, activated, NOTHING SAT: J2 walks it from the Pemetaan Awal to the certificate.
--   J3  class «8K (dunia)», teacher Bambang Sutrisno; the same chapter with an attempt limit of 1; Sinta Maharani
--       (j3.murid_resmi): 5 of 6 (83 %) against 60 % with the must-be-right question missed: «Belum lulus.» by the gate.
--       J3's fixtures W7 and W8 follow her here (fiksasi/w7a.sql, w7b.sql, w8.sql).

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare b uuid := dunia.ambil('boot.sekolah')::uuid; ta uuid := dunia.ambil('boot.ta')::uuid; ang uuid; kj uuid; kk uuid;
        spec jsonb := dunia.ambil('w3.spec')::jsonb; j3 jsonb;
begin
  perform dunia.jaga();
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (b, dunia.ambil('boot.prog')::uuid, 'COHORT', 'Kelas 8 (dunia J2/J3)', ta) returning id into ang;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (b, ang, 'CLASS', '8J (dunia)', ta) returning id into kj;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (b, ang, 'CLASS', '8K (dunia)', ta) returning id into kk;
  insert into public.classes (node_id, subject, status) values (kj, 'Matematika', 'ACTIVE'), (kk, 'Matematika', 'ACTIVE');
  perform dunia.simpan('j23.ang', ang::text); perform dunia.simpan('j2.kelas', kj::text); perform dunia.simpan('j3.kelas', kk::text);

  perform dunia.staf('j2.guru', 'guru8j.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootGuru8J-95!', 'Rina Kartika', 'EDUCATOR', kj);
  perform dunia.staf('j3.guru', 'guru8k.bootstrap-dunia@dunia.pintar.test', 'Sintetis-BootGuru8K-96!', 'Bambang Sutrisno', 'EDUCATOR', kk);
  perform dunia.murid_email('j2.murid_resmi', 'hana.wirawan.resmi@dunia.pintar.test', 'Sintetis-HanaR-97!', 'Hana Wirawan',
                            'boot.sekolah', 'boot.ta', 'boot.prog', array['j23.ang', 'j2.kelas'], 'w14.admin', true);
  perform dunia.murid_email('j3.murid_resmi', 'sinta.maharani.resmi@dunia.pintar.test', 'Sintetis-SintaR-98!', 'Sinta Maharani',
                            'boot.sekolah', 'boot.ta', 'boot.prog', array['j23.ang', 'j3.kelas'], 'w14.admin', true);

  perform dunia.bab(spec || jsonb_build_object('sekolah', 'boot.sekolah', 'kelas', 'j2.kelas', 'ta', 'boot.ta', 'penulis', 'j2.guru',
                                               'peninjau', 'w14.kaprodi', 'admin', 'w14.admin', 'simpan', 'j2.bab'));
  j3 := dunia.bab(spec || jsonb_build_object('sekolah', 'boot.sekolah', 'kelas', 'j3.kelas', 'ta', 'boot.ta', 'penulis', 'j3.guru',
                                             'peninjau', 'w14.kaprodi', 'admin', 'w14.admin', 'batas_percobaan', 1,
                                             'judul', (spec ->> 'judul') || ' (8K)', 'simpan', 'j3.bab'));
  perform dunia.duduk('j3.murid_resmi', (j3 ->> 'pa')::uuid);
  perform dunia.simpan('j3.sesi', dunia.duduk('j3.murid_resmi', (j3 ->> 'up')::uuid, array['Berapakah x jika 2x + 3 = 11?'])::text);
  raise notice 'dunia: J2/J3 at the bootstrap (Hana untouched in 8J; Sinta 83 %% with the must-be-right missed in 8K, limit 1)';
end $$;

-- the states' own checks: OFFICIAL evidence; Sinta's result as W6's (the gate failed); Hana with nothing sat
do $$
declare r record;
begin
  if public.effective_evidence_class(dunia.ambil('j3.sesi')::uuid) <> 'OFFICIAL' then raise exception 'J3: Sinta''s sitting is not OFFICIAL'; end if;
  select mastery, safety_gate_passed into r from public.assessment_results where session_id = dunia.ambil('j3.sesi')::uuid;
  if r.mastery < 0.6 or r.safety_gate_passed is distinct from false then
    raise exception 'J3: Sinta''s result is not 83 %% with the gate failed (mastery %, gate %)', r.mastery, r.safety_gate_passed;
  end if;
  if exists (select 1 from public.assessment_sessions where person_id = ((dunia.ambil('j2.murid_resmi'))::jsonb ->> 'person')::uuid) then
    raise exception 'J2: Hana was meant to have sat nothing';
  end if;
  raise notice 'dunia: J2/J3 checks: OFFICIAL; Sinta % with the gate failed; Hana untouched', r.mastery;
end $$;
