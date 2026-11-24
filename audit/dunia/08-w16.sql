-- Ruling 79's audit world (track 3c), part 8: W16 (J9) and the WITA school (J12's banners).
--
-- W16 (Daisy's §3): two schools; a learner at A with an open transfer request to B; A's year ready to promote.
--   A  SMP Sintetis Flamboyan (WIB): this school year and the next; class 7A with four learners; Qori Ananda has an
--      open transfer request to B, made by A's admin (transfer_minta: CAN_AUTHORIZE_TRANSFER at the sending school)
--   B  SMP Sintetis Kenari (WITA, Asia/Makassar): its own admin, this year, class 7A to receive into. It is also the
--      world's WITA school, for J12's banners.
-- The two schools stand apart from Melati and Cendekia, so J9's promotion closes nobody else's year.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

create function dunia.sekolah(p_k text, p_nama text, p_slug text, p_ns text, p_zona text, p_jenjang text,
                              p_tingkat text, p_kelas text) returns uuid language plpgsql as $$
declare s uuid; ta uuid; fak uuid; dep uuid; prog uuid; ang uuid; kls uuid;
begin
  insert into public.institutions (name, slug, is_synthetic, namespace) values (p_nama, p_slug, true, p_ns) returning id into s;
  perform dunia.sebagai('pintar.admin1');
  perform public.atur_zona_waktu_sekolah(s, p_zona);
  perform dunia.sebagai(null);
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (s, dunia.ta_nama(), dunia.ta_mulai(), dunia.ta_selesai()) returning id into ta;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, s, 'FACULTY', p_jenjang) returning id into fak;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, fak, 'DEPARTMENT', 'Umum') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (s, dep, 'PROGRAMME', p_jenjang || ' Reguler') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (s, prog, 'COHORT', p_tingkat || ' — ' || dunia.ta_nama(), ta) returning id into ang;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (s, ang, 'CLASS', p_kelas, ta) returning id into kls;
  insert into public.classes (node_id, subject, status) values (kls, 'Matematika', 'ACTIVE');
  perform dunia.simpan(p_k || '.sekolah', s::text); perform dunia.simpan(p_k || '.ta', ta::text);
  perform dunia.simpan(p_k || '.prog', prog::text); perform dunia.simpan(p_k || '.ang', ang::text);
  perform dunia.simpan(p_k || '.kelas', kls::text); perform dunia.simpan(p_k || '.dep', dep::text);
  return s;
end $$;

do $$
declare a uuid; b uuid; ta2 uuid; m text; n int := 0; e uuid; t uuid;
begin
  perform dunia.jaga();
  a := dunia.sekolah('w16a', 'SMP Sintetis Flamboyan', 'dunia-smp-flamboyan', 'FLB', 'Asia/Jakarta', 'SMP', 'Kelas 7', '7A');
  b := dunia.sekolah('w16b', 'SMP Sintetis Kenari', 'dunia-smp-kenari', 'KNR', 'Asia/Makassar', 'SMP', 'Kelas 7', '7A');
  perform dunia.simpan('wita.sekolah', b::text);

  -- A's next school year: the promotion's destination
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (a, 'TA ' || (extract(year from dunia.ta_mulai())::int + 1) || '/' || (extract(year from dunia.ta_mulai())::int + 2),
          dunia.ta_selesai() + 15, dunia.ta_selesai() + 15 + 349) returning id into ta2;
  perform dunia.simpan('w16a.ta_baru', ta2::text);

  perform dunia.staf('w16a.admin', 'admin.flamboyan@dunia.pintar.test', 'Sintetis-FlamboyanAdmin-61!', 'Teguh Wibowo', 'INSTITUTION_ADMIN', a);
  perform dunia.staf('w16a.guru', 'guru7a.flamboyan@dunia.pintar.test', 'Sintetis-FlamboyanGuru-62!', 'Siti Rahmawati', 'EDUCATOR', dunia.ambil('w16a.kelas')::uuid);
  perform dunia.staf('w16b.admin', 'admin.kenari@dunia.pintar.test', 'Sintetis-KenariAdmin-63!', 'Andi Mappanyompa', 'INSTITUTION_ADMIN', b);

  foreach m in array array['Qori Ananda', 'Rangga Saputra', 'Sekar Ayu', 'Taufik Hidayat'] loop
    n := n + 1;
    perform dunia.murid_email('w16.murid' || n, lower(replace(m, ' ', '.')) || '@dunia.pintar.test',
                              'Sintetis-7A-' || n || '-64!', m, 'w16a.sekolah', 'w16a.ta', 'w16a.prog',
                              array['w16a.ang', 'w16a.kelas'], 'w16a.admin', true);
  end loop;

  -- Qori's open transfer to B, requested by A's admin
  select en.id into e from public.enrollments en
   where en.person_id = ((dunia.ambil('w16.murid1'))::jsonb ->> 'person')::uuid and en.institution_id = a and en.status = 'ACTIVE';
  perform dunia.sebagai('w16a.admin');
  perform public.transfer_minta(e, b, 'Keluarga pindah ke Makassar (dunia audit W16)');
  perform dunia.sebagai(null);
  select id into t from public.transfers where from_enrollment_id = e and status in ('REQUESTED', 'AUTHORIZED');
  if t is null then raise exception 'W16: no open transfer for Qori'; end if;
  perform dunia.simpan('w16.transfer', t::text);
  raise notice 'dunia: W16 (Flamboyan WIB with next year; Qori''s open transfer to Kenari WITA)';
end $$;
