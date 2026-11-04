# H · The acceptance standard (D-168) and the acceptance ledger, Batches 0–6 · 4 Nov 2026

**Authority:** owner, 4 Nov, «PINTAR 4.0 — NEW STANDING OWNER DIRECTIVE: Mandatory Cross-Component Integrity and End-to-End Acceptance» (D-168).
- **Principle:** «A feature is not complete merely because it works. It is complete when it works correctly with everything it depends on and everything that depends on it.»
- **This document authorises no application change and no promotion.**

## 1. The five gates

Every batch and every feature is reported against all five, separately. **«GREEN» means all applicable gates have passed, and nothing less.**

| Gate | What passing means | Evidence that counts |
|---|---|---|
| **Engineering verified** | The component does what its requirement says: red/green tests, CI and the batch's own walks are green on the code head | selftests red then green; `ci` and journeys on the head; staging walks where promoted |
| **Integration verified** | It works with everything upstream and downstream: the eight checks of §2 are done and recorded, and every boundary defect found is fixed at its source | an integration dossier (§2) with its evidence |
| **Design accepted** | Every Daisy composition it uses is accepted, and the build is reviewed side by side with it; terminology is final (Dr Gladys) where it applies | the owner's acceptance; Daisy's side-by-side review; G-items closed |
| **Human journey accepted** | The end-to-end human journeys through it have been walked by a person on staging and accepted, beyond the automated journeys | a recorded walk (who, when, journey, result) accepted by the owner |
| **Fully accepted** | All of the above, where applicable | the owner's acceptance |

**Rules:**
- A gate that does not apply is marked **n/a** with the reason.
- A gate with partial evidence is **partial**, never passed.
- Component tests or CI alone never pass the integration gate.

## 2. The integration dossier: the eight checks, per feature or module

1. **Dependencies.** What it reads from and what reads from it: the tables, the functions, the pages, the emails, the print.
2. **Data contracts and consumers.** Every contract it touches (DB function returns, API shapes, email data, the copy keys) and every surface that consumes it. Two consumers of one fact must agree; the email/card order was this case.
3. **Authorization and visibility across roles.** For every role that can reach it, at the **database**, not only the screen:
   - what is readable;
   - what is refused;
   - through every route, including the API, reports, metrics and certificates.
4. **Design and terminology consistency across connected surfaces.**
   - The same word, order and shape where the same fact appears.
   - No academic word or figure on a professional-learning surface.
   - The navigation is the reader's real places.
5. **Exceptional conditions and multi-context journeys.** These include:
   - empty, refused, expired, revoked, superseded;
   - a person in two contexts or two schools;
   - a staff member who is also learning;
   - a platform administrator in «Seluruh platform».
6. **Regression.** What existing modules it changes or depends on, and the tests that prove those modules unchanged.
7. **End-to-end journeys.** The human journeys that pass through it (J-numbers), run as walks: automated where possible, by a person for the human gate.
8. **Evidence.** The dossier records **integration** evidence, not only component evidence: the probes, the screens, the walks, and what was traced to its source.

**Defects at a boundary are traced to their source and corrected there.** For example, a page that offers a link its target refuses is corrected by deriving the link from the same permission the target uses, not by hiding it with a special case.

## 3. The ledger: Batches 0–6, retrospectively

The evidence already gathered is preserved; nothing proven is reopened. «Not yet assessed» means the D-168 dossier has not been made. It does not mean a defect is known.

| Batch | Engineering verified | Integration verified | Design accepted | Human journey accepted | Fully accepted |
|---|---|---|---|---|---|
| **0** · CI, a11y harness, security safeguards | **passed** (D-145) | n/a (infrastructure); its checks feed the others | n/a | n/a | **passed (as infrastructure)** |
| **1** · class cards (CR-91), send-back/history, approved wording, F-4 | **passed**: promoted, staging verified (D-147) | **not yet assessed** | partial: the wording is Dr Gladys's (W4.1 held, terminology v1 open) | **not accepted**: Dr Gladys's walkthrough deferred (D-141) | **no** |
| **2** · the shell primitives (skip link, titles, empty state, Collection, account menu, idle warning) | **passed** (D-148) | **not yet assessed** | partial: the fifteen Batch 2 questions are unanswered (E3) | **not accepted** (D-141) | **no** |
| **3** · Studio W6.5, Uji Cepat, closure | **passed** (D-149, D-151) | **not yet assessed**; known interface: the PD course through Studio, seen working locally (`verifikasi-b1-c2/putaran-2`) | partial: A1 accepted for design (D-166), **not built**; A2–A5 open | **not accepted** (D-141: Dr Gladys's Studio attempt) | **no** |
| **4** · administration, identity, account | **passed** (D-155, D-156(a)) | **not yet assessed**; known interfaces: Konfigurasi's links and navigation (B1 differences), the identity-email data contract (D1) | partial: B1 provisional; D-156(a) keeps product acceptance open | **not accepted** | **no** |
| **5** · reports, learner workflows, integrity | **passed** (D-158) | **not yet assessed**; known interfaces: the PD class's Ringkasan Kelas (owner question), the PD record and results (boundary holds, `putaran-2` §4) | partial: C1 accepted for design (D-167), not built; C2 provisional; C3 is Dr Gladys's | **not accepted** | **no** |
| **6** · certificates, Digital Card, email, branding | **passed on the branch** (`9b52b51`: CI and journeys green); **not promoted** | **not yet assessed**; known interface fixed at source: the card email's order (D-164) | partial: D1 accepted for design, not built; F-11, DAISY-37 final, W3.21 open | **not accepted**; the cross-client email protocol and the physical proofs not run | **no** |

**No batch is fully GREEN.** Batch 0 passes only as infrastructure.

## 4. Known cross-component inconsistencies

Each is traced to its source. Status: fixed, or where it waits.

| # | Inconsistency | Surfaces it spans | Source | Status |
|---|---|---|---|---|
| X1 | The card email listed roles by seniority; the Digital Card alphabetically | `my_identity_card` → the email template / the card screen | the email took the database's order; the card sorted itself | **fixed at source** (D-164): one ordering function for both; CI and journeys green |
| X2 | «murid» on a professional-learning class: «Lihat nama murid», the five «not yet» cards, «0 murid di kelas ini» (with two participants), the `/murid/[orang]` route | the PD class's «Lihat bukti», `/siapa`, the participant's page | the participant-word switch (`KATA_PESERTA`) does not cover every key, and the class metrics are requested for a PD class at all | E-C2-1, E-C2-2 (engineering); C2's composition |
| X3 | «Lihat per soal» is offered on a PD class, but its page refuses the facilitator | the PD class's «Lihat bukti» → the per-question page | the link does not ask the permission the page asks | E-C2-3: **the link derives from the same permission as its target**, not a PD special case; Daisy's composition withdraws it on the PD page (`740ffc50`) |
| X11 | E2's context control moves to the top of the staff navigation, while E1 (J3 under the working context: the rail at 1024–1279, the collapse) waits on the owner (O6) | every staff shell | two compositions own the same region | E2 and E1 built together, after O6; E2's control placement re-checked against E1's restated or accepted navigation |
| X4 | The PD footnote says the Kepala departemen reviews PD integrity signals | the PD class's «Lihat bukti» vs the integrity boundary (D-069(c)) | the ordinary page's footnote is reused | Daisy (C2), words Dr Gladys |
| X5 | A PD class's Ringkasan Kelas lays out the academic class metrics | `/edukator/ringkasan` vs D-070 | the report has no PD state | **the owner's question**, then Daisy |
| X6 | The Admin platform navigation and sections: Daisy's specimen had «Studio» (corrected, `740ffc50`); «Perpindahan murid» is drawn in «Seluruh platform» although L3 hides school-shaped sections | B1 vs the real platform shell and `tampil()` | «Studio»: the specimen was drawn from code without the live screen. «Perpindahan murid»: **the section omits the rule its menu follows** (`konfigurasi/page.tsx:495` vs `:1198`) | «Studio» corrected by Daisy; «Perpindahan murid»: E-B1-5 at source, unless the owner changes L3 (O11) |
| X7 | «staf sekolah Anda» in «Seluruh platform» | Konfigurasi's «Laporan masalah» across contexts | one string for two contexts | Daisy (B1), words Dr Gladys |
| X8 | The identity emails' context line: no school in the activation, recovery and password data | the email data contract vs DAISY-37 (2) | the data contract | **not changed** (D-164(a)): the line is shown only where authoritative data exists |
| X9 | «Pengembangan» and «uji» proposed for platform environments and the seed school, colliding with the professional-learning and assessment words | B1's copy vs the product's terms | new copy reusing existing roots | Daisy proposed alternatives; Dr Gladys confirms |
| X10 | Old Konfigurasi links (anchors and query parameters) after the split | server actions, Persiapan, Ringkasan, the walks → Konfigurasi | the split changes the routes | E-B1-1: every link tested at the build |

## 5. How the standard is carried into the gates (proposed; each part waits for authorisation)

1. **Every remaining batch report** carries the five-gate table and an integration dossier per feature. It starts with Batch 6's remaining work and Batches 7–11.
2. **For Batches 0–6,** a dossier is made for the **interfaces** in §4 and §3, not for proven internals. The order follows the risk:
   - professional learning (Batches 5 and 6);
   - identity emails and the card (Batch 6);
   - Konfigurasi and navigation (Batch 4);
   - reports (Batch 5);
   - Studio (Batch 3).
3. **Into CI and the journeys, where possible** (test and walk changes; each needs the owner's go, as a change to the repository):
   - the PD boundary sweep (E-C1-7) as a database suite;
   - the live role probes of `putaran-2` §4 as a walk;
   - a cross-surface word check (no academic word on a PD surface, across pages and emails);
   - the Konfigurasi link-compatibility test (E-B1-1);
   - a «one fact, one order» check for every pair of surfaces that show the same contract (as B6K-URUTAN-02 does for the card and its email).
4. **The human gate:** Dr Gladys's walkthrough (deferred by D-141) and the owner's walks, recorded per journey. Each also needs the owner's scheduling.
