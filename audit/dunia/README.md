# Ruling 79's audit world (track 3c)

One shared synthetic world for the twelve journeys in Daisy's final scripts
(`docs/coordination/ux/roadmap/AUDIT-79-SKRIP-PERJALANAN.md`, `a06e13e9`, §3), and the captures that walk them
(`audit/perjalanan/`). A harness, not findings: Second Eye reproduces, Daisy judges.

```bash
scripts/dev/siap.sh                     # the machine first (ruling 83)
audit/dunia/muat.sh                     # reset, then the world; writes audit/dunia/dunia.json (not committed)
node audit/perjalanan/j1.mjs            # a journey: 1280, 390 and 320, keyboard only, ID
AUDIT_BAHASA=en AUDIT_LEBAR=1280 node audit/perjalanan/j1.mjs                 # its walk in EN
AUDIT_LALUAN=pembaca-layar AUDIT_LEBAR=1280 node audit/perjalanan/j1.mjs      # a pass's hook (also jaringan-lambat,
                                                                              # gerak-dikurangi)
```

On CI: `.github/workflows/audit-79-dunia.yml` (this branch only, not a required check), with the captures kept as an
artifact.

## The rules (Daisy's §3)

- Invented names only. Synthetic passwords and card PINs, the same after every reset.
- One school year, the one that contains the day the world is loaded (`dunia.ta_mulai()`: the second Monday of July
  on or before today). ID first; each journey walked once in EN.
- **The clock (Bob, 24 Nov):** every date in the world is relative to the load time (now() plus or minus intervals), so
  windows, deadlines and expiries hold whenever it runs. The SERVER's clock is the machine's: the product has no clock
  override, and none is added.
- The time zone fixed per school, set by an Admin PINTAR through `atur_zona_waktu_sekolah`: SD Sintetis Melati and SMP
  Sintetis Cendekia and Flamboyan are WIB (Asia/Jakarta); SMP Sintetis Kenari is WITA (Asia/Makassar). The browser runs in the school's zone.
- A reset returns every state: `muat.sh` always starts from `supabase db reset --local`, and loads the world as one
  transaction.
- Every result is SAT through the product's own functions, by the learner as themself (`dunia.duduk`:
  `start_learning_session`, `record_answer`, `finish_my_session`; a fixed Auth session per person, as the selftest's
  personas have).
- Every state is made through the product's own functions where one exists (a card through
  `authorize_account_activation`, a chapter through review, the validator, the MCQ quality gate and publication, a
  pass mark through `set_school_pass_mark`). Where it doesn't, it is written as the seeds write it.

## The states

| State | Where | Status |
|---|---|---|
| W1 · an SD class of six with printed class cards, none activated | `01-sekolah-sd.sql` (SD Sintetis Melati, 4A) | built; J1 runs on it |
| 4A's chapter, J1's «today's task» | `02-bab.sql` (`dunia.bab`, the chapter builder) | built |
| W3 · SMP Sintetis Cendekia, 8A: the core chapter «Persamaan Linear Satu Variabel», sealed at 60; a Pemetaan Awal of 3; an Uji Penguasaan of 6 (2 multi-answer, 1 must-be-right, objectives of 2, 3 and 1 item: CDK8-3 is the thin one) | `03-sekolah-smp.sql` | built (checked at load); J2's learners join with W4–W5 |
| W2 · activated learners by email at Cendekia 8A: one with a personal PIN, one whose PIN the school admin reset (`admin_reset_recovery`); the 8A teacher's PIN | `04-w2.sql` | built (checked at load) |
| The platform: two Admin PINTAR (W19's pair) | `01-sekolah-sd.sql` | built |
| W4 · «Statistika Dasar» given to 8A before a pass mark; Hana (J2's learner) finished it: a result with no verdict. **A legacy state, written past today's guard** (the product now refuses it: ASSIGN_PASS_MARK_MISSING); `dunia.bab` with `"warisan": true` disables the one sealing trigger for that chapter's own rows and enables it again at once | `05-hasil.sql` | built |
| W5 · Rizky, 8A: W3's Uji Penguasaan 5 of 6, only CDK8-3 wrong (83 %, gate passed, the thin objective below) | `05-hasil.sql` | built (sat through the product) |
| W6 · Sinta, class 8B (W3's chapter, attempt limit 1): 5 of 6 (83 %) with the must-be-right question missed (gate failed); the approver is the head of department, not 8B's teacher | `05-hasil.sql` | built (sat through the product) |
| W9 · Galih, 8A: W3's Pemetaan Awal done, the Uji Penguasaan started with 2 answered and left open | `06-w9-w11.sql` | built |
| W10 · Ayu Lestari, a teacher new to PINTAR: of 8A and 8C, no prior action | `06-w9-w11.sql` | built |
| W11 · 8C: four learners, nothing given, no result | `06-w9-w11.sql` | built |
| W17 · Puspa Anggraini, a former teacher, closed her own account (`minta_akun('CLOSE')`). Staff, because next-base refuses a learner's own closing (ACCOUNT_LEARNER_VIA_SCHOOL) | `07-w17.sql` | built |
| W16 · SMP Sintetis Flamboyan (WIB, this year and next; 7A of four) and SMP Sintetis Kenari (WITA): Qori's open transfer from Flamboyan to Kenari (`transfer_minta` by Flamboyan's admin) | `08-w16.sql` | built |
| The WITA school (J12's banners): SMP Sintetis Kenari, Asia/Makassar | `08-w16.sql` | built |
| W15 · SD Sintetis Anggrek (WIB): the school and its one Admin sekolah, nothing else (J8 builds the year through the screens; its planted-error workbook is made at capture time from the app's own template) | `09-w15.sql` | built |
| W12 · Cendekia entitled to AI drafting through C3w-1's **local stand-in**, named everywhere «penyedia lokal (stand-in), bukan penyedia AI nyata» (it answers only under `PINTAR_AI_STUB_HARNESS=1`; not stubbed by the harness); the allowance near its end (14,500 against a worst-case reservation of 12,000 + one per excerpt character: one short request admitted, a long one or a second refused `AI_JATAH_HABIS`); 8A's teacher holds the draft package «Perbandingan dan Skala» (INGESTED) | `10-w12-w13.sql` (`dunia.bab` with `"tahap": "draf"`) | built (checked at load: `ai_tersedia` as the teacher) |
| W13 · Melati has no entitlement (unset is never unlimited); 4A's teacher holds the draft package «Bangun Datar», so the absent AI button is seen on a real package | `10-w12-w13.sql` | built (checked at load) |
| W7 · J3's fixture, two moments, on **J3's Sinta in the bootstrap tenant** (Bob, 24 Nov: J3 needs OFFICIAL evidence). **W7a:** 8K's teacher requests a retake (`minta_percobaan`: a learner cannot ask herself), the head of department approves it, Sinta begins it and answers two, open (`ulang_berjalan` true). **W7b**, after W7a: the teacher ends it not counted (`akhiri_pengerjaan`, NOT_COUNTED); the line goes and her first result stays | `fiksasi/w7a.sql`, `fiksasi/w7b.sql` (`muat.sh --fiksasi w7a`) | built (checked: the line, then its absence) |
| W8 · J3's fixture: J3's Sinta's result (bootstrap tenant) with its gate unreadable (`safety_gate_passed` null). **A fixture-only state, written past today's guard** (`assessment_results_write` disabled for that one update and enabled again at once). Apply on a fresh world, not after W7 | `fiksasi/w8.sql` | built |
| W14 · **in the dev/CI bootstrap tenant** `pintar-bootstrap-official` (Bob, 24 Nov: certificates need OFFICIAL evidence, INV-20, and the bootstrap is the only non-synthetic school allowed outside production). Class «9A (dunia)» with its own year, admin, head of department and teacher; «Perkalian Bilangan Cacah» sealed at 60, 6 single-answer questions, **«7 × 8» keyed 54** (the truth is 56). Ratih 100 % (→ 83 % after the correction: the reissue case), Bayu 83 % answering the truth (→ 100 %), Citra 67 % (→ 50 %: the revocation case). Ratih's and Citra's certificates are issued **through the product** after the load: `node audit/dunia/terbitkan.mjs` (each signs in; `POST /api/certificates/issue`). Captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)» | `11-w14.sql`, `terbitkan.mjs` | built (checked at load: OFFICIAL, each eligible; the seeded rows unchanged) |
| W18 · **in the dev/CI bootstrap tenant**, its own subject (IPA), Angkatan «Kelas 8 (dunia W18)», classes 8P, 8Q, 8R, ten learners, a Kepala sekolah (DEAN at the school's root: the report's figures need it). «Sistem Pencernaan»: three objectives shown, at 90 %, 70 % and 40 % (one in each band). «Gaya dan Gerak»: withheld **«moved»** (Lukman sat it in 8R, was moved to 8Q by `move_learner_to_class`, and sat it again). «Cahaya»: withheld **for too few learners** (3). 8R reads **1 of 5** in «Kesiapan bukti». The same report also shows W14's 9A (Matematika, 3 learners, withheld; «belum cukup») and the seed's own class 5B. Page: `/dekan/ringkasan?simpul=<boot.sekolah>`. Captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)» | `12-w18.sql` | built (checked at load: the domains as `metric_evaluate` reads them, as the Kepala; 8R through `kesiapan_kelas_per_mapel`; the page seen drawing it) |
| J2/J3 · their own copy of W3's chapter **in the bootstrap tenant** (Bob, 24 Nov), Angkatan «Kelas 8 (dunia J2/J3)»: 8J with Hana Wirawan, nothing sat (J2 walks it to the certificate and the public check); 8K, the attempt limit 1, with Sinta Maharani at 83 % and the must-be-right question missed (J3). The head of department Made Wirawan reviews and decides retakes. Captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)». W3–W6 at Cendekia stay for the other journeys | `13-j2-j3.sql` | built (checked at load: OFFICIAL; Sinta's gate failed; Hana untouched) |

## The bootstrap tenant (W14, W18)

- **Only new rows.** The world adds its own year, structure, staff and learners to `pintar-bootstrap-official`, and
  touches nothing seeded. `11-w14.sql` fingerprints every seeded row of the tenant first (each table with an
  `institution_id`, and the tenant's own row), and `99-periksa.sql` fails the load unless every one is unchanged.
- **The namespace X9W is world-only.** The tenant has none after a reset; PINTAR IDs need one, so the world sets it
  inside its load transaction. It is not a real school's code and appears nowhere outside this world.
- **Never run the selftests against a database where the world has loaded** (Bob, 24 Nov): reset first.
