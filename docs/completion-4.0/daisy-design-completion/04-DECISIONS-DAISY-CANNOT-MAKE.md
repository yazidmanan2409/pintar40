# Decisions Daisy cannot make (owner and Dr Gladys) · 4 Nov 2026

Each decision gates part of Daisy's work, **at the gate named** (the brief §5 lists every item's start, design-acceptance, implementation and final-closure gates). Daisy may draw the options; she must not choose one. The register IDs are in `01-OUTSTANDING-DESIGN-REGISTER.md`.

## Owner

| # | Decision | Gates | Options (as recorded or implied; none chosen) |
|---|---|---|---|
| O1 | **D-161: what is still open (D-161 as reconciled by D-163(a); the owner's messages, with time and sender, in D-163(b)–(d))** — the wordmark direction is settled («Pintar», `#075056`; the interface palette unchanged). Still open: where the application name «PINTAR SELALU» replaces «PINTAR» in running product text (D-074(3)), and the tab icon's colour | the text identity of D1 and D4 (Daisy keeps today's text until ruled) | (a) «PINTAR» stays in running text, «PINTAR SELALU» only where the application is formally named; (b) «PINTAR SELALU» throughout; (c) another split |
| O2 | **F-11:** the licensed outlined master, its approval, and the physical A4 and CR80 proofs (the line, the QR on two phones) | D3, D5; Batch 6 W3.19 / W3.20 closure | — (owner action) |
| O3 | **D3: a minimum group size for the Uji Cepat class figure** | A3's implementation (Daisy draws each option now) | (a) the catalogue's floor of 5; (b) none, as today (shown from one scored learner); (c) another number |
| O4 | **D1: if the class figure's meaning is to change** (from the mean of official scores) | A2's meaning only; Daisy confirms the presentation and wording of the existing mean now | Only if someone proposes a different measure. The current mean stands unless the owner rules. |
| O5 | **D-074(10): product handling of more than two role/school pairs. EXPLICITLY UNRESOLVED (owner, 4 Nov)**; not designed in this exercise. The rule holds: no truncation, no shrinking, no silent omission. Unreachable today (staging has none) | B3 | (to be ruled later; no option is being drawn now) |
| O6 | **RULED (D-169(d)) → (a):** Daisy restates J3 under L3; E1 and E2 one integrated navigation. **W3.12: restate J3 under the working context, or accept OP-1 and OP-2 as deviations**; the menu order «is confirmed with Yazid» (DS/05-navigation.md:34) | E1's implementation (Daisy may draw or recommend now) | (a) Daisy restates J3 (rail, collapse, labels); (b) the owner accepts the current shell as the 4.0 design |
| O7 | **Only an exception to W3.1 for the certificate's download file name and PDF metadata title.** Daisy recommends both strings within W3.1 herself (D2); the owner rules only if the recommendation names the person. The visible certificate heading is frozen and not in question. | D2, only if an exception is proposed | (a) within W3.1: the course, as built; (b) the exception: the person, W3.1 relaxed for these two strings only |
| O8 | ~~The certificate's sage accent~~ **APPROVED IN PRINCIPLE (D-162; the owner's message, with time and sender, in D-163(c), kept apart from the coordinator's recommendation it approves):** migration 194 through `session_is_professional`, built separately under the Batch 6 gate | not Daisy's | — (engineering; no promotion authorised by the approval) |
| O9 | **The tab icon's proxy paths** (`icon.svg`, `apple-icon.png` not shipped) | D5 | (owner action; now also subject to O1's colour) |
| O10 | **The owners and dispositions of UX-42, UX-44, UX-47** (proposed in `01`, «Register gaps») | the known ownership gaps; approving closes those gaps but **does not by itself prove the inventory exhaustive** | approve as proposed, or reassign |
| O11 | **RULED (D-169(a)) → (a):** L3 preserved; transfers not drawn in «Seluruh platform». **L3 and «Perpindahan murid» in «Seluruh platform».** L3 (CR-83; D-127 Q2, Q11; D-132 C7) draws no school-shaped section in «Seluruh platform», and lists transfers among them; the page draws it today only by a missing attribute (E-B1-5). Daisy proposes keeping it there (a transfer spans two schools) | B1's platform index; E-B1-5 | (a) **L3 as ruled:** transfers are handled in each school's context; the build stops drawing it (recommended: an action there would have no school context, the very case `context.other_school` exists for); (b) an L3 exception for transfers, applied to the rule, the menu and the section together |
| O12 | **RULED (D-170(d)): today's order confirmed; ordering rules, not permission overrides.** **The menu order, per context** («the final menu, with its order and any grouping, is confirmed with Yazid», DS/05:34). Daisy offers today's order unchanged (E1 §1.3): Mengajar · Studio; Belajar; Admin sekolah: Konfigurasi · Pendataan · Aktivasi akun · Studio · Keamanan akun · Sertifikat sekolah; Kepala departemen / Dekan: Pimpinan · Studio (not Dekan); «Seluruh platform»: Konfigurasi · Aktivasi akun · Keamanan akun · Kirim email uji · Sertifikat sekolah | E1's final closure | (a) confirm today's order; (b) another order or grouping |

## Dr Gladys

| # | Decision | Gates | Open question (as recorded) |
|---|---|---|---|
| G1 | **The six expressions of D-132(m)** (W4.2, F-13) | E2's final closure and Gate 2 (the composition proceeds with empty slots) | the six semantic keys, currently drawn as nothing (`src/lib/istilah-menunggu.ts`) |
| G2 | **«Peserta» / «Kenaikan» at class and school level; the UX-41 heading** | C1's labels (Daisy lays out the approved words) | `batch-5/02-PROMOTION-PRECONDITIONS.md`, condition 1, Q1–Q2 |
| G3 | **UX-09: if the school-number term is a protected institutional term** | B2 | the term that cannot pass for the NIS, and its one sentence |
| G4 | **Engineering-written strings** from Batches 3–6 (A4's C3 «arah berpikir», C9 «Kursus» vs «paket»; E4's keys; Batch 6's email-status words, `sertifikat.berkas`, `akun.kartu.*`) | A4, E4 | the lists in `batch-3/02`, `batch-5/01:164`, `batch-6/01` §3 item 9 |
| G5 | **`auth.link_sent`** («…tautan masuk sudah dikirim ke sana»): an approved, pinned string that claims slightly more than the evidence | (none of Daisy's) | keep, or a revised sentence |
| G6 | **Report titles** (D-135(e)) | C1 | on her pending list |

## Engineering dependencies (not decisions; listed so they are not mistaken for design gaps)

- Print beyond Chromium (Firefox, Safari, devices), at the physical proof.
- UX-42, UX-44, UX-47: «for the UI/UX POLISHED pass», no owner, absent from the work register. **Proposed owners and dispositions** are in `01`, «Register gaps» (UX-42 engineering; UX-44 engineering with Daisy confirming; UX-47 Dr Gladys, with W4.4 in Batch 7). O10 asks the owner to approve or change them. Approving them resolves these known ownership gaps; it does not by itself prove the inventory exhaustive.
- Batch 7's W6.12 and W4.4 follow Daisy's packages.
