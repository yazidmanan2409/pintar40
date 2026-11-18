# Shared vocabulary: time, history, correction, "not concluded" and refusals (planning audit D-V) (Daisy, 18 Nov 2026)

> **What holds now:**
> - **One vocabulary, fixed before 4.2 planning,** for states that 4.2 (past reports, export, name and school corrections), 4.5 (classification, explainable history) and 5.0 (claims) will all need.
> - **Each phrase is reused, never re-worded per feature.** `hle.ts` gets one key family per pattern (§6). A test asserts that no other key carries the same meaning.
> - **It builds on what 4.1 already teaches:** «kunci yang berlaku sekarang», «Ditulis sebelum kunci soal ini diperbaiki», L-1's neutral sign-in, and S-1's same answer for unknown and forbidden.
> - **Source:** my planning audit review (`../roadmap/TINJAUAN-AUDIT-PERENCANAAN-63c66ba9.md` §3), with Bob's revision 2 recommendations (D-05, D-06, D-11a).

## 1 · A moment in time («as of»)

| Use | ID | EN | Rule |
|---|---|---|---|
| A view, file or print that reflects one moment | «Keadaan per {tanggal}, {jam} {zona}» | «As of {tanggal}, {jam} {zona}» | One `pin-meta` line at the top. **In every export and every print.** Non-breaking spaces as in A2b. The school's zone |
| A figure computed at a time (existing «Angka dihitung …») | keep as is; it is the same idea for a computation | — | Do not merge: "computed at" is about freshness, "as of" about the record |
| An exported file, before download (D-04) | «Berkas ini salinan per {tanggal}. Setelah diunduh, sekolah yang menjaganya: PINTAR tidak dapat menghapus atau memperbaruinya.» | «This file is a copy as of {tanggal}. Once downloaded, the school keeps it: PINTAR cannot delete or update it.» | Shown beside the download button, not after |

## 2 · As issued (snapshot, history)

| Use | ID | EN | Rule |
|---|---|---|---|
| A report, certificate or evaluation shown as it was issued (4.5-08) | «Seperti saat diterbitkan, {tanggal}.» | «As issued on {tanggal}.» | A neutral banner line, never a warning colour |
| …and something changed since | add: «Sejak itu ada perbaikan. **Lihat keadaan sekarang**» (a link) | «It has been corrected since. **See it as it is now**» | One link to the current view. Never two figures side by side without these labels |
| A certificate's public verification (D-06, as Sharon confirmed) | «Sertifikat ini sah.» Nothing about later changes, **and no name** | «This certificate is valid.» | Public pages disclose nothing new |

## 3 · Corrected

| Use | ID | EN | Rule |
|---|---|---|---|
| A record corrected after the fact (a key, a score, a name, a school's name) | «Diperbaiki pada {tanggal}» | «Corrected on {tanggal}» | **«diperbaiki» only for a correction.** «diubah» is an ordinary edit. On demand: what it was, and since when |
| A key correction | keep 4.1's: «Kunci soal ini sudah diperbaiki …», «kunci yang berlaku sekarang», and I-5's «Ditulis sebelum kunci soal ini diperbaiki …» | — | Already learned. Do not re-word |
| A renamed school (D-11a) | «Sebelumnya bernama {nama lama}» | «Formerly {nama lama}» | Schools only. **Never for a person's name** |
| A past report shown as corrected now (D-05) | «Diperbaiki pada {tanggal}», on the figure or row that changed | — | The as-issued view stays 4.5-08's, with §2's words |

## 4 · Not concluded (RD-7)

| Use | ID | EN | Rule |
|---|---|---|---|
| No conclusion can be drawn | «Belum dapat disimpulkan» | «Not enough to conclude yet» | **Always followed by why, and by what would make it possible:** «… karena baru {n} murid yang mengerjakan. Perlu paling sedikit {m}.» Never alone |
| The four classes (RD-7), reader-facing names | «tercatat» · «dihitung» · «perkiraan» · «belum dapat disimpulkan» | «recorded» · «calculated» · «estimate» · «not concluded» | A **text** marker on every statement. Colour or an icon may add, never replace |
| 4.1's existing "not enough yet" lines (e.g. `KartuKetiadaan`) | **inventory them at 4.5**, and fold them into «Belum dapat disimpulkan …» | — | Until then they stay. No new variant may be added |

## 5 · Refusals that disclose nothing (rulings 17 and 20; A2b S-1)

**The rule:** an unknown target and a forbidden target get **the same answer.** Sign-in never says whether an account exists or what state it is in. A refusal never names the *other* party's data.

| Use | ID | EN |
|---|---|---|
| An addressed object that cannot be opened (correction, staff record, export, evaluation, another school's report). The pattern of revised Z-3 and N-9 | «{Benda} ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.» | «This {thing} cannot be opened. It may no longer exist, or it is not for you.» |
| An act that is not the reader's to take | existing `galat.action_not_allowed` «Langkah ini bukan wewenang Anda.» | existing |
| A request declined (4.2-07) | «Permintaan ini tidak dapat diproses. Tanyakan kepada admin sekolah Anda.» | «This request cannot be processed. Ask your school's administrator.» |
| Sign-in | L-1's existing neutral lines, unchanged | — |

**{Benda}** is the reader's own word for the thing: «Koreksi», «Data staf», «Laporan», «Berkas», «Penilaian». Its form never changes.

## 6 · How it is held

- **One key family per pattern** in `hle.ts`: `waktu.per.*`, `riwayat.terbit.*`, `koreksi.*`, `simpulan.belum.*`, `tolak.buka.*`. A feature passes its own word as a parameter, and **never adds a sibling key with the same meaning.**
- **A test** lists these families and fails if another key's default text matches the same phrases, so «Keadaan per», «Seperti saat diterbitkan», «Diperbaiki pada», «Belum dapat disimpulkan» and «tidak dapat dibuka. Mungkin sudah tidak ada» appear only in their families.
- **DAISY-25:** all clean. None promises a message or a notification.

## 7 · What it replaces

Nothing on screen today. It is the rule for new screens from 4.2. The revised Z-3 and N-9 already follow §5.
