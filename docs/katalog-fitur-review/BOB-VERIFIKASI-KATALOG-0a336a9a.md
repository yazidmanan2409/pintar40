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

---

# Revision 2 (`PERUBAHAN-UNTUK-BOB.md`): Bob's answers, 18 Nov about 09:00 UTC

**Point 1, emergency stops: confirmed.**
- In 4.0, an emergency refused every request of the affected people (PT503), and their sittings' deadlines **kept
  running** (THE PLAN D6, "Today an emergency refuses every request … Their sittings' deadlines keep running").
- 4.1 A2a (owner ruling D-1) holds sittings with their answers and exact remaining time. Your 4.0 note and the move of the
  Makassar example are right.

**Point 2, export: your change is right, and my status report was wrong.**
- B1 records four kinds only: sign-in, failed sign-in, sign-out and print request (THE PLAN §5.1, `kind`).
- The school data export and its event arrive together in 4.2 (owner ruling D-4). "Prints and exports" in
  STATUS-2026-11-18 §3 was my error; it is corrected there. There is no other export to restore.

**Point 3, two-school roles:** correct. D-03 is open with the owner. Leaving out the code's current answer is fine.

**Point 4, Question Health:** D-12 is **not decided**. Your wording is right.

**Point 5, AI drafting and import:** correct as written.

**Release states:**
- **4.0 and 4.1 counts:** correct.
- **C2w note:** right for now. The PR's own CI is running on the documentation-only head (`b57d897a`); after it passes,
  the merge and staging promotion follow under the owner's authorisation. Keep the note, and Bob will tell the owner when
  it can change to «Diterima di lingkungan uji».
- **4.2 planning state:** use the audit's latest revision (rev 6, `71a6f87e`), not rev 4.
  - **Changed since rev 4:** two-school roles (4.2-03) is now «menunggu keputusan» (D-03).
  - **Split:** adding one person is plannable now; correcting a name after a certificate waits on D-06.
  - Your 1 / 3 / 9 is consistent if "satu orang dan membetulkan nama" counts as one entry waiting on a decision.
- **4.5 and 5.0, «Arah disetujui»:** right. Rev 6 also changes 4.5's protections (4.5-07) to «menunggu keputusan» (R-1).

**Other wording:**
- **Paraphrases of the open choices:** use rev 6's recommended answers as the reference, and print no codes.
  - **D-06 has changed:** public verification never shows a name, which is already today's behaviour (Sharon). A
    reissue is a new certificate, and the old one reads DIGANTIKAN.
  - **Do not phrase any open choice as decided.**
- **School admins scheduling planned maintenance for their own school (A2b):** correct. Class scope is "one or more
  classes".
- **The four statement names:** fine as a proposal.
- **«Hari-hari biasa di sekolah»:** fine, as long as every linked entry shows its own status.

**The three points still open from your first request** are answered in the first part of this file:
- **«Catatan peninjau»:** free-text notes, not coded.
- **«Laporkan masalah»:** yes, list it in 4.0. Class feedback rounds and the demonstration room stay out.
- **The roadmap sources:** they exist on `claude/roadmap-45-50`, not on `main`; Rev 3 is acceptable in their place.
