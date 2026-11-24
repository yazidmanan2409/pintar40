-- Ruling 79's audit world (track 3c), part 12b, A LATER MOMENT (its own transaction, after the main load): W18's move.
--   Lukman (w18.murid10), who sat «Gaya dan Gerak» in 8R, is moved to 8Q by the school admin (move_learner_to_class),
--   then sits its Uji Penguasaan again there, and sits «Sistem Pencernaan» in 8Q. Committed apart from the main load so
--   that his second sitting is truly later than his first (each transaction has its own now()).

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare mem uuid; r1 jsonb := dunia.ambil('w18.bab1')::jsonb; r2 jsonb := dunia.ambil('w18.bab2')::jsonb;
begin
  perform dunia.jaga();
  select m.id into mem from public.memberships m join public.enrollments e on e.id = m.enrollment_id
   where e.person_id = ((dunia.ambil('w18.murid10'))::jsonb ->> 'person')::uuid
     and m.node_id = dunia.ambil('w18.kelas_r')::uuid and m.valid_to is null;
  perform dunia.sebagai('w14.admin');
  perform public.move_learner_to_class(mem, dunia.ambil('w18.kelas_q')::uuid);
  perform dunia.sebagai(null);
  perform dunia.simpan('w18.sesi_pindah_baru', dunia.duduk('w18.murid10', (r2 ->> 'up')::uuid)::text);
  perform dunia.duduk('w18.murid10', (r1 ->> 'pa')::uuid);
  perform dunia.duduk('w18.murid10', (r1 ->> 'up')::uuid, array['Di mana sari makanan diserap?']);
  if (select finalized_at from public.assessment_sessions where id = dunia.ambil('w18.sesi_pindah_baru')::uuid)
     <= (select finalized_at from public.assessment_sessions where id = dunia.ambil('w18.sesi_pindah_lama')::uuid) then
    raise exception 'W18: Lukman''s second sitting is not later than his first';
  end if;
  raise notice 'dunia: W18, the later moment (Lukman moved to 8Q and sat «Gaya dan Gerak» again)';
end $$;

-- W18's own checks: the domains as the product's calculator reads them, and the classes' counts
do $$
declare d jsonb; v_moved boolean; v_learners boolean;
begin
  perform dunia.sebagai('w18.dekan');
  select public.metric_evaluate('institution.competency_outcomes', dunia.ambil('boot.sekolah')::uuid, dunia.ambil('boot.sekolah')::uuid) into d;
  perform dunia.sebagai(null);
  v_moved := jsonb_path_exists(d, '$.value[*] ? (@.code == "IPA8-G1" && @.withheld == "moved")');
  v_learners := jsonb_path_exists(d, '$.value[*] ? (@.code == "IPA8-L1" && @.withheld == "learners")');
  if not jsonb_path_exists(d, '$.value[*] ? (@.code == "IPA8-C1" && @.mean_score >= 0.8)')
     or not jsonb_path_exists(d, '$.value[*] ? (@.code == "IPA8-C2" && @.mean_score >= 0.6 && @.mean_score < 0.8)')
     or not jsonb_path_exists(d, '$.value[*] ? (@.code == "IPA8-C3" && @.mean_score < 0.6)') then
    raise exception 'W18: R1''s domains are not one in each band';
  end if;
  if not v_moved then raise exception 'W18: no domain withheld for a moved learner'; end if;
  if not v_learners then raise exception 'W18: no domain withheld for too few learners'; end if;
  perform dunia.sebagai('w18.dekan');
  if not exists (select 1 from public.kesiapan_kelas_per_mapel(dunia.ambil('boot.sekolah')::uuid) k
                  where k.class_id = dunia.ambil('w18.kelas_r')::uuid and k.subject = 'IPA' and k.have = 1 and k.needed = 5) then
    raise exception 'W18: 8R does not read 1 of 5 for IPA';
  end if;
  perform dunia.sebagai(null);
  raise notice 'dunia: W18 checks: R1 in three bands; IPA8-G1 withheld moved; IPA8-L1 withheld learners; 8R 1 of 5';
end $$;
