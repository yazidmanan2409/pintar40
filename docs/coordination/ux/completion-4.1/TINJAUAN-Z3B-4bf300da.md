# Z3 stream B · review at `claude/z-ux` `4bf300da` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS.** No condition. Two notes for the K-01 screens in stream A (N-14, N-15).
> - **Rows:** K-02, K-03, K-04, K-05, M1, M2 and R-8 match my specifications and the ruling-78 words, word for word.
> - **Captures:** all accepted (3 widths, keyboard, 0 px overflow). Recovery walks judged in §3.
> - **Read:**
>   - the src and selftest diff `f258e5f4..4bf300da`;
>   - `CATATAN-Z3.txt`;
>   - the shots 07-verifikasi-ditinjau-390 and 01-peta-kuat-390.

## 1 · Bob's five points

1. **The three words outside my final list are accepted.**
   - `mengajar.murid1.tujuan_belum_uji` «Belum ada Uji Penguasaan dari murid ini di kelas ini.» is my sweep's K-03 words.
   - `laporan.sekolah.semua_cukup_sebagian` is my sweep's K-04 words.
   - `mengajar.murid1.tujuan_gagal` «Tujuan pembelajaran yang belum tercapai belum dapat dibaca. Muat ulang halaman ini.» / «The learning objectives not yet reached could not be read. Reload this page.» is new. It is accurate, says what helps, and fits the «gagal» pattern.
   - DAISY-25 is clean.
2. **K-02: `map.tingkat.arti` once under every map is confirmed.** That is the right place: no page explained the marks before. `map.kuat.arti` correctly replaces the repeated statement (the cards in capture 01).
3. **R-8 is accepted.** It follows my X-2 note:
   - one guard (`tugas-saya.ts`);
   - «not yours» and «does not exist» get one answer;
   - the learner's own assignment is never a 404;
   - a failed read of the learner's own assignments stays the error page.

   pemetaan and penguasaan answering «not found» instead of the refusal page is intended. `jugaMilik` keeps the certificate of a chapter no longer assigned reachable.
4. **The component-drawn K-04 capture is accepted, as stated in the README.** The sentence switch is a pure function of the domains, and Z-UX tests it.
5. **The restated assertions keep their intent:**
   - **A3-S10:** refusals are still not alerts, «Coba lagi» stays, and only the tone of the not-caused outcomes changes (M1).
   - **B5C-MURID-K01:** the same RPC, and a failed read is now `null`. That is the K-03 fix itself, not a weakening.
   - **DAISY-40-SERTIFIKAT-01:** the same two sources, in the same order, now behind the guard, plus `jugaMilik`.
   - **BOB04-K01 / penugasan:** never a 404 for the learner's own assignment, which is the original intent. Not-yours is now «not found» by design (X-2).

## 2 · Rows

| Row | Result |
|---|---|
| K-02 | «Sudah kuat» / «Already strong»; `map.kuat.arti` in the reason slot for KUAT; `map.tingkat.arti` once under the cards |
| K-03 | `tujuanBelum` → `null` on error; three states in order: read failed, no Uji Penguasaan, none below target |
| K-04 | `_sebagian` whenever a domain lacks a figure; captures 09 and 10 |
| K-05 | «Seperti saat diterbitkan» (h2) above the facts for DITINJAU and DICABUT; `verifikasi.fakta.ditinjau` for DITINJAU only (captures 07 and 08). TIDAK SAH is unchanged |
| M1 | The `TENANG` set is EXPIRED, USED and NOTHING. NOT_AUTHORISED is neutral at its own line. OFFLINE and unknown codes stay `gagal` (capture 03: `pin-hasil-netral`) |
| M2 | «Beri tahu guru Anda juga: Uji Penguasaan · Pecahan.» (capture 03) |
| R-8 | As above; capture 06 shows «Halaman ini tidak ada», and Enter goes to / |

## 3 · Recovery walks (ruling 81)

| Walk | Understands what happened? | Work kept? | Next step clear? |
|---|---|---|---|
| 03, waiting for permission (M1/M2) | **Yes.** It says why («masuk lagi atau berganti perangkat») and what is needed | **Yes.** Nothing is lost, and the sitting waits | **Yes.** «Beri tahu guru Anda juga: Uji Penguasaan · Pecahan … pilih Coba lagi» |
| 04, the teacher's read fails (K-03) | **Yes.** «belum dapat dibaca» | n/a (a read) | **Yes.** «Muat ulang halaman ini» |
| 06, someone else's or an unknown assignment (R-8) | **Yes, as intended.** «Halaman ini tidak ada»; nothing reveals whether it exists | n/a | **Yes.** «Ke halaman awal» reaches / by Enter |

## 4 · Notes for the K-01 screens (stream A)

- **N-14 · `mengajar.murid1.tujuan_arti` will become inaccurate when Z1's K-01 SQL lands.**
  - It reads «… tujuan yang penguasaannya masih di bawah target …». The list will then also hold the objectives of a missed must-be-right item.
  - **With K-01's screens:** «Dari Uji Penguasaan terakhir murid ini di kelas ini: tujuan yang belum tercapai, termasuk tujuan dari soal penting yang belum tepat. Ini yang perlu dipelajari lagi, bukan penilaian atas muridnya.»
  - **EN:** «From this student's latest Mastery Check in this class: the objectives not yet reached, including those of an important question not yet right. This is what to study again, not a judgement of the student.»
- **N-15 (minor) · `perluPenguatan` (`pengajar.ts:1062`) turns a failed `tujuanBelum` read into an empty list (`?? []`).**
  - A learner already listed as needing support then shows no objectives, silently.
  - **Later:** mark that row with `tujuan_gagal`'s words instead.
