# PINTAR 4.0: corrections the application must take (engineering hand-off)

**Form:** P (a publication: one list). **From:** Daisy (UX-1). **Date:** 4 Nov 2026. **Read against:** engineering's package `claude/awesome-rubin-bqxp6p` at `0b19707` (read only).

The continuous-execution directive asks for every inconsistency to be corrected at its source. This lane is design only, so it cannot change `src/`. Everything that could be corrected on the design side has been (the compositions, and the design system itself: X-KONSISTENSI §2a, S1–S5). What follows is what remains, and it can only be corrected in the application. Each row names the source in `0b19707`, the correction, the decision it rests on, and the check that proves it, so that one engineering pass can close it.

Nothing here changes policy, calculations, certificate integrity, permissions, identity formats or the 4.0 scope. Rows marked **copy** wait for copy approval; rows marked **Dr Gladys** wait for her.

## 1. Shared components (one change each, every surface inherits it)

| # | Source in `0b19707` | Correction | Rests on | Proof |
|---|---|---|---|---|
| H1 | `src/components/koleksi/Penomoran.tsx:29` | Become the DS Pagination: «Sebelumnya» (`koleksi.sebelumnya`) in place of `koleksi.kembali`, shown disabled on page 1, never omitted; on keyset pages «Menampilkan {dari}–{sampai} {benda}» (`koleksi.menampilkan_tanpa_total`, **copy**). Users: `aktivasi`, `konfigurasi`, `studio/definisi`, `studio/integritas` | D-172 K2, K6; B1 | No «Kembali» in a pager; page 1 shows «Sebelumnya» disabled |
| H2 | the pager's narrow words, wherever Penomoran hides them | Visually hidden, never `display: none` | D-172 S1 | axe `link-name` clean at 320 px |
| H3 | `src/components/BarisHasil.tsx` | The mark and its words on one line when wrapping | D-172 K3; A5 B3 | 320 px render of a long result |
| H4 | `src/components/bentuk/TanggalDenganGema.tsx` (and its CSS) | The focus ring on `:focus-within` for date, time and datetime-local, so the calendar button is ringed | D-172 S4; B1 | Tab walk: ring on every stop |
| H5 | the page head, `src/app/konfigurasi/*` and Studio | No «PINTAR» eyebrow inside the shell | D-172 K7; RV-24; A5 C8 | No `PINTAR` eyebrow in a shell page |
| H6 | Studio's step list | Named steps, as J1Terbit, in the one step-list component | D-172 K8; A5 B12 | — |
| H7 | Siapkan after «Disediakan» | A fixed value is text, not a disabled field | D-172 K9; A5 D6 | — |
| H8 | `src/components/sesi/MenuAkun.tsx:70` | **Already correct:** named by its contents. Keep it so; do not add an `aria-label` (the DS's old preview did, now corrected) | D-172 S5; WCAG 2.5.3 | axe `label-content-name-mismatch` clean |

## 2. Back links (D-172 K1: a back link names its destination)

| # | Source | Correction |
|---|---|---|
| H9 | `src/app/dekan/ringkasan/page.tsx:93`, `src/app/edukator/ringkasan/page.tsx:89` (`laporan.kembali`) | The calling page passes the destination's name: «Pimpinan» (`nav.pimpinan`) or «Laporan» (from Konfigurasi). C1 |
| H10 | `src/app/pengembangan/[simpul]/page.tsx:42, 65` (`pengembangan.kembali`) | «Pimpinan» for a leader, «Konfigurasi» for the school admin (C1 part B) |
| H11 | `/pimpinan/*` (`pimpinan.kembali`, the built `← Kembali`) | Each names its parent: «Pimpinan», «{the place}», «{student list title}», «{feedback title}» (C1 part B) |
| H12 | `src/app/belajar/umpan-balik/[siklus]/page.tsx:59, 68`, `src/app/mengajar/[kelas]/umpan-balik/page.tsx:63, 76` (`umpanbalik.kembali`) | Name the destination («Belajar»; the class). The retired keys stay only where a destination truly varies and is unknown |

## 3. The shell, with E1 and E2 (built together; D-168)

| # | Correction | Rests on |
|---|---|---|
| H13 | The AppShell (rail at 1024–1279 px, collapse) as the DS's `bundle.css` / `bundle.js` now are: rail text visually hidden, no `aria-label` repeating it (S6); tooltip and collapse button follow the rail's state; keyboard focus shows the tooltip at once | E1 (owner, 4 Nov); S2, S3 |
| H14 | O12's menu order, per context | E1 |
| H15 | NVDA and TalkBack passes on the rail | owner, 4 Nov (still required) |

## 4. Per item

| # | Item | Correction | State |
|---|---|---|---|
| H16 | B1 | E-B1-5: «Perpindahan murid» not in «Seluruh platform» (O11(a)) | ruled |
| H17 | B1 | The platform's «Laporan masalah» wording, `lapor.triase.arti_platform` | **copy** |
| H18 | B1 | The seed school's name «Sekolah Contoh PINTAR» (a seed-file change) | accepted |
| H19 | B1 / E3 #8 | The overlap sentence, `config.pemeliharaan.tabrakan.terakhir` / `.saran`, without «pukul» before a day | **copy** |
| H20 | A2 | E-A2-1 («Rata-rata nilai kelas») | accepted |
| H21 | A3 | E-A3-1: `kalimatJumlah` (`src/components/bukti`, used at `src/app/dekan/ringkasan/page.tsx:126`) says «peserta» on PD, `ketiadaan.jumlah.peserta` | O3 / D-176; **copy** |
| H22 | A4 | X12: the terminology reconciliation (Paket Pembelajaran / Learning Package): engineering lists the uses; one decision for Dr Gladys and the owner. Sheets, identifiers and school files are not renamed | **Dr Gladys / owner** |
| H23 | B2 | The eleven keys for «Nomor Registrasi Sekolah»; no column, format or workbook change | D-174; accepted |
| H24 | C1 part B | The §8 defects listed in `C1/PIMPINAN.md` | accepted |
| H25 | D2 | The certificate file name «Sertifikat Penguasaan · {package title}», sanitised, no learner name | accepted |
| H26 | E3 | The idle warning stays until dismissed; the two disabled reasons are said | accepted |

## 5. Still gated (not hand-off)

E4 (G4), D4 stage 2 (F-11), D3 (only if the proof fails), B3 (the owner's open question).

## 6. Checklist

- [auto] Every row names a source in `0b19707` or the design item that specifies it.
- [auto] Every design-side correction is applied and re-rendered: ten specimens 0 failures; the DS's 60 previews 0 failures.
- [manual] Nothing here changes policy, calculations, certificate integrity, permissions, identity formats or scope.
- [auto] **D-172:** equivalent interactions match their canonical pattern: P3 (K1), P6 (K3), P9 (K2, K6), P11 (K8), P18 (K9), P20 (K7).
