-- Ruling 79's audit world (track 3c), part 1: SD Sintetis Melati and W1.
--
-- Loaded after `supabase db reset --local` by audit/dunia/muat.sh, in one psql session, after 00-pembantu.sql.
-- Synthetic and local only: the seed's own guards (INV-21, L3-F01) refuse it anywhere else.
-- Every name is invented. Every password and card PIN here is synthetic, and the same after every reset.
--
-- The school (WIB) holds:
--   staff, by email: Admin sekolah, Kepala sekolah (pimpinan), Wakasek kurikulum (head of department), Guru kelas 4A
--   W1: class 4A, six learners recorded and given printed class cards, none activated (never signed in). The cards are made the product's way: authorize_account_activation as the school admin,
--       then the Auth user with the card's derived secret, which the grant links to the recorded person.

do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;

do $$
declare
  sekolah uuid; ta uuid; fak uuid; dep uuid; prog uuid; ang4 uuid; k4a uuid;
  p uuid; e uuid; u uuid; m jsonb; n int := 0;
  murid jsonb := jsonb_build_array(
    -- W1: six SD learners, their printed cards (10-digit number, 6-digit PIN, as Aktivasi prints them)
    jsonb_build_object('nama', 'Bima Anggara',    'kartu', '4100000001', 'pin', '381904'),
    jsonb_build_object('nama', 'Citra Larasati',  'kartu', '4100000002', 'pin', '502617'),
    jsonb_build_object('nama', 'Dewi Kirana',     'kartu', '4100000003', 'pin', '716248'),
    jsonb_build_object('nama', 'Eka Pradipta',    'kartu', '4100000004', 'pin', '239571'),
    jsonb_build_object('nama', 'Fajar Nugraha',   'kartu', '4100000005', 'pin', '864032'),
    jsonb_build_object('nama', 'Gita Paramita',   'kartu', '4100000006', 'pin', '150786'));
begin
  perform dunia.jaga();

  -- the platform's two Admin PINTAR (W19 needs two, for the last-admin case); the first sets each school's clock
  perform dunia.staf('pintar.admin1', 'admin1.pintar@dunia.pintar.test', 'Sintetis-AdminPintar1-31!', 'Hendra Kusuma', 'SYSTEM_ADMIN', null);
  perform dunia.staf('pintar.admin2', 'admin2.pintar@dunia.pintar.test', 'Sintetis-AdminPintar2-32!', 'Ratna Sari Dewi', 'SYSTEM_ADMIN', null);

  insert into public.institutions (name, slug, is_synthetic, namespace) values ('SD Sintetis Melati', 'dunia-sd-melati', true, 'MLT')
  returning id into sekolah;
  perform dunia.simpan('sd.sekolah', sekolah::text);
  perform dunia.sebagai('pintar.admin1');
  perform public.atur_zona_waktu_sekolah(sekolah, 'Asia/Jakarta');   -- WIB
  perform dunia.sebagai(null);
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (sekolah, 'TA 2026/2027', '2026-07-13', '2027-06-26') returning id into ta;
  perform dunia.simpan('sd.ta', ta::text);
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, sekolah, 'FACULTY', 'Sekolah Dasar') returning id into fak;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, fak, 'DEPARTMENT', 'Kelas Tinggi') returning id into dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (sekolah, dep, 'PROGRAMME', 'SD Reguler') returning id into prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (sekolah, prog, 'COHORT', 'Kelas 4 — 2026/27', ta) returning id into ang4;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (sekolah, ang4, 'CLASS', '4A', ta) returning id into k4a;
  insert into public.classes (node_id, subject, status) values (k4a, 'Matematika', 'ACTIVE');
  perform dunia.simpan('sd.prog', prog::text);
  perform dunia.simpan('sd.dep', dep::text);
  perform dunia.simpan('sd.kelas4a', k4a::text);

  -- staff (email accounts, setup complete: they are staff who already work in PINTAR)
  perform dunia.staf('sd.admin',   'admin.melati@dunia.pintar.test',   'Sintetis-MelatiAdmin-41!',  'Rahmat Hidayat',   'INSTITUTION_ADMIN',  sekolah);
  perform dunia.staf('sd.kepala',  'kepala.melati@dunia.pintar.test',  'Sintetis-MelatiKepala-42!', 'Sri Wahyuningsih', 'DEAN',               sekolah);
  perform dunia.staf('sd.wakasek', 'wakasek.melati@dunia.pintar.test', 'Sintetis-MelatiWakasek-43!','Agus Santoso',     'HEAD_OF_DEPARTMENT', dep);
  perform dunia.staf('sd.guru4a',  'guru4a.melati@dunia.pintar.test',  'Sintetis-MelatiGuru-44!',   'Nur Aini',         'EDUCATOR',           k4a);

  -- W1: recorded, enrolled and placed in 4A; then each card made as the school admin makes it
  for m in select * from jsonb_array_elements(murid) loop
    n := n + 1;
    -- recorded as Pendataan records a learner: the person, then the school's own number for them
    insert into public.persons (display_name) values (m ->> 'nama') returning id into p;
    perform dunia.sebagai('sd.admin');
    perform public.issue_institutional_id(p, sekolah);
    perform dunia.sebagai(null);
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p, sekolah, ta, prog, 'ACTIVE') returning id into e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e, ang4, ta), (e, k4a, ta);
    perform dunia.sebagai('sd.admin');
    perform public.authorize_account_activation(p, 'CLASSROOM_CARD', dunia.kartu_email(m ->> 'kartu'), m ->> 'kartu');
    perform dunia.sebagai(null);
    u := dunia.auth_kartu(m ->> 'kartu', m ->> 'pin', m ->> 'nama');
    if (select person_id from public.accounts where auth_user_id = u) is distinct from p then
      raise exception 'W1: card % was not linked to the recorded learner %', m ->> 'kartu', m ->> 'nama';
    end if;
    perform dunia.simpan('w1.murid' || n, jsonb_build_object('nama', m ->> 'nama', 'kartu', m ->> 'kartu', 'pin', m ->> 'pin',
                                                             'person', p)::text);
  end loop;

  -- W1's own checks: six class cards in 4A, none ever used to sign in (a card's first sign-in is its activation)
  if (select count(*) from public.accounts a join auth.users au on au.id = a.auth_user_id
        join public.enrollments en on en.person_id = a.person_id
        join public.memberships ms on ms.enrollment_id = en.id and ms.node_id = k4a
       where a.kind = 'CLASSROOM_CARD' and au.last_sign_in_at is null) <> 6 then
    raise exception 'W1: expected six class cards in 4A, none signed in';
  end if;
  raise notice 'dunia: SD Sintetis Melati %, 4A %, W1 six cards', sekolah, k4a;
end $$;
