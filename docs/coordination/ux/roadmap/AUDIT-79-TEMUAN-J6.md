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
| **J6-4 (Significant; restated 24 Nov 21:00 after Bob's reading of the code)** | **«Tandai lolos pemeriksaan» runs the content check silently, and doesn't show what it found.** `advanceContentAction` runs `validate_course_content` and `run_mcq_quality`, and refuses while an ERROR is open. So «lolos» was true by the rule: the 4 findings are `WEAK_MISCONCEPTION_LINKAGE`, warnings. **My first reading** («accepted before any check ran») **was wrong.** I read the button's result without the code (ANTISIPASI DAISY-J6). **The UX gap that remains:** the step says «Jalankan pemeriksaan isi di bagian Temuan di bawah. Perbaiki yang wajib diperbaiki, lalu tandai lolos pemeriksaan.», which describes two actions where the button does both. After marking, the author sees only «✓ Periksa isi · Selesai», not the warnings the check just raised. The reviewer meets them later. (The database not enforcing the rule is the [S] half, under Sharon's conditions.) | **Disagree.** The step's words describe a manual check; the button runs it itself. | C-3 (the step's words and the action derived separately) | E, F | **Step words:** «Tandai lolos pemeriksaan menjalankan pemeriksaan isi lebih dulu. Yang wajib diperbaiki harus diperbaiki dulu; saran tetap terlihat oleh peninjau.» **After marking:** «✓ Diperiksa: tidak ada yang wajib diperbaiki · {n} saran.» + «Lihat temuan» (to Temuan). With no suggestions: «✓ Diperiksa: tidak ada yang wajib diperbaiki.» **When refused:** «Belum lolos: {n} temuan wajib diperbaiki.» + «Lihat temuan». |
| J6-5 | After any refusal, the rights statement («Saya menyatakan bahwa sekolah memiliki hak …») comes back **unticked**, while the source text is kept. The teacher fixes the source and presses «Buat draf» again, which brings another refusal: «Centang pernyataan …». | — | — | F | Keep the tick when the source is kept. If re-confirming is intended, say so under the refusal: «Centang lagi pernyataan hak sebelum mengirim ulang.» |
| J6-6 | **For the builder / Sharon ([S], not UX):** allowance and ceiling refusals leave `ai_permintaan.hasil` empty, while the learner-data refusal is recorded (`REFUSED_PERSONAL_DATA`). The request log can't show why those two were refused. | — | — | — | Record `REFUSED_ALLOWANCE` / `REFUSED_CEILING`, or the equivalent, as the learner-data case does |

**J6's «left for the builder» lines:** walked, except the stale form and the «already passed» refusal (above). The SR, throttled and reduced-motion passes come from the builder's run, since there is no harness for these passes.

## Capture judgement · the builder's committed J6 (`ddae57a9/j6`, `11c269e2`), 24 Nov 22:00

Seven walks, every one reaching its last screen, with fixtures for the stale form (L4) and the ceiling (L5). **Every finding stands where the capture reaches it:**
- **J6-2:** accepting a draft gives no line («(no new status line)», L10).
- **J6-4 (restated):** «Tandai lolos pemeriksaan» runs the check silently. Its one warning appears only after a separate «Periksa isi sekarang» (L8).
- **J6-5:** `rights_tick_kept: false` after the learner-data refusal.

### Holds (the two refusals I couldn't reproduce)
- **The stale form (`AI_TUJUAN_LAIN`):** «Tujuan pembelajaran pelajaran ini sudah berubah. Muat ulang halaman, lalu pilih lagi.» It is clear and blames no one, and nothing is sent.
- **«Already passed the check» (`AI_PAKET_LOLOS_PERIKSA`), from a tab opened before marking:**
  - the refusal reads «Paket ini sudah ditandai lolos pemeriksaan, jadi draf soal dengan AI tidak dibuat. Soal baru akan membuat paket perlu diperiksa lagi. Tidak ada yang dikirim.»;
  - on a fresh load, the AI button is gone (`ai_button_now: 0`).
- **The allowance used up** refuses the same request L1 admitted, and the ceiling words hold. **Both now come from the builder's own run.**
- **«Ajukan» held while a draft waits:**
  - the button is disabled, with «**1 soal masih draf dari AI.** Soal ini perlu diterima atau dihapus oleh pendidik sebelum paket diajukan.»;
  - after acceptance, it submits;
  - the second person sees «Menunggu tinjauan Anda 1», «1 dari 4 soal disusun dengan AI», «Draf ini sedang ditinjau. Soal dapat diubah lagi bila dikembalikan.», and approves.
- **W13:** no AI button and no AI word.
- **EN:** clean in the steps and the findings panel.

### L-143 · the UX side (Sharon decides the severity)

**What happens:**
- «Tandai sudah tersusun» (L7) and «Tandai lolos pemeriksaan» (L8) both go through with an AI draft waiting.
- Each answers «✓ … · Selesai», and nothing mentions the draft.
- The first time the author hears of it is at «Ajukan», two steps later.

**Why it matters:**
- «Susun isi · Selesai» states the content is composed while one question's inclusion is still undecided.
- The author marks two steps «Selesai» and is then sent back to a decision they could have made at the first.

**Cause:** C-3. The «undecided drafts» fact is derived only at the Ajukan step.

**Recommended composition (hold at the first step):** «Tandai sudah tersusun» is held, like «Ajukan», while a draft waits. Under it:
- **ID:** «**{n} soal masih draf dari AI.** Terima atau hapus setiap draf sebelum paket ditandai tersusun.» + the link «Lihat draf pertama»
- **EN:** «**{n} questions are still AI drafts.** Accept or delete each draft before the package is marked as composed.» + «See the first draft»
- Singular, reusing the existing pattern: «**1 soal masih draf dari AI.** Terima atau hapus draf ini sebelum paket ditandai tersusun.» / «**1 question is still an AI draft.** Accept or delete it before the package is marked as composed.»

**If Sharon allows marking with drafts waiting** (not recommended), the result names them:
- ID: «✓ Susun isi · Selesai. {n} draf dari AI masih menunggu: terima atau hapus sebelum paket diajukan.»
- EN: «✓ Compose · Done. {n} AI drafts are still waiting: accept or delete them before the package is submitted.»
- The same tail applies on «Tandai lolos pemeriksaan».

**Everywhere, in both cases:** the step panel's «SEKARANG» block carries «{n} draf dari AI menunggu keputusan Anda.» / «{n} AI drafts are waiting for your decision.» This is the same count J6-1 asks for in the package head.

### New

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J6-7 | **The held «Ajukan» is a disabled button with its reason in a separate paragraph** (SR tree: `button "Ajukan untuk ditinjau" [disabled]`, then `paragraph: 1 soal masih draf dari AI …`). A keyboard or screen-reader user tabbing through doesn't reach a disabled button, so they don't hear why. | — | — | G | Use `aria-disabled="true"` (focusable) with `aria-describedby` pointing at the reason. Pressing it moves focus to the first waiting draft. The same applies to L-143's held «Tandai sudah tersusun». |

**J6's «left for the builder» lines are closed.**

### L-143 · Sharon's ruling (24 Nov 21:56): both marks are held, in the database too. The fallback lapses.

**«Tandai sudah tersusun»:** the words above stand.
- ID: «**{n} soal masih draf dari AI.** Terima atau hapus setiap draf sebelum paket ditandai tersusun.»
- EN: «**{n} questions are still AI drafts.** Accept or delete each draft before the package is marked as composed.»
- Singular: «**1 soal masih draf dari AI.** Terima atau hapus draf ini sebelum paket ditandai tersusun.» / «**1 question is still an AI draft.** Accept or delete it before the package is marked as composed.»

**«Tandai lolos pemeriksaan»** (the new variant):
- ID: «**{n} soal masih draf dari AI.** Terima atau hapus setiap draf sebelum paket ditandai lolos pemeriksaan.»
- EN: «**{n} questions are still AI drafts.** Accept or delete each draft before the package is marked as passing the check.»
- Singular: «**1 soal masih draf dari AI.** Terima atau hapus draf ini sebelum paket ditandai lolos pemeriksaan.» / «**1 question is still an AI draft.** Accept or delete it before the package is marked as passing the check.»

**The same composition for both, as L-144 (J6-7):**
- the button is `aria-disabled="true"` and stays focusable;
- `aria-describedby` points at the line;
- pressing it moves focus to the first waiting draft;
- the link «Lihat draf pertama» / «See the first draft» sits after the line.

**If the database refuses** (for example, a draft created in another tab after the page loaded), the result line is the same sentence, so the page and the refusal agree.
