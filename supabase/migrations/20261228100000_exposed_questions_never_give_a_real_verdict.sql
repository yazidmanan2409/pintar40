-- D-183 (F-4(f); K6, D-179(b), D-182(7)): EXPOSED QUESTIONS NEVER GIVE A REAL VERDICT.
--
-- On 2 Nov the answer keys of 20 chapters were found public (F-4, D-145(b)): 619 questions, of which 240 are the
-- chapters' Pemetaan Awal (80) and Cek penguasaan (160) questions. Removing the files from the tree does not make
-- them confidential again; they are treated as compromised. Until now nothing in the database stopped a school from
-- giving those questions to a class as a real assessment; the rule was a procedure for the content lead. The owner
-- approved the protective flag on 4 Nov (D-183), on three conditions, each held here:
--   (1) it REFUSES, it does not warn: the database refuses the assignment and, behind it, the sitting;
--   (2) synthetic schools keep working: only a school whose is_synthetic is false is refused. Staging's founded
--       test and demonstration schools are not synthetic (operator_found_school marks every school so, and staging's
--       platform_environment reads 'production'), so after deployment they are refused the exposed chapters like any
--       school; how staging's test work continues is the owner's decision at the deployment gate (D-183);
--   (3) it is built and verified on the branch; deploying it goes through the protected gates.
--
-- WHAT IS EXPOSED. A course is exposed when either holds:
--   - its title is one of the 20 exposed chapter titles and it is not a correction of an earlier course
--     (supersedes_course_id is null): a school's fresh upload of an exposed workbook;
--   - any of its Pemetaan Awal or Cek penguasaan questions has the fingerprint of one of the 240 exposed ones: a
--     renamed copy, or a «correction» that keeps the old questions.
-- A regenerated chapter arrives as a correction of the exposed course with new questions (the F-4 inventory's §3
-- rule), so it matches neither and is given normally. Practice questions are meant to be seen and are not checked.
--
-- THE FINGERPRINT. sha256 of the text lowercased, trimmed and with every run of white space made one space, computed
-- by exposure_fingerprint() below; the 240 values were computed by this same function from the removed builds in
-- git history. Only fingerprints are stored: no question text and no key enters the tree. The 20 titles are public in
-- docs/completion-4.0/batch-1/F4-EXPOSED-ITEM-INVENTORY.md and are stored as fingerprints too, for one comparison.
--
-- exposed_content_marks         append-only (kind, fingerprint); no client reads or writes it
-- exposure_fingerprint(text)    the normalised sha256
-- course_is_exposed(uuid)       the rule above
-- real_assessment_possible(uuid) a school that is not synthetic
-- assessment_assignments_zz_exposed_is_not_assessed   BEFORE INSERT: a PRE_TEST or POST_TEST of an exposed course for a
--                               real school is refused PR050 ASSIGN_EXPOSED_CONTENT. assign_release
--                               runs in one transaction, so the whole assignment is refused and nothing is made
-- assessment_sessions_zz_exposed_is_not_assessed      BEFORE INSERT, after provenance: an OFFICIAL Pemetaan Awal or
--                               Cek penguasaan sitting of an exposed course is refused, the same code. It stops an
--                               assignment made before this migration; previews (PREVIEW) and synthetic sittings pass
--
-- WHAT DOES NOT CHANGE: every existing assignment, session, result, evidence row and certificate (D-145(b) forbids
-- deleting historical results); Uji Cepat (QUICK) and practice; the content hash (courses gains no column); RLS of
-- every existing table.

create table if not exists public.exposed_content_marks (
  kind        text        not null check (kind in ('TITLE', 'STEM')),
  fingerprint text        not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  exposure    text        not null default 'TERPAPAR_2026_11_02',
  recorded_at timestamptz not null default now(),
  primary key (kind, fingerprint)
);
alter table public.exposed_content_marks enable row level security;
revoke all on table public.exposed_content_marks from public, anon, authenticated;

create or replace function public.exposed_content_marks_append_only() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR050', detail = 'EXPOSURE_MARK_FIXED',
    message = 'an exposure mark is permanent: exposed content stays exposed (D-183)';
end $$;
revoke all on function public.exposed_content_marks_append_only() from public, anon, authenticated;
drop trigger if exists exposed_content_marks_append_only on public.exposed_content_marks;
create trigger exposed_content_marks_append_only before update or delete on public.exposed_content_marks
  for each row execute function public.exposed_content_marks_append_only();

create or replace function public.exposure_fingerprint(p text) returns text
language sql immutable set search_path = public, pg_temp as $$
  select case when p is null then null
              else encode(sha256(convert_to(lower(regexp_replace(btrim(p), '\s+', ' ', 'g')), 'UTF8')), 'hex') end
$$;
revoke all on function public.exposure_fingerprint(text) from public, anon, authenticated;

insert into public.exposed_content_marks (kind, fingerprint) values
  ('TITLE', public.exposure_fingerprint('Geografi Kelas XI · Bab 1: Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan Pengaruhnya Terhadap Kehidupan')),
  ('TITLE', public.exposure_fingerprint('Geografi Kelas XI · Bab 2: Keragaman Hayati Indonesia dan Dunia')),
  ('TITLE', public.exposure_fingerprint('Geografi Kelas XI · Bab 3: Lingkungan dan Kependudukan')),
  ('TITLE', public.exposure_fingerprint('Geografi Kelas XI · Bab 4: Perubahan Iklim dan Kebencanaan')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 2: KPK dan FPB')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 3: Bilangan Pecahan')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 4: Keliling Bangun Datar')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 5: Luas Daerah Bangun Datar')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 6: Sudut')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 7: Membandingkan Ciri-Ciri Bangun Datar')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 8: Data')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas 5 · Bab 9: Bilangan Cacah sampai 1.000.000')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 1: Eksponen')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 2: Barisan dan Deret')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 3: Perbandingan Trigonometri')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 4: Sistem Persamaan dan Pertidaksamaan Linear')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 5: Persamaan dan Fungsi Kuadrat')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 6: Representasi dan Interpretasi Data')),
  ('TITLE', public.exposure_fingerprint('Matematika Kelas X · Bab 7: Peluang'))
on conflict do nothing;

insert into public.exposed_content_marks (kind, fingerprint) values
  ('STEM', '01459d35bb4de8ae74301831610632df560d98d24b15534978758157bac175a3'),
  ('STEM', '0198cdd96066f02498f668a4f24e47c4409348dcef19fabeefe558ea62c94caa'),
  ('STEM', '02b36a93eee8637fa4f5d81c6121c8f9c8423e1d6f0138aae7df323fa5138c5c'),
  ('STEM', '04f209ca1527811eab1e21c6cf6e48b13dd93b823cd24eeebb09eab11880e103'),
  ('STEM', '05f7a0d0ed033a1286bfa3ae32ecea36a8a1f91d59b620f3d2542eeea32af374'),
  ('STEM', '074585191e234ce5d8fac6579f28a472439eedc97236232ebdb784a7614b070b'),
  ('STEM', '083d691d6eeedef9bf549717d3776cc333355d9e4b54ec5baf91b556a3551c49'),
  ('STEM', '089180dc0dc3fb8ea3be640930cef093152c884e4a22db2d544ed195b76f3dcd'),
  ('STEM', '0b56660ced56626283a1479f45117b64f87542a0c9a16eba7a2945df152b19ce'),
  ('STEM', '0d300db56169df6d0c0082d764b2f389911b66a2863c78b1e856b27a2b4e7fab'),
  ('STEM', '0f2bc3b858bc604b7e7a29bcc9c39eb8b2db5d9ada579133169511a479825919'),
  ('STEM', '10214ddb921cc3ef994357070f90b16fce662362fb5ad61154da8e21f5f043e7'),
  ('STEM', '1221fe1d96f57068e18d4de48c9e4b559e78b18550fb804862375ec5f83e0479'),
  ('STEM', '12474c74cec427a327c3e7b79f7a9c0afa8af8597e78f0b88bec2ba116028011'),
  ('STEM', '128430038118e97d8e2a105d8efa2e8d46c08de6c04a1d7f80ec2006b8c4a80b'),
  ('STEM', '12a17aa7320b72d0e73cd9b7dcc40b4f59ace3882eb632a91efcef486a002729'),
  ('STEM', '1339cd7a8958a170b4e8283f7ee00677e446cfccb5c765a24567f7b692918fd5'),
  ('STEM', '13c9ce7ee5886359c293e4ff5c4cb9abf3024f08eea6c8b3ab1cabae0fc10589'),
  ('STEM', '156665c58004db4bc6234f36aeb096705bf771316cc2e7fa47d9b01c274a52d5'),
  ('STEM', '1576fb04afe196cc53718d40972f34e540c1126d337315259eb589550b54198b'),
  ('STEM', '159a72c630da1fe0cc750ceb68cdc8d80bf77e5f9c55ded7cb0020bc1b9f2b13'),
  ('STEM', '15a4b7bedd2661f1e273f9b73dd93c8bfe3e028090b6f09acb83d7aeb4d11373'),
  ('STEM', '15a7bcd21df8635c861f7c1deb0c42585f998d74b278a8b43821d28afdc2f8e6'),
  ('STEM', '1b7214b93d1fc7a55c9f3c6b3bfcf5ed9ccfd16cd545b3fa35a73c40732d1286'),
  ('STEM', '1b8cc7a63fa95f1305dc21c6f167a8b9d035e1e872fae861c35c3ad293af165c'),
  ('STEM', '1d29766fe00c43a40379bbbfd2147b113b026fa72ba44a91254fd8fb68bd36a3'),
  ('STEM', '1d749f886d4af3f18b28313f95cd55dfeba488c012685f9bda1b4c2c207f0c91'),
  ('STEM', '1e97432d1377c54b948f96097da222a392d35e540a0cbdf9561ac845368f8a2c'),
  ('STEM', '1fb8297e273f1833c17db91de845338ebf4c0c59c270e00b895207a1461b156f'),
  ('STEM', '20abb129c443594f8adfdea0bb475cd296d219b80e1bd57b4d5e27f25b9085e3'),
  ('STEM', '21299ef1333a64f9e580080fe6764fb356f1d20097d0069a9818a5b0687cf96b'),
  ('STEM', '21d26d87d19cf1cc109ebbfaf272d5f0ae8ca192b03f816a4d77633dac6ebac5'),
  ('STEM', '229c0d1fc7b7d241e43e2210c3e53ec393fb90cab10ba945cb105387a7169150'),
  ('STEM', '235d04b261aca6a5a3502e562388aaf1b62cb494c92481e923cc4ceb6f0de545'),
  ('STEM', '248229cae37b05a553c02b63c603fe037316f8550373289fa7f69441b263601d'),
  ('STEM', '2583188395c15a0ccc070615e04b5d6cbf8110a11fef4e722c81b7abb7ec2d15'),
  ('STEM', '2644701ea535a5bb5b1a770d90bc301671cf8c2c9b229f02c7924fb6bf17574e'),
  ('STEM', '26702686c4d233911874193153185c83e4d0ac8f2d9121e72892eaa748aa0640'),
  ('STEM', '26d90d4278a0c0f0a3eb8e5e694360300ae2643c1a8914a17a9d440f4f4a2b68'),
  ('STEM', '27bb89304e216c9408c045123db2b16a545c80d0ad1c55506d7331b3ad883d5e'),
  ('STEM', '28788231d1317feea5311dfcd696136e24018635ff31ee23176f014529b54c12'),
  ('STEM', '29dc7edc0487ec8e1dc090aab22f28db44e34be7038d86c03c92dace750486cb'),
  ('STEM', '29ddb7848fa1e7c38cbaee14650c34fcc5db58fe64b7d1cd89024c24ab23d313'),
  ('STEM', '2b2834c239b5dae5b0718c615cac1f6972bb5fee82f351be33d45f8e2c7308e1'),
  ('STEM', '2cc566259f3f6010b54b0598b96fb48899dfe29a82379d066b5fa295e09eff14'),
  ('STEM', '2de38aea4ade82736c25f7c8063f7166e445000182224761a6517aafaf1fd012'),
  ('STEM', '2f001ec72188645ca019c1bf372842eb2c54dcfdcd66720760fd657bbc7b1bd4'),
  ('STEM', '343e66bd4bfe1b5a647fb6171e3b4158517c7cc73ce747e6b1439fa45cfc9068'),
  ('STEM', '36c5aeff21cc7bf9c3fe01dae5fe12e997db609790a8330e6269dff9256184f4'),
  ('STEM', '38ecc4973cace513ea238a50acbd4a066c457e1596466d24c0df6db6cd995846'),
  ('STEM', '38ef026168f6d5a847a2b1fef1060ef72ad134cf95f1f1d3db00736113c129c3'),
  ('STEM', '3989b2317f07134746f46af7b7d4e15a88f1a3c569c3a6b84295fa9a48438d97'),
  ('STEM', '3b7989385b8731c0d2c5754e59ff08543980fc3691c48129158b2e08a8192f80'),
  ('STEM', '3bc7a0e4c60656b1a08eca72e258ddea92cb7b186a1adf11bd1ae0f99aea3ed7'),
  ('STEM', '3c9dde71d92a7485f5765525f793ec4c7dd247ef563872f2fd94d012cef373ef'),
  ('STEM', '3d8a830314c4d084711b1b6c79b1f7a4d117181516761b60aaa6aa221152f325'),
  ('STEM', '402136cee93f74aae86cfa03ed0ef5496e3f3c4c10a8348266d5c0c97c326936'),
  ('STEM', '410bcdc5d5a271b245d02d884065134ad47c32103a4f83223fd7e7de629bcee2'),
  ('STEM', '41c7da5349301fd26de3deec218b1246942fd8cbfdbf0f60bc3e5332698ed6fc'),
  ('STEM', '428fb5f965f170f2655e788dad60f974b3e5442054b78bb5ff85eb1ae72f89fd'),
  ('STEM', '434470fe9685d4ac1b398d0839cd6ad23e47c9cecd98e7260492e050bf8840a9'),
  ('STEM', '444b4b05c5c4c2539e804e8c8e217a55384ecdace7e6d2c44abcef32eb7d74be'),
  ('STEM', '44d04b03c58b2f75db57b1972d0f1d4ff0f47a45b4df46214b1ad59bca0e4929'),
  ('STEM', '462c1a48d7428572997933acaa55e4aeccf28ca5028f1c81bbf1d4df1e4fd1df'),
  ('STEM', '463cd23d77ed058e2b92ac055ae90052cb008e9a4f99c24ee35e38240ab58479'),
  ('STEM', '46680bece8a194f2019c66d9e1a5a11b6e7e7c16a0d4312131136a5385529c51'),
  ('STEM', '46a4e6c4ab9cae8d714d2d264d9edf8e51da16db999339a9d0e338e0fa5cf09b'),
  ('STEM', '46c1f612b4cf05c9fe2a05f3524e795d61680e465af5c240263222dbc408f395'),
  ('STEM', '46e8ac02666db1f34562fe8ba5e90dbc8028de5894ae2ad2d09f8cb1ba500c0a'),
  ('STEM', '479de9ea30efaf91cc541b89b2e626ff10fd123d238f96c8f16ded322f99a3ee'),
  ('STEM', '485aabfd95b0c12a478ca2a50df7eff19a6790454d5d9a11ef2c19843ff26eef'),
  ('STEM', '48aa940337149224047b30b08fda77abc58cc2f74101189ff60055f427ab6d58'),
  ('STEM', '48f21661ed0097b55251a7554dd08e6db7a07a721640ebc4d8376c8988578b4b'),
  ('STEM', '494e1c83096752e08477dc9227201803f8791eeaa10293ff34012bb20d739135'),
  ('STEM', '49b494cc9d4ffc628fd7d97a80c2892b32ebd5688b120200294c3fb3cf095eee'),
  ('STEM', '4a7773ffadf21a73a3cb2be50f4e4a3e91b4ff5b9b447e1906ff9f00b5bee9c2'),
  ('STEM', '4a792a32c50a674878b978ac179576a791f7fd9f25fa3cd6833215ea0bad8fad'),
  ('STEM', '4c926bf259b5a07f348b33d20eb5e7f27d2158ff4a3c2500b0092afb04f87c8b'),
  ('STEM', '4f971826d457d36bd3d572ade62a63cf0d7217ae13fef8f299f887596f44ebc5'),
  ('STEM', '503800173459f97f6d912f3a0c4ea430a60a90fc475d6fb6aa0bafa9a6b7167d'),
  ('STEM', '50fd661664d2db163cfe758064438f3c1b5e33135c78ccafa68bcdf6f319ecc1'),
  ('STEM', '51ebb373c5e02bde816c69e089e68df1b3e8c69c78242ffbada669eeb5c678a5'),
  ('STEM', '53ad49584829ef37a66de8d56862f7be0ed19e4d3bac4138294cffd64f2435e9'),
  ('STEM', '53b9508ce70d0cd50caada019ee3ddbcfbb560a5f9ee72ecf50b3efdacf19844'),
  ('STEM', '53d58cad6c2ec186aad7641c9e5533afe228d2f4bc73b40a08e2d4d70f9ba941'),
  ('STEM', '53fa0373a646015ea3477416570b338c8d482a70b08f4f1bd96473468e2bb98e'),
  ('STEM', '549613da4115344e2e0dacc9f16de945ca602c3426d573aae1a5cdf021c9f928'),
  ('STEM', '5768a418e7ff52200e0865215084e1d5b0f5574a3462a7aeafa9ade58e30c55a'),
  ('STEM', '5a34cb89ed57a5201ecb33f0beeb64dcdbe8ae99a062e1351f67aff7b5a5fbec'),
  ('STEM', '5bf323b93f5e250164884130b3bc1b2b2eb7e4adca5682b26500c56070d07353'),
  ('STEM', '5c0034807fb4f8245dd2ea8bc40fddec641e8bdbe0c55a5f6db1be3597637422'),
  ('STEM', '5d35d5e594fa271c90945aa7903d1d25ed299be0910be26fd528333f45791b24'),
  ('STEM', '5e387ee1956c7055cc4928957ca8f1400c6dcce25a5eb9b289d654ae59dda4c9'),
  ('STEM', '5ec8d3617f6d7a9a58434e314fe90b927badc5131d79248c612d037af38587ee'),
  ('STEM', '5f6cfc090a56707a8639868f20d7629fdcc48f892e0272a1fe011217e0f77d5c'),
  ('STEM', '60eaa38b7c7c5adf7fbc7df1b963b2370286700cc7017412ccef36269b6993e4'),
  ('STEM', '61341c410ab03feacee1c884e455dd2bdcca87d044ca346f10972c4f90ff772d'),
  ('STEM', '6484664f8455048441117f679058216042e3405d0c4a0cba25b3ce7df6fc3a20'),
  ('STEM', '6773b0ae3747036dfdb3ba0701124e8a62ff169bf2e5ff9cda36a67eed69c302'),
  ('STEM', '67ad2b4bb5bddc4dee8d144072bae14f6470befaed0bd0aab837b1227b6cc910'),
  ('STEM', '69a31aa7ed670aa4aa181918d5c6a45efdba6d64e365870bb8a2f12b31f5e050'),
  ('STEM', '6a250e47f5dfbe6c6a2011536ace571d76dd93b00866bfa98625fcf27d665291'),
  ('STEM', '6c7ba7551916d45fc0e677fb9c96f320209b92b142a1019957830c60bda965d1'),
  ('STEM', '6c9b42720bef52643bc38b7f114eb92c0e6cff2a3e6c17a8bff9618c2ebe49c3'),
  ('STEM', '6d616e130acb92481bf9499c34ed0d77a66112a815ae545fe156c012dd364c83'),
  ('STEM', '6df9a45ea7ac5d2b1542f51f40689b28987e5cdd2df556bb9b9c8c32e5f9cf50'),
  ('STEM', '6e006fead0a5563f36c242b144b820bd3392d780639f7ff81e709d088ec68297'),
  ('STEM', '6e882e684e0696c2ac8c21596e1daa2c3540c9fdfc01d1b21a9d680f9e4c5a8e'),
  ('STEM', '7002f6f1366155f5a405df01298e49d79e48f7190bee403e5167ad7fd6838263'),
  ('STEM', '70a2cf5fb3f1d38967758a8c2b42946421a8c0c48093df4c3d08f706ba89b176'),
  ('STEM', '71fdb43d921f96c5e4773127e8ba1b657659e31db07197481db431daea079683'),
  ('STEM', '74b38a34e4c4005c339d4e522e640a0ce64f3314ff4a60c8ca1ddc52f50ba326'),
  ('STEM', '75069c04ec28fb6f526fab85db219b339c65e296b5d4886a3d11f3caa503b89c'),
  ('STEM', '75ee3f2f063bc83cac175412661ace00bb401c7fac035538baff882b14ff40da'),
  ('STEM', '76247fdac2d69507e479b189a4267589d2c987e5de0c4d11bceca37290ad1a03'),
  ('STEM', '766d50e00642a6f2cccabb5a4eed97bf537f961470128fc70ff7c8310f8e9c10'),
  ('STEM', '7941f97ff3da46dd799f718af8cb3ea7a29f42895eb6c72a66e4ece4547807a9'),
  ('STEM', '7a67b610018f93e0cefe5052ef945a5c70bb0bfd1a188c4ec45c30657860088a'),
  ('STEM', '7b83c3d6d8f3f44c20a8335884963574c75cdffa05690eb0793d17b724905052'),
  ('STEM', '7ba2e44ea87c67c9b1879e808280dcc67c247c2e6e9fc880622fc33d3a8324d8'),
  ('STEM', '7d86370bfaa72e5b76c74c53ba22a1b8c3725459822fb79d56f6a58fbf904720'),
  ('STEM', '7da6ba528172cc69566e9f22d690dff3c51f52a7df9cff0e3b8da4c7ee96f86c'),
  ('STEM', '7eaa704bac450acdaee582816f7f043d07e2cb9ce370d4cc3a697062175d7489'),
  ('STEM', '7ef126d01121a82ea2719c59805d57fa493aee1a92ad46f2327dbe0fc534a83a'),
  ('STEM', '8059569836e457cb7dcc37ba82ed01cfefc39ae2e6f30912a828ccc7bc2d0658'),
  ('STEM', '817d53f7fa682a1e1b4abcd64fe3da79ee97428356f7b053980647efddb0ca8e'),
  ('STEM', '820b2c1bdbe3166d972a8942f56b6e1dc649251af6e0f7aef78a330b1089faf1'),
  ('STEM', '823df33807b96e16109ea8563e5e9e36994f31ba06fb8ba4f2ea021b6b49eb12'),
  ('STEM', '825e909385a454c96ddcc5660d708a765658097cf18e03989bded626b1b652e7'),
  ('STEM', '829b03ee1f2a367214923e7711ca731eb0ac2607557864454e8c3b4fe9000559'),
  ('STEM', '82abf817d838616b403b0095eb31a7ad37ed4722c0a9add28dd2a459712010bf'),
  ('STEM', '83850ba9ee8a6c80386ed105787b47713693441e577a0896053c8b951d0d5e44'),
  ('STEM', '83faeac472ba62f23ce6366a7dcb709501c6c367380be2c5afe9c85139a85cbe'),
  ('STEM', '84d86c20f2ef043881333d45ac37fc7869877fd1219cec05e4cf93ad66e86a7b'),
  ('STEM', '86eca60b6679b88047681e19737194bdfc59b6fd62f4b82ec4184a4d98e96033'),
  ('STEM', '88e28f20b5e8e8b1db387c7fa160f6ee6e74a1eaceb2862f10cbb7ef5173c5d7'),
  ('STEM', '8909acf511dbbe41292381af39ab19a615b47c35b246446f93b8d12a29af03ac'),
  ('STEM', '8add00b8d43715aa2b71f4b2d0b2cb3c4e300fb5d191071be797c153625ae12f'),
  ('STEM', '8ddb77e70f464cba7dc74e5c6331d97db87114005059c93f57df5d0bf32c31f4'),
  ('STEM', '8ee6e165d7a1f36916b310df1de5b4bfe72584da6d0b47d1535231009a46e213'),
  ('STEM', '8f4810ff1d005f32a95a41fa63be567360f6410bb7448c9f8837c2d67a86106f'),
  ('STEM', '8f4a44feb96db097c7979e49d820dcbdaf8fac8e1bf5b8301163df5929049815'),
  ('STEM', '906d5c21102036b4036fd2e82bf511b02becf2f193ee84280e0873edb98644df'),
  ('STEM', '915549d450752e07d68fb5adae46c6951d4aca892f9ea1d2a820a9b7e702a2c4'),
  ('STEM', '94668a4c58f815ab9f510c99cf68db69ac68afd7f563703fcbbea62eb2fea129'),
  ('STEM', '94c36457f46f4b7f491389ddc18ce813389cf74c1b24fe55bed1fc32064c6bfa'),
  ('STEM', '97d2eee8877b1848528c4c35f94106b9789a8f3b6acbee24678c7540c5f03e5b'),
  ('STEM', '98961a33f064880303bbcb89cd48ae7b91957d36e17ce9bf20f383e63adb987e'),
  ('STEM', '98e969bdda3791f6e48564280bc34b332eda41051004f9dd86428832d6a0c3f6'),
  ('STEM', '9a0d278fa0ba9a68f5c212cc83609e13b27cb5cdcb83241003e41c6a42c4267c'),
  ('STEM', '9a39ad10ed3c1030988529484066820ae00ec641b97e9aed2622bc8fd5b0aee4'),
  ('STEM', '9a5d5bc1b940e98be1c614e4fc7950dcd3990b20577975c56a6c076b922a421a'),
  ('STEM', '9c1c859fa607909dec3666fc8692f5732397461afb01e1f1642d2f10ae2bccf6'),
  ('STEM', '9ca0e70e3dd7a6f4171732f83e2af5787570e3e1fa8a35f2bfeef8fe63031dbd'),
  ('STEM', '9d1380a7c111a64b1f55cb0ae16c36dc820023ed0dae4e978fb96dcf145ad86f'),
  ('STEM', '9d1b3d37128075f9aa4ec1a82e666a085a2b4cff0a1b3f6427875aa1fcf4e56d'),
  ('STEM', '9d4a9e6253c43e0f16aaf719f9ab464aece5cda3483f27756f201215f75a2779'),
  ('STEM', '9d4e508ed59d2da2aeb19c2e01b8ec0f16f4cbd13efb32a181809c90e2252d34'),
  ('STEM', '9e772bc5e2f52e1c6a4ea8e428fbb52d0a5185aa9ef9a41bca18e41dfbb3491a'),
  ('STEM', '9f352916d0d201dc9154426d0380350cac618d01fd020ca697ac1a5039a860e0'),
  ('STEM', '9f6643aac2d83111affe37839042be2592cc1d9dc16889752e21e6c12c9ee128'),
  ('STEM', 'a249f415067971edf39ad1feaf800ba015d8536d08fc6d756bee572f33e8c104'),
  ('STEM', 'a24a6692181fdd70f6429941d505e05befe53a30034007449d46e3026ee3bb07'),
  ('STEM', 'a3502a6b1a4ea60cdbbe5193c14a5602e0e5730233ae1d783084c8843ce4bf27'),
  ('STEM', 'a3f152f4666b42251fa482c1ce5ae32a9f8fd835bf81774daa6e55041f5fe7d6'),
  ('STEM', 'a4c90b64552d223a4b11b541c587548f62640fad0c4475cfa815d7e3abc411a9'),
  ('STEM', 'a8f467bb1ca318ad7c4f54b08ca14c90ad2591581e8b31a2ae08c12dfc351183'),
  ('STEM', 'aa3de3794e0ab324d9be6be634672bbbdf9ac02a54ccea4f639db82b2ebb2cf3'),
  ('STEM', 'aafd7d6a52063079d19755621323b23bc79f32cfda7d37abed0f1c79f271faef'),
  ('STEM', 'ab89c03f26d146fb04171e7e5601deccea068ee68770e16f6ee68b1f24d475c5'),
  ('STEM', 'aca6f090b1647205c903bc12ca6d5345be85c0bdf6fd23d737fcab57b608265f'),
  ('STEM', 'acddefc1e325adb6d7f9db24bfee2d9b4e639c7cf9b70b39d1c5a50f3d7054d3'),
  ('STEM', 'adb132e971ba59d935af7643a5248b69bdfa6de9a0fc4184f7994b804134718d'),
  ('STEM', 'ae0d75579fc0d50e763e937b7623f01982424949c46fb6e56aca1ef174c0e3a3'),
  ('STEM', 'aef39fd38ce738343c43cb12b4aedd212e0c5f604e097358859979624ef2f4d2'),
  ('STEM', 'af788f8fea5dc45122327c34d695d7c90b9aa79d7b612b7aa23ad8e7bcd948a8'),
  ('STEM', 'aff36442cbad980bb5fd0a11df2de1d9e3b435116f857b58d5095636111fc14f'),
  ('STEM', 'b090a5e673cacc49feaeb5413c865f3f33002ba2ba2eaa54562b8679442067f8'),
  ('STEM', 'b0b2263325772b914db5a1bdb31246971fb48c9b77c237b6487d8a233ddb46d2'),
  ('STEM', 'b1145524b70e1f3f0f470fa0e572d0bf662ca13e7afee4fd50265a9ac12b2d8f'),
  ('STEM', 'b12e16a25d2a3853fdf8524a75a6c10dc27a2aa50b7bbc821359096e72d0c895'),
  ('STEM', 'b18726f5016d41a5c31b3e059413a9ad21c672b4c1bc4fed14414aeee37d64cf'),
  ('STEM', 'b2ef24fe20df17666863c8b686b93630dd0eecac17c19486bcae96cc70f135bd'),
  ('STEM', 'b3da3b5657d892519f40d0ecfbab7f3f880b9aeed90faece519497fef24734bc'),
  ('STEM', 'b3eefcb39297ce55486f51dd72dbb868f23dcf0b498ae40c1b5dc4b5c4a8703e'),
  ('STEM', 'b424da9bbf4d9549b3e288e5d2058fd4ad4afacf764db55e9c344bcd758ffa4c'),
  ('STEM', 'b7695a1437b5a4346e09324c17f14732da2c4503d2159835fcff58f86f9e99ec'),
  ('STEM', 'b7753069ab55fd72c119006d6c75a1e520816ba09258c827c8339403d75ad5c3'),
  ('STEM', 'b818caab012fe5cbd8bdb51410f8b2374e3f292a6a7f864a5b7cc4a75de8e118'),
  ('STEM', 'b946211617f5bab8e00f48039b5baa888c40487f23ec38a598f12b4b591272d3'),
  ('STEM', 'ba39eddec5b8d04bc5d698a91550a589a5f7e8af9513836c79784b9a1b144227'),
  ('STEM', 'ba8a893633fcab43287b65ca6d65b2c8556be555de3a5048491ca67afdb58ae5'),
  ('STEM', 'bb3d635dacaf21a7e7d8d64f10e16f46ccce069a410ad7a5c6f30da43232d170'),
  ('STEM', 'bef02f688f26fd5952447c8befcc8aea92de4675c8d99e9ee979469ad02661d6'),
  ('STEM', 'c08a079b1335ea3934fce205b7eabaf9ce1cee84a548c899d28201aa474ed7d8'),
  ('STEM', 'c0cc5cba7690928151ac89698e52d9039adb04083da4e960190db3396e9a0a72'),
  ('STEM', 'c1270d3108348b186b8e602e2e520650c44be0d2f561dd7318a9be66c5b0abb6'),
  ('STEM', 'c33466431be4b771a634312546c167cc146961cc754096ca0cb1f6e5ceaf78d5'),
  ('STEM', 'c3cd21a884ca5ccec297f6328c01abe2a077a8603e88814c4c058564913c806b'),
  ('STEM', 'c4f621d63dfc9f9c6fb23a810b1d58d887224186227c37937cae5775afc61eea'),
  ('STEM', 'c4fda3801e0d00df3474e14efa2e9baf6c76d726874b6141867d3e11d10c0544'),
  ('STEM', 'c6f4e127129a2d30448547fe78a720054261c08c342da5fc4eca162bcc43179f'),
  ('STEM', 'c8e6040e5cbd28a88ab41bd3a44e339b5fa06192f1d045d3611d49a527353f08'),
  ('STEM', 'ca70e13d50549a627ed6db03aab0a5d8eb782c6c3fbb85f0e06562f269dcdec1'),
  ('STEM', 'cb44b8129951a1bdeacd82ef32cab709b68060331e2e848692bde087d05c494e'),
  ('STEM', 'cc6aa39cbf5c275f63f6de89e55aec8d94d2509862ef9befb516b59703bf64c2'),
  ('STEM', 'cc8d4cc08fc6274d2419d1e4bf9a879f3f2f9b3e763693c017e5bf1c2562ee57'),
  ('STEM', 'ccbb9f3e7cec2da407eb7f5686a12799bf53aff39ad9e9066894a6e8ca820bb5'),
  ('STEM', 'cd2c2f47d72d91f87baf39284a66c425db2b11e7a05845807263dce3e29c79c0'),
  ('STEM', 'cdcd090bda4e9000b0a8a540f2023e23e8338433f97591d242666432343e17f9'),
  ('STEM', 'ce759b2c58bea8405f9e0037fdaec830113af72acf9c05cefed9b2fb008c7fea'),
  ('STEM', 'd0b6f4cf09e42ee6bcd88a617b41c843217915a0c031816b28ac4eb94e437664'),
  ('STEM', 'd21a64557a2635a04d20349f1fc75c9032bd4abee54a8a9197c4e4226d52b1e3'),
  ('STEM', 'd2a795d739e80b68ce3898e5bb32251462e502b960cb6867d55e555bf66eeea5'),
  ('STEM', 'd381bf42d92a3d79c5b98142f1d2b725c6bee0f241ab56eae4baf7cceea7f809'),
  ('STEM', 'd673ec946302f55b0ff02e52c634f93ffde57584fe602b8a93a8ce7c61b73b0a'),
  ('STEM', 'd6876e9c0ce474040c0575f96ff706b8ca24aa13a3f37c0e7aeeea7439f2633a'),
  ('STEM', 'daa0b00263bbedc87a14cca1a71c7e60d3cba258040172706105ca3bbc9e3e89'),
  ('STEM', 'dcb07790edf10ecca77408bc39acdfee08a4c29e27cb78b03a44eeec7d6ab0e8'),
  ('STEM', 'de147c081d229e705a0b27122e3f72b3f7c7c228c618ec6ee2506b7da163471c'),
  ('STEM', 'de19c2a5cacddfda263d62e0ace773865d4296238677a7f70351377ddb90b886'),
  ('STEM', 'decf0b277970fa95a9a3b1b1c3f2b26d4c5bed2126c17d5f8ec6e6e9d8d7b6cc'),
  ('STEM', 'e47ed2e4a94da3e7b37cc04374cbe868b62e63e2fac2f7f4144e21eb6c2e6446'),
  ('STEM', 'e62f9f9d5cc9f6c0e816d3fcf21dc21754d85560a70dd44a5f2ebd26b24ac844'),
  ('STEM', 'e63310e17cbd53b55854a5ac4e79c1c538867cd953b7243cf1343ffea85f68e6'),
  ('STEM', 'e687309e07d91bb8629590075d1d62e8e20860a68de61fc84e6f20e8bd9ae3f7'),
  ('STEM', 'e76b253209a09031d91128373d9806475192b1c101169ae34ebd815f9020a6c9'),
  ('STEM', 'e822b85d66d6752b2dae7b89f28f335e4af214b9c4efc1d35b1f4c1c43bd0445'),
  ('STEM', 'ea5be1c4d723b5354bd24092fb54392ede7591747cfc780f5f1566f87825a3f6'),
  ('STEM', 'eb47cec856b6acf5ca8a098a6f64b0f11796a809cfadce7f13f6e72815101d1c'),
  ('STEM', 'eb9e82f56555356f4425c3b2567f152bbc0790b096a43b11e71663d4ae338575'),
  ('STEM', 'ebdacef164a59ac8ee5ee2b28816db3d4b8cb4a938c33ef53bbb2863a3ef08a4'),
  ('STEM', 'eddcb59da85aae8661773abfd0362464308379053b16d34122099c7824beb849'),
  ('STEM', 'f3ae12067754e993c529943fba7ba03fea5a89c97eec4f6b6b9526081815c96c'),
  ('STEM', 'f589a00f18dc2541f34555edd0d2031bffd670e12020213ef048857e880b57b2'),
  ('STEM', 'f70c7cd48fe91a417c26d3d9514e5b347f16e31cb949b48401b114246bbce421'),
  ('STEM', 'f94b334b8a0dd6ddc1a18dd4112151fca3789711145532f9d1d93b39fc262a4d'),
  ('STEM', 'fca8ef0c621bbe89a1993e47abcc9827d97e3c737583286bb9252de9683e37bf'),
  ('STEM', 'ff009e826cb05c7077f8046cb0d26ee81f3e930ad887777c805842f6d5a44303'),
  ('STEM', 'ff76566b169408e506fdc24724f375ecfad741a12aea77cb42e9f88339e1f744')
on conflict do nothing;

create or replace function public.course_is_exposed(p_course uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
           select 1 from public.courses c
             join public.exposed_content_marks x on x.kind = 'TITLE' and x.fingerprint = public.exposure_fingerprint(c.title)
            where c.id = p_course and c.supersedes_course_id is null)
      or exists (
           select 1 from public.modules m
             join public.lessons l on l.module_id = m.id
             join public.items i on i.lesson_id = l.id
             join public.exposed_content_marks x on x.kind = 'STEM' and x.fingerprint = public.exposure_fingerprint(i.stem)
            where m.course_id = p_course and i.cycle_role in ('PRE_TEST', 'POST_TEST'))
$$;
revoke all on function public.course_is_exposed(uuid) from public, anon, authenticated;

create or replace function public.real_assessment_possible(p_inst uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.institutions i where i.id = p_inst and not i.is_synthetic)
$$;
revoke all on function public.real_assessment_possible(uuid) from public, anon, authenticated;

create or replace function public.refuse_exposed_assignment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_mode public.assessment_mode; v_course uuid;
begin
  select d.mode, coalesce(d.course_id, m.course_id) into v_mode, v_course
    from public.assessment_definitions d left join public.modules m on m.id = d.module_id
   where d.id = new.assessment_definition_id;
  if v_mode in ('PRE_TEST', 'POST_TEST')
     and public.real_assessment_possible(new.institution_id)
     and public.course_is_exposed(v_course) then
    raise exception using errcode = 'PR050', detail = 'ASSIGN_EXPOSED_CONTENT',
      message = 'this lesson''s assessment questions were publicly exposed and cannot be given as a real assessment (D-183)';
  end if;
  return new;
end $$;
revoke all on function public.refuse_exposed_assignment() from public, anon, authenticated;
drop trigger if exists assessment_assignments_zz_exposed_is_not_assessed on public.assessment_assignments;
create trigger assessment_assignments_zz_exposed_is_not_assessed before insert on public.assessment_assignments
  for each row execute function public.refuse_exposed_assignment();

create or replace function public.refuse_exposed_session() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_course uuid;
begin
  if new.mode in ('PRE_TEST', 'POST_TEST') and new.evidence_class = 'OFFICIAL'
     and public.real_assessment_possible(new.institution_id) then
    select coalesce(d.course_id, m.course_id) into v_course
      from public.assessment_definitions d left join public.modules m on m.id = d.module_id
     where d.id = new.assessment_definition_id;
    if public.course_is_exposed(v_course) then
      raise exception using errcode = 'PR050', detail = 'ASSIGN_EXPOSED_CONTENT',
        message = 'this lesson''s assessment questions were publicly exposed and cannot be sat as a real assessment (D-183)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.refuse_exposed_session() from public, anon, authenticated;
drop trigger if exists assessment_sessions_zz_exposed_is_not_assessed on public.assessment_sessions;
create trigger assessment_sessions_zz_exposed_is_not_assessed before insert on public.assessment_sessions
  for each row execute function public.refuse_exposed_session();

-- Structural self-check (migrations replay before the seed, so it reads no seeded row)
do $$
declare n_title int; n_stem int;
begin
  select count(*) filter (where kind = 'TITLE'), count(*) filter (where kind = 'STEM') into n_title, n_stem
    from public.exposed_content_marks where exposure = 'TERPAPAR_2026_11_02';
  if n_title <> 20 or n_stem <> 240 then
    raise exception 'D-183: % title and % question marks, expected 20 and 240', n_title, n_stem;
  end if;
  if public.exposure_fingerprint('  Satu   DUA ') <> public.exposure_fingerprint('satu dua') then
    raise exception 'D-183: the fingerprint does not normalise case and white space';
  end if;
end $$;
