# Bob's verification of «Katalog Lengkap Fitur PINTAR 4.0–5.0» (Pete, `0a336a9a`, 97 features + 14 candidates)

18 Nov 2026. Documentation only. The catalogue is well sourced. The changes below are needed before it is published.

## 1 · Statuses and versions
- **4.0 and B0–A2b, «Sudah tersedia di staging»:** correct.
- **C2w** is changing today: PR #25 is in CI, and the owner has authorised the merge and the staging promotion. Publish
  its status only after Bob confirms; it then becomes «Sudah tersedia di staging». Stamp the catalogue
  "status per {tanggal}".
- **A3, «Sedang dikembangkan»:** correct.
- **C3w, «Selesai dirancang, belum dibangun»:** correct. Also say that it is:
  - an optional, separately paid school add-on (ruling 38);
  - offered from PINTAR's qualified options, which schools choose between (ruling 40).
- **4.2:** «Direncanakan» overstates it. 4.2 has no approved plan; these items are owner deferrals. Use, for example,
  «Ditunda ke 4.2; rencana rinci belum disusun». Note on `42-kesehatan-terjadwal`: its schedule depends on first
  checking the existing calculations.
- **4.5 and 5.0:** use «Arah disetujui; belum direncanakan». The 11 Nov owner record says implementation needs separate
  planning and authorisation.
- **`45-perbaikan-statistik`:** «temuan dugaan dari pemeriksaan kode; belum diverifikasi saat berjalan». The four RD-4
  findings are suspected, not established.

## 2 · «Catatan peninjau»
Both statements are current and consistent.
- **What they are:** C2w's notes are free-text, attributed, dated and immutable, written beside a sealed question. A note
  may say what a wrong option reveals.
- **What they are not:** they are NOT structured or coded misconception notes. Structured codes are R-3, still pending
  with the owner.
- **Where they never appear:** they are never shown to learners, never printed and never used in calculations.

Do not call them "coded".

## 3 · Code-only items
- **«Laporkan masalah»: list it** as 4.0. Rev 3 Appendix A, the row "Professional learning and support": "Staff can
  report an issue and see status".
- **Class feedback rounds and «Ruang Peragaan»: keep them out** until the owner decides.

## 4 · Sources
`PINTAR-ROADMAP.md`, `ROADMAP-RECONCILIATION-2026-11-11.md` and the roadmap-folder `OWNER-DECISIONS-2026-11-11.md` exist
on branch `claude/roadmap-45-50` (`2f419b52`), **not on `main`**; that is finding G-1 of the planning audit. Using Rev 3 in
their place is acceptable, since it consolidates them. Correct "on no branch" in `KATALOG-COVERAGE.md`.

## 5 · Missing or misplaced
- **`40-tinggalkan` contradicts `k-hapus-keluarga`.** In code (`MeninggalkanPintar.tsx`), a learner is only *told* that
  such a request goes through the school with the family; there is no form. Learner and family deletion is "later than
  4.2". Reword it: PINTAR explains to a learner that the request goes through the school and family, and the deletion
  process itself is among the later items.
- **Missing in 4.5: misconception mapping** («Pemetaan pemahaman keliru»). The reconciliation (§1) keeps it in 4.5, as
  part of Question Intelligence and competency identity. It depends on R-3.
- **Working names:** keep them marked pending the owner. «Quiet Intelligence» is English in an Indonesian catalogue;
  the owner chooses.
- **4.0 maintenance scope (point 3):** correct, provided that:
  - `41-darurat` says 4.1 added the class-level emergency stop (A2a change C);
  - `41-pemeliharaan` says 4.1 added class- and school-level scheduled maintenance (A2b).
- **No provider names:** checked in `fitur.mjs` and the PDF, and none found. Keep it so: E's judging is blinded until the
  scores are final.
