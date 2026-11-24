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
