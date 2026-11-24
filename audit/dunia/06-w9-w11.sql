-- Ruling 79's audit world (track 3c), part 6: W9 (J4), W10 and W11 (J5).
--
--   W9   Galih Pratama, 8A: W3's Pemetaan Awal finished; the Uji Penguasaan STARTED, 2 questions answered, left open
--        (the teacher's «Siapa» open and the second device are the capture's moments, not stored states)
--   W10  Ayu Lestari, a teacher new to PINTAR: EDUCATOR of 8A (W3) and of 8C (W11), no prior action
--   W11  8C: four learners, no chapter given, no result at all

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare k8c uuid; w3 jsonb := dunia.ambil('w3.bab')::jsonb; m text; n int := 0;
begin
  perform dunia.jaga();

  -- W9
  perform dunia.murid_email('w9.murid', 'galih.pratama@dunia.pintar.test', 'Sintetis-GalihP-81!', 'Galih Pratama',
                            'smp.sekolah', 'smp.ta', 'smp.prog', array['smp.ang8', 'smp.kelas8a'], 'smp.admin', true);
  perform dunia.duduk('w9.murid', (w3 ->> 'pa')::uuid);
  perform dunia.simpan('w9.sesi', dunia.duduk('w9.murid', (w3 ->> 'up')::uuid, '{}', 2)::text);

  -- W11: 8C and its learners
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (dunia.ambil('smp.sekolah')::uuid, dunia.ambil('smp.ang8')::uuid, 'CLASS', '8C', dunia.ambil('smp.ta')::uuid)
  returning id into k8c;
  insert into public.classes (node_id, subject, status) values (k8c, 'Matematika', 'ACTIVE');
  perform dunia.simpan('smp.kelas8c', k8c::text);
  foreach m in array array['Kevin Sanjaya', 'Laras Ayuningtyas', 'Made Wirawan', 'Nadia Putri'] loop
    n := n + 1;
    perform dunia.murid_email('w11.murid' || n, lower(replace(m, ' ', '.')) || '@dunia.pintar.test',
                              'Sintetis-8C-' || n || '-82!', m, 'smp.sekolah', 'smp.ta', 'smp.prog',
                              array['smp.ang8', 'smp.kelas8c'], 'smp.admin', true);
  end loop;

  -- W10: the new teacher of 8A and 8C (setup complete: she has signed in once, and done nothing since)
  perform dunia.staf('w10.guru', 'ayu.lestari@dunia.pintar.test', 'Sintetis-AyuL-83!', 'Ayu Lestari', 'EDUCATOR', dunia.ambil('smp.kelas8a')::uuid);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
  values (((dunia.ambil('w10.guru'))::jsonb ->> 'person')::uuid, 'EDUCATOR', k8c, now() + interval '10 years');

  -- checks
  if (select finalized_at from public.assessment_sessions where id = dunia.ambil('w9.sesi')::uuid) is not null then
    raise exception 'W9: the sitting was meant to stay open';
  end if;
  if exists (select 1 from public.learning_assignments where node_id = k8c) then
    raise exception 'W11: 8C was meant to have no chapter';
  end if;
  raise notice 'dunia: W9 (Galih mid-sitting, 2 answered), W10 (Ayu, new teacher of 8A and 8C), W11 (8C, four learners, nothing given)';
end $$;
