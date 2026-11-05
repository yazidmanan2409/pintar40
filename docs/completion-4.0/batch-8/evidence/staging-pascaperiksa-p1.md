# P-1 · Staging after the promotion: merge, migrations and the read-only post-check (5 Nov 2026)

**Merge:** PR #10 merged into `main` as `38d7e701`, a merge commit pinned to the verified head `afefaf72`, after:
- CI 42026574403 (dispatch) and 42026560581 (pull_request, re-run once after it was cancelled by concurrency before any
  job ran), both green on that head;
- journeys 42026579074, both jobs green;
- the owner's backup confirmation (step 2).

**Migrations:** `staging.yml` run 42035466406 green: 194, 195 and 196 applied; count = 196, equal to the repository's.

**Post-check:** read-only, on `pintar-staging` through the Supabase connector, inside `begin transaction read only`.

| Check | Expected | Read | Result |
|---|---|---|---|
| Recorded migrations | 196, latest `20261230100000` | 196, `20261230100000` | ✓ |
| Exposure marks (194) | 20 TITLE + 240 STEM | 20 + 240 | ✓ |
| The order rule (195) | `PRE_TEST_NOT_FINALIZED` in `may_start_assessment` | present | ✓ |
| `school_people_page` (196) | present | present | ✓ |
| Preservation digests | the pre-check's values | every value identical: demo 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…`, accounts `7deebf17…`, results `2440c371…`, official `a14f4a40…`, certificates `ffa43edd…`, all 1592/166/45/50/1, signals `666ff1ab…`, decisions none | ✓ |
| The ten D-184 schools' sittings | 96 | 96 | ✓ |

**The app:** staging's Vercel build of `main` is read by `environment-facts.yml`. Every Golden School walk also runs it
first as GS-00, so a walk runs only on staging serving `main`'s code and migrations.

## The Golden School walks on the promoted candidate (Sekolah Uji B8 1105, 5 Nov)

The school: `found-school.yml` run 42037509318 («Sekolah Uji B8 1105», `sekolah-uji-b8-1105`, real, one school year).
Each walk ran only after the one before it was green.

| Walk | GS rows | Run(s) | Result |
|---|---|---|---|
| First administrator | GS-01 to GS-03 | 42037667705 | **GREEN** |
| The school admin's setup and the chapter's publication | GS-04 to GS-11 | 42039104715 red (A2), 42041265308 red (A9), **42043970344** | **GREEN** on the third: both reds were walk defects, see below |
| The students | GS-07 cards, GS-12 to GS-16 | 42046058740 | **GREEN** |
| Reports, certificate, recovery, shared computer, public check | GS-17 to GS-21 | 42049795788 | **GREEN** |
| The administration journey (D-153), receiving school Sekolah Uji B5 1104 | Batch 4 | 42054817245 | **GREEN** |
| Studio end to end and the Uji Cepat score | W6.5, W6.7 | 42057142327 | **GREEN** |

**Walk defects found and fixed (not product defects; the assertions are unchanged):**
- **A2, A3, A7 (run 42039104715):** the walk read Konfigurasi as one page. Since B1 (c4e2ffe3) it is an index with
  one page per section. The walk now opens Struktur sekolah, Peran & akses and Batas ketuntasan from the index's
  rows, as a person does, and reads «Persiapan sekolah» on the index. The A3–A11 failures in that run all followed
  from A2.
- **A9 (run 42041265308):** the head of department counted 6/18 questions because the package page shows one lesson
  at a time (the lesson pager). The walk now reads every lesson by «Berikutnya» and sums them; the equality with the
  database is the same. The chapter's lifecycle itself completed in that run: PUBLISHED 1.0.0, sealed, reviewed by
  the head of department, audited. On the third run A9 re-did the reading on the published chapter (it writes
  nothing).
- **Read ahead of the later walks** against `main` 38d7e701 (the walks last passed at Batch 5's 3412075):
  - laporan L4: the summaries are on the «Laporan» section, and their links carry `dari=konfigurasi`;
  - laporan R2 (and the shared helper in murid and studio): the drawer opens by «Buka menu» (E1);
  - b5 K3: the collection pager always draws «Berikutnya», as a disabled anchor when there is no next page;
  - studio T15: the class figure's label is «Rata-rata nilai kelas». The old text was never found, so the order check
    passed without checking anything; it must now be found.
