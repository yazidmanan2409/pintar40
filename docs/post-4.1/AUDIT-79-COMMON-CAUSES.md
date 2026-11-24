# Audit 79 · the common causes behind conflicting screens (Bob, 24 Nov 2026; ruling 95)

**Status: INTERIM, after J1 to J4.** Sol's review (relayed by the owner, 24 Nov) supports the direction in principle, with two qualifications, adopted here: C-1 keeps the current attempt and the result in force as two facts, and every consumer of `my_cycle_state` is checked (§3a); C-5 keeps each recommendation's provenance. Sol's recommendation, as relayed: approve the direction in principle, and finalise the implementation plan only after all twelve journeys. It is updated as Daisy walks each remaining journey. **The correction plan is not final until all twelve are walked** (ruling 95). Nothing here is built.

**Method:**
- Every finding where screens disagree was traced, read-only, to the code on main `429b7dcc`. For each finding the trace names:
  - the files behind each surface that disagrees;
  - what each surface reads;
  - whether a shared derivation exists.
- Bob re-checked three of the claims himself: the certificate page's own `lulus` test, `my_cycle_state`'s «latest begun», and the chapter map reading the Pemetaan Awal.

**The finding in one sentence:** in all nine cases, sibling screens work out the same fact separately. Where a shared answer already exists, at least one screen goes around it.

## 1 · The causes

| # | Cause | What it looks like in the code | Findings it explains |
|---|---|---|---|
| **C-1** | **Two definitions of «the sitting in force»** | `my_cycle_state` returns the latest *begun* sitting per mode (`order by s.created_at desc`, `20261010100000…sql:554-565`). Z's V2 made `hasil_belajar_sesi_orang` take the latest *finalized* one (`20270123110000…sql:54-83`). Pages built on `my_cycle_state` lose the result while a retake is open, or read a different sitting from Hasil Belajar | L-54 (the learner's result is a 404 during a retake), L-55, the sitting mismatch in L-48 and L-61 |
| **C-2** | **A new state reached one screen, not its siblings** | The approved retake (`percobaan_saya`) was wired into the chapter card's note and the test page only. It is missing from: the step derivation (`posisi` / `peringkat`, `siklus.ts:145`); the home's «nothing waiting» check; the result's retake line; the chapter page; and `lanjut`. Likewise `ulang_berjalan` and `percobaan_ke` each reached one reader. | L-56, L-57, L-54, L-43, L-55; **J4:** L-63 (the teacher's end reaches only the teacher's screen), L-64 (no «in progress» step) |
| **C-3** | **A page re-derives a shared fact from raw fields** | The certificate page tests `outcome.lulus` (`sertifikat/page.tsx:101`) instead of `keadaanSertifikat`, so a non-certifying pass lands in «sedang disiapkan». The teacher's record works out «retake open» and «latest» in TypeScript, more loosely than the SQL (`pengajar.ts:1019-1047`). A transfer row's buttons read `status` only, while the closed-source rule lives inside `transfer_execute` | L-44, L-43 / L-55, L-35, L-38 |
| **C-4** | **Each «waiting for you» covers only one kind of decision** | The teacher's home falls back to «Tidak ada yang menunggu keputusan Anda» whenever there is no release to assign (`mengajar/page.tsx:140-176`). It never reads continue requests (`lanjut_diminta_pada`) or retake requests. The approver's Bagian A counts `management_decisions` only, while the line above it counts `percobaan_antrean` (`pimpinan/page.tsx:97-154`) | L-45, L-58; J4 confirms L-45 at a second school |
| **C-5** | **Recommendations read an old result** | The chapter page and the map always read `readingMap(pre_session)`, the Pemetaan Awal, even after a newer Uji Penguasaan. `map.intro` shows whatever the step (`[tugas]/page.tsx:45-48,106`). The result page and Hasil Belajar read the post-test's map | L-46, L-59 |
| **C-6** | **One verdict, words chosen per screen** | Every surface uses the shared `ketuntasan` (`siklus.ts:300`). But the start card and the Hasil Belajar headline ignore `bersertifikasi` when choosing their words: «Lulus» / «target tercapai» / «sudah mencapai target» | L-33, L-48, L-61 |

## 2 · Against the owner's five questions (ruling 95)

| Question | Answer so far |
|---|---|
| 1 · Do related screens derive their state from consistent authoritative information? | **No, in two places that matter.** «The sitting in force» has two definitions (C-1). Shared answers exist but are bypassed (C-3: `keadaanSertifikat`; the transfer rule) |
| 2 · Are pending decisions visible to the person responsible? | **Partly.** Each surface lists one kind of decision and then declares there is nothing else (C-4). The decisions themselves are recorded correctly |
| 3 · Are approved actions reflected throughout the journey? | **No.** An approved retake shows on one card and the test page only (C-2) |
| 4 · Are historical results, the current attempt and recommendations distinguished? | **No.** Attempts are unnumbered, and none is marked as in force (C-1, C-2: L-43 / L-55). Recommendations come from the oldest result (C-5) |
| 5 · Do changes to one screen reach its dependent screens? | **Not reliably.** The retake (C-2), Z's V2 «latest finalized» (C-1) and D2-R's certificate state (C-3, L-44) each stopped short of a sibling. **This is L-8 applied to screens:** the sweep covered tests (L-8) but not dependent screens |

**What holds** (J3's own check): the verdict itself is identical for learner, teacher and approver. The facts in the database are right; it is the screens that disagree.

## 3 · The direction of the correction (proposed; final only after all twelve journeys)

No new layer or framework (ruling 95). **Each cause gets one existing authority, used by every screen that shows that fact:**

| Cause | One authority | Who reviews |
|---|---|---|
| C-1 | **Two facts, both kept (Sol, qualification 1):** (a) **the result in force** = the latest FINALIZED sitting, as Z's V2 decided; (b) **the current attempt**, if one is underway. `my_cycle_state` keeps returning (b) exactly as today, and **gains (a) as an added field**, so no existing reader changes meaning (§3a). Each screen reads the one it means: the learner's result shows (a), with `hasil.ulang_berjalan` while (b) is open, as the teacher's side already does | **Sharon** (an RPC's contract; R-h/D2-R disclosure); Second Eye |
| C-2 | **The step derivation (`posisi`) takes `percobaan_saya`**, so «may retake» becomes a step that the home, the result, the chapter and `lanjut` all read from one place | Daisy (words); Second Eye |
| C-3 | **Every certificate surface uses `keadaanSertifikat`.** The transfer row offers only the actions its RPC would accept (the RPC's own rule, exposed on the read). The teacher's record uses the SQL's «in force» and draws `percobaan_ke` | Sharon (transfer); Daisy |
| C-4 | **«Waiting for you» means every kind of decision that person owns:** for the teacher, release, continue and retake requests; for the approver, management decisions and retake requests. The empty line appears only when all of them are empty | Daisy |
| C-5 | **Keep each recommendation's provenance (Sol, qualification 2).** The Pemetaan Awal's reading map and the Uji Penguasaan's «Baca lagi» serve different purposes, and neither replaces the other. Each is labelled with where it comes from. The screen makes clear which guidance is current: after an Uji Penguasaan, its «Baca lagi» is the current guidance, and the initial map stays readable as the starting point. The map's intro follows the step. **No new competency analytics** | **Daisy and Sharon** settle the distinction |
| C-6 | **One choice of words per verdict**, keyed on `bersertifikasi` (L-33's terms), on every surface | Daisy |

### 3a · Every consumer of `my_cycle_state` (Sol, qualification 1; Bob's check on main `429b7dcc`)

Today `post_session` / `pre_session` is the latest *begun* sitting. **That meaning is unchanged; the result in force is added beside it.**

| Consumer | What it needs | Today | After |
|---|---|---|---|
| `belajar/[tugas]/penguasaan/page.tsx:37` (the Uji Penguasaan) | the current attempt, to resume the open sitting | right | unchanged |
| `belajar/[tugas]/pemetaan/page.tsx:37` (the Pemetaan Awal) | the current attempt | right | unchanged |
| `belajar/[tugas]/hasil/page.tsx:48` (the result) | the result in force, and whether a retake is open | **404 during a retake (L-54)** | reads the result in force; shows `hasil.ulang_berjalan` while an attempt is open |
| `belajar/[tugas]/sertifikat/page.tsx:91` (the certificate) | the result in force | follows the open attempt | reads the result in force; uses `keadaanSertifikat` (C-3) |
| `belajar/sertifikat/page.tsx:71` + `components/sertifikat/asalSertifikat.ts` (the certificate list) | the session the certificate is for | **while a retake is open, a certificate from attempt 1 loses its title** (it degrades gracefully) | reads the result in force. **A new observation, recorded as L-66** |
| `belajar/[tugas]/page.tsx:38` (the chapter) | both: the step, and the result link | step only | both (C-2) |
| `belajar/[tugas]/lanjut/page.tsx:45,60` (what next) | both | step only | both (C-2) |
| `belajar/page.tsx:131` (the learner's home) | both | the current attempt only, so «Selesai» and the start card disagree (L-56, L-64) | both (C-2) |
| `belajar/[tugas]/peta/page.tsx:35` (the map) | the Pemetaan Awal's map, plus the latest «Baca lagi», each with its provenance | the Pemetaan Awal only | per C-5 |
| `lib/hasil-belajar.ts:59` (`adaHasilTertutup`) | whether any finished result exists | `post_status = FINALIZED` on the latest begun sitting: while a retake is open, it falls back to the pre-test | reads the result in force |

**Rule for the build:** every consumer above is in the batch's «dependent screens» list, and each has a journey assertion, both during an open retake and after it.

**How it stays consistent (lasting, not per row):**
- **L-8 extended to screens:** a change to a state also sweeps every screen that shows that state, in the same batch. The hand-off names them («dependent screens: N found, N updated»). This applies the existing principle; it is not a new procedure.
- **Cross-surface checks become journey assertions.** J3's three-surface verdict check is the model: for each cause, one journey step asserts that the sibling screens agree. For example, after a retake is approved, the home, result, chapter and `lanjut` all offer it; after a retake opens, the learner and the teacher both show the result in force.

## 4 · By journey

| Journey | Findings | Fit the causes | New cause |
|---|---|---|---|
| J2 | 10 | L-44 (C-3), L-45 (C-4), L-46 (C-5), L-48 (C-6) | — (the rest are wording or layout) |
| J3 | 9 | All five Significant (C-1, C-2, C-4) and L-59 to L-61 (C-5, C-6) | — |
| J4 | 3 new, plus 2 confirmations | L-63, L-64 (C-2); L-45 confirmed (C-4) | — (L-65 is wording only) |

## 5 · Open (filled as the journeys are walked)

- J4 to J12: does each new finding fit C-1 to C-6, or show a new cause? Daisy adds a «sibling screens» line per finding.
- To verify before the plan:
  - whether `learner.result` carries `percobaan_ke`;
  - ~~whether a later migration redefines `my_cycle_state`~~ **Checked (Bob): `20261010100000` is the last migration to define it, so «latest begun» is what main runs.**

## 6 · Sharon's early view on C-1, C-3 and C-5 (24 Nov; her record `AUDIT79-C1-C3-C5-VIEW.md`): conditions for the plan

**C-1 (a), adding «the result in force» to `my_cycle_state`.** Beyond the usual contract and registry checks:
1. **One SQL helper for «the result in force»** (the latest FINALIZED), shared with `hasil_belajar_sesi_orang`, so the two cannot drift.
2. **Return the sitting id, never result values.** Pages read it through `session_outcome` / `reading_map`, so they inherit `hasil_murid_id` (D14) and that sitting's own captured `bersertifikasi` gating.
3. **The same own-assignment ownership rule**, with no person parameter.
4. **For a TABLE return:** drop and create, with the grant and the registry entry asserted.
5. **A red-first test for each of the 11 consumers**, with the pinned case: an open retake after a finished attempt. The result page shows attempt 1, and the test page resumes attempt 2.

**C-1 (b), disclosure:** nothing new. The learner already sees that result in Hasil Belajar, and it stays counts-only by the old sitting's own flag. **Two conditions:**
- never call outcome, map or review with the OPEN retake's id;
- label the result as the previous attempt's.

**C-5, both recommendations shown:** nothing changes, provided that:
- each block is read with its own sitting's id and gated by that sitting's flag;
- each block's provenance is labelled (Daisy's words);
- if a pre-test KUAT beside a certifying result still reads as a mastery verdict, KUAT is dropped in that view only;
- a plant feeds the certifying id to the pre-test block, and must be refused.

**C-3, the transfer row:** no objection, provided that:
- **one helper holds the closed-source rule**, used by the read, the acceptance and `transfer_execute` alike, so no AUTHORIZED row dangles (this also closes L-35's (a) and (b));
- **the receiving school sees a boolean only**, never why the source closed: that reason is the sending school's record.
