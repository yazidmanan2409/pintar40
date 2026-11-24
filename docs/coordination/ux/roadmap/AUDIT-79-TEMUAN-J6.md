# Ruling 79 audit · J6, authoring with AI drafts: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J6 walked** on the local audit world (`00fe853d`), with the app started as CI starts it (`PINTAR_AI_STUB_HARNESS=1`, the mail sink).
>   - **W12:** 8A's teacher Dimas, with the draft package «Perbandingan dan Skala» at Cendekia (AI entitled, the local stand-in).
>   - **W13:** Melati's 4A teacher (not entitled).
>   - **Steps:** the AI form → drafts → accept, delete (the confirmation) → a second request → the learner preview → «Tandai sudah tersusun» → the content check and the steps to publication.
> - **Not reached here:**
>   - **«Allowance used up»:** the second request (306 characters, 3 questions) was **admitted** (`ai_permintaan`: DRAFTED, DRAFTED). The world's note expects `AI_JATAH_HABIS`, probably because the stand-in settles far below its reserved worst case. **A world question for the builder, not a UX finding.**
>   - Also: the provider ceiling, a source with learner data, a stale form, «Ajukan» → the reviewer → approval, and the screen reader, throttled and reduced-motion passes. These come from the builder's run.
> - **My first attempt** read «Pembuatan draf dengan AI belum tersedia di sekolah ini» because my app lacked the harness flag. That was an environment fault, re-run correctly. J10's email failure had the same cause (no mail sink), and its email branch is the builder's.
> - **Captures:** `audit79-j6/`, at 390.
> - **3 findings, all Improvement.**
> - **Provenance holds:**
>   - each draft reads «Draf dari AI · Disusun dengan AI (penyedia lokal (stand-in), bukan penyedia AI nyata) dari teks pelajaran … · diminta oleh Dimas Saputra, {waktu}» and «Menunggu keputusan Anda: terima atau hapus.»;
>   - the package head counts «5 dari 8 soal disusun dengan AI»;
>   - the learner preview carries **no** AI wording;
>   - at W13 there is no AI button or word at all.

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J6-1 | The package head says only «Perlu tindakan · Ada yang bisa Anda selesaikan sekarang di Studio». What the action is sits at the very bottom («Langkah menuju terbit … SEKARANG Periksa isi») | The steps panel names it exactly; the head doesn't | C-3 (the head re-derives a vaguer state) | F | The head names the current step: «Sekarang: Periksa isi», plus the count of AI drafts still waiting for a decision |
| J6-2 | «Terima» gives no confirmation line. The draft just loses its «Draf dari AI» buttons, which is easy to miss in a long list. (Delete asks «Hapus draf ini? Draf yang dihapus tidak dapat dikembalikan.», which is good) | — | — | F, G | «✓ Soal {n} diterima.», announced (`role=status`), as other Studio actions do |
| J6-3 | The allowance is never shown before a request. A teacher learns it only from a refusal. Nothing over-promises, so ruling 90 holds, but nothing helps them plan | — | — | F | Near the form: «Sisa jatah AI sekolah: cukup untuk sekitar {n} permintaan lagi.» **Sharon decides** whether an allowance figure may be shown to every teacher |

## Holds (checked)

- **The form** says where drafts go, what the source is used for, and what the rights statement is and isn't («Pernyataan ini bukan izin hukum.»).
- **The result:** «✓ 2 draf soal siap ditinjau.»
- **Each content finding** explains «Mengapa penting» and «Cara memperbaiki», with «Lihat lokasinya».
- **«Langkah menuju terbit»** names the seven steps and who may take each.

## The rest of J6 walked locally (24 Nov 21:00): the refusals, «Ajukan», the reviewer, approval

Walked at `6b248975` on the reloaded audit world, at 1280, with the app started as CI starts it (`PINTAR_AI_STUB_HARNESS=1`). There is no builder harness for J6, so I used my own scripts (scratch).
- **The provider ceiling:** I set the platform stop locally, then reset it.
- **Captures:** scratch only. The builder's run is the record.

### Holds
- **A source with learner data** is refused before anything leaves PINTAR: «Sumber ini tampaknya memuat nama atau data murid, jadi tidak dikirim. Hapus data murid dari sumbernya, lalu coba lagi.» (recorded `REFUSED_PERSONAL_DATA`).
  - The pasted text is kept, so it can be edited.
  - The field already warns before sending: «Jangan menempel nama atau data murid mana pun.»
- **The allowance used up** (W12's corrected world): the first request is admitted; the second is refused with «Batas pembuatan draf dengan AI sudah tercapai untuk periode ini. Tidak ada yang dikirim. …». **This closes my earlier world question.**
- **The provider ceiling:** «Pembuatan draf dengan AI sedang tidak dapat dipakai untuk sementara. Ini tidak mengurangi jatah sekolah Anda. Tidak ada yang dikirim. Coba lagi nanti, atau tulis soal sendiri.» It is honest and leaves a way forward.
- **«Ajukan untuk ditinjau»:**
  - «Persetujuannya harus dari orang lain, bukan dari penyusun.»
  - Then the author reads «Langkah ini bukan wewenang Anda … Minta orang yang disebut di atas; PINTAR tidak mengirim pemberitahuan.» This is honest about the missing notification.
- **The reviewer's count:**
  - The school admin's Studio home shows «Menunggu tinjauan Anda 1 · Perbandingan dan Skala · Sekarang: Setujui isi».
  - The package head reads «4 dari 7 soal disusun dengan AI».
  - Each accepted draft carries «Diterima oleh Dimas Saputra» and its full provenance.
  - «Setujui isi» → «✓ Setujui isi · Selesai», and the steps move on to «Buat terbitan · Kunci terbitan».
- **Provenance stays honest to staff** through approval.
- **J6-2 is confirmed:** «Terima» still produces no message (four presses, four empty status regions).

**Not reproduced:**
- the stale form (`AI_TUJUAN_LAIN`): my changed select didn't reach the server;
- the «already passed the check» refusal.

Both have clear words in `hle.ts` (`galat.ai_tujuan_lain`, `galat.ai_paket_lolos_periksa`). They come from the builder's run.

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J6-4 (Significant)** | **«Tandai lolos pemeriksaan» is offered, and accepted, before the content check has ever run.** The step says «Jalankan pemeriksaan isi di bagian Temuan di bawah. Perbaiki yang wajib diperbaiki, lalu tandai lolos pemeriksaan.» The author pressed «Tandai lolos pemeriksaan» with no check run («Tidak ada catatan mutu yang menunggu»), and got «✓ Periksa isi · Selesai». When the check was run after submission, it found **4 findings** («Tidak satu pun pengecoh tertaut ke miskonsepsi»). The reviewer then approves a package already marked as passed. | **Disagree.** The step's words require the check; the button doesn't. | C-7 | E, B | «Tandai lolos pemeriksaan» is drawn only after a check has run on the current content, and is refused while a mandatory finding is open. Before then the step shows «Jalankan pemeriksaan isi lebih dulu.» with «Periksa isi sekarang» as its button. (Lock-step still re-checks, but the reviewer reads the earlier «lolos».) |
| J6-5 | After any refusal, the rights statement («Saya menyatakan bahwa sekolah memiliki hak …») comes back **unticked**, while the source text is kept. The teacher fixes the source and presses «Buat draf» again, which brings another refusal: «Centang pernyataan …». | — | — | F | Keep the tick when the source is kept. If re-confirming is intended, say so under the refusal: «Centang lagi pernyataan hak sebelum mengirim ulang.» |
| J6-6 | **For the builder / Sharon ([S], not UX):** allowance and ceiling refusals leave `ai_permintaan.hasil` empty, while the learner-data refusal is recorded (`REFUSED_PERSONAL_DATA`). The request log can't show why those two were refused. | — | — | — | Record `REFUSED_ALLOWANCE` / `REFUSED_CEILING`, or the equivalent, as the learner-data case does |

**J6's «left for the builder» lines:** walked, except the stale form and the «already passed» refusal (above). The SR, throttled and reduced-motion passes come from the builder's run, since there is no harness for these passes.
