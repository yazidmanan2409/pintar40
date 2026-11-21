# C3w-1 · Words for the states added since `dde78004` (Daisy, 21 Nov 2026)

> **What holds now:**
> - **Five additions** to `C3W-1-WORDS.md`, design only. Everything else there stands.
> - **Two rows there are superseded** and marked in place: the third action «Ubah» (§3), and the held-step sentence's «diubah» (§3). This page gives the replacements.
> - **Staff-only rules unchanged** (ruling 40): «({model})» appears in staff copy only. Learners see nothing new.
> - **DAISY-25:** checked, clean. No promise of notice, no price, no allowance number.

## 1 · The target lesson

Every request names the lesson the drafts go into. A pasted excerpt is only the source.

| Element | ID | EN |
|---|---|---|
| Field (select of the package's lessons, by title; default: the lesson the form was opened from) | «Pelajaran tujuan» | «Target lesson» |
| Its hint | «Draf soal ditambahkan ke pelajaran ini. Sumber hanya dipakai untuk menyusun soal.» | «The draft questions are added to this lesson. The source is only used to write them.» |

- **The field comes first in the form,** before «Sumber», because the source options read against it.
- **«Sumber» option 1 becomes «Teks pelajaran tujuan»** (EN «The target lesson's text»), replacing «Teks pelajaran ini». With a chosen target, "this lesson" is ambiguous. Options 2 and 3 are unchanged.
- **The no-source line follows:** «Pelajaran tujuan belum punya teks. Pilih pelajaran lain atau tempel teks sumber.»
- **Success names the target** when it is not the lesson on screen: «{n} draf soal siap ditinjau di {judul}.» (n=1: «1 draf soal …»). The title links to that lesson. Otherwise the existing line stands, and focus moves as before.

## 2 · The decision on each draft: «Terima» or «Hapus»

The teacher decides one of two things. Whether a draft counts as accepted or edited is recorded by the system, never chosen.

| Element | ID | EN |
|---|---|---|
| Chip while undecided (`pin-pill`, neutral; unchanged) | «Draf dari AI» | «AI draft» |
| Line under the chip while undecided (`pin-meta`) | «Menunggu keputusan Anda: terima atau hapus.» | «Waiting for your decision: accept or delete.» |
| Same line once the draft has been changed and saved, still undecided | «Sudah diubah. Menunggu keputusan Anda: terima atau hapus.» | «Changed. Waiting for your decision: accept or delete.» |
| Actions | «Terima» (primary) · «Hapus» (`pin-quiet`) | «Accept» · «Delete» |
| After «Terima», unchanged draft: the chip | «Diterima oleh {nama}» (unchanged) | «Accepted by {nama}» |
| After «Terima», changed first: the chip | «Diubah lalu diterima oleh {nama}» | «Edited, then accepted by {nama}» |
| «Hapus»: confirmation (`KonfirmasiBahaya`; unchanged) | «Hapus draf ini? Draf yang dihapus tidak dapat dikembalikan.» [Hapus] [Batal] | unchanged |
| After «Hapus» (`role="status"`; unchanged) | «Draf dihapus.» | unchanged |

- **Editing stays the card's ordinary editing,** not a third decision. It changes the waiting line only.
- **«Riwayat soal»** (§4 of the set): «· diterima oleh {nama}», or «· diubah lalu diterima oleh {nama}». The reviewer's chip reads the same.

## 3 · The submit gate (`AI_BELUM_DITERIMA`)

Already in the set; the sentence changes with the decision.

- «**{n} soal masih draf dari AI.** Setiap soal perlu diterima atau dihapus oleh pendidik sebelum paket diajukan.»
- n=1: «**1 soal masih draf dari AI.** Soal ini perlu diterima atau dihapus oleh pendidik sebelum paket diajukan.»
- EN: «**{n} questions are still AI drafts.** Each needs to be accepted or deleted by an educator before the package is submitted.» / n=1: «**1 question is still an AI draft.** It needs to be accepted or deleted …»
- **Placement unchanged:** the held step, tied by `aria-describedby`; on a refused submit, the same sentence in the result line, `role="alert"`.
- **{n} is the server's count at refusal,** not the page's, so a stale page cannot show a wrong number.

## 4 · A package already marked as passing the check (VALIDATED)

New code **`AI_PAKET_LOLOS_PERIKSA`**.

- **The button «Buat draf soal dengan AI» is absent** while the package is VALIDATED, as for a package not being drafted. The step panel already names the next step, «Ajukan».
- **If reached anyway** (a stale form), the result line reads: «Paket ini sudah ditandai lolos pemeriksaan, jadi draf soal dengan AI tidak dibuat. Soal baru akan membuat paket perlu diperiksa lagi. Tidak ada yang dikirim.»
- EN: «This package is already marked as passing the check, so no AI drafts were made. New questions would mean checking the package again. Nothing was sent.»
- **«lolos pemeriksaan» reuses Studio's existing words** (`studio.langkah.periksa.tombol`). The sentence states the reason only; it promises no route back, because none is defined.

## 5 · A failed write after the AI ran

Nothing is added. The existing lines still fit:
- **`AI_KELUARAN_TIDAK_SAH`** (invalid output): «Hasilnya tidak dapat dipakai, jadi tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.» Unchanged.
- **A write refusal after the call**:
  - for a fault, use `AI_GAGAL`'s line, unchanged: «Tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.»
  - **If the refusal is a state change** (the package became VALIDATED or left drafting during the call), show that state's sentence instead: §4 above, or «Paket ini tidak sedang disusun …». Without «Tidak ada yang dikirim», because a call happened. Without «Coba lagi», which would loop.
- **No line says whether the call counted against the allowance.** That rule is unchanged (S-7).

## 6 · Anticipation

- **Question 2** (the neighbours): option 1's renamed label; success when the target is another lesson; the waiting line after an edit.
- **Question 4** (a stale page): the server's count in §3; the state race in §5.
