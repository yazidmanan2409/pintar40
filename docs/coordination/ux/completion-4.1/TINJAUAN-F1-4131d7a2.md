# F-1 (C1w correction pass) and L-1: UX review in one visit (Daisy, 12 Nov 2026)

> **What holds now:**
> - **PASS on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`, for both F-1 and L-1.** Every item is accepted, with no change asked.
> - **F1-R1 is established in §3, with no fix proposed.** It also adds a second contradiction of the same kind: the misconception named on the option that is now the key.
> - L-1's grant fix (`916d12c01345816afcf567b40131e72b9857cf65`, now the branch head) is **not** part of this review.

**Instructions:**
- the engineer's review prompts for `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`;
- `TEAM-INSTRUCTIONS.md` at `04030845b020a2eadda92b51a3d74f5e002f798f`, Daisy items 1 and 2;
- the Chief Architect's addition F1-R1, in `C1W-F1-CORRECTION.md` §9b at `5125be26815a1a41afc4d0e2d25ad182f4c3f71a`.

**How it was rendered.** Locally only:
- this commit's own `npm ci` (the lock is unchanged since `1fc719b5`), a fresh reset to its migrations, the report world, `next build`, then `next start`.

**The corrected class:**
- I ran **C1W-J02's own steps** (`--only=C1W-J02`) with its cleanup turned off in my scratch copy only. The test file was restored afterwards.
- So the corrected class stays on screen: eleven learners on «Pertanyaan awal nomor 1», keyed A where B is right.
- The admin proposes B and the head of department confirms, both on the screens.
- **Every check in that test passed here.** Its only failure is the leftover count, which my change caused.

**Evidence:** `verifikasi-F1-4131d7a2/`, with screenshots and `catatan-jalan.txt`.

## 1 · F-1: the teacher's per-question screen

`/mengajar/{kelas}/soal?penugasan=…`, as the class's teacher.

| Item | Seen | Verdict |
|---|---|---|
| «Kunci» marks the key in force | On the corrected question, **B** carries «· Kunci» (bold), with «6 murid». A carries no mark | **Accept** |
| The new line | Below the options, in the meta style: «Kunci soal ini sudah diperbaiki. Jawaban di sini dinilai dengan kunci yang berlaku sekarang; kunci aslinya A.» In English: «This question's key was corrected. The answers here are marked by the key in force now; its original key was A.» (`F1-soal-X-blok-*.png`, `…-EN-390.png`) | **Accept, unchanged** |
| A teacher cannot mistake one key for the other | The key in force is the only one marked, in the list itself. The original key appears only in the sentence, introduced by «aslinya». The count «6 dari 11 menjawab tepat» and the five named as needing help («· A») follow the key in force, so the screen agrees with itself | **Accept** |
| The uncorrected questions | «Pertanyaan awal nomor 2» and «nomor 3»: unchanged. «Kunci» on A, «11 dari 11», «Semua yang mengumpulkan menjawab soal ini dengan tepat.», no new line (`F1-soal-Y-blok-390.png`) | **Accept** |
| The class misconception figure and the reading map | Unchanged in form. C1W-J02's rendered checks passed here: before the correction the class page names B's misconception; after, A's with its remediation and not B's. A learner who chose B is sent to neither remediation, and one who chose A to A's | **Accept** |
| 1280, 390, 320 · keyboard · accessibility | **No sideways scroll** at any width. **axe: 0 violations** at each. Reading order: question → «n dari 11» → options, key marked → the line → who needs help. The page's only control in the content is «← Lihat bukti», reached by Tab after the shell | **Accept** |

**On the wording:** it names what changed, what the marks now mean and what the original was, in the teacher's register and the screen's own words («Kunci», «dinilai»). It does not say who corrected it or when; that is in Studio («Diubah oleh …»), where it belongs.

## 2 · L-1: my check list (`L1-PRA-TINJAUAN.md`), on the same commit

| # | Check | Seen | Verdict |
|---|---|---|---|
| 1 | **Sign-in screen:** suspended, closed, unknown and active-with-a-wrong-password | All four (suspended with the right password, and with a wrong one) answer **401** and show the same sentence: «Email, username, atau password belum cocok. Periksa lagi, lalu coba sekali lagi.» Focus returns to the identifier. There is no reference code and no «coba lagi sebentar lagi». Same at 320 (`L1-*-390.png`, `L1-ditangguhkan-benar-320.png`) | **Accept** |
| 2 | **The other doors**, for suspended, closed, unknown and active | Activation code (wrong): 400 `KODE_TIDAK_COCOK` for all four. Recovery code (wrong): 400 `KODE_TIDAK_COCOK` for all four. Recovery PIN (wrong): 400 `PIN_TIDAK_COCOK` for all four. Identical bodies. **The card door was not driven here** (§2a) | **Accept** for what was seen |
| 3 | **The record's row** | Pak Yusuf's attempts, read by Bu Wulan (his school) and the platform admin: «Tidak berhasil masuk · Password · Email, username, atau password belum cocok.», «… · PINTAR ID dan PIN · PINTAR ID atau PIN tidak cocok.», «… · Kode pemulihan · Kode tidak cocok atau sudah tidak berlaku.» Nothing tells them apart from an ordinary mistake, and **«PINTAR sedang tidak dapat memeriksa» is gone** (`L1-baris-*.png`) | **Accept** |
| 4 | **Reinstatement** | After `aktifkan_kembali_akun`, the lock is cleared and the right password signs in (200, on to «perangkat») | **Accept** |
| 5 | **A real outage** (local Auth stopped for two attempts, then restarted) | 503, «PINTAR sedang tidak dapat memproses ini. … Kode rujukan: …», for an active and a closed account alike. **Unchanged.** axe: 0 | **Accept** |
| 6 | **Nothing else in the screens changed** | `src/` since `1fc719b5`: the teacher's line (F-1) and the sign-in decisions. **No user-visible string changed** in sign-in. A locked address asking for a sign-in link gets «terkirim», as every address does | **Accept** |
| 7 | **Accessibility** | axe: 0 on the sign-in screen after each refusal, at 390 and 320 | **Accept** |

**The lock is readable:** `banned_until` is `2999-12-31 23:59:59+00` for both locked accounts.

**Self-tests here:**
- **B1-A04 passes:** suspended with the right and a wrong password, then closed, each recorded as `MASUK_TIDAK_COCOK`; after the deletion, the rows read the PINTAR ID.
- **AUTH-K01 passes.**

### 2a · Not seen locally, and why

- **The card door, and the recovery PIN with the *right* PIN, for a locked account.** The platform admin's request for a class card was refused (403) for this world's learner, so I had no card to try. I don't know the world staff's PINs.
- **AUTH-A01**, which drives every door including these, could not set up here. Its activation email never reached my local mail sink. That is my environment, not the product.
- The evidence for these is **AUTH-K01** (here: the card decision maps Auth's refusal to `CARD_NOT_MATCHED`), and **AUTH-A01 in CI run `43142431230`**.
- **The hosted Auth stays untested**, as the brief defers.

## 3 · F1-R1, established: where a rationale sits beside a marked answer, and what a corrected question shows

| Screen | Shows a rationale? | What the corrected question shows |
|---|---|---|
| **The learner's player, result and reading map** (`/belajar/…`) | **No.** By design the player's payload holds no key, correctness or rationale (`ItemPlayer.tsx`), and Pemetaan Awal shows none | Nothing to contradict |
| **The teacher's per-question evidence** (`/mengajar/{kelas}/soal`) | **No.** `teacher_question_evidence` returns label, body, `is_key` and `was_key`, with no rationale | Nothing to contradict |
| **Studio, the corrected revision's package view** (`/studio/paket/{corrected course}`), seen by authors and the school's admins | **Yes**, each option's «Alasan» beside the «Kunci» mark | **The contradiction is here.** **B** carries «✓ Kunci» and «Alasan: Ini belum tepat.»; A carries «Alasan: Ini tepat.» **And a second one:** B, now the key, still names «Pemahaman keliru: Keliru B …», a misconception on the right answer (`F1R1-studio-koreksi.png`) |
| Studio, the original revision | Yes | Consistent: A is «Kunci» with «Ini tepat.» (`F1R1-studio-asli.png`) |
| **The correction's own review screen** (`/studio/tinjau/kunci/{id}`), where the second person confirms | **No.** It shows the stem, the options without their rationale, «Kunci sekarang A», «Kunci yang diusulkan B», the reason and the impact | **The confirmer is never shown the rationales the correction will leave contradictory** (`F1R1-tinjau-kunci.png`) |

**What the data holds:** the corrected item's options keep their authored text unchanged:
- **B** is `is_correct = true`, with «Ini belum tepat.»;
- **A** is `is_correct = false`, with «Ini tepat.».

**So, at this commit:**
- **No learner and no teacher reading a sitting meets the contradiction.** F-1's screens are clean.
- **It lives in Studio, on the corrected revision.**
- **It may also be served by any later surface that shows authored rationales or misconception labels beside the key.** Studio's preview, the bank and the canonical view read the same fields; I did not open each.
- **The one moment a person could catch it, the confirmation, doesn't show it.**

**No fix proposed, as asked.** One fact for whoever decides: whichever treatment is chosen, the confirmation screen (`/studio/tinjau/kunci/…`) is where the confirmer could be shown the affected options' rationale and misconception before confirming.

## 4 · Register

| # | Class | Finding |
|---|---|---|
| F1-R1 | owner's decision (raised by the Chief Architect) | Established in §3: the contradiction is in Studio's corrected revision, both the rationale and the misconception label, and not on any sitting's screen |

Nothing else.
