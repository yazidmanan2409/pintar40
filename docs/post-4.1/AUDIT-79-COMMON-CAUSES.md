# Audit 79 · the common causes behind conflicting screens (Bob, 24 Nov 2026; ruling 95)

**Status: INTERIM, brought up to date at 24 Nov 22:50Z, covering every finding L-1 to L-147.**
- Daisy has walked all twelve journeys locally, and every finding has a severity (W2).
- The builder's captures are judged for J2, J3, J4, J5, J6, J7 and J10. J8, J9, J11 and J12 are still to be captured.
- **FINAL comes once those four are judged** (ruling 95: the plan isn't final until every journey is done), so a cause may still be added.
- Tonight's update adds C-12 and widens C-3, C-6, C-7 and C-11 (§1, §8).

The original status note (12:03Z) follows. Sol's review (relayed by the owner, 24 Nov) supports the direction in principle, with two qualifications, adopted here: C-1 keeps the current attempt and the result in force as two facts, and every consumer of `my_cycle_state` is checked (§3a); C-5 keeps each recommendation's provenance. Sol's recommendation, as relayed: approve the direction in principle, and finalise the implementation plan only after all twelve journeys. It is updated as Daisy walks each remaining journey. **The correction plan is not final until all twelve are walked** (ruling 95). Nothing here is built.

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
| **C-3** | **A page re-derives a shared fact from raw fields** | The certificate page tests `outcome.lulus` (`sertifikat/page.tsx:101`) instead of `keadaanSertifikat`, so a non-certifying pass lands in «sedang disiapkan». The teacher's record works out «retake open» and «latest» in TypeScript, more loosely than the SQL (`pengajar.ts:1019-1047`). A transfer row's buttons read `status` only, while the closed-source rule lives inside `transfer_execute` | L-44, L-43 / L-55, L-35, L-38; **J7:** L-68 (the holder is told the check confirms «masih berlaku» while the public page says otherwise), L-70 («tidak pernah dihitung ulang» after a recalculation) |
| **C-4** | **Each «waiting for you» covers only one kind of decision** | The teacher's home falls back to «Tidak ada yang menunggu keputusan Anda» whenever there is no release to assign (`mengajar/page.tsx:140-176`). It never reads continue requests (`lanjut_diminta_pada`) or retake requests. The approver's Bagian A counts `management_decisions` only, while the line above it counts `percobaan_antrean` (`pimpinan/page.tsx:97-154`) | L-45, L-58; J4 confirms L-45 at a second school; **J7:** L-69 (a correction waits for the second person, who is told nothing waits) |
| **C-5** | **Recommendations read an old result** | The chapter page and the map always read `readingMap(pre_session)`, the Pemetaan Awal, even after a newer Uji Penguasaan. `map.intro` shows whatever the step (`[tugas]/page.tsx:45-48,106`). The result page and Hasil Belajar read the post-test's map | L-46, L-59 |
| **C-6** | **One verdict, words chosen per screen** | Every surface uses the shared `ketuntasan` (`siklus.ts:300`). But the start card and the Hasil Belajar headline ignore `bersertifikasi` when choosing their words: «Lulus» / «target tercapai» / «sudah mencapai target» | L-33, L-48, L-61 |
| **C-7** (J7; widened by J5, ruling 97) | **An action is offered without its prerequisites: the rule is held only by the RPC that refuses it, or nowhere.** Buttons are gated on status and permission, not on what the action needs, and the rows often don't even select the needed column. Rules added later as a trigger or in the executing RPC were never carried back into the earlier steps or the reads | `siapkan`'s «Sediakan» is always enabled (`siapkan/page.tsx:300`), while `ASSIGN_PASS_MARK_MISSING` is raised by an insert trigger (`20261102100000:310`), the pass mark being added after the page. `transfer_execute` refuses SOURCE_CLOSED, but `transfer_terima`, `transfer_authorize` and the `pindah_masuk` read never check the source, so a transfer can be accepted into an AUTHORIZED state that can never be executed. Uji Cepat is offered on every class (`langkah/page.tsx:66`), while its page needs an ACTIVE assignment. `putuskan_tinjauan_sertifikat` has no result check at all (CI-1) | L-67, L-79, L-35, L-81; the J5 sweep found 9 such buttons (§3b) |
| **C-8** (J7, new) | **The person who notices isn't the person who may act** | The teacher and the head of department see a wrong key but only the admin can flag it | L-71 |
| **C-9** (J10, new) | **A refusal worded to hide a state from strangers is also shown to the person who has proven they own the account** | A closed account with the correct password gets the same «belum cocok» as a wrong password | L-75, L-76. **Sharon's rule:** say more only after the requester has proven what a stranger can't know, and only where the proof is strong: a password qualifies, a PIN doesn't |
| **C-10** (J8, new) | **Some forms leave validation to the browser** | Three fields refuse only through the browser's bubble (not announced the same way, and gone on scroll), while sibling forms give PINTAR's own line | L-88 (absorbs L-77) |
| **C-11** (J12, new; widened by J10) | **Two features' rules about the same session were written without each other** | Maintenance tells learners to sign out before it starts; A3's one-device rule makes signing out mid-test require the teacher's permission. **J10:** the welcome tour moves the page, and the shared-computer lock counts any scroll as a person's activity, so the lock never fires while the tour is open (Sharon traced it: PenjagaSesi listens to `scroll` with capture, and Tur.tsx borrows body padding and calls `scrollBy`) | L-99; **L-112 (HIGH)**, L-114 |
| **C-12** (J5, J8, new) | **A refusal names the wrong cause** | The refusal shown isn't the one that applies, so the person fixes the wrong thing. A result link missing its parameter is answered as a permission refusal; a learner offered for a staff role is refused as «bukan wewenang Anda», when the real cause is her class card; an immediate account close is refused as «Permintaan ini tidak diajukan». C-9's neighbour: C-9 hides a true cause on purpose, while C-12 names a false one by accident | L-122, L-129, L-133 |

## 2 · Against the owner's five questions (ruling 95)

| Question | Answer so far |
|---|---|
| 1 · Do related screens derive their state from consistent authoritative information? | **No, in two places that matter.** «The sitting in force» has two definitions (C-1). Shared answers exist but are bypassed (C-3: `keadaanSertifikat`; the transfer rule) |
| 2 · Are pending decisions visible to the person responsible? | **Partly.** Each surface lists one kind of decision and then declares there is nothing else (C-4). The decisions themselves are recorded correctly |
| 3 · Are approved actions reflected throughout the journey? | **No.** An approved retake shows on one card and the test page only (C-2) |
| 4 · Are historical results, the current attempt and recommendations distinguished? | **No.** Attempts are unnumbered, and none is marked as in force (C-1, C-2: L-43 / L-55). Recommendations come from the oldest result (C-5) |
| 5 · Do changes to one screen reach its dependent screens? | **Not reliably.** The retake (C-2), Z's V2 «latest finalized» (C-1) and D2-R's certificate state (C-3, L-44) each stopped short of a sibling. **This is L-8 applied to screens:** the sweep covered tests (L-8) but not dependent screens. D2-R's own sweep missed two sibling screens: L-44 (the certificate page) and L-82 (Siapkan's certificate step) |

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

### 3b · J5's readiness cause (ruling 97), traced on main `429b7dcc`

**Readiness is worked out per page from partial facts; no «may I do X» read exists for assigning.** The class page and `menungguKelas` say «Siap» from published + place fit, minus releases already held. The Siapkan list also drops a chapter line the class already has, so the two disagree. The review step reads the pass mark but only prints it. `assign_release` and its insert triggers hold the real list: NOT_ALLOWED, CLASS_INVALID, RELEASE_NOT_PUBLISHED, WINDOW_INVALID, EXISTS, PRE/POST_TEST_MISSING, PRE/POST_TEST_TOO_SHORT, CYCLE_OVERLAP, maintenance, plus the triggers' PASS_MARK_MISSING, CONTEXT_MISMATCH and EXPOSED_CONTENT. `instrumen()` re-derives the tests more loosely than `assign_release`, so the review can show tests the RPC would refuse.

**PINTAR already has the pattern that works**, so no new abstraction is needed: **a read the database owns that answers «may do / why not» with the same codes the action raises.** For example:
- «Akhiri» asks `akhiri_penugasan_pratinjau`;
- re-enrolment reads `bisa_dikoreksi` / `di_sekolah_lain`;
- place fit reads `releases_matching_place`;
- Studio publishing reads `publish_readiness` / `studio_package_state`.

**Direction (proposed; final after all twelve journeys):**
- every consequential action with prerequisites gets that pattern: one read returning the action's own refusal codes, used by every indicator («Siap») and by the button's enabled state;
- the refusal codes stay the database's own;
- where the rule is missing entirely (L-67), it is added, which CI-1 does.

The 9 buttons found:

| # | Where | Action RPC | Unchecked prerequisite |
|---|---|---|---|
| 1 | `siapkan/page.tsx:300` | `assign_release` | the pass mark (L-79) |
| 2 | the same | the same | PRE/POST_TEST missing or too short, CYCLE_OVERLAP, EXPOSED_CONTENT (`instrumen()` re-derives loosely) |
| 3 | `uji-cepat/page.tsx:255` | `launch_selected_quick_assessment` | QUICK_PASS_MARK_MISSING (only for assignments predating school pass marks; to confirm) |
| 4 | `studio/paket/[course]/page.tsx:742` | `move_learning_assignment_release` | RELEASE_MOVE_STARTED, RELEASE_MOVE_NO_CYCLE_DEFINITION |
| 5 | `konfigurasi/page.tsx:1917` | `transfer_execute` | SOURCE_CLOSED, ALREADY_ENROLLED (L-35) |
| 6 | `konfigurasi/page.tsx:1947` | `transfer_terima` | a closed source: **not refused by the database either** (L-35 (a), and Sharon's one helper) |
| 7 | `konfigurasi/sertifikat/page.tsx:175` | `putuskan_tinjauan_sertifikat` | the result in force: **no rule anywhere** (L-67, CI-1) |
| 8 | `langkah/page.tsx:66`, `[kelas]/page.tsx:152` | Uji Cepat | no chapter available (L-81); also `soalUjiCepat` turns any RPC error into «empty» (`pengajar.ts:643`), and the empty state offers no way on |
| 9 | `[kelas]/page.tsx:261`, `pengajar.ts:842` | «Siap» and the f4 card | the chapter-line rule that Siapkan applies (whether the DB enforces it: to confirm) |

**Sol's qualification (relayed by the owner, 24 Nov): both checks remain.** A readiness read informs the person; **the database still makes the final decision when the action is performed**, because circumstances can change between drawing a button and pressing it. So the «may do / why not» read never replaces the action's own refusal; it uses the same codes, and a refusal at press time is still shown as a named refusal (DAISY-18). Reusing PINTAR's existing pattern, rather than a new framework, is supported.

**How it stays consistent (lasting, not per row):**
- **L-8 extended to screens:** a change to a state also sweeps every screen that shows that state, in the same batch. The hand-off names them («dependent screens: N found, N updated»). This applies the existing principle; it is not a new procedure.
- **Cross-surface checks become journey assertions.** J3's three-surface verdict check is the model: for each cause, one journey step asserts that the sibling screens agree. For example, after a retake is approved, the home, result, chapter and `lanjut` all offer it; after a retake opens, the learner and the teacher both show the result in force.

## 4 · By journey

| Journey | Findings | Fit the causes | New cause |
|---|---|---|---|
| J2 | 10 | L-44 (C-3), L-45 (C-4), L-46 (C-5), L-48 (C-6) | — (the rest are wording or layout) |
| J3 | 9 | All five Significant (C-1, C-2, C-4) and L-59 to L-61 (C-5, C-6) | — |
| J4 | 3 new, plus 2 confirmations | L-63, L-64 (C-2); L-45 confirmed (C-4) | — (L-65 is wording only) |
| J7 | 8 | L-68, L-70 (C-3); L-69 (C-4); L-74 (C-6) | **C-7** (L-67), **C-8** (L-71) |
| J10 | 3 | — | **C-9** (L-75, L-76); L-77 is layout |
| J5 (part) | 4 | L-79 (C-3, C-7), L-80 (C-4), L-81 (C-7), L-82 (C-6) | — |
| J6 | 3 | L-83 (C-4) | — |
| J8 (part) | 6 | L-89 (C-6); L-39 confirmed | **C-10** (L-88) |

**Since 12:03Z (the builder's captures, Daisy's remaining walks, and the specialists' findings):**

| Journey | New findings | Fit the causes | New or widened cause |
|---|---|---|---|
| J10 (capture) | L-112 to L-117, L-147 | L-113, L-116 (principle 4); L-117 (C-6); L-147 (C-6) | **C-11 widened** (L-112, L-114); L-115 is layout |
| J5 (rest, capture) | L-118 to L-123, L-134, L-141, L-145, L-146 | L-118 (C-3); L-119 (C-7); L-120 (C-10); L-121 (C-6, C-3); L-123 (C-6); L-134 (C-3); L-141 (C-5); L-145 (C-6) | **C-12** (L-122) |
| J6 (rest, capture) | L-124 to L-126, L-143, L-144 | L-124, L-143 (**C-7, the database half missing**); L-125 (form state); L-144 (accessibility) | **C-7 widened:** a rule held by the screen only, with the database not enforcing it (principle 3's second check). L-126 is accountability (§8) |
| J8 (rest, probe) | L-127 to L-133, L-142 | L-127 (C-7: a rule assuming names are unique); L-128 (C-7); L-130 (C-10); L-131 (C-3); L-132 (C-7, C-10) | **C-12** (L-129, L-133); **C-3 widened** to contracts: L-142, a sibling route bypassing the helper that guarantees no-store |
| J8 (capture) | L-148, L-150 to L-153 (L-149 withdrawn) | L-148 (**C-7** and **C-12**: staff units offered as Tempat, then refused with the learner line); L-150 (C-10); L-151 (data quality, Sharon's encode-on-output rules); **L-152 (C-12, C-7: the last admin told a false cause)**; L-153 (layout) | — |
| J9, J11, J12 (passes) | L-135 to L-140 | L-138 (C-6); L-139 (accessibility) | **C-6 widened:** words outside the translation lookup (L-135, L-136, L-140: hard-coded in `konfigurasi/page.tsx`) |

**The counts behind the shape:**
- **Daisy's W2:** 18 of the 28 Significant findings come from C-3 and C-4. That is the strongest single argument for fixing in the shared layer, not page by page.
- **Certificates** hold the one Critical (L-67), one High (L-105) and four Significant findings (L-68, L-70, L-106, and L-105's replaced case), so they go first.
- **Every specialist-classified [S] finding tonight** (L-112, L-124, L-126, L-127, L-131, L-134, L-142, L-143) is either C-7's missing database half or a confidentiality boundary (§8).

## 4a · Owner direction for the remaining analysis (ruling 96)

- **Certificates, three facts:** the original passing result, the recalculated result, and the certificate's current validity. Each is communicated truthfully and distinctly, on every surface that shows the certificate, the public check included. This is C-1's «two facts, both kept» applied to certificates.
- **How an assessment ended** is preserved and shown to the learner (L-63; C-2).
- **Recovery (J10):** better guidance, with no weakening of account confidentiality. Sharon confirms whether any account-specific disclosure is appropriate.
- **No speculative fixes; don't reopen 4.1 unnecessarily.** A confirmed critical integrity issue goes to the owner promptly.

## 5 · Open (filled as the journeys are walked; at 22:50Z what remains is the builder's J8, J9, J11 and J12 captures and their judgement)

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

## 7 · The lasting principles (Sol, relayed by the owner, 24 Nov), carried into 4.5, 5.0 and 6.0 (rulings 97 and 98)

1. **One authoritative interpretation of each state** (C-1, C-3).
2. **Consistent communication across related surfaces** (C-2, C-4, C-6), verified by cross-surface journey assertions.
3. **Actions offered only when their known prerequisites are satisfied** (C-7). The database still decides at the moment of action.
4. **No promises unsupported by the underlying facts** (L-44, L-67, ruling 90's response-time lesson).

5. **Confidentiality holds throughout the system, not only on the screens** (ruling 98).

They also cover **accessibility as its own verification**: a screen that looks right isn't necessarily accessible (L-87, and the SR pass). And **a finding is told apart from a limitation of the synthetic data** (Daisy's L3 judgement).

## 8 · What tonight's findings add to the direction (proposed; final with W3)

**C-7, the second check.**
- Principle 3 says the database still decides at the moment of action. L-124 and L-143 show the opposite gap: the screen holds the rule, and the database doesn't.
  - «Tandai lolos pemeriksaan» runs the check in the app action only.
  - Neither mark is refused while an AI draft waits.
- **Direction:** every rule a screen enforces is also enforced by the action's RPC, with the same code. Sharon's conditions bind the «lolos» mark to the exact revision it checked, and approval re-checks the current revision whatever the mark says.
- The sweep for C-7 therefore runs both ways:
  - a button without the database's rule (the 9 in §3b);
  - a database action without the screen's rule.

**Confidentiality as a cause family (principle 5).** Five boundaries were set by Sharon tonight:

| Finding | The boundary |
|---|---|
| L-134 | A teacher never learns that a sitting was set aside by an integrity review: only «not countable», and the ordinary next step |
| L-131, L-142 | A PIN is a secret shown once. Every response carrying a secret is `no-store`, with a static guard against the bypass |
| L-127 | A name is never identity. NIS is per school, shown only to intake and admin staff, and never matched across schools. No merge without an audited admin decision, and removing an import row never touches a person record |
| L-126 | Every AI refusal records a closed reason code, so the request log is accountable (before C3w-2's activation; PR-24) |
| L-112 | The shared-computer lock is a confidentiality control. Only real input counts as activity |

**C-11, the shared session.** The lock, the tour, maintenance and the one-device rule each make rules about one person's session. **Direction:** the idle lock counts only real input (keydown, pointerdown, touchstart, wheel, real pointer movement), never a render or a programmatic scroll, and every component that scrolls, focuses or changes height by itself is swept (Sharon's conditions on L-112).

**C-12, the true refusal.** Each refusal names the cause that applies, from the action's own code (the same codes C-7's «may do / why not» read returns). It's never a generic permission line when the cause is known and harmless to name.

## 9 · Test-reliability causes (not product, recorded for the closure report)

Three test faults went red tonight. Each was a test depending on something it didn't control:

| Fault | Depends on | Fix |
|---|---|---|
| C1W-S06 | the random order of questions | proven under both orders (CI-1) |
| R1-K01 | the wall clock (UTC against the school's day), so it fails every evening from 16:00 to 24:00Z | in CI-2, ported to H-1. **Main carries it until one merges** |
| Z-S12-01 | randomly drawn test addresses colliding on a rate-limited route (about 2 in 250) | a non-repeating draw, its own range, and a sweep (in CI-2) |

**The lesson:** a passing run is evidence only for the order, time and data it ran with. Tests pin each of these or are independent of them. (Also: a run result is quoted only from the API's conclusion, plan of record §3d.)
