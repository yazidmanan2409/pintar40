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
