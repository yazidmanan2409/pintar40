# Decisions Daisy cannot make (owner and Dr Gladys) · 4 Nov 2026

Each decision gates part of Daisy's work. Daisy may draw the options; she must not choose one. The register IDs are in `01-OUTSTANDING-DESIGN-REGISTER.md`.

## Owner

| # | Decision | Gates | Options (as recorded or implied; none chosen) |
|---|---|---|---|
| O1 | **D-161 brand reconciliation.** Which of D-074(3), D-076(b)(7), D-120 Q16, the approved primary colour `#245F55` (`--pintar-primary`) and the card and certificate header slots change for «PINTAR SELALU» / «Pintar» / `#075056` / Helvetica Neue Bold, and whether `#075056` is the wordmark colour only or also the interface's primary | D4, D5, DAISY-37 point 3 (D1) | (a) the wordmark colour only, the UI primary unchanged; (b) the UI primary also becomes `#075056` (token change, with every contrast pair re-checked); for each, the slots in which «Pintar» or «PINTAR SELALU» appears |
| O2 | **F-11:** the licensed outlined master, its approval, and the physical A4 and CR80 proofs (the line, the QR on two phones) | D3, D5; Batch 6 W3.19 / W3.20 closure | — (owner action) |
| O3 | **D3: a minimum group size for the Uji Cepat class figure** | A3 | (a) the catalogue's floor of 5; (b) none, as today (shown from one scored learner); (c) another number |
| O4 | **D1: if the class figure's meaning is to change** (from the mean of official scores) | A2 | Only if Daisy's answer proposes a different measure. The current mean stands unless the owner rules. |
| O5 | **D-074(10): product handling of more than two role/school pairs** (unreachable today: staging has none) | B3 | (a) a second face; (b) two pairs and «and n more», with Akun saya listing all; (c) no card issued in that case; (d) keep today's treatment for 4.0 (every line drawn, the exception marked, nothing designed) |
| O6 | **W3.12: restate J3 under the working context, or accept OP-1 and OP-2 as deviations**; the menu order «is confirmed with Yazid» (DS/05-navigation.md:34) | E1 | (a) Daisy restates J3 (rail, collapse, labels); (b) the owner accepts the current shell as the 4.0 design |
| O7 | **The certificate's PDF file name** (Daisy's example names the person; W3.1 keeps names out of titles) | D2 | (a) the course, as built; (b) the person, with W3.1 relaxed for the print title only |
| O8 | **The certificate's sage accent:** approve `my_certificate` returning the accent from `session_is_professional` (one migration) | not Daisy's (engineering, `batch-6/02` §2) | yes or no |
| O9 | **The tab icon's proxy paths** (`icon.svg`, `apple-icon.png` not shipped) | D5 | (owner action; now also subject to O1's colour) |

## Dr Gladys

| # | Decision | Gates | Open question (as recorded) |
|---|---|---|---|
| G1 | **The six expressions of D-132(m)** (W4.2, F-13) | E2's words | the six semantic keys, currently drawn as nothing (`src/lib/istilah-menunggu.ts`) |
| G2 | **«Peserta» / «Kenaikan» at class and school level; the UX-41 heading** | C1's labels (Daisy lays out the approved words) | `batch-5/02-PROMOTION-PRECONDITIONS.md`, condition 1, Q1–Q2 |
| G3 | **UX-09: if the school-number term is a protected institutional term** | B2 | the term that cannot pass for the NIS, and its one sentence |
| G4 | **Engineering-written strings** from Batches 3–6 (A4's C3 «arah berpikir», C9 «Kursus» vs «paket»; E4's keys; Batch 6's email-status words, `sertifikat.berkas`, `akun.kartu.*`) | A4, E4 | the lists in `batch-3/02`, `batch-5/01:164`, `batch-6/01` §3 item 9 |
| G5 | **`auth.link_sent`** («…tautan masuk sudah dikirim ke sana»): an approved, pinned string that claims slightly more than the evidence | (none of Daisy's) | keep, or a revised sentence |
| G6 | **Report titles** (D-135(e)) | C1 | on her pending list |

## Engineering dependencies (not decisions; listed so they are not mistaken for design gaps)

- Print beyond Chromium (Firefox, Safari, devices), at the physical proof.
- UX-42, UX-44, UX-47: «for the UI/UX POLISHED pass», no owner, absent from the work register. To triage, not for Daisy.
- Batch 7's W6.12 and W4.4 follow Daisy's packages.
