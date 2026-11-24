# Ruling 79 audit · the twelve journey scripts, final (Daisy, 24 Nov 2026)

> **What holds now:**
> - **Status:** final scripts for track 3b (ruling 89, `NEXT-SEQUENCE-89.md`). They supersede `AUDIT-79-SKRIP-PERJALANAN-DRAF.md` (`4f0b3f42`), which stays as history.
> - **Base:** `claude/next-base` `055738ba`, **plus D2-R when it lands.** J2, J3 and J7 read D2-R's result words (`../completion-4.1/D2R-KATA.md`).
> - **For the builder (3c):** §3 names every state the shared synthetic world must hold, one row per state, with the journeys that need it. Per-journey fixtures only where §3 says so.
> - **Roles** (ruling 79; 3d): Second Eye reproduces and captures; I judge; Sharon judges the protection points marked **[S]**; Bob consolidates.
> - **Each journey is walked:**
>   - at 1280, 390 and 320, by keyboard only;
>   - once with a screen reader (landmarks, the focus path, live regions);
>   - once on a throttled network;
>   - once with reduced motion.
> - **Each failure branch** is judged by ruling 81's three questions: does the person understand what happened, was their work kept, is the next step clear.
> - **Findings:** Critical, Significant or Improvement, by human impact, each with its dimension (A–H) and journey.
> - **Synthetic data only, in approved environments. Nothing runs on production.** Multi-answer items are included (ruling 88). AI drafts stay single-answer (ruling 81).
> - **Vocabulary:** my vocabulary page (`KOSAKATA-RIWAYAT-DAN-PENOLAKAN.md`) and the Z words are the reference. A screen that departs from them is a finding under B (cross-role truth) or H (tone).

**Dimensions:** **A** first use · **B** cross-feature and cross-role truth · **C** errors and recovery · **D** empty and uncertain states · **E** consequential actions · **F** effort · **G** accessibility · **H** educational and emotional tone.

## 1 · The journeys at a glance

| # | Journey | Who | World states (§3) | Dimensions |
|---|---|---|---|---|
| J1 | First day: class card, first sign-in, personal PIN, «Komputer siapa ini?», the tour | Young learner (SD) | W1, W2 | A, G, H, F |
| J2 | One chapter, start to certificate | Learner (SMP) | W3, W4, W5 | B, D, H, G |
| J3 | The gate, the retake, the new result | Learner, teacher, approver | W6, W7, W8 | B, C, H, E |
| J4 | An interrupted sitting | Learner, teacher | W9 | C, D, G |
| J5 | A teacher's week | New teacher | W3, W10, W11 | A, B, F, D |
| J6 | Authoring with AI drafts | Teacher-author, reviewer | W12, W13 | B, E, H, C |
| J7 | A key correction after results exist | Reviewer, school admin, outside verifier | W14 | B, E, D, H |
| J8 | A school year set up | School admin | W15 | A, E, F, C |
| J9 | A promotion, then a transfer across it | Two school admins | W16 | E, B, C |
| J10 | Locked out | Learner and staff, signed out | W2, W17 | C, G, H |
| J11 | Reading the school | Leader | W18 | B, D, H |
| J12 | Operating PINTAR | Admin PINTAR | W19 | E, C, D, B |

## 2 · The scripts

Each script has five parts:
- **start:** the world state;
- **steps:** the happy path;
- **branches:** the failures and edges walked;
- **check:** what I judge, beyond the standard walk;
- **[S]:** Sharon's protection points.

### J1 · First day (SD)
- **Start:** W1, a class of six learners with printed class cards, none activated.
- **Steps:**
  1. sign in by card number and card PIN;
  2. make a personal PIN;
  3. «Komputer siapa ini?» (shared);
  4. the tour;
  5. open today's task.
- **Branches:**
  - a wrong card PIN three times (the wait);
  - a mistyped card number;
  - a weak PIN refused (each PIN rule);
  - the shared/personal choice made wrongly, then changed in «Akun saya»;
  - the tour closed early, then reopened.
- **Check:**
  - the reading level of every sentence a 9-year-old meets (H);
  - steps and time to the first task (F);
  - touch targets at 320 (G);
  - no screen says more than the child needs.
- **[S]:** card and PIN pacing; nothing tells whether a card number exists.

### J2 · One chapter, start to certificate
- **Start:** W3, an assigned chapter with lessons, a sealed pass mark of 60, a certifying Uji Penguasaan with single-answer and multi-answer items, and a must-be-right item.
- **Steps:**
  1. Pemetaan Awal;
  2. the Peta Bacaan (its order, «Sudah kuat», `map.tingkat.arti`);
  3. lessons with stepwise help;
  4. Uji Penguasaan offered once Pemetaan Awal is done, with D2-R's advisory line;
  5. the test (no help, `posttest.tanpa_bantuan`);
  6. the result: «Lulus.», the counts secondary, nothing per question;
  7. the certificate («Sertifikat», no predicate);
  8. the public check.
- **Branches:**
  - a lesson left halfway, then resumed;
  - a multi-answer item partly chosen;
  - the result before a pass mark exists (W4: no verdict);
  - thin evidence on one objective (W5: «Baca lagi juga:» with its no-blame note).
- **Check:**
  - every claim word against its evidence (the sweep's Q3, now walked);
  - no «dikuasai» per objective;
  - no key or per-question mark on any certifying route (result, review, print, export);
  - the certificate line, the result and the public «Lulus» agree.

### J3 · The gate, the retake, the new result
- **Start:** W6, a learner at 83 % against 60 % who missed one must-be-right item.
- **Steps, walked by three people who compare what they see:**
  1. the learner: «Belum lulus.» with the gate reason, «Pelajari lagi», and the Hasil Belajar line;
  2. the teacher: `mengajar.murid1.gerbang`, and «Minta membaca lagi» pre-ticked;
  3. the approver: `kesempatan.baris.hasil_gerbang`;
  4. the retake requested and approved;
  5. while open, `hasil.ulang_berjalan` on the learner's and the teacher's sides;
  6. a second retake finished, «Lulus.», and the certificate.
- **Branches:**
  - the retake abandoned (W7: the line goes, and the earlier result and verdict stay);
  - the gate unknown (W8: `…tak_diketahui` on all three surfaces, nobody pre-ticked);
  - a must-be-right item with no linked objective (`gerbang_tanpa_tujuan`).
- **Check:**
  - **one verdict everywhere (B),** the core check;
  - the learner reads «Lulus» or «Belum lulus» and the teacher reads «tercapai» or «belum mencapai target». Judge whether two words for one verdict cause doubt; if so, it is a finding under B.
- **[S]:** who may approve a retake that can yield a certificate.

### J4 · An interrupted sitting
- **Start:** W9, a learner mid-Uji Penguasaan.
- **Branches:**
  - the network lost and returned;
  - the device changed, so permission is needed («Beri tahu guru Anda juga: Uji Penguasaan · {bab}»);
  - the teacher allows, and recovery happens on another session;
  - the time runs out during the gap;
  - the teacher ends the sitting (counted, or not counted);
  - maintenance starts (stage 0, then the T−15 staff line).
- **Check:**
  - each branch, from the learner's and the teacher's side;
  - nothing a learner answered is lost silently;
  - every wait says what is happening.

### J5 · A teacher's week
- **Start:** W10, a teacher new to PINTAR with two classes. One class is W3; the other has no results (W11).
- **Steps:**
  1. «Siapkan» a chapter (the window, «Sampai» left empty);
  2. an Uji Cepat in class (the minutes chosen; a learner joins late; one is held by a stop);
  3. read «Bukti» and the topic grid;
  4. «Minta membaca lagi»;
  5. «Ubah jadwal»;
  6. «Atur» → «Tambah waktu»;
  7. «Siapa» at 390, as blocks.
- **Check:**
  - first-use clarity without the tour (A);
  - the steps per weekly task (F);
  - the empty states for W11 (D);
  - the carried audit notes: «target 60 %» above «Murid», and the breadcrumb «/».

### J6 · Authoring with AI drafts
- **Start:** W12, a draft package at a school entitled to AI drafting; W13 is a second school without it.
- **Steps:**
  1. «Pelajaran tujuan» and the source;
  2. drafts;
  3. edit one, accept one, delete one;
  4. «Ajukan» held, then submitted;
  5. the reviewer's count;
  6. approval.
- **Branches:**
  - a source with learner data (refused);
  - the allowance used up;
  - the provider ceiling;
  - the package already marked as passing the check;
  - a stale form (`AI_TUJUAN_LAIN`);
  - the AI button absent at W13.
- **Check:**
  - provenance honest to staff and invisible to learners (B, H);
  - nothing promises what the allowance cannot keep.
- **[S]:** no learner data leaves PINTAR; entitlement checks.

### J7 · A key correction after results exist
- **Start:** W14, results and an issued certificate exist; one key is wrong.
- **Steps:**
  1. propose the correction;
  2. the second person approves;
  3. results are recalculated, the old figure shown beside the new;
  4. the certificate is «Sedang ditinjau»;
  5. an outside verifier opens the public link («Seperti saat diterbitkan»);
  6. a printed copy is compared (no status word, QR present);
  7. the review is settled: reissued, then a second case revoked.
- **Check:**
  - the learner's, the teacher's and the verifier's views agree at each moment (B);
  - the words before each irreversible step name its effect (E).
- **[S]:** the public surface's fields; the name never appears.

### J8 · A school year set up
- **Start:** W15, an empty school.
- **Steps:**
  1. structure (Kelas · Tingkat · Bagian);
  2. pass marks (1–100);
  3. staff roles with «Berlaku sampai» (today included);
  4. intake by workbook, with planted errors;
  5. activation cards printed.
- **Branches:**
  - a role without a date;
  - a school code of the wrong shape (the field kept);
  - a workbook that fails its check;
  - a rule renamed (settings kept);
  - the last Admin sekolah trying to close their own account, or to revoke the last admin role.
- **Check:**
  - the effort count for a 600-learner school (F);
  - every refusal names its field (C);
  - Konfigurasi's one navigation on every sub-page (R-10).

### J9 · A promotion, then a transfer across it
- **Start:** W16, two schools; a learner at school A with an open transfer request to school B.
- **Steps:**
  1. the year-end promotion at A;
  2. B presses «Terima perpindahan» → `TRANSFER_SOURCE_CLOSED`;
  3. A makes a new request;
  4. B accepts.
- **Check:**
  - both schools understand who acts next (B, C);
  - nothing changed by the refused step (E);
  - the review summary's fixed order.
- **[S]:** ruling 73's own-authority rule, if W16 also holds a suspended requester.

### J10 · Locked out
- **Start:** W2 (activated learners and staff) and W17 (one closed account).
- **Signed-out paths:**
  - forgot password by email, by username, and by PINTAR ID + PIN (time runs out: `lupa.pin.berakhir`);
  - the session lock (PIN, card PIN, three tries; a reset PIN: «belum punya PIN yang bisa dipakai»);
  - a closed account's reopening request (a short message refused with the field kept, a double press, Back, the wait).
- **Check:**
  - every wait names the right thing (network, what was typed);
  - the screen reader's announcements;
  - no blame in any sentence (H).
- **[S]:** no existence oracle anywhere; pacing.

### J11 · Reading the school
- **Start:** W18, a school with mixed evidence: some domains withheld, a moved class, a class under the minimum sample.
- **Steps:**
  1. Pimpinan's report;
  2. readiness bands;
  3. «Belum cukup bukti»;
  4. «Semua bidang kompetensi yang punya angka…»;
  5. the printed summary.
- **Check:**
  - every «semua» or «all» against what was judged (D, B);
  - the tone towards learners and teachers in a leader's view (H);
  - T-01's four names for one objective, as the leader meets them.

### J12 · Operating PINTAR
- **Start:** W19, an Admin PINTAR on a quiet day, with W3 running.
- **Steps:**
  1. plan maintenance;
  2. extend it;
  3. end it early;
  4. an emergency stop and its end;
  5. a test email;
  6. a platform role renewed, then the last-admin refusal.
- **Check:**
  - what learners and teachers see at each moment (B, with J4);
  - every consequential step confirmed in words that name the effect (E);
  - «Admin PINTAR» throughout.
- **[S]:** who may stop PINTAR; the audit rows.

## 3 · The world states, for the builder (3c)

One shared synthetic world. Fixtures only where marked.

| State | What it holds | Journeys |
|---|---|---|
| W1 | An SD class of 6 learners with printed class cards, none activated | J1 |
| W2 | Activated learners (one with a personal PIN, one with a reset PIN) and staff with email accounts | J1, J10 |
| W3 | A school year with a sealed pass mark of 60; a chapter with 3 lessons, Pemetaan Awal, and a certifying Uji Penguasaan of at least 6 items: single- and multi-answer, one must-be-right item, at least 2 objectives with at least 2 items each, plus 1 objective with 1 item (thin evidence) | J2, J5, J12 |
| W4 | A chapter given before a pass mark existed (a no-verdict result) | J2 |
| W5 | A finished Uji Penguasaan where only the thin-evidence objective is below the mark | J2 |
| W6 | A learner at 83 % / 60 % with the must-be-right item missed, an attempt limit of 1, an approver who is not the teacher | J3 |
| W7 | The same learner with a retake begun, then abandoned (fixture: two moments) | J3 |
| W8 | A result whose gate cannot be read (fixture: a withheld or error read, as Z's captures did) | J3 |
| W9 | A learner mid-sitting, with the teacher's «Siapa» open; a second device | J4 |
| W10 | A new teacher with two classes and no prior actions | J5 |
| W11 | A class with members and no results at all | J5 |
| W12 | A draft package at a school with AI entitlement, the local provider stub, and an allowance near its end | J6 |
| W13 | A second school without AI entitlement | J6 |
| W14 | Results plus one issued certificate on a chapter whose key will be corrected; a second certificate for the revocation case | J7 |
| W15 | An empty school with one Admin sekolah and a workbook with planted errors | J8 |
| W16 | Two schools; a learner at A with an open transfer request to B; A's year ready to promote | J9 |
| W17 | One account closed at its owner's request | J10 |
| W18 | A school with: one domain withheld (few learners), one class moved, one class under the minimum sample, and readiness bands populated | J11 |
| W19 | An Admin PINTAR and a second Admin PINTAR (for the last-admin case) | J12 |

**Shared-world rules:**
- invented names only, no real people;
- one school year;
- **ID first, with each journey walked once in EN;**
- the clock and time zone fixed (WIB, plus one WITA school for J12's banners);
- a reset returns every state.

## 4 · Carried into the audit (not new scope)

- **From the Z reviews:**
  - N-13 (links in text not underlined);
  - N-18 (an `h1` at body size);
  - N-19 (a double announcement);
  - N-20 (the bar's second line);
  - R-10 Option B (the 14-section list on sub-pages);
  - «target 60 %» and the breadcrumb «/» (J5);
  - S-06's lasting cause (J5).
- **From the sweep's "later" rows:** T-01, T-04 to T-08, T-10 to T-12, S-14, S-16, K-06, K-08 and K-09. Each is met by the journey named in its row above, or by J5/J11 for the terminology rows.
- **For J3:** «Lulus» (the learner) against «tercapai» (the teacher), one verdict with two words.
