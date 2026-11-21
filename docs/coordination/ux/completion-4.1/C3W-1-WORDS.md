# C3w-1 · Words for AI-drafted questions in Studio, and the Studio consistency findings (Daisy, 18 Nov 2026)

> **What holds now:**
> - **21 Nov:** additions for the states built since (target lesson, two-action decision, VALIDATED, failed write) are in `C3W-1-WORDS-TAMBAHAN.md`; two rows here are superseded in place.
> - **Words for every state and every code** of `C3W-1-DESIGN.md` §3 (PR220):
>   - the form, generating and success (§1);
>   - the refusals (§2);
>   - acceptance (§3);
>   - the reviewer and «Riwayat soal» (§4);
>   - the teacher's next step (§5).
> - **Learners: unchanged.** No AI label anywhere a learner sees (§6).
> - **Studio consistency findings** (§7). **Four are not applied on `main` (`1b1cada8`)** and are small; I ask they land before C3w-1's build. One is cross-module and goes to Z.
> - **One point for Bob** (§8): the provenance line's {model}, against "no provider named in any copy".
> - **Sources:**
>   - my `DESAIN-AWAL-4.1.md` §5 and O-5 (THE PLAN §5.6 F);
>   - `PLAN-A3-C3W-Z.md` §3.3–3.4;
>   - `C3W-PAID-ADDON-ASSESSMENT.md` S-7 and §9;
>   - `C3W-1-DESIGN.md` on `claude/bob-41-master-plan`.
> - **DAISY-25:** checked, clean. No price, token, key, model ID or allowance number appears in a teacher's copy.

## 1 · The flow

### 1.1 Not available at this school (`AI_TIDAK_TERSEDIA`, as S-7)

- **The button «Buat draf soal dengan AI» is absent.** Not disabled, and no upsell, no "upgrade", no price.
- The workbook route and manual writing are unchanged.
- **Only if reached anyway** (a stale form, or the entitlement switched off meanwhile), the form's result line reads: «Pembuatan draf dengan AI belum tersedia di sekolah ini. Anda tetap dapat menulis soal sendiri.» EN: «Drafting questions with AI is not available at this school yet. You can still write questions yourself.»

### 1.2 The button and the form

**Where:** on a lesson in Studio's package page, beside the workbook route. It is shown only to an author (`CAN_DRAFT`) of a package that is a draft.

| Element | ID | EN |
|---|---|---|
| Button (secondary) | «Buat draf soal dengan AI» | «Draft questions with AI» |
| Form heading | «Buat draf soal dengan AI» | «Draft questions with AI» |
| **Sumber** (legend, radio group) | «Sumber» | «Source» |
| · option 1 (default) | «Teks pelajaran ini» | «This lesson's text» |
| · option 2 | «Pelajaran lain di paket ini», with a select of the package's lessons by title | «Another lesson in this package» |
| · option 3 | «Teks yang saya tempel», with a field «Teks sumber» | «Text I paste», «Source text» |
| Hint under «Teks sumber» | «Jangan menempel nama atau data murid mana pun. Sampai {n} karakter.» | «Do not paste any learner's name or data. Up to {n} characters.» |
| **Tujuan pembelajaran** (checkboxes, the lesson's objectives, at least one) | «Tujuan pembelajaran» | «Learning objectives» |
| **Banyak soal** | «Banyak soal (1–10)» | «Number of questions (1–10)» |
| **Kesulitan** (radio) | «Mudah» · «Sedang» · «Sulit» | «Easy» · «Medium» · «Hard» |
| **Rights confirmation (D10)**, required checkbox (O-5, unchanged) | «Saya menyatakan bahwa sekolah memiliki hak atau izin untuk memakai sumber ini dalam membuat soal.» | «I confirm that the school has the right or permission to use this source to make questions.» |
| Its hint (O-5, unchanged) | «Pernyataan ini dicatat bersama permintaan. Pernyataan ini bukan izin hukum.» | «This statement is recorded with the request. It is not legal permission.» |
| Primary | «Buat draf» | «Create drafts» |
| Cancel | «Batal» (`pin-quiet`) | «Cancel» |

**No source** (the lesson has no text, and option 1 is chosen): an inline line under «Sumber», «Pelajaran ini belum punya teks. Pilih pelajaran lain atau tempel teks sumber.» «Buat draf» stays enabled. The server refuses with the same line if submitted, and nothing is sent.

### 1.3 Generating, and success

| State | ID | EN | Notes |
|---|---|---|---|
| **Working** (O-5) | «Menyusun {n} draf soal… Ini dapat memakan waktu hingga satu menit.» | «Drafting {n} questions… This can take up to a minute.» | `role="status"`. «Buat draf» shows busy and cannot be pressed again |
| **Success** (O-5) | «{n} draf soal siap ditinjau.» | «{n} draft questions are ready to review.» | `role="status"`. Focus moves to the first new card. For n=1: «1 draf soal siap ditinjau.» |
| **A repeated submit** (same `kunci_idempoten`, D11) | **No new sentence.** The page shows the first request's outcome line again: success, or its refusal | — | Not an error. No second call |

## 2 · Refusals (PR220 detail codes)

**Form:**
- Each is `role="alert"`, in the form's result slot.
- **The form keeps everything entered**, as A2b's BL-1 rule requires, except that the rights box is unticked again after `AI_DATA_PRIBADI`, because the source changes.
- Each line says **what happened, what was not done, and the next step**. Manual writing is always offered.

| Code | ID | EN |
|---|---|---|
| `AI_TIDAK_TERSEDIA` | §1.1's line | §1.1's line |
| `AI_HAK_BERAKHIR` (inactive or expired) | «Pembuatan draf dengan AI sedang tidak aktif untuk sekolah ini. Admin sekolah Anda dapat menanyakannya kepada Admin PINTAR. Anda tetap dapat menulis soal sendiri.» | «Drafting with AI is not active for this school at the moment. Your school's administrator can ask an Admin PINTAR about it. You can still write questions yourself.» |
| `AI_JATAH_HABIS` (school allowance or educator limit; **period-neutral**, S-7) | «Batas pembuatan draf dengan AI sudah tercapai untuk periode ini. Tidak ada yang dikirim. Admin sekolah Anda dapat menanyakannya kepada Admin PINTAR. Anda tetap dapat menulis soal sendiri.» | «The limit for drafting with AI has been reached for this period. Nothing was sent. Your school's administrator can ask an Admin PINTAR about it. You can still write questions yourself.» |
| `AI_PLAFON` (the provider's or the platform's ceiling) | «Pembuatan draf dengan AI sedang tidak dapat dipakai untuk sementara. Ini tidak mengurangi jatah sekolah Anda. Tidak ada yang dikirim. Coba lagi nanti, atau tulis soal sendiri.» | «Drafting with AI cannot be used for the moment. This does not use up your school's allowance. Nothing was sent. Try again later, or write questions yourself.» |
| `AI_HAK_SUMBER` (D10) | «Centang pernyataan tentang hak memakai sumber ini lebih dulu. Tidak ada yang dikirim.» | «Tick the statement about the right to use this source first. Nothing was sent.» |
| `AI_DATA_PRIBADI` (R-3) | «Sumber ini tampaknya memuat nama atau data murid, jadi tidak dikirim. Hapus data murid dari sumbernya, lalu coba lagi.» | «This source seems to contain a learner's name or data, so it was not sent. Remove learner data from the source, then try again.» |
| `AI_GAGAL` (after D11's bounded retries; O-5's line) | «Tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.» | «No questions were created. Try again, or write questions yourself.» |
| `AI_KELUARAN_TIDAK_SAH` (D6) | «Hasilnya tidak dapat dipakai, jadi tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.» | «The result could not be used, so no questions were created. Try again, or write questions yourself.» |
| Not an author here (existing refusal) | `galat.action_not_allowed` «Langkah ini bukan wewenang Anda.» | existing |
| The package is not a draft | «Paket ini tidak sedang disusun, jadi soal baru tidak dapat ditambahkan.» | «This package is not being drafted, so no new questions can be added.» |

**Notes on these lines:**
- **`AI_DATA_PRIBADI` never echoes the match.** No name, no number, no position (R3-06). It says «tampaknya», because the check can be wrong, and the remedy is the same either way.
- **«Tidak ada yang dikirim»** appears only where nothing left PINTAR: refusals before the call. It does not appear on `AI_GAGAL` or `AI_KELUARAN_TIDAK_SAH`, where a call happened.
- **«jatah» appears only in `AI_PLAFON`, to reassure.** The limit line says «batas», without a number or a unit, in line with S-7.

## 3 · Acceptance (D2)

**On each generated card** (C1w's question card):

| Element | ID | EN |
|---|---|---|
| Chip, before any action (`pin-pill`, neutral) | «Draf dari AI» | «AI draft» |
| Provenance line (`pin-meta`) | «Disusun dengan AI ({model}) dari {sumber} · diminta oleh {nama}, {waktu}» | «Drafted with AI ({model}) from {sumber} · requested by {nama}, {waktu}» |
| Actions | ~~«Terima» (primary) · «Ubah» · «Hapus» (`pin-quiet`)~~ Superseded: «Terima» · «Hapus», see `C3W-1-WORDS-TAMBAHAN.md` §2 | ~~«Accept» · «Edit» · «Delete»~~ |
| After «Terima»: the chip | «Diterima oleh {nama}» | «Accepted by {nama}» |
| ~~After «Ubah» and saving: the chip~~ | ~~«Diubah oleh {nama}»~~ Superseded: «Diubah lalu diterima oleh {nama}», `C3W-1-WORDS-TAMBAHAN.md` §2 | ~~«Edited by {nama}»~~ |
| «Hapus»: confirmation (`KonfirmasiBahaya`) | «Hapus draf ini? Draf yang dihapus tidak dapat dikembalikan.» [Hapus] [Batal] | «Delete this draft? A deleted draft cannot be brought back.» |
| After «Hapus» (`role="status"`) | «Draf dihapus.» | «Draft deleted.» |

**{sumber} and {waktu}:**
- **{sumber}** is «teks pelajaran {judul}» or «teks yang ditempel». Never the text itself.
- **{waktu}** is in the school's zone, with non-breaking spaces as in A2b.

**The held submit step (`AI_BELUM_DITERIMA`), in «Langkah menuju terbit»** (O-5's sentence, unchanged):
- ~~«**{n} soal masih draf dari AI.** Setiap soal perlu diterima, diubah atau dihapus oleh pendidik sebelum paket diajukan.»~~ Superseded: «… diterima atau dihapus …», `C3W-1-WORDS-TAMBAHAN.md` §3
- n=1: «**1 soal masih draf dari AI.** …»
- **The step is shown with its reason** and tied by `aria-describedby`, per finding #10 (`AlasanNonaktif`).
- **If submitted anyway** (stale page, the database's refusal), the same sentence appears in the result line, `role="alert"`.

## 4 · The reviewer, and «Riwayat soal»

- **At «Setujui isi» and in the review queue,** beside the package state: «{a} dari {b} soal disusun dengan AI». EN: «{a} of {b} questions drafted with AI». It is shown only when a > 0.
- **Each card keeps its provenance line.** The chip there shows the acceptance fact («Diterima oleh …» or «Diubah oleh …»).
- **In «Riwayat soal»,** under the version the draft became: «Disusun dengan AI ({model}) · diterima oleh {nama}», or «· diubah oleh {nama}». Later versions show nothing new, because lineage carries the origin.
- **Bank Soal:** the same provenance line, staff only.

## 5 · The teacher's next step when the entitlement is inactive or used up

**The next step is a person, not a purchase:**
- **«Admin sekolah Anda dapat menanyakannya kepada Admin PINTAR.»** In 4.1 the operator sets each school's entitlement (ruling 39, §9.4), so the school's admin is the one who can ask.
- **Always followed by «Anda tetap dapat menulis soal sendiri.»** Manual writing is never interrupted (S-7).
- **No price, token, allowance number, provider or "upgrade"** in any line. When the commercial launch brings admins their own view, this line points there instead.

## 6 · Learners

**No change, and no AI label anywhere a learner sees:**
- the player;
- results;
- «Hasil belajar»;
- certificates;
- print.

The provenance and acceptance tables are staff-only (D4). My check at the rendered review is a search of every learner page's text for «AI», «Draf dari AI», «Disusun dengan».

## 7 · Studio consistency findings: which, and whether applied on `main` (`1b1cada8`)

**The findings** are the Studio-touching items of `DESAIN-AWAL-4.1.md` §6 and `Z-KONSISTENSI-INVENTARIS.md`, plus two found on the Kanonik screen at C2w.

| # | Finding | Applied on main? | Evidence | Before C3w-1? |
|---|---|---|---|---|
| §6 #10 | A disabled action is tied to its reason by `aria-describedby`, in a component | **Yes** | `src/components/AlasanNonaktif.tsx` | — |
| Z-2 (X-1) | **Two `<main id="isi">`** when a refusal renders inside Studio | **No** | `src/app/studio/layout.tsx:77` and `src/components/HalamanPenolakan.tsx:42` both render `<main id="isi">`; e.g. `studio/tinjau/kunci/[koreksi]/page.tsx:49` | **Yes.** C3w adds Studio refusals |
| Z-3 (X-3) | An **unknown** key-correction id shows the refusal, not «not found» | **No** | `studio/tinjau/kunci/[koreksi]/page.tsx:47-50`: any error, or no row, gives `HalamanPenolakan` | **Yes.** Small, and the same check applies to `/studio/paket/[course]` |
| N-6 | Kanonik's withdraw confirmation states the result («… sudah berakhir») before confirming | **No** (4.0 string; seen at the C2w rehearsal) | `studio.kanonik.ditarik` used as `akibat` in `studio/kanonik/page.tsx` | **Yes.** One key |
| N-7 | Kanonik's grant select labelled «Paket Pembelajaran» | **No** | `studio.paket.judul` on the withdraw select | **Yes.** One key |
| §6 #7 | The primary-button rule (one per view, or one per form) | **Not ruled on record** | — | **No.** C3w's cards follow D-140, one primary per card, as C2w's notes did |
| §6 #2 | **One test, two names:** «Cek penguasaan» (the workbook's value) becomes the assignment title in Mengajar; reports say «Uji Penguasaan» | **No** | `supabase/migrations/20261202100000…sql:535` still builds «Cek penguasaan — …» | **No, Z.** Cross-module (Mengajar, reports). C3w's form uses no «Kegunaan» |

**So:** four small Studio items (Z-2, Z-3, N-6, N-7) should land before C3w-1's build. #2 is for Z, and #7 needs no ruling for C3w.

## 8 · One point for Bob: {model} in the provenance line

- **Bob's brief says "no provider is named in any copy".** Ruling 40 (§9.1) allows provider names **in staff copy**, and names my provenance line.
- **My line keeps «({model})»,** filled from the option registry's **display name** (S-8). It is staff-only.
- **In C3w-1, with the stub, it reads the stub's display name.**
- If the brief means no provider name at all in 4.1, the line becomes «Disusun dengan AI dari {sumber} · …» and nothing else changes. **Your call; I recommend keeping it.** Staff reviewing a draft should know which option produced it, and ruling 40 sought exactly that transparency.

## 9 · Anticipation

**Found before the build:**
- **Question 2** (the neighbours): a double submit, «Hapus»'s confirmation, «no source».
- **Question 5** (who reads «jatah» or «batas», and where).
