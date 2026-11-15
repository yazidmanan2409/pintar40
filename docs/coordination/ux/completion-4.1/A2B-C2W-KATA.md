# A2b's banner rule and D8 screens; C2w's I-5 words (Daisy, 15 Nov 2026)

> **What holds now:**
> - **Decision 3 confirmed.** One addition for a failed read (§1).
> - **D8's screen list is fixed** (§2): six screens, in two capture batches.
> - **C2w I-5: the words are final** (§3).
> - Source: `PLAN-A2B-C2W.md` at `43ce13bf`.
> - Found in code on `main`: `PengingatPemeliharaan.tsx`, `PitaPemeliharaan.tsx`, `/pemeliharaan`, `konfigurasi/page.tsx`, `belajar/actions.ts`.

## 1 · A2b, decision 3: the banner rule, confirmed

**Every stage (T−60, T−30, T−15, the start) re-reads the status before it shows,** with no polling added.

**So:**
- an extension shows «diperpanjang sampai …» at the next stage;
- an early end or a cancellation shows no further stage;
- a stale stage never appears.

**One addition, the opposite case: the re-read fails.**
- No new stage is shown.
- The stage already on screen stays until the next successful read.
- A missed warning is covered: a learner who then presses «Mulai» meets D4's refusal, which names the window.
- A wrong warning, after an early end, would not be covered. So "show nothing new" is the safe side.

**Unchanged:**
- T−60 and T−30 are neutral and can be closed.
- T−15 is amber and cannot be closed.
- `role="status"`, announced on arrival only.
- Minutes refresh in place, never a seconds countdown.

## 2 · A2b, D8: the screens that show a maintenance time (fixed before the build)

Every one of them is captured **twice**: once in a **WIB** school, and once in a **WITA** (or WIT) school, to prove the zone word is the school's (`pemeliharaan.zona`'s fixed «WIB» is removed).

| # | Screen | States to capture |
|---|---|---|
| D8-1 | **The banner** (`PengingatPemeliharaan`, `PitaPemeliharaan`; root layout): for a learner and for a teacher | T−60, T−15 (amber), started, extended. **Class-scoped:** on the class's own pages, and **nothing** on another class's page (R-1) |
| D8-2 | **The planned pause page** (`/pemeliharaan`) | Started, with the reason (D2), the expected end, and «diperpanjang sampai …»; class-scoped title |
| D8-3 | **The learner's start refusal (D4)**, the disabled «Mulai» with its sentence, on the chapter start (`/belajar/[tugas]/…`) and on a standalone assessment's orientation | The four variants of `A2-KATA-DESAIN.md` B2 (with an end; with no end; class-scoped; the end on another day) |
| D8-4 | **The player** during a planned window, for a learner whose sitting is running | The quiet line that they can finish and that the time does not change |
| D8-5 | **Konfigurasi › «Pemeliharaan dan pengumuman»**, the planned form | The labels with {zona}; the reason list (D2) with «Lainnya»; «Periksa waktu ini» with the collision lines («Asesmen terakhir diperkirakan selesai …», «Pertimbangkan memulai pemeliharaan setelah …») |
| D8-6 | **The same page's lists** | A planned row with scope and «Dijadwalkan oleh {nama}»; «Perpanjang» with its new end; «Akhiri sekarang»; an announcement's «Terbit» and «Sampai»; A2a's emergency row «sejak {jam} {zona}» |

- **Batch 1:** D8-1 to D8-4, the learner's and the teacher's surfaces.
- **Batch 2:** D8-5 and D8-6, Konfigurasi.
- Each at 390 and 320; D8-1 and D8-5 also at 1280. Keyboard on D8-3 and D8-5.

## 3 · C2w, I-5: a reviewer's note written before the key was corrected

**When it shows:** on a note («Catatan peninjau») read against a revision whose key differs from the revision the note was written on.

**Where it sits:**
- as the **first line of that note**, above its text, in `pin-meta`;
- the note itself stays visible, as decided. Hiding it would go to the owner.

**The vocabulary is chosen to match what the reader already meets:**
- F-1's teacher line says «kunci aslinya {asli}» and «kunci yang berlaku sekarang»;
- Studio's history says «versi» («Riwayat soal (2 versi)»).

| Where | ID | EN |
|---|---|---|
| **Studio** (the «Catatan peninjau» disclosure) | «Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Catatan ini tentang versi {n}; kunci yang berlaku sekarang {kunci_kini}.» | «Written before this question's key was corrected, when its key was still {kunci_saat_itu}. This note is about version {n}; the key in force now is {kunci_kini}.» |
| **Beside the class misconception report** (a teacher) | «Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Kunci yang berlaku sekarang {kunci_kini}.» | «Written before this question's key was corrected, when its key was still {kunci_saat_itu}. The key in force now is {kunci_kini}.» |

**Why the two differ:**
- A teacher does not meet «versi». The two keys tell them everything: in B4's case, the note calls B a common wrong answer, and B is now the key.
- «saat kuncinya masih …» names the key **at the time of the note**, so it stays true after more than one correction.

**Neighbouring cases:**
- **A note written after the correction, or on a question never corrected:** no line.
- **A note on an option whose misconception link was withdrawn by F1-R1b:** the same line covers it. The «Pemahaman keliru: belum dikaitkan» beside the option already says the link is gone.
- **The terms stay apart:** this line never uses «terkait» or «dikaitkan» (those are F1-R1b's), and never «anotasi».

**Screens for B4 and B5, at 390 and 320:**
- the Studio disclosure, open, with one note before the correction and one after;
- the class report's disclosure, open, as a teacher.
