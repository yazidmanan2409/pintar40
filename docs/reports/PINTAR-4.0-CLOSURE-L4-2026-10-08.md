# PINTAR 4.0 · L4 report: the Human Interface Boundary (CR-85) and shared components (CR-88, engineering part)

**8 October 2026. For the owner and the Second Eye.** L4 is the last of D-128's four engineering streams (L1 → L2 → L3 → **L4**), started on the owner's go after D-133. **This report is a stop.** It claims no GREEN; the verdict is the Second Eye's. No production change.

Scope, from D-127 and its investigation (`PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md`, §B RC-4 and RC-6, §E):
- **CR-85:** the Human Interface Boundary as a closure invariant (D-127 Q5). No ordinary workflow shows a person a database ID, a UUID fragment, an enum, JSON, a raw key or an unexplained machine value. An extended guard is written first, red then green, and the fixes go through shared components.
- **CR-88, engineering part:**
  - bounded lists with an explicit edit;
  - the Studio preview rendered through the learner player's own components;
  - the example workbook as a separate download (Q9).
- **Constraint (D-128(g)):** no word is invented and no *Replace* term is applied. Where a fix needs words that do not exist, it is listed for Dr Gladys (§4), not written.

**Head e7fb612,** the branch and main alike (main fast-forwarded under E1). This landing also carries the approved English for «Menunjuk admin sekolah pertama» (463dfc3, D-133(d)).

| Evidence | Result |
|---|---|
| Full local suite, fresh seeded database | **650 passed, 0 failed** (1 justified local-only skip); `tsc` 0 errors; ESLint 0 errors (the 6 old warnings) |
| Local journeys first, before CI | The first local pass found two journey failures and one crawl overflow, all caused by L4; each was fixed before CI (§6). The second pass: crawl GREEN, job B 74 PASS + S23q (BD11 blocked locally only, as in every local run) |
| CI **37762170301** on e7fb612 | **18 of 18 jobs succeeded** |
| Journeys **37762173449** on e7fb612 | Job A: **«Crawl A GREEN»**. Job B: **75 PASS, 1 FAIL**. The FAIL is S23q (CR-52, D-123), the documented exception of D-133; the suite is not fully green |
| Main | Fast-forwarded to e7fb612. Main's `ci` **37766144556** cancelled itself by proof reuse (the identical commit). As on 37742974393, its baseline was cancelled with the rest; the commit's full proof is 37762170301 |
| Staging | No migration (177 unchanged). Vercel deployed e7fb612. **environment-facts 37766343961 (read only): success** |
| Golden School walk | None: L4 changes no Golden School step (D-127's estimate for L4 had none) |

## 1. What was fixed, item by item (investigation §E)

| # | Was | Now | How |
|---|---|---|---|
| 1 | Aturan Penilaian's bank as `PRACTICE / TEST / EXAM` | «Latihan / Penilaian / Ujian» | `enumLabel("bank")`, the words Bank Soal already uses |
| 3 | The difficulty mix typed as JSON (`{"MUDAH":3,"SEDANG":2}`) | One number per band, labelled «Mudah», «Sedang», «Sulit» | The band words already in the copy (`mengajar.cepat.tingkat.*`). The action builds the mix; the server's check is unchanged |
| 4, 9, 10, 11, 18, 19 | — | Already fixed or gone in L2 (passing-rule JSON gone; Pustaka PINTAR by names; layout picker gone; JSON import operator-only) | Confirmed in the code, 8 Oct |
| 8 | An integrity sitting as «4d2050fd · 1» | The learner's name · class · assessment | Read under the reviewer's own row security (`assessment_sessions_select` admits CAN_REVIEW_INTEGRITY). A sitting the read cannot name shows «—» |
| 13 | Report templates: metric ids and title keys as text | The metric's own label (`metrik.*.label`, from the catalogue's `label_key`), the id secondary; the title in its words | `label_key` was already fetched and unused **Restated (Second Eye, finding 8):** a template's title is shown in words only when its typed key is a copy key; an admin's own typed title shows «—» until templates take a title in words (§8) |
| 15 | An 8-character ID when a name lookup failed (Konfigurasi, Studio's home) | «—»; the other school of a transfer is now read by name | FD-4's embedded names cover the rest **Restated (finding 8):** `institutions_select` admits only a school's members, so for Admin sekolah the *other* school of a transfer still shows «—»; naming it needs a governed read and an owner/security ruling (§8) |
| 16 | «Perkiraan penyusun: 0.3» | «Perkiraan penyusun: Mudah» | `pitaKesulitan`, the database's own band rule (`difficulty_band`, FD-5): at most 0.4 Mudah, at least 0.7 Sulit, otherwise Sedang |
| 20 | Open questions drawn with `JSON.stringify` | The question's words, or nothing | — |
| 21 | `[[visual:…]]` printed in the preview | Drawn, as the learner sees it | §2 |
| 22 | The build shown to Admin sekolah in issue triage | The platform operator's triage only, the kept exception exactly as the investigation recorded it | `platformIni` |
| — | Learning-objective codes first in the preview | The objective's words first, its code secondary | — |

## 2. CR-88: the shared components (engineering part)

- **One lesson renderer, two places.** `src/components/pelajaran/Halaman.tsx` now holds:
  - the page split at `## `;
  - the diagram drawing;
  - one page's rendering;
  - a worked example's steps.

  The learner's player and Studio's preview both import it, and neither keeps its own. The preview now shows:
  - every page, as its own card, with «Halaman n/N»;
  - the diagrams, drawn;
  - every worked example with all its steps.

  Before, it was one flattened card with the directives printed.
- **Bounded lists.** `src/components/koleksi/Penomoran.tsx`: a staff list shows 20 rows a page, moved with «Kembali» and «Berikutnya». These are words the copy already has, from `pretest.back` and `pretest.next`. Applied to:
  - Aturan Penilaian (read a page at a time);
  - Konfigurasi's transfers;
  - Jejak audit (a page at a time instead of a fixed newest 50).
- **Explicit edit.** A rule's edit form opens by «Ubah», one row at a time. A refused edit returns to the row's own page with that row open, so what was typed comes back (CR-84 (3) kept); a saved edit opens no row.
- **The example workbook (Q9). WITHDRAWN from serving after the Second Eye's review (§7, finding 1).** As first landed:
  - **The file:** `public/contoh/contoh-buku-kerja-pintar.xlsx` is PINTAR's own SD 5 Matematika Bab 1. Its only change is a course title that begins «Contoh — ».
  - **How it is built:** from its source by `npm run contoh:buku-kerja`.
  - **How it is offered:** as a separate download («Contoh») beside the blank template.
  - **Importing it:** the importer's own reader and converter accept it, and it has no special case.

## 3. The guard and the tests

| Test | What it proves | Red on the code before L4 | Now |
|---|---|---|---|
| **L4-G01** (new guard) | Over every page in `src/app`: no ID fragment as a name, no UPPER_CASE literal list drawn as text, no JSON drawn or asked for, no raw key column drawn. What still matches is in its register, with a reason; a register entry that matches nothing fails. Each rule is shown catching a planted leak and passing a non-render | **FAIL**: items 1, 3, 8, 15, 16, 20, the template titles and the metric ids | PASS |
| **L4-C01** | The example workbook: built from its source byte for byte, accepted by the importer, marked, offered separately, no special case | **FAIL** (no example) | PASS |
| **L4-P01** | The player and the preview draw through one renderer. Rendered, PINTAR's SD 5 lesson pages at its headings, the player's page is the shared page byte for byte, and a diagram is drawn, never printed | **FAIL** | PASS |
| **L4-K01** | The screens from their source plus the shared rules executed: the mix per band, the bank's words, the band rule, the sitting's names, the paging rule, the transfers and trail paged | **FAIL** | PASS |

**Restated, not weakened:**
- **DAISY-30-TEKS-01:** the renderer moved into the shared module, and the preview is now held to drawing diagrams too.
- **PENUTUPAN-F01:** a rule's form still appears only while its chapter is a draft, and now also only after «Ubah».
- **EFF-K02:** the trail still names the administrator's schools; it is read a page at a time.

## 4. Waiting for words: Dr Gladys's list (D-128(g))

Each item stays as it is until its words exist. L4-G01's register holds the ones it can see, so none is forgotten.

| Where | What needs words | Who sees it |
|---|---|---|
| Aturan Penilaian | What is shuffled: `NONE / ITEMS / ITEMS_AND_OPTIONS` (§E 2) | Admin sekolah, Admin platform (not teacher UI, Q8) |
| Aturan Penilaian | The limits line «3–20 · 300s · 1×»: words for the units (questions, the seconds of late-sync grace, attempts) (§E 5) | Same |
| Aturan Penilaian | Six inputs labelled by placeholder only: «nama aturan», «jumlah soal», «minimum keselamatan», «jendela ragu (detik)», «tenggang kirim (detik)», «batas percobaan», and the two boxes «jeda» and «luring» (§E 6) | Same |
| Every Studio mode label | «Penilaian awal / akhir / cepat» are Terminology v1 *Replace* terms; their replacements are not applied (§E 7, D-128(g)) | Studio |
| Konfigurasi · Jejak audit (DG-11) | 112 action codes in three naming styles; a name for each audited table; then the row's reference and build become secondary | Admin sekolah, Admin platform |
| Konfigurasi · report templates | A word for each visualization and each standard report; the template title is still typed as a key (§E 13) | Admins |
| Konfigurasi · transfers | The destination asked for as typed codes (CR-41 / W-7, §E 14); needs a ruling and words for the school, period and programme pickers | Admins |
| Bank Soal | The measured difficulty and its evidence count (§E 17) | CAN_REVIEW_QUESTION_HEALTH |
| «Soal dalam paket ini» | Each option's misconception is stored but not shown; a staff word for one misconception is needed (the copy has only the plural «Pemahaman keliru yang berulang») | Studio staff |

**For Daisy (her components):**
- the Collection's look, with search;
- the Question review's layout: `pin-soal-pelajaran` still has no style, and `pin-soal` / `pin-opsi` borrow the player's;
- the File field;
- the enrolment picker on Konfigurasi, a long select with no search.

## 5. What did not change

- **Database:** no migration.
- **Authorization:** unchanged. Every new database read goes through the reader's own row security. **Restated (finding 1):** the first landing also served a file from `public/` (the example workbook) to every signed-in person; that was outside row security, and it is withdrawn (§7).
- **Production:** untouched.
- **Kept on purpose:**
  - the reference code on a failure (D-011);
  - the PINTAR ID as a secondary identifier;
  - the build in the operator's triage.
- **Gates:** none weakened. S23q (CR-52, D-123) stays the one governed FAIL.

## 6. What the local runs caught, and how each was fixed

| Found | Cause | Fix |
|---|---|---|
| S23j FAIL | The audit trail's page became 20 rows; CR-39 (J1.6) reads the newest 50 | The audit trail's page is 50 (`UKURAN_JEJAK`), then paged; other lists are 20 a page. The criterion is unchanged |
| S23t FAIL | The walk found the saved template by raw metric ids, which L4 replaced with their labels | **Instrument restated:** the walk now finds the template by the labels it reads from the same form. The criterion (the school's own report replaces the standard assembly) is unchanged. Marked in the walk |
| Crawl: 3 pages 2 px wider than 320 | The metric id beside its label | The id wraps on its own line |
| Four test failures in the first full suite | A duplicate test id; the paging links lacked tokens and click acknowledgement; PENUTUPAN-F01 and EFF-K02 pinned the old shapes | The guard renamed L4-G01; the links use the design system's classes and TandaTautan; the two checks restated, neither weakened |

**Allowance: 1,645 of 1,900** estimated minutes (255 left). L4 cost 128: one CI run, one journeys run, main's E1 and the facts check. The local runs cost nothing against it.

**Stopped here.** Next in D-128's order: the Second Eye's review of this report. After that, Daisy's J1–J7 correction pass and APPLICATION READY, then the full regression (D-128(d), (i)).


## 7. The Second Eye's review: AMBER, and the corrections

The independent review (8 Oct, overnight) read the code and the evidence, not this report. **Verdict: AMBER.** The evidence (CI 37762170301, journeys 37762173449, facts 37766343961, main's proof reuse) matched; the shared renderer, the band inputs, the bank words, the sitting's names, the build exception and the restated tests checked out. Its findings, and what was done:

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | The example workbook in `public/` let **any signed-in person, learners included, download SD5 Bab 1's live Pemetaan Awal and Uji Penguasaan questions with their keys and reasons** (served on staging at e7fb612; production never had it) | MAJOR | **Withdrawn:** no file served, no link. The build is kept in its own folder, `docs/onboarding/contoh/` (not served, and apart from the chapters PENUTUPAN-M04 reads). L4-C01 now asserts that `public/` serves no workbook or data file and nothing links one. **Owner:** Q9 says «if canonically suitable»: example-only questions, or who may download the live set, by which governed route |
| 2 | A refused edit on page 2 or later lost what was typed (CR-84 (3)); any refusal reopened every row's form | MAJOR | `saveDefinitionAction` returns to the row's own page (`hal`); a refused edit also reopens only that row (`ubah`; after the re-review's N2, a saved one opens none); a new rule returns to page 1. «Ubah» is a `pin-tautan` link that acknowledges the click |
| 3 | The upload panel (a client component) pulled the xlsx reader's Node polyfills into the browser bundle for one constant | MINOR | Gone with finding 1: the panel imports nothing of it |
| 4 | The preview showed every worked example, the player only the first; the canonical preview showed none; L4-P01 did not render one | MINOR | One rule, `contohPelajaran`, for both; the canonical branch reads the examples its RPC already returns; L4-P01 renders the player's example through the shared component |
| 5 | Transfers were a slice of the newest 50; page links dropped every other parameter; a page past the end was blank | MINOR | Transfers have their own paged read (every one reachable, and after the re-review's N1 named from its own row); `tautanHalaman` keeps the section, the school and the lists' pages, and after N4 nothing else; an empty page says «Belum ada.» |
| 6 | The Peran & akses role list is unbounded, with a revoke form per row | MINOR | **Open, recorded:** the journeys find their row on it (S24); it waits for Daisy's Collection with an explicit action, then a bounded list |
| 7 | The guard read `src/app` only, had no rule for bare units, and matched register entries loosely | MINOR | L4-G01 reads `src/components` too, catches `{n}s` / `{n}×`, and each register entry admits an exact count; the limits line is registered, and the media player's playback speeds are kept on purpose |
| 8 | Claims stated more strongly than the code | MINOR | §1 rows 13 and 15, §2's example and §5 restated above; L4-P01's preview is read as source, not rendered (its verdict says so) |

**Terminology (the owner, 8 Oct: «Dr Gladys will need more time; in the meantime, use the previously approved terminology»).** Terminology v1 (D-068) is applied to the words L4 was waiting for: the modes A1–A5 («Pemetaan Awal», «Uji Penguasaan», «Uji Cepat», «Asesmen Mandiri», «Tes di Kertas»), N1 (the TEST mode «Tes»), N2 (the bank TEST «Asesmen») and N9 («Aturan Asesmen»). The rest of v1's approved change set stays with Daisy's polish (D-068). Words v1 does not have stay on Dr Gladys's list (§4): the shuffle, the limits line's units, the audit codes and tables, visualizations, the measured difficulty, one misconception.

### 7.1 The re-review: AMBER (light), and the corrections

The Second Eye re-read the corrections (e1f8736..6d0eac7). Findings 1–4 resolved; the eight Terminology v1 strings match the frozen package exactly, and no test or walk depends on the old words. Four new MINOR findings, all corrected with a check that is red on the code before and green after:

| # | Finding | Done |
|---|---|---|
| N1 | A transfer past the newest 50 showed «—» for its person and schools (names were still built from the newest-50 read) | Each listed transfer is named from its own row; its schools are read with the rest. L4-K01 checks it |
| N2 | A successful edit kept its row open, after a new version the old version's form | Only a refused edit reopens the row; the page is kept. L4-K01 checks it |
| N3 | The guard's two non-render exclusions let drawn text through (`({d.metric_id})`, `{nama}, {r.action}`, `[{x}]`, a template in `title` or `aria-label`) | An object literal is known by its key shape; only templates in `name`, `key`, `id`, `href`, `className` are set aside. Five planted controls added (16 leaks caught, 7 non-renders passed); today's source has no new match |
| N4 | A page link carried Konfigurasi's pending steps (`lapor`, `periksa`, `angkat`/`lingkup`/`sampai`/`pertama`, `pm_*`) | `tautanHalaman` keeps an allowlist: `bagian`, `sekolah`, `hal`, `hal_*`. L4-K01 executes it |

The re-review also notes that v1 row A9 (`metrik.pemahaman.arti`, «penilaian akhir») is not applied under D-134, so «Uji Penguasaan» and «penilaian akhir» sit side by side until Daisy's polish lands.

## 8. Settled without the owner (D-135)

None of the questions first listed here meets D-135(b)'s escalation standard, so none goes to the owner:
1. **The example workbook** stays withheld: it carries live answer keys. An example-only question set is content work for later, not a ruling.
2. **A transfer's other school** stays «—» for Admin sekolah under the existing row security.
3. **Report-template titles in words** join the one consolidated terminology register for Dr Gladys; nothing else waits on them.

## 9. Final evidence and the verdict (8 Oct)

**The Second Eye: GREEN for L4**, on the condition that the local suite, the crawl and the journeys come back green and CI follows. Each N1–N4 correction was verified in the code; nothing remained wrong. The conditions were met:

| Evidence | Result |
|---|---|
| Full local suite (fresh seeded database) | 649 passed, 1 failed: PENUTUPAN-M04, which read the withheld example as a chapter. Root cause: the example sat in `docs/onboarding/konten/`. It moved to `docs/onboarding/contoh/` (dab5c12); M04 and L4-C01 pass |
| Local crawl, 320 px | exit 0; no broken page |
| Local journeys | 74 PASS, S23q FAIL (CR-52, D-123), BD11 not runnable here (one engine) |
| CI 37775379355 on dab5c12 | 18/18 jobs green |
| Journeys 37775382999 on dab5c12 | Crawl A GREEN; job B 75 PASS, 1 FAIL (S23q, CR-52, the governed D-123 exception; BD11 PASS on three engines) |
| main | fast-forwarded e1f8736 → dab5c12; main's run 37782331321 stopped as already proven |
| Staging | Vercel deployed dab5c12; facts 37782586725 (success): staging is main. The withdrawn workbook is no longer served |

The journey suite is **75 PASS, 1 governed FAIL**, never «fully green».

**Budget:** 1,792 of 1,900 minutes used; 108 left.
