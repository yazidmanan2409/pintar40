# Ruling 79 audit · J9, a promotion then a transfer across it: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J9 walked** with the builder's own harness (`audit/perjalanan/j9.mjs`, keyboard only, the world reloaded before each width), run locally on the audit world `00fe853d`, at 1280, 390 and 320. **Every walk reached its last screen.**
>   - **People:** W16, Flamboyan's admin Teguh (A) and Kenari's admin Andi (B), with Qori Ananda's open transfer.
>   - **Local-only change:** the harness was pointed at this machine's browser (`executablePath`, in my scratch copy only).
> - **Captures:** `audit79-j9/`, at 390, from the run's `standar-id-390`.
> - **3 findings: 1 Significant (new), 2 Improvement.** L-35 and L-38 are confirmed, not re-counted.
> - **«Nothing changed by the refused step» holds:** «Laksanakan» on the stale request was refused, and the transfers and enrolments before and after are identical. Its words are clear and honest: «Belum berhasil … sudah ditutup … misalnya karena kenaikan kelas. Perpindahan tidak dijalankan, dan tidak ada yang berubah. Sekolah asal perlu mengajukan perpindahan baru …».

## Significant

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J9-1** | **The promotion doesn't say it will strand an open transfer.** A's review («Langkah 3 dari 3 · Tinjau lalu konfirmasi») lists «4 naik ke 8A · 2027/28». Qori is among them, with a transfer request to Kenari still open, and nothing says so. After the promotion that request can never be carried out, which is the upstream cause of L-35 (B is stuck later) | **Disagree.** A's «Perpindahan murid» lists Qori's REQUESTED transfer; the promotion review doesn't mention it | C-7 (a consequential action offered without the fact beside it) | E, B | In the review, name each learner with an open transfer: «Qori Ananda punya permintaan pindah ke SMP Sintetis Kenari yang belum dijalankan. Bila dinaikkan, permintaan itu tidak dapat dijalankan lagi.», with the choice to leave her out or proceed. That prevents L-35 rather than recovering from it |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J9-2 | The review states «4 naik ke 8A · 2027/28» twice in a row (the heading, then the disclosure's summary) | — | — | B (visual) | Keep one: the disclosure's summary |
| J9-3 | After A submits the new request: «Perpindahan diajukan dan kini menunggu persetujuan dari pihak lain.» «pihak lain» is vague when PINTAR knows it is Kenari | The request row names Kenari | — | H | «… menunggu persetujuan SMP Sintetis Kenari.» |

## Confirmed, not re-counted

- **L-35:** B's «Terima» on the stale request is accepted («Sekarang bisa dijalankan»), then «Laksanakan» is refused, and the stale row stays AUTHORIZED beside the new one.
- **L-38:** no source school on B's rows.

## Holds

- **The promotion:** its teacher-assignment warning has an explicit acknowledgement («Saya tahu 8A · 2027/28 belum punya guru …») before «Konfirmasi kenaikan kelas»; it says «Semuanya diterapkan bersama atau tidak sama sekali»; and the result says how it was checked («Diperiksa dari data PINTAR: semua sesuai»).
- **The new request:** works end to end at both schools, «✓ Selesai. Perpindahan dijalankan.»

## Left for the builder

- The EN pass, the screen reader, throttled and reduced-motion passes;
- the [S] suspended-requester case.

## The passes walked locally (24 Nov 21:40): EN, screen reader, throttled, reduced motion

I ran the builder's harness `audit/perjalanan/j9.mjs` at `6b248975`, at 1280, once per pass (`AUDIT_BAHASA=en`; `AUDIT_LALUAN=pembaca-layar`, `jaringan-lambat`, `gerak-dikurangi`). **Every pass reached its last screen.**

### Holds
- **The outcome is the same in every pass:**
  - the promotion ends the 2026/27 enrolment and opens 2027/28;
  - «Terima» on the stale request is accepted (L-35);
  - «Laksanakan» is refused and nothing changes;
  - the new request then goes through.
- **Throttled:** each step takes about 3 times as long (L1 31 s against 9.6 s). There are no duplicate submissions, and the data matches.
- **Screen reader:**
  - the refusal is a live `alert` with its full sentence;
  - the action buttons carry the learner's name («Laksanakan · Qori Ananda»);
  - the page has one h1, with h2 for the request form.
- **Reduced motion:** nothing in J9 animates. No difference.
- **EN, the promotion steps:** the steps, the review and the teacher-assignment check are in English («Nothing has changed yet …», «Everything is applied together or not at all.»).

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J9-4 (Significant)** | **In EN, the transfers page stays Indonesian** (`08-b-laksanakan`, EN run): the title «Perpindahan murid», the status «Disetujui», the buttons «Laksanakan» and «Tolak», the full refusal «Belum berhasil. Pendaftaran murid ini …», and the request form («Ajukan perpindahan ke sekolah lain», «Cari sekolah»). The sidebar and paging around it are English. An EN-reading admin can't read the one sentence that tells them what to do next. The section's words are written in `src/app/konfigurasi/page.tsx` (around line 1899) rather than drawn from `hle.ts`, which already holds `pindah.*` EN keys for the incoming list. | **Disagree:** the incoming-transfer words exist in EN (`pindah.masuk.judul` «Incoming transfer requests») | C-6 (words chosen per screen, here outside the word file) | B, H | Move the section's words into `hle.ts` with EN. Add a sweep for other hard-coded words in `konfigurasi/page.tsx` to the visual and wording consistency pass. |
| J9-5 | In EN, the promotion page's h1 is still «Kenaikan kelas dan kelulusan» (`04`), under English steps | — | C-6 | H | «Promotion and graduation» |
| J9-6 | In EN: «I know 8A · 2027/28 **have** no teacher yet» (one class: «has»). The review repeats «4 up to 8A · 2027/28» twice: the summary line, and the collapsed row's label. | — | — | H | «I know 8A · 2027/28 has no teacher yet …». The collapsed row reads «Details: 4 students» |

**Still for the builder:** the [S] suspended-requester case (it needs a requester suspended between request and acceptance, which J9's harness doesn't stage).

## Capture judgement · the builder's committed J9 (`25fe5ea9/j9`, `1ed2d250`), 25 Nov 00:05

Seven walks, every one reaching its last screen. They match my local passes:
- the same outcome in every walk (L-35 «Terima» accepted, «Laksanakan» refused with nothing changed, the new request goes through);
- the EN walk confirms J9-4 (L-135).
- **390 and 320 hold:** the refusal wraps in full at 320 (`08-b-laksanakan`), «Laksanakan» and «Tolak» stay side by side, and the request form fits.
  - The mobile header appearing mid-page in `08` at 320 is the full-page screenshot catching the sticky header, not a layout fault.
- **The [S] suspended-requester line:** not walkable; it is ruling 73, placed in 4.5 (PR-3). **J9's «left for the builder» lines are closed.**
